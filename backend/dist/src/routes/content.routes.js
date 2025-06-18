'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = require('express');
const client_1 = require('@prisma/client');
const zod_1 = require('zod');
const validation_1 = require('../middleware/validation');
const routeAuth_1 = require('../middleware/routeAuth');
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Schema for content creation
const createContentSchema = zod_1.z.object({
  title: zod_1.z.string().min(2, 'Title must be at least 2 characters'),
  contentType: zod_1.z.enum([
    'BLOG_POST',
    'SOCIAL_POST',
    'EMAIL',
    'AD_COPY',
    'PRODUCT_DESCRIPTION',
    'LANDING_PAGE',
    'PRESS_RELEASE',
    'VIDEO_SCRIPT',
  ]),
  campaignId: zod_1.z.string().optional(),
  platform: zod_1.z
    .enum([
      'WEBSITE',
      'TWITTER',
      'LINKEDIN',
      'FACEBOOK',
      'INSTAGRAM',
      'EMAIL',
      'YOUTUBE',
      'TIKTOK',
      'OTHER',
    ])
    .optional(),
  targeting: zod_1.z
    .string()
    .min(5, 'Target audience must be at least 5 characters'),
  keyPoints: zod_1.z
    .string()
    .min(10, 'Key points must be at least 10 characters'),
  tone: zod_1.z.enum([
    'PROFESSIONAL',
    'CASUAL',
    'FORMAL',
    'FRIENDLY',
    'HUMOROUS',
    'AUTHORITATIVE',
    'INSPIRATIONAL',
    'EDUCATIONAL',
  ]),
  length: zod_1.z.enum(['SHORT', 'MEDIUM', 'LONG']),
  content: zod_1.z.string(),
});
// Schema for content update
const updateContentSchema = zod_1.z.object({
  title: zod_1.z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .optional(),
  contentType: zod_1.z
    .enum([
      'BLOG_POST',
      'SOCIAL_POST',
      'EMAIL',
      'AD_COPY',
      'PRODUCT_DESCRIPTION',
      'LANDING_PAGE',
      'PRESS_RELEASE',
      'VIDEO_SCRIPT',
    ])
    .optional(),
  campaignId: zod_1.z.string().optional().nullable(),
  platform: zod_1.z
    .enum([
      'WEBSITE',
      'TWITTER',
      'LINKEDIN',
      'FACEBOOK',
      'INSTAGRAM',
      'EMAIL',
      'YOUTUBE',
      'TIKTOK',
      'OTHER',
    ])
    .optional(),
  targeting: zod_1.z
    .string()
    .min(5, 'Target audience must be at least 5 characters')
    .optional(),
  content: zod_1.z.string().optional(),
  status: zod_1.z
    .enum(['DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED'])
    .optional(),
  publishDate: zod_1.z.string().optional(),
});
// Get all content
router.get(
  '/',
  (0, routeAuth_1.requireAuth)(async (req, res) => {
    try {
      const userId = req.user.id;
      // Support filtering by campaign and content type
      const { campaignId, contentType, status } = req.query;
      const whereClause = {
        creatorId: userId,
      };
      if (campaignId) {
        whereClause.campaignId = campaignId;
      }
      if (contentType) {
        whereClause.contentType = contentType;
      }
      if (status) {
        whereClause.status = status;
      }
      const contents = await prisma.generatedContent.findMany({
        where: whereClause,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          campaign: {
            select: {
              id: true,
              name: true,
            },
          },
          feedback: {
            select: {
              id: true,
              sentiment: true,
            },
          },
        },
      });
      return res.json(contents);
    } catch (error) {
      console.error('Error fetching content:', error);
      return res.status(500).json({ message: 'Failed to fetch content' });
    }
  }),
);
// Get content by ID
router.get(
  '/:id',
  (0, routeAuth_1.requireAuth)(async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const content = await prisma.generatedContent.findFirst({
        where: {
          id,
          creatorId: userId,
        },
        include: {
          campaign: true,
          feedback: true,
        },
      });
      if (!content) {
        return res.status(404).json({ message: 'Content not found' });
      }
      return res.json(content);
    } catch (error) {
      console.error('Error fetching content:', error);
      return res.status(500).json({ message: 'Failed to fetch content' });
    }
  }),
);
// Create new content
router.post(
  '/',
  (0, validation_1.validateRequest)(createContentSchema),
  (0, routeAuth_1.requireAuth)(async (req, res) => {
    try {
      // Extract data from request body
      const {
        title,
        content,
        contentType,
        campaignId,
        platform,
        targeting,
        keyPoints,
        tone,
        length,
      } = req.body;
      const userId = req.user.id;
      // Check if campaign exists and belongs to user if campaignId is provided
      if (campaignId) {
        const campaign = await prisma.campaign.findFirst({
          where: {
            id: campaignId,
            ownerId: userId,
          },
        });
        if (!campaign) {
          return res.status(404).json({ message: 'Campaign not found' });
        }
      }
      // Find a default agent to associate with this content
      const defaultAgent = await prisma.aIAgent.findFirst({
        where: {
          managerId: userId,
          agentType: 'CONTENT_CREATOR',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      // If no content agent exists, create a temporary placeholder agent
      const agentId = defaultAgent
        ? defaultAgent.id
        : (
            await prisma.aIAgent.create({
              data: {
                name: 'Content Generator',
                description: 'Default agent for user-created content',
                agentType: 'CONTENT_CREATOR',
                status: 'IDLE',
                managerId: userId,
                projectId: campaignId
                  ? (
                      await prisma.campaign.findUnique({
                        where: { id: campaignId },
                        select: { projectId: true },
                      })
                    )?.projectId || '1'
                  : '1',
                configuration: {},
                scheduleEnabled: false,
              },
            })
          ).id;
      const generatedContent = await prisma.generatedContent.create({
        data: {
          title,
          contentType,
          campaignId: campaignId || null,
          platform: platform || null,
          // Store targeting as part of metadata
          metadata: {
            targeting,
            keyPoints,
            tone,
            length,
          },
          content,
          status: 'DRAFT',
          creatorId: userId,
          agentId, // Add the required agentId
        },
      });
      return res.status(201).json(generatedContent);
    } catch (error) {
      console.error('Error creating content:', error);
      return res.status(500).json({ message: 'Failed to create content' });
    }
  }),
);
// Update content
router.put(
  '/:id',
  (0, validation_1.validateRequest)(updateContentSchema),
  (0, routeAuth_1.requireAuth)(async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      // Check if content exists and belongs to user
      const existingContent = await prisma.generatedContent.findFirst({
        where: {
          id,
          creatorId: userId,
        },
      });
      if (!existingContent) {
        return res.status(404).json({ message: 'Content not found' });
      }
      // Check if campaign exists and belongs to user if campaignId is provided
      if (req.body.campaignId) {
        const campaign = await prisma.campaign.findFirst({
          where: {
            id: req.body.campaignId,
            ownerId: userId,
          },
        });
        if (!campaign) {
          return res.status(404).json({ message: 'Campaign not found' });
        }
      }
      // Get existing metadata to update
      const currentMetadata = existingContent.metadata || {};
      // Prepare updated metadata as a valid JSON object
      const updatedMetadata = {};
      // Copy existing metadata properties if it's an object
      if (typeof currentMetadata === 'object' && currentMetadata !== null) {
        Object.keys(currentMetadata).forEach((key) => {
          try {
            // Only copy if it's a valid value for JSON
            const value = currentMetadata[key];
            if (value !== undefined) {
              updatedMetadata[key] = value;
            }
          } catch (e) {
            // Skip invalid properties
          }
        });
      }
      // Add targeting to metadata if provided
      if (req.body.targeting) {
        updatedMetadata['targeting'] = req.body.targeting;
      }
      // Add publish date to metadata if provided
      if (req.body.publishDate) {
        updatedMetadata['publishDate'] = req.body.publishDate;
      }
      // Update content
      const updatedContent = await prisma.generatedContent.update({
        where: {
          id,
        },
        data: {
          title: req.body.title,
          contentType: req.body.contentType,
          campaignId: req.body.campaignId,
          platform: req.body.platform,
          metadata: updatedMetadata,
          content: req.body.content,
          status: req.body.status,
        },
      });
      return res.json(updatedContent);
    } catch (error) {
      console.error('Error updating content:', error);
      return res.status(500).json({ message: 'Failed to update content' });
    }
  }),
);
// Delete content
router.delete(
  '/:id',
  (0, routeAuth_1.requireAuth)(async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      // Check if content exists and belongs to user
      const existingContent = await prisma.generatedContent.findFirst({
        where: {
          id,
          creatorId: userId,
        },
      });
      if (!existingContent) {
        return res.status(404).json({ message: 'Content not found' });
      }
      // Delete content
      await prisma.generatedContent.delete({
        where: {
          id,
        },
      });
      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting content:', error);
      return res.status(500).json({ message: 'Failed to delete content' });
    }
  }),
);
// Add feedback to content
router.post(
  '/:id/feedback',
  (0, routeAuth_1.requireAuth)(async (req, res) => {
    try {
      const { id } = req.params;
      const { sentiment, content } = req.body;
      const userId = req.user.id;
      // Check if content exists and belongs to user
      const existingContent = await prisma.generatedContent.findFirst({
        where: {
          id,
          creatorId: userId,
        },
      });
      if (!existingContent) {
        return res.status(404).json({ message: 'Content not found' });
      }
      // Add feedback
      const feedback = await prisma.feedback.create({
        data: {
          content,
          sentiment,
          userId,
          sourceType: 'CONTENT',
          sourceId: id,
          channel: 'IN_APP',
          contentId: id,
        },
      });
      return res.status(201).json(feedback);
    } catch (error) {
      console.error('Error adding feedback:', error);
      return res.status(500).json({ message: 'Failed to add feedback' });
    }
  }),
);
exports.default = router;
