import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
/**
 * Middleware for validating request data against a Zod schema
 * @param schema Zod schema to validate against
 * @returns Express middleware
 */
export declare const validateRequest: (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
