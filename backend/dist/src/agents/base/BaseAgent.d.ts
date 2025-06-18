import { PrismaClient, AIAgent } from '@prisma/client';
export interface TokenUsage {
  input: number;
  output: number;
  total: number;
  model?: string;
}
export interface ExecutionOptions {
  campaignId?: string;
  trackMetrics?: boolean;
  tokenUsage?: TokenUsage;
  maxRetries?: number;
  retryDelay?: number;
}
export declare enum AgentEventType {
  EXECUTION_STARTED = 'execution_started',
  EXECUTION_COMPLETED = 'execution_completed',
  EXECUTION_FAILED = 'execution_failed',
  RETRY_ATTEMPT = 'retry_attempt',
  STOP_REQUESTED = 'stop_requested',
  CUSTOM_EVENT = 'custom_event',
}
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
export declare abstract class BaseAgent {
  protected prisma: PrismaClient;
  protected agentData: AIAgent;
  protected isRunning: boolean;
  protected shouldStop: boolean;
  protected executionStartTime: number;
  protected currentSessionId: string | null;
  protected events: AgentEvent[];
  protected maxRetries: number;
  protected retryDelay: number;
  /**
   * Constructor for the BaseAgent
   * @param prisma PrismaClient instance
   * @param agentData Agent data from the database
   */
  constructor(prisma: PrismaClient, agentData: AIAgent);
  /**
   * Execute the agent with the provided configuration
   * @param config Agent configuration
   * @param options Execution options
   * @returns Result of the agent execution
   */
  execute(config: any, options?: ExecutionOptions): Promise<any>;
  /**
   * Execute with retry mechanism
   * @param config Agent configuration
   * @returns Result of the agent execution
   */
  private executeWithRetry;
  /**
   * Stop the agent execution
   */
  stop(): Promise<void>;
  /**
   * Implementation-specific execution logic
   * @param config Agent configuration
   */
  protected abstract executeImpl(config: any): Promise<any>;
  /**
   * Implementation-specific stop logic
   */
  protected stopImpl(): Promise<void>;
  /**
   * Check if the agent should stop execution
   */
  protected checkShouldStop(): boolean;
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
    level?: 'info' | 'warning' | 'error',
  ): void;
  /**
   * Log a message to the agent's execution log (legacy method for backward compatibility)
   * @param level Log level
   * @param message The message to log
   */
  protected logMessage(
    level: 'info' | 'warning' | 'error',
    message: string,
  ): Promise<void>;
  /**
   * Get current agent status
   */
  getStatus(): {
    isRunning: boolean;
    shouldStop: boolean;
    currentSessionId: string | null;
    eventCount: number;
    executionTime?: number;
  };
  /**
   * Get agent events
   */
  getEvents(): AgentEvent[];
  /**
   * Sleep utility for retry delays
   */
  private sleep;
}
