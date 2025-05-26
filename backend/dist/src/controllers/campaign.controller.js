"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduleCampaign = exports.getCampaignAnalytics = exports.deleteCampaign = exports.updateCampaign = exports.createCampaign = exports.getCampaign = exports.getCampaigns = void 0;
const index_1 = require("../index");
const services_1 = require("../services");
const client_1 = require("@prisma/client");
/**
 * Get all campaigns for the current user
 * @route GET /api/campaigns
 * @access Private
 */
const getCampaigns = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
        }
        const projectId = req.query.projectId;
        const includeRelated = req.query.includeRelated === 'true';
        const campaignService = (0, services_1.getCampaignService)(index_1.prisma);
        const campaigns = await campaignService.getCampaigns(req.user.id, projectId, includeRelated);
        res.status(200).json({
            success: true,
            data: campaigns,
        });
    }
    catch (error) {
        console.error('Get campaigns error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getCampaigns = getCampaigns;
/**
 * Get a campaign by ID
 * @route GET /api/campaigns/:id
 * @access Private
 */
const getCampaign = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
        }
        const { id } = req.params;
        const includeRelated = req.query.includeRelated === 'true';
        const campaignService = (0, services_1.getCampaignService)(index_1.prisma);
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
    }
    catch (error) {
        console.error('Get campaign error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getCampaign = getCampaign;
/**
 * Create a new campaign
 * @route POST /api/campaigns
 * @access Private
 */
const createCampaign = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
        }
        const { name, description, campaignType, targeting, budget, goals, startDate, endDate, projectId, agentIds, } = req.body;
        // Validate required fields
        if (!name || !description || !campaignType || !projectId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, description, campaign type, and project ID',
            });
        }
        // Validate campaign type
        if (!Object.values(client_1.CampaignType).includes(campaignType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid campaign type',
            });
        }
        // Create campaign
        const campaignService = (0, services_1.getCampaignService)(index_1.prisma);
        const campaign = await campaignService.createCampaign({
            name,
            description,
            campaignType: campaignType,
            targeting,
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
    }
    catch (error) {
        console.error('Create campaign error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.createCampaign = createCampaign;
/**
 * Update a campaign
 * @route PUT /api/campaigns/:id
 * @access Private
 */
const updateCampaign = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
        }
        const { id } = req.params;
        const { name, description, campaignType, targeting, budget, goals, startDate, endDate, status, agentIds, } = req.body;
        // Validate campaign type if provided
        if (campaignType &&
            !Object.values(client_1.CampaignType).includes(campaignType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid campaign type',
            });
        }
        // Validate status if provided
        if (status &&
            !Object.values(client_1.CampaignStatus).includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid campaign status',
            });
        }
        // Check if campaign exists and belongs to user
        const campaignService = (0, services_1.getCampaignService)(index_1.prisma);
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
            campaignType: campaignType,
            targeting,
            budget,
            goals,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            status: status,
            agentIds,
        });
        res.status(200).json({
            success: true,
            data: campaign,
        });
    }
    catch (error) {
        console.error('Update campaign error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.updateCampaign = updateCampaign;
/**
 * Delete a campaign
 * @route DELETE /api/campaigns/:id
 * @access Private
 */
const deleteCampaign = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
        }
        const { id } = req.params;
        // Check if campaign exists and belongs to user
        const campaignService = (0, services_1.getCampaignService)(index_1.prisma);
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
    }
    catch (error) {
        console.error('Delete campaign error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.deleteCampaign = deleteCampaign;
/**
 * Get campaign analytics
 * @route GET /api/campaigns/:id/analytics
 * @access Private
 */
const getCampaignAnalytics = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
        }
        const { id } = req.params;
        // Check if campaign exists and belongs to user
        const campaignService = (0, services_1.getCampaignService)(index_1.prisma);
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
    }
    catch (error) {
        console.error('Get campaign analytics error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Server error',
        });
    }
};
exports.getCampaignAnalytics = getCampaignAnalytics;
/**
 * Schedule a campaign
 * @route POST /api/campaigns/:id/schedule
 * @access Private
 */
const scheduleCampaign = async (req, res) => {
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
        const campaignService = (0, services_1.getCampaignService)(index_1.prisma);
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
        const campaign = await campaignService.scheduleCampaign(id, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        res.status(200).json({
            success: true,
            data: campaign,
        });
    }
    catch (error) {
        console.error('Schedule campaign error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.scheduleCampaign = scheduleCampaign;
//# sourceMappingURL=campaign.controller.js.map