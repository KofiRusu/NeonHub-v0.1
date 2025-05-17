import { PrismaClient, AIAgent } from '@prisma/client';
import { getCampaignService, getMetricService, MetricSource } from '../../../services';

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
}

/**
 * Abstract base class for all AI agents
 */
export abstract class BaseAgent {
  protected prisma: PrismaClient;
  protected agentData: AIAgent;
  protected isRunning: boolean = false;
  protected shouldStop: boolean = false;
  protected executionStartTime: number = 0;
  protected currentSessionId: string | null = null;

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
    
    // Default options
    const { campaignId, trackMetrics = true } = options;
    
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
        linkedCampaignId
      );
      
      // Log execution start
      console.log(`Agent ${this.agentData.id} (${this.agentData.name}) execution started`);
      
      // Execute agent-specific logic
      const result = await this.executeImpl(config);
      
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
          metrics: { 
            executionTime,
            ...(options.tokenUsage || {})
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
          options.tokenUsage
        );
      }
      
      // Log execution completion
      console.log(`Agent ${this.agentData.id} execution completed successfully in ${executionTime}ms`);
      
      this.isRunning = false;
      this.currentSessionId = null;
      
      // Add campaign to the result
      return {
        ...result,
        campaignId: campaign.id,
        executionTime,
        sessionId: session.id
      };
    } catch (error) {
      // Log execution error
      console.error(`Agent ${this.agentData.id} execution failed:`, error);
      
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
            errorMessage: error instanceof Error ? error.message : String(error),
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
              options.tokenUsage
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
   * Stop the agent execution
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }
    
    console.log(`Stopping agent ${this.agentData.id}`);
    this.shouldStop = true;
    
    // Execute agent-specific stop logic
    await this.stopImpl();
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
    console.log(`Default stop implementation for agent ${this.agentData.id}`);
  }

  /**
   * Check if the agent should stop execution
   */
  protected checkShouldStop(): boolean {
    return this.shouldStop;
  }

  /**
   * Log a message to the agent's execution log
   * @param message The message to log
   * @param level Log level
   */
  protected async logMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): Promise<void> {
    // Find latest execution session
    const session = await this.prisma.agentExecutionSession.findFirst({
      where: { agentId: this.agentData.id },
      orderBy: { startedAt: 'desc' },
    });

    if (!session) {
      console.warn(`No session found for agent ${this.agentData.id}`);
      return;
    }

    // Update session logs
    const currentLogs = session.logs as Array<any> || [];
    const updatedLogs = [
      ...currentLogs,
      {
        timestamp: new Date(),
        level,
        message,
      }
    ];

    // Update the session with the new logs
    await this.prisma.agentExecutionSession.update({
      where: { id: session.id },
      data: { logs: updatedLogs as any },
    });
  }
} 