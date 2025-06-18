'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getMe = exports.oauthLogin = exports.login = exports.register = void 0;
const index_1 = require('../index');
const services_1 = require('../services');
/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password',
      });
    }
    const authService = (0, services_1.getAuthService)(index_1.prisma);
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
exports.register = register;
/**
 * Login a user
 * @route POST /api/auth/login
 * @access Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }
    const authService = (0, services_1.getAuthService)(index_1.prisma);
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
exports.login = login;
/**
 * OAuth authentication
 * @route POST /api/auth/oauth/:provider
 * @access Public
 */
const oauthLogin = async (req, res) => {
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
    if (!Object.values(services_1.OAuthProvider).includes(provider)) {
      return res.status(400).json({
        success: false,
        message: `Unsupported OAuth provider: ${provider}`,
      });
    }
    const authService = (0, services_1.getAuthService)(index_1.prisma);
    // Authenticate with OAuth
    const result = await authService.authenticateWithOAuth(provider, code);
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
exports.oauthLogin = oauthLogin;
/**
 * Get current logged in user
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = async (req, res) => {
  try {
    // Since this route is protected, req.user should always exist
    const authService = (0, services_1.getAuthService)(index_1.prisma);
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
exports.getMe = getMe;
