import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';
import { Request, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/routeAuth';
import { CampaignService } from '../services/campaigns/CampaignService';

const router = Router();
const prisma = new PrismaClient();
const campaignService = new CampaignService(prisma);

// Schema for campaign creation
const createCampaignSchema = z.object({
  name: z.string().min(3, 'Campaign name must be at least 3 characters'),
  description: z.string().optional(),
  campaignType: z.enum([
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
  targeting: z.string().optional(),
  budget: z.string().optional().nullable(),
  goals: z.record(z.any()).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  projectId: z.string(),
  agentIds: z.array(z.string()).optional(),
});

// Schema for campaign update
const updateCampaignSchema = z.object({
  name: z.string().min(3, 'Campaign name must be at least 3 characters').optional(),
  description: z.string().optional(),
  campaignType: z.enum([
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
  ]).optional(),
  targeting: z.string().optional(),
  budget: z.string().optional().nullable(),
  goals: z.record(z.any()).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  status: z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']).optional(),
  agentIds: z.array(z.string()).optional(),
});

// Get all campaigns
router.get('/', requireAuth(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.query;
    
    // Get campaigns with related entities if needed
    const campaigns = await campaignService.getCampaigns(
      userId,
      projectId as string | undefined,
      true
    );
    
    return res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return res.status(500).json({ message: 'Failed to fetch campaigns' });
  }
}));

// Get campaign by ID
router.get('/:id', requireAuth(async (req: AuthenticatedRequest, res: Response) => {
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
      return res.status(403).json({ message: 'Not authorized to access this campaign' });
    }

    return res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return res.status(500).json({ message: 'Failed to fetch campaign' });
  }
}));

// Create new campaign
router.post(
  '/', 
  validateRequest(createCampaignSchema), 
  requireAuth(async (req: AuthenticatedRequest, res: Response) => {
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
        agentIds
      } = req.body;
      
      // Check if user has access to the project
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { ownerId: req.user.id },
            { members: { some: { id: req.user.id } } }
          ]
        }
      });
      
      if (!project) {
        return res.status(403).json({ message: 'Not authorized to create campaigns for this project' });
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
        agentIds
      });
      
      return res.status(201).json(campaign);
    } catch (error) {
      console.error('Error creating campaign:', error);
      return res.status(500).json({ message: 'Failed to create campaign' });
    }
  })
);

// Update campaign
router.put(
  '/:id', 
  validateRequest(updateCampaignSchema), 
  requireAuth(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Check if campaign exists and belongs to user
      const existingCampaign = await campaignService.getCampaign(id);
      
      if (!existingCampaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      
      if (existingCampaign.ownerId !== userId) {
        return res.status(403).json({ message: 'Not authorized to update this campaign' });
      }
      
      // Update campaign
      const updatedData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined
      };
      
      const campaign = await campaignService.updateCampaign(id, updatedData);
      
      return res.json(campaign);
    } catch (error) {
      console.error('Error updating campaign:', error);
      return res.status(500).json({ message: 'Failed to update campaign' });
    }
  })
);

// Delete campaign
router.delete('/:id', requireAuth(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if campaign exists and belongs to user
    const existingCampaign = await campaignService.getCampaign(id);
    
    if (!existingCampaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    if (existingCampaign.ownerId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this campaign' });
    }
    
    // Delete campaign
    await campaignService.deleteCampaign(id);
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return res.status(500).json({ message: 'Failed to delete campaign' });
  }
}));

// Get campaign metrics
router.get('/:id/metrics', requireAuth(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Check if campaign exists and belongs to user
    const existingCampaign = await campaignService.getCampaign(id);
    
    if (!existingCampaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    
    if (existingCampaign.ownerId !== userId) {
      return res.status(403).json({ message: 'Not authorized to access this campaign' });
    }
    
    // Get campaign metrics
    const metrics = await campaignService.getCampaignAnalytics(id);
    
    return res.json(metrics);
  } catch (error) {
    console.error('Error fetching campaign metrics:', error);
    return res.status(500).json({ message: 'Failed to fetch campaign metrics' });
  }
}));

export default router;
