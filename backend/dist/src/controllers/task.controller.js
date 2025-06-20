'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.deleteTask =
  exports.updateTask =
  exports.createTask =
  exports.getTask =
  exports.getTasks =
    void 0;
const index_1 = require('../index');
/**
 * Get all tasks for a project
 * @route GET /api/tasks?projectId=:projectId
 * @access Private
 */
const getTasks = async (req, res) => {
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
    // Get all tasks for the project
    const tasks = await index_1.prisma.task.findMany({
      where: { projectId: projectId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        creator: {
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
    });
    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
exports.getTasks = getTasks;
/**
 * Get single task
 * @route GET /api/tasks/:id
 * @access Private
 */
const getTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user?.id;
    // Get task by ID with project info to check access rights
    const task = await index_1.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            members: {
              select: {
                id: true,
              },
            },
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }
    // Check if user has access to the project
    const hasAccess =
      task.project.ownerId === userId ||
      task.project.members.some((member) => member.id === userId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this task',
      });
    }
    // Remove project details from response
    const { project, ...taskData } = task;
    res.status(200).json({
      success: true,
      data: taskData,
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
exports.getTask = getTask;
/**
 * Create new task
 * @route POST /api/tasks
 * @access Private
 */
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      projectId,
      assigneeId,
    } = req.body;
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
        message: 'Not authorized to create tasks in this project',
      });
    }
    // Create task
    const task = await index_1.prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        projectId,
        assigneeId,
        creatorId: userId,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
exports.createTask = createTask;
/**
 * Update task
 * @route PUT /api/tasks/:id
 * @access Private
 */
const updateTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, assigneeId } =
      req.body;
    const taskId = req.params.id;
    const userId = req.user?.id;
    // Get task with project info to check access rights
    const task = await index_1.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            members: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }
    // Check if user has access to the project
    const hasAccess =
      task.project.ownerId === userId ||
      task.project.members.some((member) => member.id === userId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task',
      });
    }
    // Update task
    const updatedTask = await index_1.prisma.task.update({
      where: { id: taskId },
      data: {
        title: title || undefined,
        description: description !== undefined ? description : undefined,
        status: status || undefined,
        priority: priority || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assigneeId: assigneeId !== undefined ? assigneeId : undefined,
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
    res.status(200).json({
      success: true,
      data: updatedTask,
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
exports.updateTask = updateTask;
/**
 * Delete task
 * @route DELETE /api/tasks/:id
 * @access Private
 */
const deleteTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user?.id;
    // Get task with project info to check access rights
    const task = await index_1.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: true,
      },
    });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }
    // Check if user has access to delete the task (project owner or task creator)
    const canDelete =
      task.project.ownerId === userId || task.creatorId === userId;
    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this task',
      });
    }
    // Delete task
    await index_1.prisma.task.delete({
      where: { id: taskId },
    });
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
exports.deleteTask = deleteTask;
