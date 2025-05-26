import { Request, Response, NextFunction } from 'express';
declare module 'express-serve-static-core' {
    interface Request {
        user?: {
            id: string;
            email: string;
            role: string;
        };
    }
}
/**
 * Middleware to protect routes by requiring authentication
 */
export declare const protect: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to restrict access to specific roles
 */
export declare const authorize: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
