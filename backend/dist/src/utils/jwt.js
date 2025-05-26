"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTokenFromHeader = exports.verifyToken = exports.verifyJWT = exports.generateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("./logger");
// Default JWT expiration time
const DEFAULT_EXPIRY = process.env.JWT_EXPIRE || '7d';
/**
 * Generate a JWT token for a user
 * @param user User data to include in the token
 * @param expiresIn Token expiration time (default: from env or 7 days)
 * @returns JWT token
 */
const generateJWT = (user, expiresIn = DEFAULT_EXPIRY) => {
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            logger_1.logger.warn('JWT_SECRET is not set. Using development secret. This is not secure for production!');
        }
        return jsonwebtoken_1.default.sign({
            id: user.id,
            email: user.email,
            role: user.role || 'USER',
        }, jwtSecret || 'development-secret', { expiresIn: expiresIn });
    }
    catch (error) {
        logger_1.logger.error('Error generating JWT:', error);
        throw new Error('Failed to generate token');
    }
};
exports.generateJWT = generateJWT;
/**
 * Verify a JWT token
 * @param token JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
const verifyJWT = (token) => {
    try {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            logger_1.logger.warn('JWT_SECRET is not set. Using development secret. This is not secure for production!');
        }
        return jsonwebtoken_1.default.verify(token, jwtSecret || 'development-secret');
    }
    catch (error) {
        logger_1.logger.error('Error verifying JWT:', error);
        return null;
    }
};
exports.verifyJWT = verifyJWT;
// Alias for backward compatibility
exports.verifyToken = exports.verifyJWT;
/**
 * Extract a token from the Authorization header
 * @param authHeader Authorization header value
 * @returns Extracted token or null if not found
 */
const extractTokenFromHeader = (authHeader) => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7); // Remove "Bearer " prefix
};
exports.extractTokenFromHeader = extractTokenFromHeader;
//# sourceMappingURL=jwt.js.map