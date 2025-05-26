import { PrismaClient, Metric, MetricSource } from '@prisma/client';
import { TokenUsage } from '../../agents/types';

/**
 * Service for handling metrics collection and analysis
 */
export class MetricService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

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
  async logAgentExecutionMetrics(
    executionTime: number,
    agentId: string,
    agentType: string,
    projectId: string,
    executionId: string,
    campaignId?: string,
    success = true,
    tokenUsage?: TokenUsage,
  ): Promise<Metric> {
    // Create a new metric entry for the agent execution
    return this.prisma.metric.create({
      data: {
        metricSource: 'AGENT' as MetricSource,
        sourceId: agentId,
        projectId,
        campaignId,
        timestamp: new Date(),
        data: {
          executionTime,
          executionId,
          agentType,
          success,
          tokenUsage: tokenUsage || null,
        } as any,
      },
    });
  }
}
