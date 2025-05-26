"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessage = exports.createMessage = exports.getMessages = exports.setIo = void 0;
const index_1 = require("../index");
// Reference to the Socket.io server
let io;
// Set the Socket.io server instance
const setIo = (socketIo) => {
    io = socketIo;
};
exports.setIo = setIo;
/**
 * Get messages for a project
 * @route GET /api/messages?projectId=:projectId
 * @access Private
 */
const getMessages = async (req, res) => {
    try {
        const { projectId } = req.query;
        const userId = req.user?.id;
        if (!projectId) {
            return res.status(400).json({
                success: false,
                message: 'Project ID is required',
            });
        }
        // Check if user has access to the project
        const project = await index_1.prisma.project.findFirst({
            where: {
                id: projectId,
                OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
            },
        });
        if (!project) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this project',
            });
        }
        // Get messages for the project
        const messages = await index_1.prisma.message.findMany({
            where: { projectId: projectId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 50, // Limit to last 50 messages
        });
        res.status(200).json({
            success: true,
            count: messages.length,
            data: messages.reverse(), // Return in chronological order
        });
    }
    catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getMessages = getMessages;
/**
 * Create new message
 * @route POST /api/messages
 * @access Private
 */
const createMessage = async (req, res) => {
    try {
        const { content, projectId } = req.body;
        const userId = req.user?.id;
        // Check if user has access to the project
        const project = await index_1.prisma.project.findFirst({
            where: {
                id: projectId,
                OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
            },
        });
        if (!project) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to send messages in this project',
            });
        }
        // Create message
        const message = await index_1.prisma.message.create({
            data: {
                content,
                projectId,
                userId: userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
        });
        // Emit the message to all users in the project via Socket.io
        if (io) {
            io.to(projectId).emit('new-message', message);
        }
        res.status(201).json({
            success: true,
            data: message,
        });
    }
    catch (error) {
        console.error('Create message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.createMessage = createMessage;
/**
 * Delete message
 * @route DELETE /api/messages/:id
 * @access Private
 */
const deleteMessage = async (req, res) => {
    try {
        const messageId = req.params.id;
        const userId = req.user?.id;
        // Get message with project info to check access rights
        const message = await index_1.prisma.message.findUnique({
            where: { id: messageId },
            include: {
                project: true,
            },
        });
        if (!message) {
            return res.status(404).json({
                success: false,
                message: 'Message not found',
            });
        }
        // Check if user is authorized to delete the message (sender or project owner)
        const canDelete = message.userId === userId || message.project.ownerId === userId;
        if (!canDelete) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this message',
            });
        }
        // Delete message
        await index_1.prisma.message.delete({
            where: { id: messageId },
        });
        // Notify clients about deleted message
        if (io) {
            io.to(message.projectId).emit('message-deleted', { id: messageId });
        }
        res.status(200).json({
            success: true,
            data: {},
        });
    }
    catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.deleteMessage = deleteMessage;
//# sourceMappingURL=message.controller.js.map