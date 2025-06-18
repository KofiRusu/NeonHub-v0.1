'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.authorize = exports.requireAdmin = exports.protect = void 0;
const jwt_1 = require('../utils/jwt');
const client_1 = require('@prisma/client');
const logger_1 = require('../utils/logger');
const prisma = new client_1.PrismaClient();
/**
 * Authentication middleware that verifies the JWT token
 * and attaches the user object to the request
 */
const protect = async (req, res, next) => {
  try {
    const token = (0, jwt_1.extractTokenFromHeader)(req.headers.authorization);
    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const decoded = (0, jwt_1.verifyToken)(token);
    if (!decoded || !decoded.id) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    // Find user by ID
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }
    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      ...decoded,
    };
    next();
  } catch (error) {
    logger_1.logger.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};
exports.protect = protect;
/**
 * Middleware to check if user has admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }
  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ message: 'Admin privileges required' });
    return;
  }
  next();
};
exports.requireAdmin = requireAdmin;
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
