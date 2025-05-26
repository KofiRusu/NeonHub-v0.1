import { PrismaClient } from '@prisma/client';
interface GoogleUserInfo {
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
}
export declare class GoogleOAuthService {
    private client;
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Generate OAuth URL for Google authentication
     */
    getAuthUrl(): Promise<string>;
    /**
     * Exchange authorization code for tokens
     */
    exchangeCodeForTokens(code: string): Promise<import("google-auth-library").Credentials>;
    /**
     * Get user information from Google API
     */
    getUserInfo(accessToken: string): Promise<GoogleUserInfo>;
    /**
     * Authenticate user with Google OAuth
     */
    authenticateUser(code: string): Promise<{
        user: any;
        token: string;
        isNewUser: boolean;
    }>;
    /**
     * Store OAuth credentials in database
     */
    private storeOAuthCredentials;
    /**
     * Generate JWT token for authenticated user
     */
    private generateJWTToken;
    /**
     * Refresh OAuth tokens
     */
    refreshTokens(userId: string): Promise<boolean>;
    /**
     * Revoke OAuth tokens
     */
    revokeTokens(userId: string): Promise<boolean>;
    /**
     * Verify Google ID token
     */
    verifyIdToken(idToken: string): Promise<GoogleUserInfo | null>;
}
export {};
