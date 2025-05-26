import { Request, Response, NextFunction } from 'express';
export interface ApiError extends Error {
    statusCode?: number;
    code?: string;
}
/**
 * Custom error handling middleware
 */
export declare const errorHandler: (err: ApiError, req: Request, res: Response, next: NextFunction) => void;
