import { Request, Response, NextFunction, RequestHandler } from 'express';
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
  next?: NextFunction,
) => Promise<any> | any;
/**
 * Creates a wrapped handler that ensures the request is authenticated
 * before passing it to the original handler. This maintains proper typing.
 *
 * @param handler The authenticated route handler
 * @returns A standard Express request handler with authentication
 */
export declare function requireAuth(
  handler: AuthenticatedRequestHandler,
): RequestHandler;
