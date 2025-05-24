import { Router } from 'express';
import { register, login, getMe, oauthLogin } from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', register);

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', login);

/**
 * @route POST /api/auth/oauth/:provider
 * @desc Authenticate with OAuth provider
 * @access Public
 */
router.post('/oauth/:provider', oauthLogin);

/**
 * @route GET /api/auth/me
 * @desc Get current user
 * @access Private
 */
router.get('/me', protect, getMe);

export default router; 