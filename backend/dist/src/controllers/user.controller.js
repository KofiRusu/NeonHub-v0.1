"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.getUser = exports.getUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const index_1 = require("../index");
/**
 * Get all users
 * @route GET /api/users
 * @access Private/Admin
 */
const getUsers = async (req, res) => {
    try {
        const users = await index_1.prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                createdAt: true,
            },
        });
        res.status(200).json({
            success: true,
            count: users.length,
            data: users,
        });
    }
    catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getUsers = getUsers;
/**
 * Get single user
 * @route GET /api/users/:id
 * @access Private/Admin
 */
const getUser = async (req, res) => {
    try {
        const user = await index_1.prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                createdAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        res.status(200).json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getUser = getUser;
/**
 * Update user
 * @route PUT /api/users/:id
 * @access Private
 */
const updateUser = async (req, res) => {
    try {
        // Only allow users to update their own profile, unless they're an admin
        if (req.params.id !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this user',
            });
        }
        const { name, email, password, avatar } = req.body;
        // Build update object
        const updateData = {};
        if (name)
            updateData.name = name;
        if (email)
            updateData.email = email;
        if (avatar)
            updateData.avatar = avatar;
        // If password is being updated, hash it
        if (password) {
            const salt = await bcryptjs_1.default.genSalt(10);
            updateData.password = await bcryptjs_1.default.hash(password, salt);
        }
        // Update user
        const user = await index_1.prisma.user.update({
            where: { id: req.params.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                avatar: true,
                createdAt: true,
            },
        });
        res.status(200).json({
            success: true,
            data: user,
        });
    }
    catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.updateUser = updateUser;
/**
 * Delete user
 * @route DELETE /api/users/:id
 * @access Private/Admin
 */
const deleteUser = async (req, res) => {
    try {
        // Check if user exists
        const user = await index_1.prisma.user.findUnique({
            where: { id: req.params.id },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
        // Delete user
        await index_1.prisma.user.delete({
            where: { id: req.params.id },
        });
        res.status(200).json({
            success: true,
            data: {},
        });
    }
    catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.deleteUser = deleteUser;
//# sourceMappingURL=user.controller.js.map