'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = require('express');
const client_1 = require('@prisma/client');
const auth_1 = require('../../middleware/auth');
const validation_1 = require('../../middleware/validation');
const AgentScheduler_1 = require('../../agents/scheduler/AgentScheduler');
const schedulerSingleton_1 = require('../../services/schedulerSingleton');
const express_validator_1 = require('express-validator');
const logger_1 = require('../../utils/logger');
const router = (0, express_1.Router)({ mergeParams: true });
const prisma = new client_1.PrismaClient();
// Validation schemas
const scheduleValidation = [
  (0, express_validator_1.body)('cronExpression')
    .isString()
    .matches(/^[\d\s*/\-,]+$/)
    .withMessage('Invalid cron expression format'),
  (0, express_validator_1.body)('priority')
    .optional()
    .isIn(['LOW', 'NORMAL', 'HIGH', 'CRITICAL'])
    .withMessage('Invalid priority level'),
  (0, express_validator_1.body)('enabled')
    .optional()
    .isBoolean()
    .withMessage('Enabled must be a boolean'),
];
// Schedule a new run
router.post(
  '/',
  auth_1.authenticateToken,
  scheduleValidation,
  validation_1.validateRequest,
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
      const priorityMap = {
        LOW: AgentScheduler_1.AgentPriority.LOW,
        NORMAL: AgentScheduler_1.AgentPriority.NORMAL,
        HIGH: AgentScheduler_1.AgentPriority.HIGH,
        CRITICAL: AgentScheduler_1.AgentPriority.CRITICAL,
      };
      const scheduler = (0, schedulerSingleton_1.getScheduler)();
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
      logger_1.logger.info(`Agent ${agentId} scheduled successfully`);
      res.json({
        success: true,
        data: updatedAgent,
      });
    } catch (err) {
      logger_1.logger.error('Error scheduling agent:', err);
      next(err);
    }
  },
);
// Get agent schedule info
router.get('/', auth_1.authenticateToken, async (req, res, next) => {
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
    const scheduler = (0, schedulerSingleton_1.getScheduler)();
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
    logger_1.logger.error('Error fetching agent schedule:', err);
    next(err);
  }
});
// Unschedule agent
router.delete('/', auth_1.authenticateToken, async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const scheduler = (0, schedulerSingleton_1.getScheduler)();
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
    logger_1.logger.info(`Agent ${agentId} unscheduled successfully`);
    res.json({
      success: true,
      message: 'Agent unscheduled successfully',
    });
  } catch (err) {
    logger_1.logger.error('Error unscheduling agent:', err);
    next(err);
  }
});
// Get scheduler status
router.get('/status', auth_1.authenticateToken, async (req, res, next) => {
  try {
    const scheduler = (0, schedulerSingleton_1.getScheduler)();
    const stats = scheduler.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    logger_1.logger.error('Error fetching scheduler status:', err);
    next(err);
  }
});
// Pause a scheduled job
router.patch(
  '/:jobId/pause',
  auth_1.authenticateToken,
  async (req, res, next) => {
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
      const scheduler = (0, schedulerSingleton_1.getScheduler)();
      await scheduler.pauseJob(agentId, jobId);
      logger_1.logger.info(
        `Job ${jobId} for agent ${agentId} paused successfully`,
      );
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
      logger_1.logger.error(`Error pausing job:`, err);
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
  },
);
// Resume a paused job
router.patch(
  '/:jobId/resume',
  auth_1.authenticateToken,
  async (req, res, next) => {
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
      const scheduler = (0, schedulerSingleton_1.getScheduler)();
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
      logger_1.logger.info(
        `Job ${jobId} for agent ${agentId} resumed successfully`,
      );
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
      logger_1.logger.error(`Error resuming job:`, err);
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
  },
);
// Get paused jobs
router.get('/paused', auth_1.authenticateToken, async (req, res, next) => {
  try {
    const scheduler = (0, schedulerSingleton_1.getScheduler)();
    const pausedJobs = scheduler.getPausedJobs();
    res.json({
      success: true,
      data: pausedJobs,
    });
  } catch (err) {
    logger_1.logger.error('Error fetching paused jobs:', err);
    next(err);
  }
});
exports.default = router;
