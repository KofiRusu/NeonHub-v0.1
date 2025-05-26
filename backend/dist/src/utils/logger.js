"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logError = exports.logAPIRequest = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
// Configure the logger
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
    }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json()),
    defaultMeta: { service: 'neonhub-backend' },
    transports: [
        // Write all logs with importance level of `error` or less to `error.log`
        new winston_1.default.transports.File({ filename: 'logs/error.log', level: 'error' }),
        // Write all logs with importance level of `info` or less to `combined.log`
        new winston_1.default.transports.File({ filename: 'logs/combined.log' }),
    ],
});
exports.logger = logger;
// If we're not in production then log to the console
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple()),
    }));
}
// In test environment, silence logs unless explicitly enabled
if (process.env.NODE_ENV === 'test' && !process.env.ENABLE_LOGS) {
    logger.silent = true;
}
// Helper function to log API requests
const logAPIRequest = (method, path, status, responseTime) => {
    logger.info({
        message: `API Request: ${method} ${path}`,
        method,
        path,
        status,
        responseTime,
    });
};
exports.logAPIRequest = logAPIRequest;
// Helper function to log errors with context
const logError = (error, context) => {
    logger.error({
        message: error.message,
        stack: error.stack,
        ...context,
    });
};
exports.logError = logError;
//# sourceMappingURL=logger.js.map