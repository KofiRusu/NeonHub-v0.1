import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { AgentPriority } from '../../agents/scheduler/AgentScheduler';
import { getScheduler } from '../../services/schedulerSingleton';
import { body } from 'express-validator';
import { logger } from '../../utils/logger';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

// Validation schemas
const scheduleValidation = [
  body('cronExpression')
    .isString()
    .matches(/^[\d\s*/-,]+$/)
    .withMessage('Invalid cron expression format'),
  body('priority')
    .optional()
    .isIn(['LOW', 'NORMAL', 'HIGH', 'CRITICAL'])
    .withMessage('Invalid priority level'),
  body('enabled')
    .optional()
    .isBoolean()
    .withMessage('Enabled must be a boolean'),
];

// Schedule a new run
router.post(
  '/',
  authenticate,
  scheduleValidation,
  validateRequest,
  async (req, res, next) => {
    try {
      const { agentId } = req.params;
      const { cronExpression, priority = 'NORMAL', enabled = true } = req.body;

      // Verify agent exists
      const agent = await prisma.aIAgent.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found',
        });
      }

      // Map string priority to enum
      const priorityMap: Record<string, AgentPriority> = {
        LOW: AgentPriority.LOW,
        NORMAL: AgentPriority.NORMAL,
        HIGH: AgentPriority.HIGH,
        CRITICAL: AgentPriority.CRITICAL,
      };

      const scheduler = getScheduler();
      await scheduler.scheduleAgent(
        agentId,
        cronExpression,
        priorityMap[priority],
        enabled,
      );

      // Get updated agent with schedule info
      const updatedAgent = await prisma.aIAgent.findUnique({
        where: { id: agentId },
        select: {
          id: true,
          name: true,
          scheduleExpression: true,
          scheduleEnabled: true,
          nextRunAt: true,
        },
      });

      logger.info(`Agent ${agentId} scheduled successfully`);

      res.json({
        success: true,
        data: updatedAgent,
      });
    } catch (err) {
      logger.error('Error scheduling agent:', err);
      next(err);
    }
  },
);

// Get agent schedule info
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { agentId } = req.params;

    // Get agent with schedule info
    const agent = await prisma.aIAgent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        scheduleExpression: true,
        scheduleEnabled: true,
        nextRunAt: true,
        lastRunAt: true,
        status: true,
      },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    // Get additional task details from scheduler
    const scheduler = getScheduler();
    const taskDetails = scheduler
      .getTaskDetails()
      .filter((task) => task.agentId === agentId);

    res.json({
      success: true,
      data: {
        ...agent,
        taskDetails: taskDetails[0] || null,
      },
    });
  } catch (err) {
    logger.error('Error fetching agent schedule:', err);
    next(err);
  }
});

// Unschedule agent
router.delete('/', authenticate, async (req, res, next) => {
  try {
    const { agentId } = req.params;

    const scheduler = getScheduler();
    scheduler.unscheduleAgent(agentId);

    // Update agent in database
    await prisma.aIAgent.update({
      where: { id: agentId },
      data: {
        scheduleEnabled: false,
        scheduleExpression: null,
        nextRunAt: null,
      },
    });

    logger.info(`Agent ${agentId} unscheduled successfully`);

    res.json({
      success: true,
      message: 'Agent unscheduled successfully',
    });
  } catch (err) {
    logger.error('Error unscheduling agent:', err);
    next(err);
  }
});

// Get scheduler status
router.get('/status', authenticate, async (req, res, next) => {
  try {
    const scheduler = getScheduler();
    const stats = scheduler.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    logger.error('Error fetching scheduler status:', err);
    next(err);
  }
});

// Pause a scheduled job
router.patch('/:jobId/pause', authenticate, async (req, res, next) => {
  try {
    const { agentId, jobId } = req.params;

    // Verify agent exists
    const agent = await prisma.aIAgent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    const scheduler = getScheduler();
    await scheduler.pauseJob(agentId, jobId);

    logger.info(`Job ${jobId} for agent ${agentId} paused successfully`);

    res.json({
      success: true,
      message: `Job ${jobId} paused successfully`,
      data: {
        agentId,
        jobId,
        status: 'paused',
      },
    });
  } catch (err) {
    logger.error(`Error pausing job:`, err);
    
    // Handle specific errors
    if (err instanceof Error) {
      if (err.message.includes('No scheduled task found')) {
        return res.status(404).json({
          success: false,
          error: err.message,
        });
      }
      if (err.message.includes('while it is running')) {
        return res.status(409).json({
          success: false,
          error: err.message,
        });
      }
    }
    
    next(err);
  }
});

// Resume a paused job
router.patch('/:jobId/resume', authenticate, async (req, res, next) => {
  try {
    const { agentId, jobId } = req.params;

    // Verify agent exists
    const agent = await prisma.aIAgent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found',
      });
    }

    const scheduler = getScheduler();
    await scheduler.resumeJob(agentId, jobId);

    // Get updated agent info
    const updatedAgent = await prisma.aIAgent.findUnique({
      where: { id: agentId },
      select: {
        id: true,
        name: true,
        scheduleExpression: true,
        scheduleEnabled: true,
        nextRunAt: true,
        status: true,
      },
    });

    logger.info(`Job ${jobId} for agent ${agentId} resumed successfully`);

    res.json({
      success: true,
      message: `Job ${jobId} resumed successfully`,
      data: {
        agentId,
        jobId,
        status: 'resumed',
        nextRunAt: updatedAgent?.nextRunAt,
      },
    });
  } catch (err) {
    logger.error(`Error resuming job:`, err);
    
    // Handle specific errors
    if (err instanceof Error) {
      if (err.message.includes('No scheduled task found')) {
        return res.status(404).json({
          success: false,
          error: err.message,
        });
      }
      if (err.message.includes('is not paused')) {
        return res.status(400).json({
          success: false,
          error: err.message,
        });
      }
    }
    
    next(err);
  }
});

// Get paused jobs
router.get('/paused', authenticate, async (req, res, next) => {
  try {
    const scheduler = getScheduler();
    const pausedJobs = scheduler.getPausedJobs();

    res.json({
      success: true,
      data: pausedJobs,
    });
  } catch (err) {
    logger.error('Error fetching paused jobs:', err);
    next(err);
  }
});

export default router;
