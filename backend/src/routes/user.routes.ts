import { Router } from 'express';
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller';
import { protect, authorize } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route GET /api/users
 * @desc Get all users
 * @access Private/Admin
 */
router.get('/', protect, authorize('ADMIN'), getUsers);

/**
 * @route GET /api/users/:id
 * @desc Get single user
 * @access Private
 */
router.get('/:id', protect, getUser);

/**
 * @route PUT /api/users/:id
 * @desc Update user
 * @access Private
 */
router.put('/:id', protect, updateUser);

/**
 * @route DELETE /api/users/:id
 * @desc Delete user
 * @access Private/Admin
 */
router.delete('/:id', protect, authorize('ADMIN'), deleteUser);

export default router;
