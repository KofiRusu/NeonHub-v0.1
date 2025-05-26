"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const project_controller_1 = require("../controllers/project.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @route GET /api/projects
 * @desc Get all projects for the authenticated user
 * @access Private
 */
router.get('/', auth_middleware_1.protect, project_controller_1.getProjects);
/**
 * @route GET /api/projects/:id
 * @desc Get single project
 * @access Private
 */
router.get('/:id', auth_middleware_1.protect, project_controller_1.getProject);
/**
 * @route POST /api/projects
 * @desc Create a new project
 * @access Private
 */
router.post('/', auth_middleware_1.protect, project_controller_1.createProject);
/**
 * @route PUT /api/projects/:id
 * @desc Update a project
 * @access Private
 */
router.put('/:id', auth_middleware_1.protect, project_controller_1.updateProject);
/**
 * @route DELETE /api/projects/:id
 * @desc Delete a project
 * @access Private
 */
router.delete('/:id', auth_middleware_1.protect, project_controller_1.deleteProject);
/**
 * @route POST /api/projects/:id/members
 * @desc Add a member to a project
 * @access Private
 */
router.post('/:id/members', auth_middleware_1.protect, project_controller_1.addMember);
/**
 * @route DELETE /api/projects/:id/members/:userId
 * @desc Remove a member from a project
 * @access Private
 */
router.delete('/:id/members/:userId', auth_middleware_1.protect, project_controller_1.removeMember);
exports.default = router;
//# sourceMappingURL=project.routes.js.map