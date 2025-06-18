'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = require('express');
const message_controller_1 = require('../controllers/message.controller');
const auth_middleware_1 = require('../middleware/auth.middleware');
const router = (0, express_1.Router)();
/**
 * @route GET /api/messages?projectId=:projectId
 * @desc Get messages for a project
 * @access Private
 */
router.get('/', auth_middleware_1.protect, message_controller_1.getMessages);
/**
 * @route POST /api/messages
 * @desc Create a new message
 * @access Private
 */
router.post('/', auth_middleware_1.protect, message_controller_1.createMessage);
/**
 * @route DELETE /api/messages/:id
 * @desc Delete a message
 * @access Private
 */
router.delete(
  '/:id',
  auth_middleware_1.protect,
  message_controller_1.deleteMessage,
);
exports.default = router;
