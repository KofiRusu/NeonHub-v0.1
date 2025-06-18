import * as jwt from 'jsonwebtoken';
/**
 * Generate a JWT token
 * @param payload Data to encode in the token
 * @param expiresIn Token expiration time
 * @returns JWT token string
 */
export declare const generateToken: (
  payload: any,
  expiresIn?: string,
) => string;
export declare const generateJWT: (payload: any, expiresIn?: string) => string;
/**
 * Verify a JWT token
 * @param token JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export declare const verifyToken: (token: string) => jwt.JwtPayload | null;
export declare const verifyJWT: (token: string) => jwt.JwtPayload | null;
/**
 * Extract a token from the Authorization header
 * @param authHeader Authorization header value
 * @returns Extracted token or null if not found
 */
export declare const extractTokenFromHeader: (
  authHeader?: string,
) => string | null;
