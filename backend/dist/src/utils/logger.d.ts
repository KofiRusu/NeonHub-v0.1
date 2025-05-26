import winston from 'winston';
declare const logger: winston.Logger;
export { logger };
export declare const logAPIRequest: (method: string, path: string, status: number, responseTime: number) => void;
export declare const logError: (error: Error, context?: Record<string, any>) => void;
