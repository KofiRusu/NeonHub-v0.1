import { Router } from 'express';
import { PrismaClient, AgentType } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { getAgentManager } from '../../agents';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route   POST /api/agents/content/generate
 * @desc    Generate content using the ContentAgent
 * @access  Private
 */
router.post(
  '/generate',
  [
    body('title').isString().notEmpty().withMessage('Title is required'),
    body('contentType')
      .isString()
      .notEmpty()
      .withMessage('Content type is required'),
    body('targeting')
      .isString()
      .notEmpty()
      .withMessage('Target audience is required'),
    body('keyPoints')
      .isString()
      .notEmpty()
      .withMessage('Key points are required'),
    body('tone').isString().notEmpty().withMessage('Tone is required'),
    body('length').isString().notEmpty().withMessage('Length is required'),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        message: 'Validation failed',
      });
    }

    try {
      const {
        title,
        contentType,
        campaignId,
        platform,
        targeting,
        keyPoints,
        tone,
        length,
      } = req.body;

      const userId = req.user.id;

      // Get agent manager
      const manager = getAgentManager(prisma);

      // Find a ContentAgent or create a temporary one
      let contentAgent = await prisma.aIAgent.findFirst({
        where: {
          agentType: 'CONTENT_CREATOR',
          status: 'IDLE',
        },
      });

      if (!contentAgent) {
        // Create a temporary agent
        contentAgent = await prisma.aIAgent.create({
          data: {
            name: 'Temporary Content Agent',
            description: 'Created for content generation',
            agentType: 'CONTENT_CREATOR',
            status: 'IDLE',
            configuration: {
              topics: [title],
              length: {
                min: length === 'SHORT' ? 100 : length === 'MEDIUM' ? 300 : 600,
                max:
                  length === 'SHORT' ? 300 : length === 'MEDIUM' ? 600 : 1200,
              },
              tone: tone.toLowerCase(),
              platform: platform || 'WEBSITE',
            },
            userId,
          },
        });
      }

      // Prepare context for the agent
      const context = {
        title,
        contentType,
        targeting,
        keyPoints,
        tone,
        length,
        platform,
        campaignId,
      };

      // Run the agent to generate content
      const result = await manager.runAgent(contentAgent.id, context);

      if (result.success) {
        // If successful, return the generated content
        return res.json({
          success: true,
          content: result.data.content,
          metadata: {
            title,
            contentType,
            tone,
            length,
            targeting,
          },
          message: 'Content generated successfully',
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to generate content',
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Content generation error:', error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
        error: error instanceof Error ? error.stack : null,
      });
    }
  },
);

/**
 * @route   POST /api/agents/content/improve
 * @desc    Improve existing content using the ContentAgent
 * @access  Private
 */
router.post(
  '/improve',
  [
    body('content').isString().notEmpty().withMessage('Content is required'),
    body('feedback').isString().notEmpty().withMessage('Feedback is required'),
  ],
  async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
        message: 'Validation failed',
      });
    }

    try {
      const { content, feedback, contentId } = req.body;
      const userId = req.user.id;

      // Get agent manager
      const manager = getAgentManager(prisma);

      // Find a ContentAgent
      let contentAgent = await prisma.aIAgent.findFirst({
        where: {
          agentType: 'CONTENT_CREATOR',
          status: 'IDLE',
        },
      });

      if (!contentAgent) {
        // Create a temporary agent
        contentAgent = await prisma.aIAgent.create({
          data: {
            name: 'Temporary Content Improvement Agent',
            description: 'Created for content improvement',
            agentType: 'CONTENT_CREATOR',
            status: 'IDLE',
            configuration: {
              mode: 'improvement',
            },
            userId,
          },
        });
      }

      // Prepare context for the agent
      const context = {
        originalContent: content,
        feedback,
        contentId,
        task: 'improve',
      };

      // Run the agent to improve content
      const result = await manager.runAgent(contentAgent.id, context);

      if (result.success) {
        // If successful, return the improved content
        return res.json({
          success: true,
          content: result.data.content,
          improvements: result.data.improvements,
          message: 'Content improved successfully',
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to improve content',
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Content improvement error:', error);
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
        error: error instanceof Error ? error.stack : null,
      });
    }
  },
);

export default router;
