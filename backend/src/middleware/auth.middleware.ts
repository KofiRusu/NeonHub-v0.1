import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { getAuthService } from '../services';

const prisma = new PrismaClient();

// Extend Express Request interface to include user
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

/**
 * Authentication middleware that verifies the JWT token
 * and attaches the user object to the request
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const decoded = verifyToken(token);

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
      ...decoded
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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

/**
 * Middleware to restrict access to specific roles
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
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
