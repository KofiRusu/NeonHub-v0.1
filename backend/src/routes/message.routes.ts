import { Router } from 'express';
import { 
  getMessages,
  createMessage,
  deleteMessage
} from '../controllers/message.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route GET /api/messages?projectId=:projectId
 * @desc Get messages for a project
 * @access Private
 */
router.get('/', protect, getMessages);

/**
 * @route POST /api/messages
 * @desc Create a new message
 * @access Private
 */
router.post('/', protect, createMessage);

/**
 * @route DELETE /api/messages/:id
 * @desc Delete a message
 * @access Private
 */
router.delete('/:id', protect, deleteMessage);

export default router; 