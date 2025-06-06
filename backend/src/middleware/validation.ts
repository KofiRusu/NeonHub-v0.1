import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../utils/logger';

/**
 * Middleware for validating request data against a Zod schema
 * @param schema Zod schema to validate against
 * @returns Express middleware
 */
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Combine body, query, and params for validation
      const data = {
        ...req.body,
        ...req.query,
        ...req.params,
      };

      // Validate against schema
      const validatedData = schema.parse(data);

      // Replace request body with validated data
      req.body = validatedData;

      next();
    } catch (error) {
      logger.error('Validation error:', error);
      
      // Check if error is a ZodError
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors || [{ message: 'Invalid request data' }],
        });
      }
      
      // Handle other errors
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: [{ message: 'Request validation failed' }],
      });
    }
  };
}; 