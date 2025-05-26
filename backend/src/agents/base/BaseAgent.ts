import { PrismaClient, AIAgent } from '@prisma/client';
import {
  getCampaignService,
  getMetricService,
  MetricSource,
} from '../../../services';

// Token usage tracking interface
export interface TokenUsage {
  input: number;
  output: number;
  total: number;
  model?: string;
}

// Execution options
export interface ExecutionOptions {
  campaignId?: string;
  trackMetrics?: boolean;
  tokenUsage?: TokenUsage;
  maxRetries?: number;
  retryDelay?: number;
}

// Event types for logging
export enum AgentEventType {
  EXECUTION_STARTED = 'execution_started',
  EXECUTION_COMPLETED = 'execution_completed',
  EXECUTION_FAILED = 'execution_failed',
  RETRY_ATTEMPT = 'retry_attempt',
  STOP_REQUESTED = 'stop_requested',
  CUSTOM_EVENT = 'custom_event',
}

// Agent event interface
export interface AgentEvent {
  type: AgentEventType;
  timestamp: Date;
  message: string;
  data?: any;
  level: 'info' | 'warning' | 'error';
}

/**
 * Abstract base class for all AI agents
 */
export abstract class BaseAgent {
  protected prisma: PrismaClient;
  protected agentData: AIAgent;
  protected isRunning = false;
  protected shouldStop = false;
  protected executionStartTime = 0;
  protected currentSessionId: string | null = null;
  protected events: AgentEvent[] = [];
  protected maxRetries = 3;
  protected retryDelay = 1000; // 1 second

  /**
   * Constructor for the BaseAgent
   * @param prisma PrismaClient instance
   * @param agentData Agent data from the database
   */
  constructor(prisma: PrismaClient, agentData: AIAgent) {
    this.prisma = prisma;
    this.agentData = agentData;
  }

  /**
   * Execute the agent with the provided configuration
   * @param config Agent configuration
   * @param options Execution options
   * @returns Result of the agent execution
   */
  async execute(config: any, options: ExecutionOptions = {}): Promise<any> {
    this.isRunning = true;
    this.shouldStop = false;
    this.executionStartTime = Date.now();
    this.events = [];

    // Set retry options
    this.maxRetries = options.maxRetries ?? this.maxRetries;
    this.retryDelay = options.retryDelay ?? this.retryDelay;

    // Default options
    const { campaignId, trackMetrics = true } = options;

    // Log execution start event
    this.logEvent(AgentEventType.EXECUTION_STARTED, 'Agent execution started', {
      config,
      options,
    });

    try {
      // Create execution session
      const session = await this.prisma.agentExecutionSession.create({
        data: {
          agentId: this.agentData.id,
          context: config as any,
        },
      });

      this.currentSessionId = session.id;

      // Link to campaign if provided or create one
      let linkedCampaignId = campaignId;
      if (!linkedCampaignId && config.campaignId) {
        linkedCampaignId = config.campaignId;
      }

      const campaignService = getCampaignService(this.prisma);
      const campaign = await campaignService.getOrCreateCampaignForAgent(
        this.agentData,
        linkedCampaignId,
      );

      // Execute agent-specific logic with retry mechanism
      const result = await this.executeWithRetry(config);

      // Calculate execution duration
      const executionTime = Date.now() - this.executionStartTime;

      // Update execution session
      await this.prisma.agentExecutionSession.update({
        where: { id: session.id },
        data: {
          completedAt: new Date(),
          success: true,
          duration: executionTime,
          outputSummary: JSON.stringify(result).substring(0, 1000),
          logs: this.events as any,
          metrics: {
            executionTime,
            eventCount: this.events.length,
            ...(options.tokenUsage || {}),
          } as any,
        },
      });

      // Log metrics if enabled
      if (trackMetrics) {
        const metricService = getMetricService(this.prisma);
        await metricService.logAgentExecutionMetrics(
          executionTime,
          this.agentData.id,
          this.agentData.agentType,
          this.agentData.projectId,
          session.id,
          campaign.id,
          true,
          options.tokenUsage,
        );
      }

      // Log execution completion event
      this.logEvent(
        AgentEventType.EXECUTION_COMPLETED,
        `Agent execution completed successfully in ${executionTime}ms`,
        { executionTime, sessionId: session.id },
      );

      this.isRunning = false;
      this.currentSessionId = null;

      // Add campaign to the result
      return {
        ...result,
        campaignId: campaign.id,
        executionTime,
        sessionId: session.id,
        events: this.events,
      };
    } catch (error) {
      // Log execution error event
      this.logEvent(
        AgentEventType.EXECUTION_FAILED,
        `Agent execution failed: ${error instanceof Error ? error.message : String(error)}`,
        { error: error instanceof Error ? error.stack : error },
      );

      // Calculate execution duration
      const executionTime = Date.now() - this.executionStartTime;

      // Update session if it was created
      if (this.currentSessionId) {
        await this.prisma.agentExecutionSession.update({
          where: { id: this.currentSessionId },
          data: {
            completedAt: new Date(),
            success: false,
            duration: executionTime,
            logs: this.events as any,
            errorMessage:
              error instanceof Error ? error.message : String(error),
          },
        });

        // Log failure metrics
        if (trackMetrics) {
          try {
            const metricService = getMetricService(this.prisma);
            await metricService.logAgentExecutionMetrics(
              executionTime,
              this.agentData.id,
              this.agentData.agentType,
              this.agentData.projectId,
              this.currentSessionId,
              campaignId,
              false,
              options.tokenUsage,
            );
          } catch (metricError) {
            console.error('Failed to log metrics:', metricError);
          }
        }
      }

      this.isRunning = false;
      this.currentSessionId = null;
      throw error;
    }
  }

