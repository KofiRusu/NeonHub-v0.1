import { PrismaClient, Metric } from '@prisma/client';

/**
 * Types of metrics that can be logged
 */
export enum MetricType {
  AGENT_EXECUTION_TIME = 'agent_execution_time',
  TOKEN_USAGE = 'token_usage',
  AGENT_SUCCESS_RATE = 'agent_success_rate',
  CONTENT_PRODUCTION = 'content_production',
  TREND_DETECTION = 'trend_detection',
  CAMPAIGN_PERFORMANCE = 'campaign_performance',
}

/**
 * Metric source categories
 */
export enum MetricSource {
  AGENT = 'agent',
  CAMPAIGN = 'campaign',
  CONTENT = 'content',
  SYSTEM = 'system',
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
export class MetricService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

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
  async logMetric(
    name: string,
    value: number,
    source: string,
    projectId: string,
    campaignId?: string,
    metadata?: MetricMetadata,
  ): Promise<Metric> {
    return this.prisma.metric.create({
      data: {
        name,
        value,
        source,
        projectId,
        ...(campaignId ? { campaignId } : {}),
        metadata: metadata as any,
      },
    });
  }

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
  async logAgentExecutionMetrics(
    executionTime: number,
    agentId: string,
    agentType: string,
    projectId: string,
    sessionId: string,
    campaignId?: string,
    success = true,
    tokenUsage?: { input: number; output: number; total: number },
  ): Promise<Metric[]> {
    const metrics: Metric[] = [];

    // Log execution time
    const executionMetric = await this.logMetric(
      MetricType.AGENT_EXECUTION_TIME,
      executionTime,
      MetricSource.AGENT,
      projectId,
      campaignId,
      {
        agentId,
        agentType,
        sessionId,
        outcomeType: success ? 'success' : 'failure',
      },
    );
    metrics.push(executionMetric);

    // Log success rate (0 or 1 for success/failure)
    const successMetric = await this.logMetric(
      MetricType.AGENT_SUCCESS_RATE,
      success ? 1 : 0,
      MetricSource.AGENT,
      projectId,
      campaignId,
      {
        agentId,
        agentType,
        sessionId,
      },
    );
    metrics.push(successMetric);

    // Log token usage if provided
    if (tokenUsage) {
      const tokenMetric = await this.logMetric(
        MetricType.TOKEN_USAGE,
        tokenUsage.total,
        MetricSource.AGENT,
        projectId,
        campaignId,
        {
          agentId,
          agentType,
          sessionId,
          inputTokens: tokenUsage.input,
          outputTokens: tokenUsage.output,
        },
      );
      metrics.push(tokenMetric);
    }

    return metrics;
  }

  /**
   * Get metrics for a campaign
   * @param campaignId Campaign ID
   * @returns Array of metrics
   */
  async getCampaignMetrics(campaignId: string): Promise<Metric[]> {
    return this.prisma.metric.findMany({
      where: {
        campaignId,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }

  /**
   * Get metrics for an agent
   * @param agentId Agent ID
   * @returns Array of metrics
   */
  async getAgentMetrics(agentId: string): Promise<Metric[]> {
    return this.prisma.metric.findMany({
      where: {
        metadata: {
          path: ['agentId'],
          equals: agentId,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }
}

// Singleton instance
let metricServiceInstance: MetricService | null = null;

/**
 * Get the singleton instance of MetricService
 * @param prisma PrismaClient instance
 * @returns MetricService instance
 */
export function getMetricService(prisma: PrismaClient): MetricService {
  if (!metricServiceInstance) {
    metricServiceInstance = new MetricService(prisma);
  }
  return metricServiceInstance;
}
