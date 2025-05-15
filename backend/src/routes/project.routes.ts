import { Router } from 'express';
import { 
  getProjects, 
  getProject, 
  createProject, 
  updateProject, 
  deleteProject,
  addMember,
  removeMember
} from '../controllers/project.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route GET /api/projects
 * @desc Get all projects for the authenticated user
 * @access Private
 */
router.get('/', protect, getProjects);

/**
 * @route GET /api/projects/:id
 * @desc Get single project
 * @access Private
 */
router.get('/:id', protect, getProject);

/**
 * @route POST /api/projects
 * @desc Create a new project
 * @access Private
 */
router.post('/', protect, createProject);

/**
 * @route PUT /api/projects/:id
 * @desc Update a project
 * @access Private
 */
router.put('/:id', protect, updateProject);

/**
 * @route DELETE /api/projects/:id
 * @desc Delete a project
 * @access Private
 */
router.delete('/:id', protect, deleteProject);

/**
 * @route POST /api/projects/:id/members
 * @desc Add a member to a project
 * @access Private
 */
router.post('/:id/members', protect, addMember);

/**
 * @route DELETE /api/projects/:id/members/:userId
 * @desc Remove a member from a project
 * @access Private
 */
router.delete('/:id/members/:userId', protect, removeMember);

export default router; 