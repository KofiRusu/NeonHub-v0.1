import { PrismaClient, Metric } from '@prisma/client';
/**
 * Types of metrics that can be logged
 */
export declare enum MetricType {
    AGENT_EXECUTION_TIME = "agent_execution_time",
    TOKEN_USAGE = "token_usage",
    AGENT_SUCCESS_RATE = "agent_success_rate",
    CONTENT_PRODUCTION = "content_production",
    TREND_DETECTION = "trend_detection",
    CAMPAIGN_PERFORMANCE = "campaign_performance"
}
/**
 * Metric source categories
 */
export declare enum MetricSource {
    AGENT = "agent",
    CAMPAIGN = "campaign",
    CONTENT = "content",
    SYSTEM = "system"
}
/**
 * Additional metadata for metrics
 */
export interface MetricMetadata {
    agentId?: string;
    agentType?: string;
    sessionId?: string;
    tokenModel?: string;
    outcomeType?: 'success' | 'failure' | 'partial';
    [key: string]: any;
}
/**
 * Service for logging and retrieving metrics
 */
export declare class MetricService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Log a new metric
     * @param name Metric name
     * @param value Metric value
     * @param source Source of the metric
     * @param projectId Project ID
     * @param campaignId Optional campaign ID
     * @param metadata Additional metadata
     * @returns The created metric
     */
    logMetric(name: string, value: number, source: string, projectId: string, campaignId?: string, metadata?: MetricMetadata): Promise<Metric>;
    /**
     * Log agent execution metrics
     * @param executionTime Execution time in milliseconds
     * @param agentId Agent ID
     * @param agentType Agent type
     * @param projectId Project ID
     * @param sessionId Execution session ID
     * @param campaignId Optional campaign ID
     * @param success Whether the execution was successful
     * @param tokenUsage Optional token usage information
     * @returns The created metrics
     */
    logAgentExecutionMetrics(executionTime: number, agentId: string, agentType: string, projectId: string, sessionId: string, campaignId?: string, success?: boolean, tokenUsage?: {
        input: number;
        output: number;
        total: number;
    }): Promise<Metric[]>;
    /**
     * Get metrics for a campaign
     * @param campaignId Campaign ID
     * @returns Array of metrics
     */
    getCampaignMetrics(campaignId: string): Promise<Metric[]>;
    /**
     * Get metrics for an agent
     * @param agentId Agent ID
     * @returns Array of metrics
     */
    getAgentMetrics(agentId: string): Promise<Metric[]>;
}
/**
 * Get the singleton instance of MetricService
 * @param prisma PrismaClient instance
 * @returns MetricService instance
 */
export declare function getMetricService(prisma: PrismaClient): MetricService;
