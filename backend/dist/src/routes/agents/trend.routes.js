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
 * @route   POST /api/agents/trend/predict
 * @desc    Predict trends using the TrendPredictorAgent
 * @access  Private
 */
router.post(
  '/predict',
  [
    (0, express_validator_1.body)('industries')
      .optional()
      .isArray()
      .withMessage('Industries must be an array'),
    (0, express_validator_1.body)('keywords')
      .optional()
      .isArray()
      .withMessage('Keywords must be an array'),
    (0, express_validator_1.body)('sources')
      .optional()
      .isArray()
      .withMessage('Sources must be an array'),
    (0, express_validator_1.body)('timeframe')
      .optional()
      .isString()
      .withMessage('Timeframe must be a string'),
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
      const { industries, keywords, sources, timeframe } = req.body;
      const userId = req.user.id;
      // Get agent manager
      const manager = (0, agents_1.getAgentManager)(prisma);
      // Find a TrendPredictor agent or create a temporary one
      let trendAgent = await prisma.aIAgent.findFirst({
        where: {
          agentType: 'TREND_ANALYZER',
          status: 'IDLE',
        },
      });
      if (!trendAgent) {
        // Create a temporary agent
        trendAgent = await prisma.aIAgent.create({
          data: {
            name: 'Temporary Trend Predictor',
            description: 'Created for trend analysis',
            agentType: 'TREND_ANALYZER',
            status: 'IDLE',
            configuration: {
              sources: sources || ['social_media', 'news', 'search_trends'],
              industries: industries || ['marketing', 'technology'],
              keywords: keywords || ['AI', 'automation', 'personalization'],
              timeframe: timeframe || 'recent',
            },
            projectId: req.body.projectId,
            managerId: userId,
            scheduleEnabled: false,
          },
        });
      }
      // Prepare context for the agent
      const context = {
        industries,
        keywords,
        sources,
        timeframe,
        userId,
      };
      // Run the agent to predict trends
      const result = await manager.runAgent(trendAgent.id, context);
      if (result.success) {
        // If successful, fetch the latest trends created by this agent
        const latestTrends = await prisma.trendSignal.findMany({
          where: {
            agentId: trendAgent.id,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        });
        return res.json({
          success: true,
          trends: latestTrends,
          message: 'Trend analysis completed successfully',
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to analyze trends',
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Trend prediction error:', error);
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
 * @route   POST /api/agents/trend/analyze
 * @desc    Analyze a specific trend or topic using the TrendPredictorAgent
 * @access  Private
 */
router.post(
  '/analyze',
  [
    (0, express_validator_1.body)('topic')
      .isString()
      .notEmpty()
      .withMessage('Topic is required'),
    (0, express_validator_1.body)('depth')
      .optional()
      .isString()
      .withMessage('Depth must be a string'),
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
      const { topic, depth, sources } = req.body;
      const userId = req.user.id;
      // Get agent manager
      const manager = (0, agents_1.getAgentManager)(prisma);
      // Find a TrendPredictor agent
      let trendAgent = await prisma.aIAgent.findFirst({
        where: {
          agentType: 'TREND_ANALYZER',
          status: 'IDLE',
        },
      });
      if (!trendAgent) {
        // Create a temporary agent
        trendAgent = await prisma.aIAgent.create({
          data: {
            name: 'Temporary Trend Analyzer',
            description: 'Created for specific trend analysis',
            agentType: 'TREND_ANALYZER',
            status: 'IDLE',
            configuration: {
              mode: 'specific_analysis',
              sources: sources || ['social_media', 'news', 'search_trends'],
              depth: depth || 'medium',
            },
            projectId: req.body.projectId,
            managerId: userId,
            scheduleEnabled: false,
          },
        });
      }
      // Prepare context for the agent
      const context = {
        topic,
        depth,
        sources,
      };
      // Run the agent to analyze the specific trend
      const result = await manager.runAgent(trendAgent.id, context);
      if (result.success) {
        return res.json({
          success: true,
          analysis: result.data,
          message: 'Trend analysis completed successfully',
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Failed to analyze trend',
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Trend analysis error:', error);
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
