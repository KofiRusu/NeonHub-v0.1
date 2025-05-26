"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricService = exports.MetricSource = exports.MetricType = void 0;
exports.getMetricService = getMetricService;
/**
 * Types of metrics that can be logged
 */
var MetricType;
(function (MetricType) {
    MetricType["AGENT_EXECUTION_TIME"] = "agent_execution_time";
    MetricType["TOKEN_USAGE"] = "token_usage";
    MetricType["AGENT_SUCCESS_RATE"] = "agent_success_rate";
    MetricType["CONTENT_PRODUCTION"] = "content_production";
    MetricType["TREND_DETECTION"] = "trend_detection";
    MetricType["CAMPAIGN_PERFORMANCE"] = "campaign_performance";
})(MetricType || (exports.MetricType = MetricType = {}));
/**
 * Metric source categories
 */
var MetricSource;
(function (MetricSource) {
    MetricSource["AGENT"] = "agent";
    MetricSource["CAMPAIGN"] = "campaign";
    MetricSource["CONTENT"] = "content";
    MetricSource["SYSTEM"] = "system";
})(MetricSource || (exports.MetricSource = MetricSource = {}));
/**
 * Service for logging and retrieving metrics
 */
class MetricService {
    prisma;
    constructor(prisma) {
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
    async logMetric(name, value, source, projectId, campaignId, metadata) {
        return this.prisma.metric.create({
            data: {
                name,
                value,
                source,
                projectId,
                ...(campaignId ? { campaignId } : {}),
                metadata: metadata,
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
    async logAgentExecutionMetrics(executionTime, agentId, agentType, projectId, sessionId, campaignId, success = true, tokenUsage) {
        const metrics = [];
        // Log execution time
        const executionMetric = await this.logMetric(MetricType.AGENT_EXECUTION_TIME, executionTime, MetricSource.AGENT, projectId, campaignId, {
            agentId,
            agentType,
            sessionId,
            outcomeType: success ? 'success' : 'failure',
        });
        metrics.push(executionMetric);
        // Log success rate (0 or 1 for success/failure)
        const successMetric = await this.logMetric(MetricType.AGENT_SUCCESS_RATE, success ? 1 : 0, MetricSource.AGENT, projectId, campaignId, {
            agentId,
            agentType,
            sessionId,
        });
        metrics.push(successMetric);
        // Log token usage if provided
        if (tokenUsage) {
            const tokenMetric = await this.logMetric(MetricType.TOKEN_USAGE, tokenUsage.total, MetricSource.AGENT, projectId, campaignId, {
                agentId,
                agentType,
                sessionId,
                inputTokens: tokenUsage.input,
                outputTokens: tokenUsage.output,
            });
            metrics.push(tokenMetric);
        }
        return metrics;
    }
    /**
     * Get metrics for a campaign
     * @param campaignId Campaign ID
     * @returns Array of metrics
     */
    async getCampaignMetrics(campaignId) {
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
    async getAgentMetrics(agentId) {
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
exports.MetricService = MetricService;
// Singleton instance
let metricServiceInstance = null;
/**
 * Get the singleton instance of MetricService
 * @param prisma PrismaClient instance
 * @returns MetricService instance
 */
function getMetricService(prisma) {
    if (!metricServiceInstance) {
        metricServiceInstance = new MetricService(prisma);
    }
    return metricServiceInstance;
}
//# sourceMappingURL=MetricService.js.map