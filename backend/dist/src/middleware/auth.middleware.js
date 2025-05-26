"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.protect = void 0;
const jwt_1 = require("../utils/jwt");
const index_1 = require("../index");
const services_1 = require("../services");
/**
 * Middleware to protect routes by requiring authentication
 */
const protect = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        const token = (0, jwt_1.extractTokenFromHeader)(authHeader);
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route',
            });
        }
        // Verify token
        const decoded = (0, jwt_1.verifyJWT)(token);
        if (!decoded) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token',
            });
        }
        // Check if user still exists
        const authService = (0, services_1.getAuthService)(index_1.prisma);
        const user = await authService.getUserById(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists',
            });
        }
        // Add user to request object
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role,
        };
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
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
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route',
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`,
            });
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.middleware.js.map