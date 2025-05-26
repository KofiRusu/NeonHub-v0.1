import { PrismaClient, Metric } from '@prisma/client';
import { TokenUsage } from '../../agents/types';
/**
 * Service for handling metrics collection and analysis
 */
export declare class MetricService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Log metrics for agent execution
     * @param executionTime Execution time in milliseconds
     * @param agentId Agent ID
     * @param agentType Agent type
     * @param projectId Project ID
     * @param executionId Execution session ID
     * @param campaignId Optional campaign ID
     * @param success Whether the execution was successful
     * @param tokenUsage Optional token usage information
     */
    logAgentExecutionMetrics(executionTime: number, agentId: string, agentType: string, projectId: string, executionId: string, campaignId?: string, success?: boolean, tokenUsage?: TokenUsage): Promise<Metric>;
}
