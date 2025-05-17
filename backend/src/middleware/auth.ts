import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Authenticate user JWT token and add user data to request
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Internal server error' });
    }

    jwt.verify(token, jwtSecret, async (err: any, decoded: any) => {
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
  } catch (error) {
    logger.error('Error in authentication middleware:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Middleware to check if user has admin role
 */
export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
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
  expiresIn = '7d'
) => {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    jwtSecret,
    { expiresIn }
  );
}; 