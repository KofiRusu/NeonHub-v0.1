'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.BaseAgent = exports.AgentEventType = void 0;
const services_1 = require('../../../services');
// Event types for logging
var AgentEventType;
(function (AgentEventType) {
  AgentEventType['EXECUTION_STARTED'] = 'execution_started';
  AgentEventType['EXECUTION_COMPLETED'] = 'execution_completed';
  AgentEventType['EXECUTION_FAILED'] = 'execution_failed';
  AgentEventType['RETRY_ATTEMPT'] = 'retry_attempt';
  AgentEventType['STOP_REQUESTED'] = 'stop_requested';
  AgentEventType['CUSTOM_EVENT'] = 'custom_event';
})(AgentEventType || (exports.AgentEventType = AgentEventType = {}));
/**
 * Abstract base class for all AI agents
 */
class BaseAgent {
  /**
   * Constructor for the BaseAgent
   * @param prisma PrismaClient instance
   * @param agentData Agent data from the database
   */
  constructor(prisma, agentData) {
    this.isRunning = false;
    this.shouldStop = false;
    this.executionStartTime = 0;
    this.currentSessionId = null;
    this.events = [];
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
    this.prisma = prisma;
    this.agentData = agentData;
  }
  /**
   * Execute the agent with the provided configuration
   * @param config Agent configuration
   * @param options Execution options
   * @returns Result of the agent execution
   */
  async execute(config, options = {}) {
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
          context: config,
        },
      });
      this.currentSessionId = session.id;
      // Link to campaign if provided or create one
      let linkedCampaignId = campaignId;
      if (!linkedCampaignId && config.campaignId) {
        linkedCampaignId = config.campaignId;
      }
      const campaignService = (0, services_1.getCampaignService)(this.prisma);
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
          logs: this.events,
          metrics: {
            executionTime,
            eventCount: this.events.length,
            ...(options.tokenUsage || {}),
          },
        },
      });
      // Log metrics if enabled
      if (trackMetrics) {
        const metricService = (0, services_1.getMetricService)(this.prisma);
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
            logs: this.events,
            errorMessage:
              error instanceof Error ? error.message : String(error),
          },
        });
        // Log failure metrics
        if (trackMetrics) {
          try {
            const metricService = (0, services_1.getMetricService)(this.prisma);
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
  async executeWithRetry(config) {
    let lastError = null;
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
  async stop() {
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
   * Implementation-specific stop logic
   */
  async stopImpl() {
    // Default implementation - can be overridden by subclasses
    this.logEvent(
      AgentEventType.CUSTOM_EVENT,
      `Default stop implementation for agent ${this.agentData.id}`,
    );
  }
  /**
   * Check if the agent should stop execution
   */
  checkShouldStop() {
    return this.shouldStop;
  }
  /**
   * Log an event to the agent's execution log
   * @param type Event type
   * @param message The message to log
   * @param data Additional event data
   * @param level Log level
   */
  logEvent(type, message, data, level = 'info') {
    const event = {
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
   * @param level Log level
   * @param message The message to log
   */
  async logMessage(level, message) {
    this.logEvent(AgentEventType.CUSTOM_EVENT, message, undefined, level);
  }
  /**
   * Get current agent status
   */
  getStatus() {
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
  getEvents() {
    return [...this.events];
  }
  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
exports.BaseAgent = BaseAgent;
