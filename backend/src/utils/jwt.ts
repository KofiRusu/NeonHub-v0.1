import jwt from 'jsonwebtoken';
import { logger } from './logger';

// Default JWT expiration time
const DEFAULT_EXPIRY = process.env.JWT_EXPIRE || '7d';

/**
 * Generate a JWT token for a user
 * @param user User data to include in the token
 * @param expiresIn Token expiration time (default: from env or 7 days)
 * @returns JWT token
 */
export const generateJWT = (
  user: { id: string; email: string; role?: string },
  expiresIn = DEFAULT_EXPIRY
): string => {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      logger.warn('JWT_SECRET is not set. Using development secret. This is not secure for production!');
    }
    
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role || 'USER',
      },
      jwtSecret || 'development-secret',
      { expiresIn: expiresIn }
    );
  } catch (error) {
    logger.error('Error generating JWT:', error);
    throw new Error('Failed to generate token');
  }
};

/**
 * Verify a JWT token
 * @param token JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyJWT = (token: string): any | null => {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      logger.warn('JWT_SECRET is not set. Using development secret. This is not secure for production!');
    }
    
    return jwt.verify(token, jwtSecret || 'development-secret');
  } catch (error) {
    logger.error('Error verifying JWT:', error);
    return null;
  }
};

// Alias for backward compatibility
export const verifyToken = verifyJWT;

/**
 * Extract a token from the Authorization header
 * @param authHeader Authorization header value
 * @returns Extracted token or null if not found
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove "Bearer " prefix
}; 