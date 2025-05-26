import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics (memory, CPU, etc.)
client.collectDefaultMetrics({ register });

// HTTP request duration metric
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10], // in seconds
});

// HTTP request counter
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// API error counter
const apiErrorCounter = new client.Counter({
  name: 'api_errors_total',
  help: 'Total number of API errors',
  labelNames: ['method', 'route', 'error_code'],
});

// Agent execution metrics
const agentExecutionDuration = new client.Histogram({
  name: 'agent_execution_duration_seconds',
  help: 'Duration of agent executions in seconds',
  labelNames: ['agent_type', 'status'],
  buckets: [0.5, 1, 2, 5, 10, 30, 60, 120, 300, 600], // in seconds
});

const agentExecutionCounter = new client.Counter({
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
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Record start time
  const start = Date.now();

  // Add response hook to record metrics when the request is complete
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    
    // Normalize route path to prevent high cardinality
    const route = req.route ? req.baseUrl + req.route.path : req.path;
    
    // Record metrics
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );
    
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

/**
 * Metrics endpoint handler to expose Prometheus metrics
 */
export const metricsHandler = async (_req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    console.error('Error generating metrics:', error);
    res.status(500).end();
  }
};

/**
 * Track agent execution metrics
 * @param agentType Type of agent
 * @param status Execution status (success/error)
 * @param durationMs Duration in milliseconds
 */
export const trackAgentExecution = (
  agentType: string,
  status: 'success' | 'error',
  durationMs: number
) => {
  const durationSeconds = durationMs / 1000;
  agentExecutionDuration.observe({ agent_type: agentType, status }, durationSeconds);
  agentExecutionCounter.inc({ agent_type: agentType, status });
};

// Export metrics registry for use in other parts of the application
export { register }; 