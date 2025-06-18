'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = require('express');
const client_1 = require('@prisma/client');
const zod_1 = require('zod');
const validation_1 = require('../middleware/validation');
const routeAuth_1 = require('../middleware/routeAuth');
const CampaignService_1 = require('../services/campaigns/CampaignService');
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const campaignService = new CampaignService_1.CampaignService(prisma);
// Schema for campaign creation
const createCampaignSchema = zod_1.z.object({
  name: zod_1.z.string().min(3, 'Campaign name must be at least 3 characters'),
  description: zod_1.z.string().optional(),
  campaignType: zod_1.z.enum([
    'SOCIAL_MEDIA',
    'EMAIL',
    'CONTENT_MARKETING',
    'SEO',
    'PPC',
    'INFLUENCER',
    'AFFILIATE',
    'EVENT',
    'PR',
    'INTEGRATED',
  ]),
  targeting: zod_1.z.string().optional(),
  budget: zod_1.z.string().optional().nullable(),
  goals: zod_1.z.record(zod_1.z.any()).optional(),
  startDate: zod_1.z.string().optional().nullable(),
  endDate: zod_1.z.string().optional().nullable(),
  projectId: zod_1.z.string(),
  agentIds: zod_1.z.array(zod_1.z.string()).optional(),
});
// Schema for campaign update
const updateCampaignSchema = zod_1.z.object({
  name: zod_1.z
    .string()
    .min(3, 'Campaign name must be at least 3 characters')
    .optional(),
  description: zod_1.z.string().optional(),
  campaignType: zod_1.z
    .enum([
      'SOCIAL_MEDIA',
      'EMAIL',
      'CONTENT_MARKETING',
      'SEO',
      'PPC',
      'INFLUENCER',
      'AFFILIATE',
      'EVENT',
      'PR',
      'INTEGRATED',
    ])
    .optional(),
  targeting: zod_1.z.string().optional(),
  budget: zod_1.z.string().optional().nullable(),
  goals: zod_1.z.record(zod_1.z.any()).optional(),
  startDate: zod_1.z.string().optional().nullable(),
  endDate: zod_1.z.string().optional().nullable(),
  status: zod_1.z
    .enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'])
    .optional(),
  agentIds: zod_1.z.array(zod_1.z.string()).optional(),
});
// Get all campaigns
router.get(
  '/',
  (0, routeAuth_1.requireAuth)(async (req, res) => {
    try {
      const userId = req.user.id;
      const { projectId } = req.query;
      // Get campaigns with related entities if needed
      const campaigns = await campaignService.getCampaigns(
        userId,
        projectId,
        true,
      );
      return res.json(campaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      return res.status(500).json({ message: 'Failed to fetch campaigns' });
    }
  }),
);
// Get campaign by ID
router.get(
  '/:id',
  (0, routeAuth_1.requireAuth)(async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      // Get campaign with related entities
      const campaign = await campaignService.getCampaign(id, true);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      // Check if user has access to this campaign
      if (campaign.ownerId !== userId) {
        return res
          .status(403)
          .json({ message: 'Not authorized to access this campaign' });
      }
      return res.json(campaign);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      return res.status(500).json({ message: 'Failed to fetch campaign' });
    }
  }),
);
// Create new campaign
router.post(
  '/',
  (0, validation_1.validateRequest)(createCampaignSchema),
  (0, routeAuth_1.requireAuth)(async (req, res) => {
    try {
      const {
        name,
        description,
        campaignType,
        targeting,
        budget,
        goals,
        startDate,
        endDate,
        projectId,
        agentIds,
      } = req.body;
      // Check if user has access to the project
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { ownerId: req.user.id },
            { members: { some: { id: req.user.id } } },
          ],
        },
      });
      if (!project) {
        return res
          .status(403)
          .json({
            message: 'Not authorized to create campaigns for this project',
          });
      }
      // Create campaign
      const campaign = await campaignService.createCampaign({
        name,
        description: description || '',
        campaignType,
        targeting: targeting || '',
        budget,
        goals,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        ownerId: req.user.id,
        projectId,
        agentIds,
      });
      return res.status(201).json(campaign);
    } catch (error) {
      console.error('Error creating campaign:', error);
      return res.status(500).json({ message: 'Failed to create campaign' });
    }
  }),
);
// Update campaign
router.put(
  '/:id',
  (0, validation_1.validateRequest)(updateCampaignSchema),
  (0, routeAuth_1.requireAuth)(async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      // Check if campaign exists and belongs to user
      const existingCampaign = await campaignService.getCampaign(id);
      if (!existingCampaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      if (existingCampaign.ownerId !== userId) {
        return res
          .status(403)
          .json({ message: 'Not authorized to update this campaign' });
      }
      // Update campaign
      const updatedData = {
        ...req.body,
        startDate: req.body.startDate
          ? new Date(req.body.startDate)
          : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      };
      const campaign = await campaignService.updateCampaign(id, updatedData);
      return res.json(campaign);
    } catch (error) {
      console.error('Error updating campaign:', error);
      return res.status(500).json({ message: 'Failed to update campaign' });
    }
  }),
);
// Delete campaign
router.delete(
  '/:id',
  (0, routeAuth_1.requireAuth)(async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      // Check if campaign exists and belongs to user
      const existingCampaign = await campaignService.getCampaign(id);
      if (!existingCampaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      if (existingCampaign.ownerId !== userId) {
        return res
          .status(403)
          .json({ message: 'Not authorized to delete this campaign' });
      }
      // Delete campaign
      await campaignService.deleteCampaign(id);
      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      return res.status(500).json({ message: 'Failed to delete campaign' });
    }
  }),
);
// Get campaign metrics
router.get(
  '/:id/metrics',
  (0, routeAuth_1.requireAuth)(async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      // Check if campaign exists and belongs to user
      const existingCampaign = await campaignService.getCampaign(id);
      if (!existingCampaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      if (existingCampaign.ownerId !== userId) {
        return res
          .status(403)
          .json({ message: 'Not authorized to access this campaign' });
      }
      // Get campaign metrics
      const metrics = await campaignService.getCampaignAnalytics(id);
      return res.json(metrics);
    } catch (error) {
      console.error('Error fetching campaign metrics:', error);
      return res
        .status(500)
        .json({ message: 'Failed to fetch campaign metrics' });
    }
  }),
);
exports.default = router;
