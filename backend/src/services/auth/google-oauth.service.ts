import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
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

export class GoogleOAuthService {
  private client: OAuth2Client;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('Google OAuth credentials are required');
    }

    this.client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
    );
    this.prisma = prisma;
  }

  /**
   * Generate OAuth URL for Google authentication
   */
  async getAuthUrl(): Promise<string> {
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      include_granted_scopes: true,
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string) {
    try {
      const { tokens } = await this.client.getToken(code);
      this.client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new Error('Failed to exchange authorization code');
    }
  }

  /**
   * Get user information from Google API
   */
  async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch user info from Google');
      }

      const userInfo = await response.json();
      return userInfo as GoogleUserInfo;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw new Error('Failed to get user information');
    }
  }

  /**
   * Authenticate user with Google OAuth
   */
  async authenticateUser(code: string): Promise<{
    user: any;
    token: string;
    isNewUser: boolean;
  }> {
    try {
      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code);
      
      if (!tokens.access_token) {
        throw new Error('No access token received');
      }

      // Get user info from Google
      const googleUser = await this.getUserInfo(tokens.access_token);

      if (!googleUser.verified_email) {
        throw new Error('Email not verified with Google');
      }

      // Check if user exists in database
      let user = await this.prisma.user.findUnique({
        where: { email: googleUser.email }
      });

      let isNewUser = false;

      if (!user) {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email: googleUser.email,
            name: googleUser.name,
            avatar: googleUser.picture,
            password: '', // OAuth users don't have passwords
            role: 'USER'
          }
        });
        isNewUser = true;
      } else {
        // Update existing user with latest Google info
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            name: googleUser.name,
            avatar: googleUser.picture
          }
        });
      }

      // Store/update OAuth credentials
      await this.storeOAuthCredentials(user.id, tokens, googleUser);

      // Generate JWT token
      const jwtToken = this.generateJWTToken(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role
        },
        token: jwtToken,
        isNewUser
      };
    } catch (error) {
      console.error('OAuth authentication error:', error);
      throw error;
    }
  }

  /**
   * Store OAuth credentials in database
   */
  private async storeOAuthCredentials(
    userId: string, 
    tokens: any, 
    googleUser: GoogleUserInfo
  ) {
    try {
      await this.prisma.integrationCredential.upsert({
        where: {
          userId_platform_accountIdentifier: {
            userId,
            platform: 'google',
            accountIdentifier: googleUser.email
          }
        },
        update: {
          authToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
          tokenType: tokens.token_type || 'Bearer',
          expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          scopes: tokens.scope ? tokens.scope.split(' ') : [],
          metadata: {
            googleId: googleUser.id,
            picture: googleUser.picture,
            verified: googleUser.verified_email
          }
        },
        create: {
          userId,
          platform: 'google',
          accountIdentifier: googleUser.email,
          authToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
          tokenType: tokens.token_type || 'Bearer',
          expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          scopes: tokens.scope ? tokens.scope.split(' ') : [],
          metadata: {
            googleId: googleUser.id,
            picture: googleUser.picture,
            verified: googleUser.verified_email
          }
        }
      });
    } catch (error) {
      console.error('Error storing OAuth credentials:', error);
      // Don't throw here as the authentication was successful
    }
  }

  /**
   * Generate JWT token for authenticated user
   */
  private generateJWTToken(user: any): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is required');
    }

    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );
  }

  /**
   * Refresh OAuth tokens
   */
  async refreshTokens(userId: string): Promise<boolean> {
    try {
      const credentials = await this.prisma.integrationCredential.findFirst({
        where: {
          userId,
          platform: 'google'
        }
      });

      if (!credentials || !credentials.refreshToken) {
        return false;
      }

      this.client.setCredentials({
        refresh_token: credentials.refreshToken
      });

      const { credentials: newCredentials } = await this.client.refreshAccessToken();

      // Update stored credentials
      await this.prisma.integrationCredential.update({
        where: { id: credentials.id },
        data: {
          authToken: newCredentials.access_token || credentials.authToken,
          expiry: newCredentials.expiry_date ? new Date(newCredentials.expiry_date) : credentials.expiry
        }
      });

      return true;
    } catch (error) {
      console.error('Error refreshing OAuth tokens:', error);
      return false;
    }
  }

  /**
   * Revoke OAuth tokens
   */
  async revokeTokens(userId: string): Promise<boolean> {
    try {
      const credentials = await this.prisma.integrationCredential.findFirst({
        where: {
          userId,
          platform: 'google'
        }
      });

      if (!credentials) {
        return false;
      }

      // Revoke token with Google
      if (credentials.authToken) {
        await this.client.revokeToken(credentials.authToken);
      }

      // Remove from database
      await this.prisma.integrationCredential.delete({
        where: { id: credentials.id }
      });

      return true;
    } catch (error) {
      console.error('Error revoking OAuth tokens:', error);
      return false;
    }
  }

  /**
   * Verify Google ID token
   */
  async verifyIdToken(idToken: string): Promise<GoogleUserInfo | null> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      
      if (!payload) {
        return null;
      }

      return {
        id: payload.sub,
        email: payload.email || '',
        verified_email: payload.email_verified || false,
        name: payload.name || '',
        given_name: payload.given_name || '',
        family_name: payload.family_name || '',
        picture: payload.picture || ''
      };
    } catch (error) {
      console.error('Error verifying ID token:', error);
      return null;
    }
  }
} 