"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeMember = exports.addMember = exports.deleteProject = exports.updateProject = exports.createProject = exports.getProject = exports.getProjects = void 0;
const index_1 = require("../index");
/**
 * Get all projects
 * @route GET /api/projects
 * @access Private
 */
const getProjects = async (req, res) => {
    try {
        const userId = req.user?.id;
        // Get all projects where user is a member or owner
        const projects = await index_1.prisma.project.findMany({
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
    }
    catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getProjects = getProjects;
/**
 * Get single project
 * @route GET /api/projects/:id
 * @access Private
 */
const getProject = async (req, res) => {
    try {
        const userId = req.user?.id;
        // Get project by ID
        const project = await index_1.prisma.project.findUnique({
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
        const isMember = project.ownerId === userId ||
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
    }
    catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getProject = getProject;
/**
 * Create new project
 * @route POST /api/projects
 * @access Private
 */
const createProject = async (req, res) => {
    try {
        const { name, description, memberIds } = req.body;
        const ownerId = req.user?.id;
        // Create project
        const project = await index_1.prisma.project.create({
            data: {
                name,
                description,
                ownerId: ownerId,
                members: {
                    connect: memberIds?.map((id) => ({ id })) || [],
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
    }
    catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.createProject = createProject;
/**
 * Update project
 * @route PUT /api/projects/:id
 * @access Private
 */
const updateProject = async (req, res) => {
    try {
        const { name, description, memberIds } = req.body;
        const userId = req.user?.id;
        // Get project
        const project = await index_1.prisma.project.findUnique({
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
        const updatedProject = await index_1.prisma.project.update({
            where: { id: req.params.id },
            data: {
                name: name || undefined,
                description: description || undefined,
                members: memberIds
                    ? {
                        set: memberIds.map((id) => ({ id })),
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
    }
    catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.updateProject = updateProject;
/**
 * Delete project
 * @route DELETE /api/projects/:id
 * @access Private
 */
const deleteProject = async (req, res) => {
    try {
        const userId = req.user?.id;
        // Get project
        const project = await index_1.prisma.project.findUnique({
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
        await index_1.prisma.project.delete({
            where: { id: req.params.id },
        });
        res.status(200).json({
            success: true,
            data: {},
        });
    }
    catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.deleteProject = deleteProject;
/**
 * Add member to project
 * @route POST /api/projects/:id/members
 * @access Private
 */
const addMember = async (req, res) => {
    try {
        const { userId } = req.body;
        const projectId = req.params.id;
        const currentUserId = req.user?.id;
        // Get project
        const project = await index_1.prisma.project.findUnique({
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
        const updatedProject = await index_1.prisma.project.update({
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
    }
    catch (error) {
        console.error('Add member error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.addMember = addMember;
/**
 * Remove member from project
 * @route DELETE /api/projects/:id/members/:userId
 * @access Private
 */
const removeMember = async (req, res) => {
    try {
        const { userId } = req.params;
        const projectId = req.params.id;
        const currentUserId = req.user?.id;
        // Get project
        const project = await index_1.prisma.project.findUnique({
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
        const updatedProject = await index_1.prisma.project.update({
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
    }
    catch (error) {
        console.error('Remove member error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.removeMember = removeMember;
//# sourceMappingURL=project.controller.js.map