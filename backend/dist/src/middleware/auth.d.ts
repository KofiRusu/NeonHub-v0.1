import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}
/**
 * Authenticate user JWT token and add user data to request
 */
export declare const authenticateToken: (req: AuthRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to check if user has admin role
 */
export declare const adminOnly: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
/**
 * Generate a JWT token for a user
 */
export declare const generateJWT: (user: {
    id: string;
    email: string;
    role: string;
}, expiresIn?: string) => never;
