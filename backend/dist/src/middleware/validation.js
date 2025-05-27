"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
/**
 * Middleware for validating request data against a Zod schema
 * @param schema Zod schema to validate against
 * @returns Express middleware
 */
const validateRequest = (schema) => {
    return (req, res, next) => {
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
        }
        catch (error) {
            logger_1.logger.error('Validation error:', error);
            // Check if error is a ZodError
            if (error instanceof zod_1.ZodError) {
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
exports.validateRequest = validateRequest;
//# sourceMappingURL=validation.js.map