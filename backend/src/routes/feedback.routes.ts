import { Router } from 'express';
import {
  getAllFeedback,
  getFeedback,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getSentimentSummary,
} from '../controllers/feedback.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route GET /api/feedback
 * @desc Get all feedback entries with filtering options
 * @access Private
 */
router.get('/', protect, getAllFeedback);

/**
 * @route GET /api/feedback/sentiment-summary
 * @desc Get sentiment analysis summary
 * @access Private
 */
router.get('/sentiment-summary', protect, getSentimentSummary);

/**
 * @route GET /api/feedback/:id
 * @desc Get single feedback entry by ID
 * @access Private
 */
router.get('/:id', protect, getFeedback);

/**
 * @route POST /api/feedback
 * @desc Create a new feedback entry
 * @access Private
 */
router.post('/', protect, createFeedback);

/**
 * @route PUT /api/feedback/:id
 * @desc Update a feedback entry
 * @access Private
 */
router.put('/:id', protect, updateFeedback);

/**
 * @route DELETE /api/feedback/:id
 * @desc Delete a feedback entry
 * @access Private
 */
router.delete('/:id', protect, deleteFeedback);

export default router;
