import jwt from 'jsonwebtoken';
import { logger } from './logger';

// Default JWT expiration time
const DEFAULT_EXPIRY = process.env.JWT_EXPIRE || '7d';

/**
 * Generate a JWT token
 * @param payload Data to encode in the token
 * @param expiresIn Token expiration time
 * @returns JWT token string
 */
export const generateToken = (payload: any, expiresIn = '30d'): string => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  return jwt.sign(
    payload,
    secret,
    { expiresIn }
  );
};

/**
 * Verify a JWT token
 * @param token JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): any => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

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
