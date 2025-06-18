'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = require('express');
const client_1 = require('@prisma/client');
const express_validator_1 = require('express-validator');
const agents_1 = require('../agents');
const schedulerSingleton_1 = require('../services/schedulerSingleton');
const content_routes_1 = __importDefault(require('./agents/content.routes'));
const trend_routes_1 = __importDefault(require('./agents/trend.routes'));
const schedule_1 = __importDefault(require('./agents/schedule'));
// Initialize router
const router = (0, express_1.Router)();
// Initialize Prisma client
const prisma = new client_1.PrismaClient();
// Mount specialized agent routes
router.use('/content', content_routes_1.default);
router.use('/trend', trend_routes_1.default);
router.use('/:agentId/schedule', schedule_1.default);
/**
 * @route   POST /api/agents/run
 * @desc    Run an AI agent
 * @access  Private
 */
router.post(
  '/run',
  [
    // Validate that either agentId or type is provided
    (0, express_validator_1.body)().custom((body) => {
      if (!body.agentId && !body.type) {
        throw new Error('Either agentId or type must be provided');
      }
      return true;
    }),
    // Validate agent type if provided
    (0, express_validator_1.body)('type')
      .optional()
      .isIn(['Content', 'Outreach', 'AdOptimizer', 'TrendPredictor'])
      .withMessage(
        'Invalid agent type. Must be one of: Content, Outreach, AdOptimizer, TrendPredictor',
      ),
    // Validate context if provided
    (0, express_validator_1.body)('context')
      .optional()
      .isObject()
      .withMessage('Context must be an object'),
  ],
  async (req, res) => {
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
      const { agentId, type, context } = req.body;
      // Get agent manager
      const manager = (0, agents_1.getAgentManager)(prisma);
      // Variable to store the agent ID we'll end up using
      let targetAgentId = agentId;
      // If no agent ID but a type is provided, create a temporary agent
      if (!targetAgentId && type) {
        const agentType = mapAgentType(type);
        targetAgentId = await createTemporaryAgent(agentType);
      }
      if (!targetAgentId) {
        return res.status(400).json({
          success: false,
          message: 'No agent ID could be determined',
        });
      }
      // Run the agent
      const result = await manager.runAgent(targetAgentId, context);
      // Get agent metadata
      const agentMetadata = await getAgentMetadata(targetAgentId);
      // Prepare and send response
      res.json({
        success: true,
        output: result.data,
        logs: result.success
          ? { level: 'info', message: 'Agent executed successfully' }
          : { level: 'error', message: result.error?.message },
        status: result.success ? 'completed' : 'failed',
        metrics: result.metrics,
        timestamp: result.timestamp,
        agent: agentMetadata,
      });
    } catch (error) {
      console.error('Agent run error:', error);
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
 * @route   GET /api/agents
 * @desc    Get all agents
 * @access  Private
 */
router.get('/', async (_req, res) => {
  try {
    const agents = await prisma.aIAgent.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      success: true,
      agents: agents.map((agent) => ({
        id: agent.id,
        name: agent.name,
        type: agent.agentType,
        status: agent.status,
        lastRunAt: agent.lastRunAt,
      })),
    });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});
/**
 * @route   GET /api/agents/:id
 * @desc    Get agent by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const agent = await prisma.aIAgent.findUnique({
      where: { id },
    });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }
    res.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        type: agent.agentType,
        status: agent.status,
        configuration: agent.configuration,
        lastRunAt: agent.lastRunAt,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get agent error:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});
/**
 * Map string agent type to AgentType enum
 */
function mapAgentType(type) {
  switch (type) {
    case 'Content':
      return client_1.AgentType.CONTENT_CREATOR;
    case 'Outreach':
      return client_1.AgentType.OUTREACH_MANAGER;
    case 'AdOptimizer':
      return client_1.AgentType.PERFORMANCE_OPTIMIZER;
    case 'TrendPredictor':
      return client_1.AgentType.TREND_ANALYZER;
    default:
      throw new Error(`Invalid agent type: ${type}`);
  }
}
/**
 * Create a temporary agent for testing
 */
async function createTemporaryAgent(agentType) {
  // Generate a basic configuration based on agent type
  const config = {
    id: `temp-${Date.now()}`,
    maxRetries: 1,
    autoRetry: true,
  };
  // Add type-specific configurations
  switch (agentType) {
    case client_1.AgentType.CONTENT_CREATOR:
      config.topics = ['marketing', 'artificial intelligence'];
      config.length = { min: 200, max: 500 };
      config.tone = 'professional';
      break;
    case client_1.AgentType.OUTREACH_MANAGER:
      config.personalizationLevel = 'high';
      config.templates = {
        email: 'Default email template',
        linkedin: 'Default LinkedIn template',
      };
      break;
    case client_1.AgentType.PERFORMANCE_OPTIMIZER:
      config.platforms = ['FACEBOOK', 'GOOGLE'];
      config.targetMetrics = {
        ctr: 0.02,
        cpc: 2.5,
      };
      break;
    case client_1.AgentType.TREND_ANALYZER:
      config.sources = ['social_media', 'news', 'search_trends'];
      config.industries = ['marketing', 'technology'];
      config.keywords = ['AI', 'automation', 'personalization'];
      break;
  }
  // Get default project and user IDs
  const projectId = await getDefaultProjectId();
  const managerId = await getDefaultUserId();
  // Create the agent in the database
  const agent = await prisma.aIAgent.create({
    data: {
      name: `Temporary ${agentType} Agent`,
      description: `Created for API testing on ${new Date().toISOString()}`,
      agentType,
      status: 'IDLE',
      configuration: config,
      projectId,
      managerId,
    },
  });
  return agent.id;
}
/**
 * Get agent metadata
 */
async function getAgentMetadata(agentId) {
  const agent = await prisma.aIAgent.findUnique({
    where: { id: agentId },
    select: {
      id: true,
      name: true,
      agentType: true,
      status: true,
      lastRunAt: true,
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      manager: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  if (!agent) {
    throw new Error(`Agent with ID ${agentId} not found`);
  }
  return agent;
}
/**
 * Get a default project ID for testing
 */
async function getDefaultProjectId() {
  // Try to find an existing project
  const project = await prisma.project.findFirst({
    select: { id: true },
  });
  if (project) {
    return project.id;
  }
  // If no project exists, create a test project
  const userId = await getDefaultUserId();
  const newProject = await prisma.project.create({
    data: {
      name: 'API Test Project',
      description: 'Created for API agent testing',
      ownerId: userId,
    },
  });
  return newProject.id;
}
/**
 * Get a default user ID for testing
 */
async function getDefaultUserId() {
  // Try to find an existing user
  const user = await prisma.user.findFirst({
    select: { id: true },
  });
  if (user) {
    return user.id;
  }
  // If no user exists, create a test user
  const newUser = await prisma.user.create({
    data: {
      name: 'API Test User',
      email: `api.test.${Date.now()}@example.com`,
      password: 'hashedpassword', // In a real app, this would be properly hashed
    },
  });
  return newUser.id;
}
/**
 * @route   GET /api/agents/sessions
 * @desc    Get all active agent sessions
 * @access  Private
 */
router.get('/sessions', async (_req, res) => {
  try {
    const agentScheduler = (0, schedulerSingleton_1.getScheduler)();
    const taskDetails = agentScheduler.getTaskDetails();
    // Filter to only running tasks
    const runningSessions = taskDetails.filter((task) => task.isRunning);
    res.json({
      success: true,
      sessions: runningSessions.map((task) => ({
        agentId: task.agentId,
        agentName: task.agentName,
        priority: task.priority,
        isRunning: task.isRunning,
        isPaused: task.isPaused,
      })),
      count: runningSessions.length,
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});
/**
 * @route   GET /api/agents/scheduler/status
 * @desc    Get scheduler status and statistics
 * @access  Private
 */
router.get('/scheduler/status', async (_req, res) => {
  try {
    const scheduler = (0, schedulerSingleton_1.getScheduler)();
    const stats = scheduler.getStats();
    res.json({
      success: true,
      status: stats.isRunning ? 'running' : 'stopped',
      stats: {
        totalScheduled: stats.scheduledTasksCount,
        activeAgents: stats.runningAgentsCount,
        queuedTasks: stats.queuedTasksCount,
        maxConcurrentAgents: stats.maxConcurrentAgents,
        pausedJobs: stats.pausedJobsCount,
        isRunning: stats.isRunning,
      },
    });
  } catch (error) {
    console.error('Get scheduler status error:', error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'An unexpected error occurred',
    });
  }
});
// Add scheduling routes after the agent routes
/**
 * @route   POST /api/agents/:id/run
 * @desc    Run an agent immediately
 * @access  Private
 */
router.post('/:id/run', async (req, res) => {
  try {
    const { id } = req.params;
    const { context } = req.body;
    // Check if the agent exists
    const agent = await prisma.aIAgent.findUnique({
      where: { id },
    });
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }
    // Get the agent scheduler
    const agentScheduler = (0, schedulerSingleton_1.getScheduler)();
    // Run the agent using the scheduler's manual run method
    agentScheduler.runAgentNow(id).catch((error) => {
      console.error(`Error running agent ${id}:`, error);
    });
    return res.json({
      success: true,
      message: 'Agent execution started',
      agentId: id,
    });
  } catch (error) {
    console.error('Error scheduling agent run:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to run agent',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
exports.default = router;
