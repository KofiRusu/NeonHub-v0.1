import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { AgentPriority } from '../../agents/scheduler/AgentScheduler';
import { getScheduler } from '../../services/schedulerSingleton';
import { body } from 'express-validator';
import { logger } from '../../utils/logger';
import { Request, Response, NextFunction } from 'express';

// Extended request interface with params
interface AgentRequest extends Request {
  params: {
    agentId: string;
  };
}

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

// Validation schemas
const scheduleValidation = [
  body('cronExpression')
    .isString()
    .matches(/^[\d\s*/\-,]+$/)
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
  authenticateToken,
  scheduleValidation,
  validateRequest,
  async (req: AgentRequest, res: Response, next: NextFunction) => {
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
router.get(
  '/',
  authenticateToken,
  async (req: AgentRequest, res: Response, next: NextFunction) => {
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
  },
);

// Unschedule agent
router.delete(
  '/',
  authenticateToken,
  async (req: AgentRequest, res: Response, next: NextFunction) => {
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
  },
);

// Get scheduler status
router.get(
  '/status',
  authenticateToken,
  async (req: Request, res: Response, next: NextFunction) => {
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
  },
);

export default router;
