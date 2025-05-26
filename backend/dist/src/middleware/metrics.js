"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.trackAgentExecution = exports.metricsHandler = exports.metricsMiddleware = void 0;
const prom_client_1 = __importDefault(require("prom-client"));
// Create a Registry to register metrics
const register = new prom_client_1.default.Registry();
exports.register = register;
// Add default metrics (memory, CPU, etc.)
prom_client_1.default.collectDefaultMetrics({ register });
// HTTP request duration metric
const httpRequestDuration = new prom_client_1.default.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10], // in seconds
});
// HTTP request counter
const httpRequestCounter = new prom_client_1.default.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
});
// API error counter
const apiErrorCounter = new prom_client_1.default.Counter({
    name: 'api_errors_total',
    help: 'Total number of API errors',
    labelNames: ['method', 'route', 'error_code'],
});
// Agent execution metrics
const agentExecutionDuration = new prom_client_1.default.Histogram({
    name: 'agent_execution_duration_seconds',
    help: 'Duration of agent executions in seconds',
    labelNames: ['agent_type', 'status'],
    buckets: [0.5, 1, 2, 5, 10, 30, 60, 120, 300, 600], // in seconds
});
const agentExecutionCounter = new prom_client_1.default.Counter({
    name: 'agent_executions_total',
    help: 'Total number of agent executions',
    labelNames: ['agent_type', 'status'],
});
// Register metrics with the registry
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestCounter);
register.registerMetric(apiErrorCounter);
register.registerMetric(agentExecutionDuration);
register.registerMetric(agentExecutionCounter);
/**
 * Middleware to track HTTP request metrics
 */
const metricsMiddleware = (req, res, next) => {
    // Record start time
    const start = Date.now();
    // Add response hook to record metrics when the request is complete
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000; // Convert to seconds
        // Normalize route path to prevent high cardinality
        const route = req.route ? req.baseUrl + req.route.path : req.path;
        // Record metrics
        httpRequestDuration.observe({ method: req.method, route, status_code: res.statusCode }, duration);
        httpRequestCounter.inc({
            method: req.method,
            route,
            status_code: res.statusCode,
        });
        // Track errors
        if (res.statusCode >= 400) {
            apiErrorCounter.inc({
                method: req.method,
                route,
                error_code: res.statusCode,
            });
        }
    });
    next();
};
exports.metricsMiddleware = metricsMiddleware;
/**
 * Metrics endpoint handler to expose Prometheus metrics
 */
const metricsHandler = async (_req, res) => {
    try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
    }
    catch (error) {
        console.error('Error generating metrics:', error);
        res.status(500).end();
    }
};
exports.metricsHandler = metricsHandler;
/**
 * Track agent execution metrics
 * @param agentType Type of agent
 * @param status Execution status (success/error)
 * @param durationMs Duration in milliseconds
 */
const trackAgentExecution = (agentType, status, durationMs) => {
    const durationSeconds = durationMs / 1000;
    agentExecutionDuration.observe({ agent_type: agentType, status }, durationSeconds);
    agentExecutionCounter.inc({ agent_type: agentType, status });
};
exports.trackAgentExecution = trackAgentExecution;
//# sourceMappingURL=metrics.js.map