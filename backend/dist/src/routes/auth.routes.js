'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = require('express');
const auth_controller_1 = require('../controllers/auth.controller');
const auth_middleware_1 = require('../middleware/auth.middleware');
const router = (0, express_1.Router)();
/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', auth_controller_1.register);
/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', auth_controller_1.login);
/**
 * @route POST /api/auth/oauth/:provider
 * @desc Authenticate with OAuth provider
 * @access Public
 */
router.post('/oauth/:provider', auth_controller_1.oauthLogin);
/**
 * @route GET /api/auth/me
 * @desc Get current user
 * @access Private
 */
router.get('/me', auth_middleware_1.protect, auth_controller_1.getMe);
exports.default = router;
