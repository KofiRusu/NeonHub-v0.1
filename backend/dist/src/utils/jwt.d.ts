/**
 * Generate a JWT token for a user
 * @param user User data to include in the token
 * @param expiresIn Token expiration time (default: from env or 7 days)
 * @returns JWT token
 */
export declare const generateJWT: (user: {
    id: string;
    email: string;
    role?: string;
}, expiresIn?: string) => string;
/**
 * Verify a JWT token
 * @param token JWT token to verify
 * @returns Decoded token payload or null if invalid
 */
export declare const verifyJWT: (token: string) => any | null;
export declare const verifyToken: (token: string) => any | null;
/**
 * Extract a token from the Authorization header
 * @param authHeader Authorization header value
 * @returns Extracted token or null if not found
 */
export declare const extractTokenFromHeader: (authHeader?: string) => string | null;
