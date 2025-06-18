import { Request, Response, NextFunction } from 'express';
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}
/**
 * Authenticate user JWT token and add user data to request
 */
export declare const authenticateToken: (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Middleware to check if user has admin role
 */
export declare const adminOnly: (
  req: Request,
  res: Response,
  next: NextFunction,
) => Response<any, Record<string, any>> | undefined;
/**
 * Generate a JWT token for a user
 */
export declare const generateJWT: (
  user: {
    id: string;
    email: string;
    role: string;
  },
  expiresIn?: string,
) => string;
/**
 * Middleware to protect routes that require authentication
 */
export declare const protect: (
  req: Request,
  res: Response,
  next: NextFunction,
) => Response<any, Record<string, any>> | undefined;
/**
 * Middleware to restrict access to specific roles
 */
export declare const restrictTo: (
  ...roles: string[]
) => (
  req: Request,
  res: Response,
  next: NextFunction,
) => Response<any, Record<string, any>> | undefined;
/**
 * Alias for restrictTo for backward compatibility
 */
export declare const authorize: (
  ...roles: string[]
) => (
  req: Request,
  res: Response,
  next: NextFunction,
) => Response<any, Record<string, any>> | undefined;
