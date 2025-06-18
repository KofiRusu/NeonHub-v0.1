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
 * Authentication middleware that verifies the JWT token
 * and attaches the user object to the request
 */
export declare const protect: (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;
/**
 * Middleware to check if user has admin role
 */
export declare const requireAdmin: (
  req: Request,
  res: Response,
  next: NextFunction,
) => void;
/**
 * Middleware to restrict access to specific roles
 */
export declare const authorize: (
  ...roles: string[]
) => (
  req: Request,
  res: Response,
  next: NextFunction,
) => Response<any, Record<string, any>> | undefined;
