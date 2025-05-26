"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const task_controller_1 = require("../controllers/task.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @route GET /api/tasks?projectId=:projectId
 * @desc Get all tasks for a project
 * @access Private
 */
router.get('/', auth_middleware_1.protect, task_controller_1.getTasks);
/**
 * @route GET /api/tasks/:id
 * @desc Get single task
 * @access Private
 */
router.get('/:id', auth_middleware_1.protect, task_controller_1.getTask);
/**
 * @route POST /api/tasks
 * @desc Create a new task
 * @access Private
 */
router.post('/', auth_middleware_1.protect, task_controller_1.createTask);
/**
 * @route PUT /api/tasks/:id
 * @desc Update a task
 * @access Private
 */
router.put('/:id', auth_middleware_1.protect, task_controller_1.updateTask);
/**
 * @route DELETE /api/tasks/:id
 * @desc Delete a task
 * @access Private
 */
router.delete('/:id', auth_middleware_1.protect, task_controller_1.deleteTask);
exports.default = router;
//# sourceMappingURL=task.routes.js.map