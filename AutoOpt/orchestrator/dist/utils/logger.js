"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createChildLogger = exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
// Determine the log level from environment variables, default to 'info'
const logLevel = process.env.LOG_LEVEL || 'info';
// Configure the logger
exports.logger = (0, pino_1.default)({
    level: logLevel,
    transport: process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
            },
        }
        : undefined,
    base: {
        service: 'orchestrator',
    },
});
// Create child loggers for specific components
const createChildLogger = (component) => {
    return exports.logger.child({ component });
};
exports.createChildLogger = createChildLogger;
exports.default = exports.logger;
