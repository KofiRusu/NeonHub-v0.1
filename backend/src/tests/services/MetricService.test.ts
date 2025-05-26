import {
  MetricService,
  getMetricService,
  MetricType,
  MetricSource,
} from '../../../services/MetricService';
import { prisma, createTestMetric } from '../mocks/prismaMock';

describe('MetricService', () => {
  let metricService: MetricService;

  beforeEach(() => {
    metricService = new MetricService(prisma);
  });

  describe('logMetric', () => {
    it('should create a metric record with all data', async () => {
      const metric = createTestMetric();
      const metadata = { agentId: 'agent-id', sessionId: 'session-id' };

      prisma.metric.create.mockResolvedValue(metric);

      await metricService.logMetric(
        'test_metric',
        100,
        'test_source',
        'project-id',
        'campaign-id',
        metadata,
      );

      expect(prisma.metric.create).toHaveBeenCalledWith({
        data: {
          name: 'test_metric',
          value: 100,
          source: 'test_source',
          projectId: 'project-id',
          campaignId: 'campaign-id',
          metadata: metadata as any,
        },
      });
    });

    it('should create a metric without campaign ID when not provided', async () => {
      const metric = createTestMetric();

      prisma.metric.create.mockResolvedValue(metric);

      await metricService.logMetric(
        'test_metric',
        100,
        'test_source',
        'project-id',
      );

      const createArg = prisma.metric.create.mock.calls[0][0];
      expect(createArg.data.campaignId).toBeUndefined();
    });
  });

  describe('logAgentExecutionMetrics', () => {
    it('should log execution time, success rate and token usage metrics', async () => {
      const executionTimeMetric = createTestMetric({
        name: MetricType.AGENT_EXECUTION_TIME,
        value: 1500,
      });

      const successRateMetric = createTestMetric({
        name: MetricType.AGENT_SUCCESS_RATE,
        value: 1,
      });

      const tokenUsageMetric = createTestMetric({
        name: MetricType.TOKEN_USAGE,
        value: 2550,
      });

      prisma.metric.create
        .mockResolvedValueOnce(executionTimeMetric)
        .mockResolvedValueOnce(successRateMetric)
        .mockResolvedValueOnce(tokenUsageMetric);

      const tokenUsage = {
        input: 350,
        output: 2200,
        total: 2550,
      };

      const result = await metricService.logAgentExecutionMetrics(
        1500, // execution time
        'agent-id', // agent ID
        'CONTENT_CREATOR', // agent type
        'project-id', // project ID
        'session-id', // session ID
        'campaign-id', // campaign ID
        true, // success
        tokenUsage, // token usage
      );

      expect(result.length).toBe(3);
      expect(prisma.metric.create).toHaveBeenCalledTimes(3);

      // Verify execution time metric
      const executionTimeCall = prisma.metric.create.mock.calls[0][0];
      expect(executionTimeCall.data.name).toBe(MetricType.AGENT_EXECUTION_TIME);
      expect(executionTimeCall.data.value).toBe(1500);
      expect(executionTimeCall.data.source).toBe(MetricSource.AGENT);
      expect(executionTimeCall.data.projectId).toBe('project-id');
      expect(executionTimeCall.data.campaignId).toBe('campaign-id');
      expect(executionTimeCall.data.metadata).toEqual(
        expect.objectContaining({
          agentId: 'agent-id',
          agentType: 'CONTENT_CREATOR',
          sessionId: 'session-id',
          outcomeType: 'success',
        }),
      );

      // Verify success rate metric
      const successRateCall = prisma.metric.create.mock.calls[1][0];
      expect(successRateCall.data.name).toBe(MetricType.AGENT_SUCCESS_RATE);
      expect(successRateCall.data.value).toBe(1);

      // Verify token usage metric
      const tokenUsageCall = prisma.metric.create.mock.calls[2][0];
      expect(tokenUsageCall.data.name).toBe(MetricType.TOKEN_USAGE);
      expect(tokenUsageCall.data.value).toBe(2550);
      expect(tokenUsageCall.data.metadata).toEqual(
        expect.objectContaining({
          inputTokens: 350,
          outputTokens: 2200,
        }),
      );
    });

    it('should not log token usage if not provided', async () => {
      const executionTimeMetric = createTestMetric();
      const successRateMetric = createTestMetric();

      prisma.metric.create
        .mockResolvedValueOnce(executionTimeMetric)
        .mockResolvedValueOnce(successRateMetric);

      const result = await metricService.logAgentExecutionMetrics(
        1500,
        'agent-id',
        'CONTENT_CREATOR',
        'project-id',
        'session-id',
      );

      expect(result.length).toBe(2);
      expect(prisma.metric.create).toHaveBeenCalledTimes(2);
    });

    it('should log failure metrics correctly', async () => {
      const executionTimeMetric = createTestMetric();
      const successRateMetric = createTestMetric();

      prisma.metric.create
        .mockResolvedValueOnce(executionTimeMetric)
        .mockResolvedValueOnce(successRateMetric);

      await metricService.logAgentExecutionMetrics(
        1500,
        'agent-id',
        'CONTENT_CREATOR',
        'project-id',
        'session-id',
        'campaign-id',
        false,
      );

      const executionTimeCall = prisma.metric.create.mock.calls[0][0];
      expect(executionTimeCall.data.metadata).toEqual(
        expect.objectContaining({
          outcomeType: 'failure',
        }),
      );

      const successRateCall = prisma.metric.create.mock.calls[1][0];
      expect(successRateCall.data.value).toBe(0);
    });
  });

  describe('getCampaignMetrics', () => {
    it('should return metrics for a campaign', async () => {
      const metrics = [createTestMetric(), createTestMetric()];

      prisma.metric.findMany.mockResolvedValue(metrics);

      const result = await metricService.getCampaignMetrics('campaign-id');

      expect(result).toEqual(metrics);
      expect(prisma.metric.findMany).toHaveBeenCalledWith({
        where: { campaignId: 'campaign-id' },
        orderBy: { timestamp: 'desc' },
      });
    });
  });

  describe('getAgentMetrics', () => {
    it('should return metrics for an agent', async () => {
      const metrics = [createTestMetric(), createTestMetric()];

      prisma.metric.findMany.mockResolvedValue(metrics);

      const result = await metricService.getAgentMetrics('agent-id');

      expect(result).toEqual(metrics);
      expect(prisma.metric.findMany).toHaveBeenCalledWith({
        where: {
          metadata: {
            path: ['agentId'],
            equals: 'agent-id',
          },
        },
        orderBy: { timestamp: 'desc' },
      });
    });
  });

  describe('getMetricService', () => {
    it('should return singleton instance', () => {
      const service1 = getMetricService(prisma);
      const service2 = getMetricService(prisma);

      expect(service1).toBe(service2);
    });
  });
});
