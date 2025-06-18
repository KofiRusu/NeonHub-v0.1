'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.MetricService = exports.MetricSource = void 0;
// Add MetricSource enum since it's not in Prisma
var MetricSource;
(function (MetricSource) {
  MetricSource['AGENT'] = 'AGENT';
  MetricSource['CAMPAIGN'] = 'CAMPAIGN';
  MetricSource['CONTENT'] = 'CONTENT';
  MetricSource['USER'] = 'USER';
  MetricSource['SYSTEM'] = 'SYSTEM';
})(MetricSource || (exports.MetricSource = MetricSource = {}));
/**
 * Service for handling metrics collection and analysis
 */
class MetricService {
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
  async logAgentExecutionMetrics(
    executionTime,
    agentId,
    agentType,
    projectId,
    executionId,
    campaignId,
    success = true,
    tokenUsage,
  ) {
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
        },
      },
    });
  }
}
exports.MetricService = MetricService;
