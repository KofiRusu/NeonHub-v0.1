import { Request, Response } from 'express';
import { prisma } from '../index';

/**
 * Get all projects
 * @route GET /api/projects
 * @access Private
 */
export const getProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    // Get all projects where user is a member or owner
    const projects = await prisma.project.findMany({
      where: {
        OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Get single project
 * @route GET /api/projects/:id
 * @access Private
 */
export const getProject = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    // Get project by ID
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check if user is owner or member of the project
    const isMember =
      project.ownerId === userId ||
      project.members.some((member) => member.id === userId);

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this project',
      });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Create new project
 * @route POST /api/projects
 * @access Private
 */
export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, memberIds } = req.body;
    const ownerId = req.user?.id;

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        description,
        ownerId: ownerId as string,
        members: {
          connect: memberIds?.map((id: string) => ({ id })) || [],
        },
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        members: {
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
      data: project,
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Update project
 * @route PUT /api/projects/:id
 * @access Private
 */
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { name, description, memberIds } = req.body;
    const userId = req.user?.id;

    // Get project
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check if user is the owner of the project
    if (project.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this project',
      });
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        name: name || undefined,
        description: description || undefined,
        members: memberIds
          ? {
              set: memberIds.map((id: string) => ({ id })),
            }
          : undefined,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        members: {
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
      data: updatedProject,
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Delete project
 * @route DELETE /api/projects/:id
 * @access Private
 */
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    // Get project
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check if user is the owner of the project
    if (project.ownerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this project',
      });
    }

    // Delete project
    await prisma.project.delete({
      where: { id: req.params.id },
    });

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Add member to project
 * @route POST /api/projects/:id/members
 * @access Private
 */
export const addMember = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const projectId = req.params.id;
    const currentUserId = req.user?.id;

    // Get project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check if user is the owner of the project
    if (project.ownerId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add members to this project',
      });
    }

    // Check if user is already a member
    const isMember = project.members.some((member) => member.id === userId);

    if (isMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member of this project',
      });
    }

    // Add user to project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        members: {
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
      data: updatedProject,
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Remove member from project
 * @route DELETE /api/projects/:id/members/:userId
 * @access Private
 */
export const removeMember = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const projectId = req.params.id;
    const currentUserId = req.user?.id;

    // Get project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: true,
      },
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Check if user is the owner of the project
    if (project.ownerId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to remove members from this project',
      });
    }

    // Check if user is a member
    const isMember = project.members.some((member) => member.id === userId);

    if (!isMember) {
      return res.status(400).json({
        success: false,
        message: 'User is not a member of this project',
      });
    }

    // Remove user from project
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        members: {
          disconnect: {
            id: userId,
          },
        },
      },
      include: {
        members: {
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
      data: updatedProject,
    });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
