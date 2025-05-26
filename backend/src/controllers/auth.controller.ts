import { Request, Response } from 'express';
import { prisma } from '../index';
import { getAuthService, OAuthProvider } from '../services';

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password',
      });
    }

    const authService = getAuthService(prisma);

    // Register the user
    const result = await authService.register({ name, email, password });

    res.status(201).json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('Register error:', error);

    // Handle specific errors
    if (
      error instanceof Error &&
      error.message === 'User with this email already exists'
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Login a user
 * @route POST /api/auth/login
 * @access Public
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const authService = getAuthService(prisma);

    // Login the user
    const result = await authService.login({ email, password });

    res.status(200).json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('Login error:', error);

    // Handle invalid credentials
    if (error instanceof Error && error.message === 'Invalid credentials') {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * OAuth authentication
 * @route POST /api/auth/oauth/:provider
 * @access Public
 */
export const oauthLogin = async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { code } = req.body;

    // Validate input
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required',
      });
    }

    // Validate provider
    if (!Object.values(OAuthProvider).includes(provider as OAuthProvider)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported OAuth provider: ${provider}`,
      });
    }

    const authService = getAuthService(prisma);

    // Authenticate with OAuth
    const result = await authService.authenticateWithOAuth(
      provider as OAuthProvider,
      code,
    );

    res.status(200).json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('OAuth login error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Server error',
    });
  }
};

/**
 * Get current logged in user
 * @route GET /api/auth/me
 * @access Private
 */
export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const authService = getAuthService(prisma);
    const user = await authService.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
