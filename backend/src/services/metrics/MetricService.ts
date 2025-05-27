import { PrismaClient, Metric } from '@prisma/client';
import { TokenUsage } from '../../agents/types';

// Add MetricSource enum since it's not in Prisma
export enum MetricSource {
  AGENT = 'AGENT',
  CAMPAIGN = 'CAMPAIGN',
  CONTENT = 'CONTENT',
  USER = 'USER',
  SYSTEM = 'SYSTEM'
}

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
        name: 'agent_execution_time',
        source: 'AGENT',
        value: executionTime,
        unit: 'ms',
        projectId,
        campaignId,
        metadata: {
          agentId,
          agentType,
          sessionId: executionId,
          success,
          tokenUsage: tokenUsage || null,
        } as any,
      },
    });
  }
}
