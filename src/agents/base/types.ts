import { AgentStatus, AgentType } from '@prisma/client';

/**
 * Base interface for all agent configurations
 */
export interface AgentConfig {
  /** Unique identifier for this configuration */
  id: string;
  /** Maximum runtime in milliseconds before timeout */
  maxRuntime?: number;
  /** Maximum retries on failure */
  maxRetries?: number;
  /** Delay between retries in milliseconds */
  retryDelay?: number;
  /** Whether to automatically retry on failure */
  autoRetry?: boolean;
}

/**
 * Interface representing agent execution state
 */
export interface AgentState {
  /** Current status of the agent */
  status: AgentStatus;
  /** Last run timestamp */
  lastRunAt?: Date;
  /** Start time of current/last run */
  startedAt?: Date;
  /** End time of current/last run */
  completedAt?: Date;
  /** Number of retries performed */
  retries: number;
}

/**
 * Interface representing agent execution result
 */
export interface AgentResult<T = any> {
  /** Whether the agent execution was successful */
  success: boolean;
  /** Output data from the agent (if successful) */
  data?: T;
  /** Error details (if unsuccessful) */
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
  /** Metrics about the execution */
  metrics?: {
    /** Duration in milliseconds */
    duration: number;
    /** Resources used (e.g., API calls, tokens, etc.) */
    resources?: Record<string, number>;
  };
  /** Timestamp when the result was produced */
  timestamp: Date;
}

/**
 * Interface for agent log entries
 */
export interface AgentLogEntry {
  /** Log timestamp */
  timestamp: Date;
  /** Log level */
  level: 'info' | 'warning' | 'error';
  /** Log message */
  message: string;
  /** Additional context */
  context?: Record<string, any>;
}

/**
 * Type for agent runtime options
 */
export interface AgentRunOptions {
  /** Force agent to run even if conditions aren't met */
  force?: boolean;
  /** Custom timeout for this specific run */
  timeout?: number;
  /** Additional context for this run */
  context?: Record<string, any>;
}

/**
 * Interface defining the structure for content agent outputs
 */
export interface ContentAgentOutput {
  title: string;
  content: string;
  contentType: string;
  platform?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface defining the structure for outreach agent outputs
 */
export interface OutreachAgentOutput {
  leadInfo: {
    email?: string;
    name?: string;
    company?: string;
    [key: string]: any;
  };
  response: string;
  contactMethod: string;
  metadata?: Record<string, any>;
}

/**
 * Interface defining the structure for ad optimizer agent outputs
 */
export interface AdOptimizerOutput {
  recommendations: Array<{
    adId: string;
    changes: Record<string, any>;
    expectedImpact: number;
    confidence: number;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Interface defining the structure for trend predictor agent outputs
 */
export interface TrendPredictorOutput {
  trends: Array<{
    title: string;
    description: string;
    confidence: number;
    source: string;
    predictedImpact: number;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Type guard to check if an agent result is successful
 */
export function isSuccessfulResult<T>(
  result: AgentResult<T>,
): result is AgentResult<T> & { success: true; data: T } {
  return result.success === true;
}

/**
 * Type guard to check if an agent result is a failure
 */
export function isFailedResult(result: AgentResult): result is AgentResult & {
  success: false;
  error: NonNullable<AgentResult['error']>;
} {
  return result.success === false;
}