  /**
   * Execute with retry mechanism
   * @param config Agent configuration
   * @returns Result of the agent execution
   */
  private async executeWithRetry(config: any): Promise<any> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (this.shouldStop) {
        throw new Error('Agent execution stopped by user request');
      }

      try {
        if (attempt > 0) {
          this.logEvent(
            AgentEventType.RETRY_ATTEMPT,
            `Retry attempt ${attempt}/${this.maxRetries}`,
            { attempt, maxRetries: this.maxRetries },
          );

          // Wait before retry with exponential backoff
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }

        return await this.executeImpl(config);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === this.maxRetries) {
          // Final attempt failed
          break;
        }

        // Log retry event
        this.logEvent(
          AgentEventType.RETRY_ATTEMPT,
          `Attempt ${attempt + 1} failed, will retry: ${lastError.message}`,
          { attempt: attempt + 1, error: lastError.message },
          'warning',
        );
      }
    }

    throw lastError || new Error('Unknown error during execution');
  }

  /**
   * Stop the agent execution
   */
  async stop(): Promise<void> {
    this.logEvent(
      AgentEventType.STOP_REQUESTED,
      `Stopping agent ${this.agentData.id}`,
    );
    this.shouldStop = true;

    // Execute agent-specific stop logic only if running
    if (this.isRunning) {
      await this.stopImpl();
    }
  }

  /**
   * Implementation-specific execution logic
   * @param config Agent configuration
   */
  protected abstract executeImpl(config: any): Promise<any>;

  /**
   * Implementation-specific stop logic
   */
  protected async stopImpl(): Promise<void> {
    // Default implementation - can be overridden by subclasses
    this.logEvent(
      AgentEventType.CUSTOM_EVENT,
      `Default stop implementation for agent ${this.agentData.id}`,
    );
  }

  /**
   * Check if the agent should stop execution
   */
  protected checkShouldStop(): boolean {
    return this.shouldStop;
  }

  /**
   * Log an event to the agent's execution log
   * @param type Event type
   * @param message The message to log
   * @param data Additional event data
   * @param level Log level
   */
  protected logEvent(
    type: AgentEventType,
    message: string,
    data?: any,
    level: 'info' | 'warning' | 'error' = 'info',
  ): void {
    const event: AgentEvent = {
      type,
      timestamp: new Date(),
      message,
      data,
      level,
    };

    this.events.push(event);

    // Also log to console for immediate visibility
    const logMethod =
      level === 'error'
        ? console.error
        : level === 'warning'
          ? console.warn
          : console.log;
    logMethod(`[${this.agentData.id}] ${type}: ${message}`, data || '');
  }

  /**
   * Log a message to the agent's execution log (legacy method for backward compatibility)
   * @param message The message to log
   * @param level Log level
   */
  protected async logMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
  ): Promise<void> {
    this.logEvent(AgentEventType.CUSTOM_EVENT, message, undefined, level);
  }

  /**
   * Get current agent status
   */
  public getStatus(): {
    isRunning: boolean;
    shouldStop: boolean;
    currentSessionId: string | null;
    eventCount: number;
    executionTime?: number;
  } {
    return {
      isRunning: this.isRunning,
      shouldStop: this.shouldStop,
      currentSessionId: this.currentSessionId,
      eventCount: this.events.length,
      executionTime: this.isRunning
        ? Date.now() - this.executionStartTime
        : undefined,
    };
  }

  /**
   * Get agent events
   */
  public getEvents(): AgentEvent[] {
    return [...this.events];
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
