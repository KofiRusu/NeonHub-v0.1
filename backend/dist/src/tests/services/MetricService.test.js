"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MetricService_1 = require("../../../services/MetricService");
const prismaMock_1 = require("../mocks/prismaMock");
describe('MetricService', () => {
    let metricService;
    beforeEach(() => {
        metricService = new MetricService_1.MetricService(prismaMock_1.prisma);
    });
    describe('logMetric', () => {
        it('should create a metric record with all data', async () => {
            const metric = (0, prismaMock_1.createTestMetric)();
            const metadata = { agentId: 'agent-id', sessionId: 'session-id' };
            prismaMock_1.prisma.metric.create.mockResolvedValue(metric);
            await metricService.logMetric('test_metric', 100, 'test_source', 'project-id', 'campaign-id', metadata);
            expect(prismaMock_1.prisma.metric.create).toHaveBeenCalledWith({
                data: {
                    name: 'test_metric',
                    value: 100,
                    source: 'test_source',
                    projectId: 'project-id',
                    campaignId: 'campaign-id',
                    metadata: metadata,
                },
            });
        });
        it('should create a metric without campaign ID when not provided', async () => {
            const metric = (0, prismaMock_1.createTestMetric)();
            prismaMock_1.prisma.metric.create.mockResolvedValue(metric);
            await metricService.logMetric('test_metric', 100, 'test_source', 'project-id');
            const createArg = prismaMock_1.prisma.metric.create.mock.calls[0][0];
            expect(createArg.data.campaignId).toBeUndefined();
        });
    });
    describe('logAgentExecutionMetrics', () => {
        it('should log execution time, success rate and token usage metrics', async () => {
            const executionTimeMetric = (0, prismaMock_1.createTestMetric)({
                name: MetricService_1.MetricType.AGENT_EXECUTION_TIME,
                value: 1500,
            });
            const successRateMetric = (0, prismaMock_1.createTestMetric)({
                name: MetricService_1.MetricType.AGENT_SUCCESS_RATE,
                value: 1,
            });
            const tokenUsageMetric = (0, prismaMock_1.createTestMetric)({
                name: MetricService_1.MetricType.TOKEN_USAGE,
                value: 2550,
            });
            prismaMock_1.prisma.metric.create
                .mockResolvedValueOnce(executionTimeMetric)
                .mockResolvedValueOnce(successRateMetric)
                .mockResolvedValueOnce(tokenUsageMetric);
            const tokenUsage = {
                input: 350,
                output: 2200,
                total: 2550,
            };
            const result = await metricService.logAgentExecutionMetrics(1500, // execution time
            'agent-id', // agent ID
            'CONTENT_CREATOR', // agent type
            'project-id', // project ID
            'session-id', // session ID
            'campaign-id', // campaign ID
            true, // success
            tokenUsage);
            expect(result.length).toBe(3);
            expect(prismaMock_1.prisma.metric.create).toHaveBeenCalledTimes(3);
            // Verify execution time metric
            const executionTimeCall = prismaMock_1.prisma.metric.create.mock.calls[0][0];
            expect(executionTimeCall.data.name).toBe(MetricService_1.MetricType.AGENT_EXECUTION_TIME);
            expect(executionTimeCall.data.value).toBe(1500);
            expect(executionTimeCall.data.source).toBe(MetricService_1.MetricSource.AGENT);
            expect(executionTimeCall.data.projectId).toBe('project-id');
            expect(executionTimeCall.data.campaignId).toBe('campaign-id');
            expect(executionTimeCall.data.metadata).toEqual(expect.objectContaining({
                agentId: 'agent-id',
                agentType: 'CONTENT_CREATOR',
                sessionId: 'session-id',
                outcomeType: 'success',
            }));
            // Verify success rate metric
            const successRateCall = prismaMock_1.prisma.metric.create.mock.calls[1][0];
            expect(successRateCall.data.name).toBe(MetricService_1.MetricType.AGENT_SUCCESS_RATE);
            expect(successRateCall.data.value).toBe(1);
            // Verify token usage metric
            const tokenUsageCall = prismaMock_1.prisma.metric.create.mock.calls[2][0];
            expect(tokenUsageCall.data.name).toBe(MetricService_1.MetricType.TOKEN_USAGE);
            expect(tokenUsageCall.data.value).toBe(2550);
            expect(tokenUsageCall.data.metadata).toEqual(expect.objectContaining({
                inputTokens: 350,
                outputTokens: 2200,
            }));
        });
        it('should not log token usage if not provided', async () => {
            const executionTimeMetric = (0, prismaMock_1.createTestMetric)();
            const successRateMetric = (0, prismaMock_1.createTestMetric)();
            prismaMock_1.prisma.metric.create
                .mockResolvedValueOnce(executionTimeMetric)
                .mockResolvedValueOnce(successRateMetric);
            const result = await metricService.logAgentExecutionMetrics(1500, 'agent-id', 'CONTENT_CREATOR', 'project-id', 'session-id');
            expect(result.length).toBe(2);
            expect(prismaMock_1.prisma.metric.create).toHaveBeenCalledTimes(2);
        });
        it('should log failure metrics correctly', async () => {
            const executionTimeMetric = (0, prismaMock_1.createTestMetric)();
            const successRateMetric = (0, prismaMock_1.createTestMetric)();
            prismaMock_1.prisma.metric.create
                .mockResolvedValueOnce(executionTimeMetric)
                .mockResolvedValueOnce(successRateMetric);
            await metricService.logAgentExecutionMetrics(1500, 'agent-id', 'CONTENT_CREATOR', 'project-id', 'session-id', 'campaign-id', false);
            const executionTimeCall = prismaMock_1.prisma.metric.create.mock.calls[0][0];
            expect(executionTimeCall.data.metadata).toEqual(expect.objectContaining({
                outcomeType: 'failure',
            }));
            const successRateCall = prismaMock_1.prisma.metric.create.mock.calls[1][0];
            expect(successRateCall.data.value).toBe(0);
        });
    });
    describe('getCampaignMetrics', () => {
        it('should return metrics for a campaign', async () => {
            const metrics = [(0, prismaMock_1.createTestMetric)(), (0, prismaMock_1.createTestMetric)()];
            prismaMock_1.prisma.metric.findMany.mockResolvedValue(metrics);
            const result = await metricService.getCampaignMetrics('campaign-id');
            expect(result).toEqual(metrics);
            expect(prismaMock_1.prisma.metric.findMany).toHaveBeenCalledWith({
                where: { campaignId: 'campaign-id' },
                orderBy: { timestamp: 'desc' },
            });
        });
    });
    describe('getAgentMetrics', () => {
        it('should return metrics for an agent', async () => {
            const metrics = [(0, prismaMock_1.createTestMetric)(), (0, prismaMock_1.createTestMetric)()];
            prismaMock_1.prisma.metric.findMany.mockResolvedValue(metrics);
            const result = await metricService.getAgentMetrics('agent-id');
            expect(result).toEqual(metrics);
            expect(prismaMock_1.prisma.metric.findMany).toHaveBeenCalledWith({
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
            const service1 = (0, MetricService_1.getMetricService)(prismaMock_1.prisma);
            const service2 = (0, MetricService_1.getMetricService)(prismaMock_1.prisma);
            expect(service1).toBe(service2);
        });
    });
});
//# sourceMappingURL=MetricService.test.js.map