import * as jwt from 'jsonwebtoken';
import { logger } from './logger';

// Default JWT expiration time
const DEFAULT_EXPIRY = process.env.JWT_EXPIRE || '7d';

/**
 * Generate a JWT token
 * @param payload Data to encode in the token
 * @param expiresIn Token expiration time
 * @returns JWT token string
 */
export const generateToken = (payload: any, expiresIn = DEFAULT_EXPIRY): string => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as jwt.SignOptions['expiresIn']
  });
};

// Export with the name expected by other parts of the code
export const generateJWT = generateToken;

/**
 * Verify a JWT token
 * @param token JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): jwt.JwtPayload | null => {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  
  try {
    return jwt.verify(token, secret) as jwt.JwtPayload;
  } catch (error) {
    return null;
  }
};

// Export with the name expected by other parts of the code
export const verifyJWT = verifyToken;

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
