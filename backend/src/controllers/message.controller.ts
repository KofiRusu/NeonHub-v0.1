import { Request, Response } from 'express';
import { prisma } from '../index';
import { Server } from 'socket.io';

// Reference to the Socket.io server
let io: Server;

// Set the Socket.io server instance
export const setIo = (socketIo: Server) => {
  io = socketIo;
};

/**
 * Get messages for a project
 * @route GET /api/messages?projectId=:projectId
 * @access Private
 */
export const getMessages = async (req: Request, res: Response) => {
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
    const project = await prisma.project.findFirst({
      where: {
        id: projectId as string,
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
    const messages = await prisma.message.findMany({
      where: { projectId: projectId as string },
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
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Create new message
 * @route POST /api/messages
 * @access Private
 */
export const createMessage = async (req: Request, res: Response) => {
  try {
    const { content, projectId } = req.body;
    const userId = req.user?.id;

    // Check if user has access to the project
    const project = await prisma.project.findFirst({
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
    const message = await prisma.message.create({
      data: {
        content,
        projectId,
        userId: userId as string,
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
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Delete message
 * @route DELETE /api/messages/:id
 * @access Private
 */
export const deleteMessage = async (req: Request, res: Response) => {
  try {
    const messageId = req.params.id;
    const userId = req.user?.id;

    // Get message with project info to check access rights
    const message = await prisma.message.findUnique({
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
    const canDelete =
      message.userId === userId || message.project.ownerId === userId;

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message',
      });
    }

    // Delete message
    await prisma.message.delete({
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
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
