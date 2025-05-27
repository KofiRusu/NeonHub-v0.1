"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.restrictTo = exports.protect = exports.generateJWT = exports.adminOnly = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const logger_1 = require("../utils/logger");
const jwt_1 = require("../utils/jwt");
const prisma = new client_1.PrismaClient();
/**
 * Authenticate user JWT token and add user data to request
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            logger_1.logger.error('JWT_SECRET is not defined in environment variables');
            return res.status(500).json({ message: 'Internal server error' });
        }
        jsonwebtoken_1.default.verify(token, jwtSecret, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid or expired token' });
            }
            // Find user in database to ensure they still exist
            const user = await prisma.user.findUnique({
                where: { id: decoded.id },
            });
            if (!user) {
                return res.status(403).json({ message: 'User no longer exists' });
            }
            // Add user data to request
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role,
            };
            next();
        });
    }
    catch (error) {
        logger_1.logger.error('Error in authentication middleware:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};
exports.authenticateToken = authenticateToken;
/**
 * Middleware to check if user has admin role
 */
const adminOnly = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};
exports.adminOnly = adminOnly;
/**
 * Generate a JWT token for a user
 */
const generateJWT = (user, expiresIn = '7d') => {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        role: user.role,
    }, jwtSecret, { expiresIn });
};
exports.generateJWT = generateJWT;
/**
 * Middleware to protect routes that require authentication
 */
const protect = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route',
            });
        }
        // Get token from Bearer header
        const token = authHeader.split(' ')[1];
        // Verify token
        const decoded = (0, jwt_1.verifyToken)(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token',
            });
        }
        // Add user to request
        req.user = decoded;
        next();
    }
    catch (error) {
        logger_1.logger.error('Auth middleware error:', error);
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route',
        });
    }
};
exports.protect = protect;
/**
 * Middleware to restrict access to specific roles
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        // Check if user exists and has a role
        if (!req.user || !req.user.role) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Insufficient permissions',
            });
        }
        // Check if user role is allowed
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Insufficient permissions for this role',
            });
        }
        next();
    };
};
exports.restrictTo = restrictTo;
//# sourceMappingURL=auth.js.map