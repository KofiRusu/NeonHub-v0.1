'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.requireAuth = requireAuth;
const auth_middleware_1 = require('./auth.middleware');
/**
 * Creates a wrapped handler that ensures the request is authenticated
 * before passing it to the original handler. This maintains proper typing.
 *
 * @param handler The authenticated route handler
 * @returns A standard Express request handler with authentication
 */
function requireAuth(handler) {
  return async (req, res, next) => {
    // Apply authentication middleware
    const authMiddleware = (req, res, nextFn) => {
      (0, auth_middleware_1.protect)(req, res, nextFn);
    };
    try {
      // Execute auth middleware
      await new Promise((resolve, reject) => {
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
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}
