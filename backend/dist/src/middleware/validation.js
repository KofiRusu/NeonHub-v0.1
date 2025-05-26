"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
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
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: error.errors || [{ message: 'Invalid request data' }],
            });
        }
    };
};
exports.validateRequest = validateRequest;
//# sourceMappingURL=validation.js.map