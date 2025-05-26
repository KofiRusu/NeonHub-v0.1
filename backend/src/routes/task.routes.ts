import { Router } from 'express';
import {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/task.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route GET /api/tasks?projectId=:projectId
 * @desc Get all tasks for a project
 * @access Private
 */
router.get('/', protect, getTasks);

/**
 * @route GET /api/tasks/:id
 * @desc Get single task
 * @access Private
 */
router.get('/:id', protect, getTask);

/**
 * @route POST /api/tasks
 * @desc Create a new task
 * @access Private
 */
router.post('/', protect, createTask);

/**
 * @route PUT /api/tasks/:id
 * @desc Update a task
 * @access Private
 */
router.put('/:id', protect, updateTask);

/**
 * @route DELETE /api/tasks/:id
 * @desc Delete a task
 * @access Private
 */
router.delete('/:id', protect, deleteTask);

export default router;
