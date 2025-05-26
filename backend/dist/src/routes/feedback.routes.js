"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feedback_controller_1 = require("../controllers/feedback.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @route GET /api/feedback
 * @desc Get all feedback entries with filtering options
 * @access Private
 */
router.get('/', auth_middleware_1.protect, feedback_controller_1.getAllFeedback);
/**
 * @route GET /api/feedback/sentiment-summary
 * @desc Get sentiment analysis summary
 * @access Private
 */
router.get('/sentiment-summary', auth_middleware_1.protect, feedback_controller_1.getSentimentSummary);
/**
 * @route GET /api/feedback/:id
 * @desc Get single feedback entry by ID
 * @access Private
 */
router.get('/:id', auth_middleware_1.protect, feedback_controller_1.getFeedback);
/**
 * @route POST /api/feedback
 * @desc Create a new feedback entry
 * @access Private
 */
router.post('/', auth_middleware_1.protect, feedback_controller_1.createFeedback);
/**
 * @route PUT /api/feedback/:id
 * @desc Update a feedback entry
 * @access Private
 */
router.put('/:id', auth_middleware_1.protect, feedback_controller_1.updateFeedback);
/**
 * @route DELETE /api/feedback/:id
 * @desc Delete a feedback entry
 * @access Private
 */
router.delete('/:id', auth_middleware_1.protect, feedback_controller_1.deleteFeedback);
exports.default = router;
//# sourceMappingURL=feedback.routes.js.map