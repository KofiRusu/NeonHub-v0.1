"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricService = void 0;
/**
 * Service for handling metrics collection and analysis
 */
class MetricService {
    prisma;
    constructor(prisma) {
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
    async logAgentExecutionMetrics(executionTime, agentId, agentType, projectId, executionId, campaignId, success = true, tokenUsage) {
        // Create a new metric entry for the agent execution
        return this.prisma.metric.create({
            data: {
                metricSource: 'AGENT',
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
                },
            },
        });
    }
}
exports.MetricService = MetricService;
//# sourceMappingURL=MetricService.js.map