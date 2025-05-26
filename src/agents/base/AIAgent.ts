import { PrismaClient, AgentStatus, AgentType } from '@prisma/client';
import {
  AgentConfig,
  AgentState,
  AgentResult,
  AgentLogEntry,
  AgentRunOptions,
} from './types';
import {
  getSocketIO,
  emitAgentStart,
  emitAgentLog,
  emitAgentDone,
  emitAgentError,
} from '../../socket/agentOutput';

/**
 * Abstract base class for all AI agents in the system
 */
export abstract class AIAgent<
  TConfig extends AgentConfig = AgentConfig,
  TOutput = any,
> {
  /** The agent's unique identifier */
  protected id: string;

  /** The agent's current state */
  protected state: AgentState;

  /** The agent's configuration */
  protected config: TConfig;

  /** The agent's type */
  protected type: AgentType;

  /** Log of agent activity */
  protected logs: AgentLogEntry[] = [];

  /** Reference to Prisma client */
  protected prisma: PrismaClient;

  /** Cache for the last result */
  protected lastResult?: AgentResult<TOutput>;

  /** Current execution session ID */
  protected currentSessionId?: string;

  /**
   * Create a new agent instance
   *
   * @param id The unique identifier of this agent
   * @param type The type of agent
   * @param config The agent's configuration
   * @param prisma The Prisma client instance
   */
  constructor(
    id: string,
    type: AgentType,
    config: TConfig,
    prisma: PrismaClient,
  ) {
    this.id = id;
    this.type = type;
    this.config = config;
    this.prisma = prisma;

    // Initialize state
    this.state = {
      status: AgentStatus.IDLE,
      retries: 0,
    };
  }

  /**
   * Execute the agent's logic
   *
   * @param options Options for this specific run
   * @returns A promise resolving to the agent's execution result
   */
  public async run(
    options: AgentRunOptions = {},
  ): Promise<AgentResult<TOutput>> {
    // Start execution timer
    const startTime = Date.now();
    this.state.startedAt = new Date();
    this.state.retries = 0;

    // Get the agent details for WebSocket events
    const agentDetails = await this.prisma.aIAgent.findUnique({
      where: { id: this.id },
      select: { name: true, agentType: true },
    });

    // Create execution session
    const session = await this.prisma.agentExecutionSession.create({
      data: {
        agentId: this.id,
        context: options.context || {},
      },
    });

    this.currentSessionId = session.id;

    // Emit start event via WebSocket
    const socketIo = getSocketIO();
    if (socketIo) {
      emitAgentStart(socketIo, this.id, {
        agentType: agentDetails?.agentType || String(this.type),
        name: agentDetails?.name || `Agent ${this.id}`,
        context: options.context,
      });
    }

    try {
      // Update status in memory and database
      await this.updateStatus(AgentStatus.RUNNING);
      this.log('info', `Agent ${this.id} (${this.type}) started execution`);

      // Execute concrete implementation
      const output = await this.execute(options);

      // Calculate duration
      const duration = Date.now() - startTime;

      // Create successful result
      const result: AgentResult<TOutput> = {
        success: true,
        data: output,
        metrics: {
          duration,
        },
        timestamp: new Date(),
      };

      // Update state and database
      this.state.completedAt = new Date();
      await this.updateStatus(AgentStatus.COMPLETED);
      await this.saveResult(result);

      this.log(
        'info',
        `Agent ${this.id} (${this.type}) completed successfully in ${duration}ms`,
      );

      // Update execution session
      await this.updateExecutionSession(result, duration);

      // Emit done event via WebSocket
      if (socketIo) {
        emitAgentDone(socketIo, this.id, {
          success: true,
          data: output,
          metrics: result.metrics,
          duration,
        });
      }

      // Store last result
      this.lastResult = result;

      return result;
    } catch (error) {
      // Handle error
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.log(
        'error',
        `Agent ${this.id} (${this.type}) failed: ${errorMessage}`,
        { error },
      );

      // Calculate duration
      const duration = Date.now() - startTime;

      // Create error result
      const result: AgentResult<TOutput> = {
        success: false,
        error: {
          message: errorMessage,
          stack: errorStack,
        },
        metrics: {
          duration,
        },
        timestamp: new Date(),
      };

      // Update state and database
      this.state.completedAt = new Date();
      await this.updateStatus(AgentStatus.ERROR);
      await this.saveResult(result);

      // Update execution session
      await this.updateExecutionSession(result, duration, errorMessage);

      // Emit error event via WebSocket
      if (socketIo) {
        emitAgentError(socketIo, this.id, {
          message: errorMessage,
          stack: errorStack,
        });
      }

      // Store last result
      this.lastResult = result;

      // Handle retries if enabled
      if (this.shouldRetry()) {
        return this.retry(options);
      }

      return result;
    }
  }

  /**
   * Concrete implementation of the agent's execution logic
   * @param options Options for this specific run
   */
  protected abstract execute(options: AgentRunOptions): Promise<TOutput>;

  /**
   * Update the agent's status in memory and database
   * @param status The new status
   */
  protected async updateStatus(status: AgentStatus): Promise<void> {
    this.state.status = status;

    try {
      await this.prisma.aIAgent.update({
        where: { id: this.id },
        data: {
          status,
          lastRunAt: status === AgentStatus.RUNNING ? new Date() : undefined,
        },
      });
    } catch (error) {
      this.log(
        'warning',
        `Failed to update agent status in database: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Save the agent's execution result
   * @param result The result to save
   */
  protected async saveResult(result: AgentResult<TOutput>): Promise<void> {
    try {
      // Here you would implement saving the result to the database
      // This might be a table not yet in your schema, or could update the existing agent record

      // Example implementation (assuming you have a table for results):
      /*
      await this.prisma.agentResult.create({
        data: {
          agentId: this.id,
          success: result.success,
          data: result.data as any,
          error: result.error as any,
          metrics: result.metrics as any,
          timestamp: result.timestamp
        }
      });
      */

      // For now, just log that we would save this
      this.log('info', 'Would save agent result to database', { result });
    } catch (error) {
      this.log(
        'warning',
        `Failed to save agent result: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Add a log entry
   * @param level Log level
   * @param message Log message
   * @param context Additional context
   */
  protected log(
    level: AgentLogEntry['level'],
    message: string,
    context?: Record<string, any>,
  ): void {
    const entry: AgentLogEntry = {
      timestamp: new Date(),
      level,
      message,
      context,
    };

    // Add to in-memory logs
    this.logs.push(entry);

    // Log to console (in development)
    if (process.env.NODE_ENV !== 'production') {
      const prefix = `[${entry.timestamp.toISOString()}] [${this.type}] [${level.toUpperCase()}]`;
      console.log(`${prefix} ${message}`);
      if (context) console.log(context);
    }

    // Emit log event via WebSocket
    const socketIo = getSocketIO();
    if (socketIo) {
      emitAgentLog(socketIo, this.id, entry);
    }

    // In a real implementation, you might store logs in the database or send to a logging service
  }

  /**
   * Check if the agent should retry execution
   */
  protected shouldRetry(): boolean {
    const { maxRetries = 0, autoRetry = false } = this.config;
    return autoRetry && this.state.retries < maxRetries;
  }

  /**
   * Retry the agent's execution
   * @param options Original run options
   */
  protected async retry(
    options: AgentRunOptions,
  ): Promise<AgentResult<TOutput>> {
    this.state.retries += 1;
    const retryCount = this.state.retries;

    // Calculate delay
    const delay = this.config.retryDelay || 1000;

    this.log(
      'info',
      `Retrying agent execution (${retryCount}/${this.config.maxRetries}) after ${delay}ms delay`,
    );

    // Wait for the specified delay
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Run again
    return this.run(options);
  }

  /**
   * Get the agent's current state
   */
  public getState(): AgentState {
    return { ...this.state };
  }

  /**
   * Get the agent's configuration
   */
  public getConfig(): TConfig {
    return { ...this.config };
  }

  /**
   * Get the agent's logs
   */
  public getLogs(): AgentLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get the agent's last result
   */
  public getLastResult(): AgentResult<TOutput> | undefined {
    return this.lastResult ? { ...this.lastResult } : undefined;
  }

  /**
   * Get the agent's ID
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Get the agent's type
   */
  public getType(): AgentType {
    return this.type;
  }

  /**
   * Update the execution session with results
   * @param result Execution result
   * @param duration Duration in milliseconds
   * @param errorMessage Optional error message
   */
  private async updateExecutionSession(
    result: AgentResult<TOutput>,
    duration: number,
    errorMessage?: string,
  ): Promise<void> {
    if (!this.currentSessionId) return;

    try {
      await this.prisma.agentExecutionSession.update({
        where: { id: this.currentSessionId },
        data: {
          completedAt: new Date(),
          success: result.success,
          duration,
          outputSummary: result.success
            ? JSON.stringify(result.data, null, 2).substring(0, 1000) // First 1000 chars of JSON
            : undefined,
          errorMessage: errorMessage,
          logs: this.logs as any,
          metrics: result.metrics as any,
        },
      });
    } catch (error) {
      console.error('Failed to update execution session:', error);
    }
  }
}
