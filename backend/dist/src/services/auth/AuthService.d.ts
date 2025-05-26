import { PrismaClient, User } from '@prisma/client';
/**
 * User registration data
 */
export interface RegisterData {
    name: string;
    email: string;
    password: string;
}
/**
 * Login credentials
 */
export interface LoginCredentials {
    email: string;
    password: string;
}
/**
 * Authentication result
 */
export interface AuthResult {
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        avatar?: string | null;
    };
    token: string;
}
/**
 * OAuth provider types
 */
export declare enum OAuthProvider {
    GOOGLE = "google",
    GITHUB = "github"
}
/**
 * OAuth profile data structure
 */
export interface OAuthProfile {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    provider: OAuthProvider;
}
/**
 * Service for handling authentication-related operations
 */
export declare class AuthService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Register a new user
     * @param data User registration data
     * @returns Authentication result
     */
    register(data: RegisterData): Promise<AuthResult>;
    /**
     * Login a user with email and password
     * @param credentials Login credentials
     * @returns Authentication result
     */
    login(credentials: LoginCredentials): Promise<AuthResult>;
    /**
     * Authenticate a user using OAuth
     * @param provider OAuth provider
     * @param code Authorization code
     * @returns Authentication result
     */
    authenticateWithOAuth(provider: OAuthProvider, code: string): Promise<AuthResult>;
    /**
     * Get user by ID
     * @param userId User ID
     * @returns User data
     */
    getUserById(userId: string): Promise<Partial<User> | null>;
    /**
     * Find or create a user from OAuth profile
     * @param profile OAuth profile
     * @returns User data
     */
    private findOrCreateOAuthUser;
    /**
     * Get Google user profile from authorization code
     * @param code Authorization code
     * @returns OAuth profile
     */
    private getGoogleProfile;
    /**
     * Get GitHub user profile from authorization code
     * @param code Authorization code
     * @returns OAuth profile
     */
    private getGithubProfile;
}
