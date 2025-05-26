"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @route GET /api/users
 * @desc Get all users
 * @access Private/Admin
 */
router.get('/', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('ADMIN'), user_controller_1.getUsers);
/**
 * @route GET /api/users/:id
 * @desc Get single user
 * @access Private
 */
router.get('/:id', auth_middleware_1.protect, user_controller_1.getUser);
/**
 * @route PUT /api/users/:id
 * @desc Update user
 * @access Private
 */
router.put('/:id', auth_middleware_1.protect, user_controller_1.updateUser);
/**
 * @route DELETE /api/users/:id
 * @desc Delete user
 * @access Private/Admin
 */
router.delete('/:id', auth_middleware_1.protect, (0, auth_middleware_1.authorize)('ADMIN'), user_controller_1.deleteUser);
exports.default = router;
//# sourceMappingURL=user.routes.js.map