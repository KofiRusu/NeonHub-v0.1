import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../utils/jwt';
import axios from 'axios';

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
export enum OAuthProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
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
export class AuthService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Register a new user
   * @param data User registration data
   * @returns Authentication result
   */
  async register(data: RegisterData): Promise<AuthResult> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // Create new user
    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
    });

    // Generate JWT token
    const token = generateToken(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    };
  }

  /**
   * Login a user with email and password
   * @param credentials Login credentials
   * @returns Authentication result
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: credentials.email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(
      credentials.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate JWT token
    const token = generateToken(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    };
  }

  /**
   * Authenticate a user using OAuth
   * @param provider OAuth provider
   * @param code Authorization code
   * @returns Authentication result
   */
  async authenticateWithOAuth(
    provider: OAuthProvider,
    code: string,
  ): Promise<AuthResult> {
    // Get OAuth profile based on provider
    let profile: OAuthProfile;

    switch (provider) {
      case OAuthProvider.GOOGLE:
        profile = await this.getGoogleProfile(code);
        break;
      case OAuthProvider.GITHUB:
        profile = await this.getGithubProfile(code);
        break;
      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }

    // Find or create user
    const user = await this.findOrCreateOAuthUser(profile);

    // Generate JWT token
    const token = generateToken(user);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    };
  }

  /**
   * Get user by ID
   * @param userId User ID
   * @returns User data
   */
  async getUserById(userId: string): Promise<Partial<User> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * Find or create a user from OAuth profile
   * @param profile OAuth profile
   * @returns User data
   */
  private async findOrCreateOAuthUser(profile: OAuthProfile): Promise<User> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (existingUser) {
      // Update avatar if it's changed
      if (profile.avatar && existingUser.avatar !== profile.avatar) {
        return this.prisma.user.update({
          where: { id: existingUser.id },
          data: { avatar: profile.avatar },
        });
      }
      return existingUser;
    }

    // Create new user
    return this.prisma.user.create({
      data: {
        name: profile.name,
        email: profile.email,
        // Generate a random password for OAuth users
        password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10),
        avatar: profile.avatar,
      },
    });
  }

  /**
   * Get Google user profile from authorization code
   * @param code Authorization code
   * @returns OAuth profile
   */
  private async getGoogleProfile(code: string): Promise<OAuthProfile> {
    try {
      // Exchange code for tokens
      const tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          code,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI,
          grant_type: 'authorization_code',
        },
      );

      // Get user info using access token
      const userResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.data.access_token}`,
          },
        },
      );

      return {
        id: userResponse.data.id,
        email: userResponse.data.email,
        name: userResponse.data.name,
        avatar: userResponse.data.picture,
        provider: OAuthProvider.GOOGLE,
      };
    } catch (error) {
      console.error('Google OAuth error:', error);
      throw new Error('Failed to authenticate with Google');
    }
  }

  /**
   * Get GitHub user profile from authorization code
   * @param code Authorization code
   * @returns OAuth profile
   */
  private async getGithubProfile(code: string): Promise<OAuthProfile> {
    try {
      // Exchange code for access token
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        },
        {
          headers: {
            Accept: 'application/json',
          },
        },
      );

      // Get user info using access token
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `token ${tokenResponse.data.access_token}`,
        },
      });

      // Get user email (GitHub might not return email in user info)
      const emailsResponse = await axios.get(
        'https://api.github.com/user/emails',
        {
          headers: {
            Authorization: `token ${tokenResponse.data.access_token}`,
          },
        },
      );

      // Find primary email
      const primaryEmail = emailsResponse.data.find(
        (email: any) => email.primary,
      )?.email;

      return {
        id: userResponse.data.id.toString(),
        email: primaryEmail || `${userResponse.data.id}@github.noreply.com`,
        name: userResponse.data.name || userResponse.data.login,
        avatar: userResponse.data.avatar_url,
        provider: OAuthProvider.GITHUB,
      };
    } catch (error) {
      console.error('GitHub OAuth error:', error);
      throw new Error('Failed to authenticate with GitHub');
    }
  }
}
