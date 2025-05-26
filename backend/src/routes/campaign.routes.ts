import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation';

const router = Router();
const prisma = new PrismaClient();

// Schema for campaign creation
const createCampaignSchema = z.object({
  name: z.string().min(2, 'Campaign name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum([
    'CONTENT_MARKETING',
    'EMAIL_CAMPAIGN',
    'SOCIAL_MEDIA',
    'SEO_OPTIMIZATION',
    'AD_CAMPAIGN',
    'PRODUCT_LAUNCH',
    'EVENT_PROMOTION',
    'BRAND_AWARENESS',
  ]),
  target: z.string().min(5, 'Target audience must be at least 5 characters'),
  budget: z.string().optional(),
  goals: z.string().min(5, 'Campaign goals must be at least 5 characters'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Schema for campaign update
const updateCampaignSchema = createCampaignSchema.partial().extend({
  status: z
    .enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'])
    .optional(),
});

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const campaigns = await prisma.campaign.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        generatedContents: {
          select: {
            id: true,
            title: true,
            contentType: true,
            status: true,
          },
          take: 3,
        },
        outreachTasks: {
          select: {
            id: true,
            title: true,
            status: true,
          },
          take: 3,
        },
        _count: {
          select: {
            generatedContents: true,
            outreachTasks: true,
          },
        },
      },
    });

    return res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return res.status(500).json({ message: 'Failed to fetch campaigns' });
  }
});

// Get campaign by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId,
      },
      include: {
        generatedContents: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        outreachTasks: {
          orderBy: {
            createdAt: 'desc',
          },
        },
        metrics: {
          orderBy: {
            timestamp: 'desc',
          },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    return res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return res.status(500).json({ message: 'Failed to fetch campaign' });
  }
});

// Create new campaign
router.post('/', validateRequest(createCampaignSchema), async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      target,
      budget,
      goals,
      startDate,
      endDate,
    } = req.body;
    const userId = req.user.id;

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        campaignType: type,
        targetAudience: target,
        budget: budget || null,
        goals,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: 'DRAFT',
        userId,
      },
    });

    return res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    return res.status(500).json({ message: 'Failed to create campaign' });
  }
});

// Update campaign
router.put('/:id', validateRequest(updateCampaignSchema), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      type,
      target,
      budget,
      goals,
      startDate,
      endDate,
      status,
    } = req.body;
    const userId = req.user.id;

    // Check if campaign exists and belongs to user
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingCampaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Update campaign
    const campaign = await prisma.campaign.update({
      where: {
        id,
      },
      data: {
        name,
        description,
        campaignType: type,
        targetAudience: target,
        budget,
        goals,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status,
      },
    });

    return res.json(campaign);
  } catch (error) {
    console.error('Error updating campaign:', error);
    return res.status(500).json({ message: 'Failed to update campaign' });
  }
});

// Delete campaign
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if campaign exists and belongs to user
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingCampaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Delete campaign
    await prisma.campaign.delete({
      where: {
        id,
      },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return res.status(500).json({ message: 'Failed to delete campaign' });
  }
});

// Get campaign performance metrics
router.get('/:id/metrics', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if campaign exists and belongs to user
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!existingCampaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const metrics = await prisma.metric.findMany({
      where: {
        campaignId: id,
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return res.json(metrics);
  } catch (error) {
    console.error('Error fetching campaign metrics:', error);
    return res
      .status(500)
      .json({ message: 'Failed to fetch campaign metrics' });
  }
});

export default router;
