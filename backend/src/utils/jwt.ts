import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

// Type for the JWT payload
interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

/**
 * Generate a JWT token for a user
 * @param user The user to generate a token for
 * @returns The generated JWT token
 */
export const generateToken = (user: User): string => {
  const payload: JwtPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const secret = process.env.JWT_SECRET || 'default_secret_change_this';
  const expiresIn = process.env.JWT_EXPIRE || '24h';

  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify a JWT token
 * @param token The token to verify
 * @returns The decoded token payload or null if invalid
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const secret = process.env.JWT_SECRET || 'default_secret_change_this';
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    return null;
  }
}; 