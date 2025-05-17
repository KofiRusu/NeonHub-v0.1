import { Request, Response } from 'express';
import { prisma } from '../index';
import { CampaignStatus, CampaignType } from '@prisma/client';

/**
 * Get all campaigns with filtering options
 * @route GET /api/campaigns
 * @access Private
 */
export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const { projectId, status, type, userId } = req.query;
    const currentUserId = req.user?.id;

    // Build where clause for filtering
    const where: any = {};

    // Filter by project
    if (projectId) {
      where.projectId = projectId as string;
    }

    // Filter by status
    if (status) {
      where.status = status as CampaignStatus;
    }

    // Filter by campaign type
    if (type) {
      where.campaignType = type as CampaignType;
    }

    // Filter by owner
    if (userId) {
      where.ownerId = userId as string;
    }

    // If no projectId specified, filter by projects the user has access to
    if (!projectId) {
      where.OR = [
        { ownerId: currentUserId },
        { project: { members: { some: { id: currentUserId } } } }
      ];
    } else {
      // Check if user has access to the project
      const project = await prisma.project.findFirst({
        where: {
          id: projectId as string,
          OR: [
            { ownerId: currentUserId },
            { members: { some: { id: currentUserId } } }
          ]
        }
      });

      if (!project) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this project'
        });
      }
    }

    // Get campaigns with filters
    const campaigns = await prisma.campaign.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            metrics: true,
            generatedContent: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.status(200).json({
      success: true,
      count: campaigns.length,
      data: campaigns
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get single campaign
 * @route GET /api/campaigns/:id
 * @access Private
 */
export const getCampaign = async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id;
    const userId = req.user?.id;

    // Get campaign by ID with project info to check access rights
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        project: {
          include: {
            owner: {
              select: {
                id: true
              }
            },
            members: {
              select: {
                id: true
              }
            }
          }
        },
        agents: {
          select: {
            id: true,
            name: true,
            agentType: true,
            status: true
          }
        },
        generatedContent: {
          take: 5,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            title: true,
            contentType: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if user has access to the project
    const hasAccess =
      campaign.project.owner.id === userId ||
      campaign.project.members.some(member => member.id === userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this campaign'
      });
    }

    // Simplify project data for response
    const { project, ...campaignData } = campaign;
    const simplifiedProject = {
      id: project.id,
      ownerId: project.owner.id
    };

    res.status(200).json({
      success: true,
      data: {
        ...campaignData,
        project: simplifiedProject
      }
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Create new campaign
 * @route POST /api/campaigns
 * @access Private
 */
export const createCampaign = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      description, 
      campaignType, 
      goals, 
      targeting, 
      budget, 
      startDate, 
      endDate, 
      projectId, 
      status = 'DRAFT' 
    } = req.body;
    
    const userId = req.user?.id;

    // Validate required fields
    if (!name || !campaignType || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, campaign type, and project ID'
      });
    }

    // Check if user has access to the project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: userId },
          { members: { some: { id: userId } } }
        ]
      }
    });

    if (!project) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create campaigns in this project'
      });
    }

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        campaignType,
        goals: goals || {},
        targeting: targeting || {},
        budget,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: status as CampaignStatus,
        projectId,
        ownerId: userId as string
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Update campaign
 * @route PUT /api/campaigns/:id
 * @access Private
 */
export const updateCampaign = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      description, 
      status, 
      campaignType, 
      goals, 
      targeting, 
      budget, 
      startDate, 
      endDate 
    } = req.body;
    
    const campaignId = req.params.id;
    const userId = req.user?.id;

    // Find the campaign to check ownership
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        project: {
          select: {
            ownerId: true,
            members: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if user is owner of the campaign or project owner
    const isOwner = existingCampaign.ownerId === userId;
    const isProjectOwner = existingCampaign.project.ownerId === userId;
    const isProjectMember = existingCampaign.project.members.some(member => member.id === userId);

    if (!isOwner && !isProjectOwner && !isProjectMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this campaign'
      });
    }

    // Update campaign
    const campaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        name,
        description,
        status: status as CampaignStatus,
        campaignType: campaignType as CampaignType,
        goals: goals,
        targeting: targeting,
        budget,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    res.status(200).json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Delete campaign
 * @route DELETE /api/campaigns/:id
 * @access Private
 */
export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id;
    const userId = req.user?.id;

    // Find the campaign to check ownership
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        project: {
          select: {
            ownerId: true
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if user is owner of the campaign or project owner
    const isOwner = campaign.ownerId === userId;
    const isProjectOwner = campaign.project.ownerId === userId;

    if (!isOwner && !isProjectOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this campaign'
      });
    }

    // Delete campaign
    await prisma.campaign.delete({
      where: { id: campaignId }
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get campaign metrics
 * @route GET /api/campaigns/:id/metrics
 * @access Private
 */
export const getCampaignMetrics = async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id;
    const userId = req.user?.id;

    // Find the campaign to check access rights
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        project: {
          select: {
            ownerId: true,
            members: {
              select: {
                id: true
              }
            }
          }
        }
      }
    });

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if user has access to the campaign
    const hasAccess =
      campaign.ownerId === userId ||
      campaign.project.ownerId === userId ||
      campaign.project.members.some(member => member.id === userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this campaign'
      });
    }

    // Get campaign metrics
    const metrics = await prisma.metric.findMany({
      where: { campaignId },
      orderBy: { timestamp: 'desc' }
    });

    res.status(200).json({
      success: true,
      count: metrics.length,
      data: metrics
    });
  } catch (error) {
    console.error('Get campaign metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 