import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import {
  verifyToken,
  extractTokenFromHeader,
  generateToken,
} from '../utils/jwt';

const prisma = new PrismaClient();

// Extend Express Request interface to include user property
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

/**
 * Authenticate user JWT token and add user data to request
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = verifyToken(token);

    if (!decoded) {
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
  } catch (error) {
    logger.error('Error in authentication middleware:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const adminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

/**
 * Generate a JWT token for a user
 */
export const generateJWT = (
  user: { id: string; email: string; role: string },
  expiresIn = '7d',
) => {
  return generateToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    expiresIn,
  );
};

/**
 * Middleware to protect routes that require authentication
 */
export const protect = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    // Add user to request
    req.user = decoded as { id: string; email: string; role: string };

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};

/**
 * Middleware to restrict access to specific roles
 */
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
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

/**
 * Alias for restrictTo for backward compatibility
 */
export const authorize = restrictTo;
