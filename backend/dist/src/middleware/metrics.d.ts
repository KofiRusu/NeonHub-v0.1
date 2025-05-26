import { Request, Response, NextFunction } from 'express';
declare const register: any;
/**
 * Middleware to track HTTP request metrics
 */
export declare const metricsMiddleware: (req: Request, res: Response, next: NextFunction) => void;
/**
 * Metrics endpoint handler to expose Prometheus metrics
 */
export declare const metricsHandler: (_req: Request, res: Response) => Promise<void>;
/**
 * Track agent execution metrics
 * @param agentType Type of agent
 * @param status Execution status (success/error)
 * @param durationMs Duration in milliseconds
 */
export declare const trackAgentExecution: (agentType: string, status: "success" | "error", durationMs: number) => void;
export { register };
