import { Request, Response } from 'express';
import { prisma } from '../index';
import { getCampaignService } from '../services';
import { CampaignType, CampaignStatus } from '@prisma/client';

/**
 * Get all campaigns for the current user
 * @route GET /api/campaigns
 * @access Private
 */
export const getCampaigns = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const projectId = req.query.projectId as string | undefined;
    const includeRelated = req.query.includeRelated === 'true';

    const campaignService = getCampaignService(prisma);
    const campaigns = await campaignService.getCampaigns(
      req.user.id,
      projectId,
      includeRelated
    );

    res.status(200).json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Get a campaign by ID
 * @route GET /api/campaigns/:id
 * @access Private
 */
export const getCampaign = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const { id } = req.params;
    const includeRelated = req.query.includeRelated === 'true';

    const campaignService = getCampaignService(prisma);
    const campaign = await campaignService.getCampaign(id, includeRelated);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    // Check if user has access to this campaign
    if (campaign.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this campaign',
      });
    }

    res.status(200).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Create a new campaign
 * @route POST /api/campaigns
 * @access Private
 */
export const createCampaign = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const {
      name,
      description,
      campaignType,
      targetAudience,
      budget,
      goals,
      startDate,
      endDate,
      projectId,
      agentIds,
    } = req.body;

    // Validate required fields
    if (!name || !description || !campaignType || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, description, campaign type, and project ID',
      });
    }

    // Validate campaign type
    if (!Object.values(CampaignType).includes(campaignType as CampaignType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign type',
      });
    }

    // Create campaign
    const campaignService = getCampaignService(prisma);
    const campaign = await campaignService.createCampaign({
      name,
      description,
      campaignType: campaignType as CampaignType,
      targetAudience,
      budget,
      goals,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      ownerId: req.user.id,
      projectId,
      agentIds,
    });

    res.status(201).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Update a campaign
 * @route PUT /api/campaigns/:id
 * @access Private
 */
export const updateCampaign = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const { id } = req.params;
    const {
      name,
      description,
      campaignType,
      targetAudience,
      budget,
      goals,
      startDate,
      endDate,
      status,
      agentIds,
    } = req.body;

    // Validate campaign type if provided
    if (
      campaignType &&
      !Object.values(CampaignType).includes(campaignType as CampaignType)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign type',
      });
    }

    // Validate status if provided
    if (
      status &&
      !Object.values(CampaignStatus).includes(status as CampaignStatus)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid campaign status',
      });
    }

    // Check if campaign exists and belongs to user
    const campaignService = getCampaignService(prisma);
    const existingCampaign = await campaignService.getCampaign(id);

    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    if (existingCampaign.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this campaign',
      });
    }

    // Update campaign
    const campaign = await campaignService.updateCampaign(id, {
      name,
      description,
      campaignType: campaignType as CampaignType,
      targetAudience,
      budget,
      goals,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      status: status as CampaignStatus,
      agentIds,
    });

    res.status(200).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Delete a campaign
 * @route DELETE /api/campaigns/:id
 * @access Private
 */
export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const { id } = req.params;

    // Check if campaign exists and belongs to user
    const campaignService = getCampaignService(prisma);
    const existingCampaign = await campaignService.getCampaign(id);

    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    if (existingCampaign.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this campaign',
      });
    }

    // Delete campaign
    await campaignService.deleteCampaign(id);

    res.status(204).send();
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

/**
 * Get campaign analytics
 * @route GET /api/campaigns/:id/analytics
 * @access Private
 */
export const getCampaignAnalytics = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const { id } = req.params;

    // Check if campaign exists and belongs to user
    const campaignService = getCampaignService(prisma);
    const existingCampaign = await campaignService.getCampaign(id);

    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    if (existingCampaign.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this campaign',
      });
    }

    // Get analytics
    const analytics = await campaignService.getCampaignAnalytics(id);

    res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error('Get campaign analytics error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Server error',
    });
  }
};

/**
 * Schedule a campaign
 * @route POST /api/campaigns/:id/schedule
 * @access Private
 */
export const scheduleCampaign = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const { id } = req.params;
    const { startDate, endDate } = req.body;

    // Validate dates
    if (!startDate && !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one of startDate or endDate',
      });
    }

    // Check if campaign exists and belongs to user
    const campaignService = getCampaignService(prisma);
    const existingCampaign = await campaignService.getCampaign(id);

    if (!existingCampaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found',
      });
    }

    if (existingCampaign.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to schedule this campaign',
      });
    }

    // Schedule campaign
    const campaign = await campaignService.scheduleCampaign(
      id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    res.status(200).json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error('Schedule campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
}; 