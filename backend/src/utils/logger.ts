import winston from 'winston';

// Configure the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
  ),
  defaultMeta: { service: 'neonhub-backend' },
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// If we're not in production then log to the console
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}

// In test environment, silence logs unless explicitly enabled
if (process.env.NODE_ENV === 'test' && !process.env.ENABLE_LOGS) {
  logger.silent = true;
}

export { logger };

// Helper function to log API requests
export const logAPIRequest = (
  method: string,
  path: string,
  status: number,
  responseTime: number,
) => {
  logger.info({
    message: `API Request: ${method} ${path}`,
    method,
    path,
    status,
    responseTime,
  });
};

// Helper function to log errors with context
export const logError = (error: Error, context?: Record<string, any>) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context,
  });
};
