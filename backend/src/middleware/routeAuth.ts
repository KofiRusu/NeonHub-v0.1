import { Request, Response, NextFunction, RequestHandler } from 'express';
import { protect } from './auth.middleware';

/**
 * Interface for authenticated requests with guaranteed user object
 */
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    [key: string]: any;
  };
}

/**
 * Type for a route handler that expects an authenticated request
 */
export type AuthenticatedRequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next?: NextFunction
) => Promise<any> | any;

/**
 * Creates a wrapped handler that ensures the request is authenticated
 * before passing it to the original handler. This maintains proper typing.
 * 
 * @param handler The authenticated route handler
 * @returns A standard Express request handler with authentication
 */
export function requireAuth(handler: AuthenticatedRequestHandler): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Apply authentication middleware
    const authMiddleware = (req: Request, res: Response, nextFn: NextFunction) => {
      protect(req, res, nextFn);
    };

    try {
      // Execute auth middleware
      await new Promise<void>((resolve, reject) => {
        authMiddleware(req, res, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Type assertion is safe here because auth middleware will attach user
      // or respond with 401 before we get here
      await handler(req as AuthenticatedRequest, res, next);
    } catch (error) {
      next(error);
    }
  };
} 