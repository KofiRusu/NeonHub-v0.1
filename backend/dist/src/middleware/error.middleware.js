'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.errorHandler = void 0;
/**
 * Custom error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  const error = { ...err };
  error.message = err.message;
  // Log error for server-side debugging
  console.error('Error:', err);
  // Prisma error handling
  if (err.code === 'P2002') {
    error.message = 'Duplicate field value entered';
    error.statusCode = 400;
  }
  if (err.code === 'P2025') {
    error.message = 'Resource not found';
    error.statusCode = 404;
  }
  // Handle validation errors
  if (err.name === 'ValidationError') {
    error.message = Object.values(err)
      .map((val) => val.message)
      .join(', ');
    error.statusCode = 400;
  }
  // Set default status code if not provided
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: error.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};
exports.errorHandler = errorHandler;
