'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = require('express');
const client_1 = require('@prisma/client');
const express_validator_1 = require('express-validator');
const agents_1 = require('../../agents');
const routeAuth_1 = require('../../middleware/routeAuth');
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * @route   POST /api/agents/content/generate
 * @desc    Generate content using the ContentAgent
 * @access  Private
 */
router.post(
  '/generate',
  [
    (0, express_validator_1.body)('title')
      .isString()
      .notEmpty()
      .withMessage('Title is required'),
    (0, express_validator_1.body)('contentType')
      .isString()
      .notEmpty()
      .withMessage('Content type is required'),
    (0, express_validator_1.body)('targeting')
      .isString()
      .notEmpty()
      .withMessage('Target audience is required'),
    (0, express_validator_1.body)('keyPoints')
      .isString()
      .notEmpty()
      .withMessage('Key points are required'),
    (0, express_validator_1.body)('tone')
      .isString()
      .notEmpty()
      .withMessage('Tone is required'),
    (0, express_validator_1.body)('length')
      .isString()
      .notEmpty()
      .withMessage('Length is required'),
  ],
  (0, routeAuth_1.requireAuth)(async (req, res) => {
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
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
      const manager = (0, agents_1.getAgentManager)(prisma);
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
            projectId: req.body.projectId,
            managerId: userId,
            scheduleEnabled: false,
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
  }),
);
/**
 * @route   POST /api/agents/content/improve
 * @desc    Improve existing content using the ContentAgent
 * @access  Private
 */
router.post(
  '/improve',
  [
    (0, express_validator_1.body)('content')
      .isString()
      .notEmpty()
      .withMessage('Content is required'),
    (0, express_validator_1.body)('feedback')
      .isString()
      .notEmpty()
      .withMessage('Feedback is required'),
  ],
  (0, routeAuth_1.requireAuth)(async (req, res) => {
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
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
      const manager = (0, agents_1.getAgentManager)(prisma);
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
            projectId: req.body.projectId || '1', // Default project
            managerId: userId,
            scheduleEnabled: false,
          },
        });
      }
      // If contentId is provided, fetch the content from database
      let existingContent;
      if (contentId) {
        existingContent = await prisma.generatedContent.findUnique({
          where: {
            id: contentId,
          },
        });
      }
      // Prepare context for the agent
      const context = {
        originalContent: content,
        feedback,
        metadata: existingContent?.metadata || {},
      };
      // Run the agent to improve content
      const result = await manager.runAgent(contentAgent.id, context);
      if (result.success) {
        // If contentId was provided, update the existing content
        if (contentId && existingContent) {
          await prisma.generatedContent.update({
            where: {
              id: contentId,
            },
            data: {
              content: result.data.content,
              status: 'DRAFT', // Reset to draft after improvement
            },
          });
        }
        // Return the improved content
        return res.json({
          success: true,
          originalContent: content,
          improvedContent: result.data.content,
          changes: result.data.changes || [],
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
  }),
);
exports.default = router;
