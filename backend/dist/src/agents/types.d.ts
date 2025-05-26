import { TokenUsage, ExecutionOptions } from './base/BaseAgent';
/**
 * Configuration for agent execution
 */
export interface AgentExecutionConfig {
    /**
     * Campaign ID to link with this execution
     */
    campaignId?: string;
    /**
     * Additional configuration to pass to the agent
     */
    config?: Record<string, any>;
    /**
     * Whether to track metrics for this execution
     * @default true
     */
    trackMetrics?: boolean;
    /**
     * Token usage tracking for this execution
     */
    tokenUsage?: TokenUsage;
    /**
     * Maximum number of retry attempts
     */
    maxRetries?: number;
    /**
     * Delay between retry attempts in milliseconds
     */
    retryDelay?: number;
}
export { TokenUsage, ExecutionOptions };
