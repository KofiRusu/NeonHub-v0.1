import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AgentPriority } from '../../agents/scheduler/AgentScheduler';
import { getScheduler } from '../../services/schedulerSingleton';
import scheduleRouter from '../../routes/agents/schedule';

// Mock dependencies
jest.mock('@prisma/client');
jest.mock('../../services/schedulerSingleton');
jest.mock('../../utils/logger');
jest.mock('../../middleware/auth', () => ({
  authenticate: jest.fn((req: Request, res: Response, next: NextFunction) =>
    next(),
  ),
}));
jest.mock('../../middleware/validation', () => ({
  validateRequest: jest.fn((req: Request, res: Response, next: NextFunction) =>
    next(),
  ),
}));

describe('Agent Schedule Routes', () => {
  let mockPrismaClient: jest.Mocked<PrismaClient>;
  let mockScheduler: any;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock Prisma client
    mockPrismaClient = new PrismaClient() as jest.Mocked<PrismaClient>;
    mockPrismaClient.aIAgent = {
      findUnique: jest.fn(),
      update: jest.fn(),
    } as any;

    // Mock scheduler
    mockScheduler = {
      scheduleAgent: jest.fn(),
      unscheduleAgent: jest.fn(),
      getTaskDetails: jest.fn(() => []),
      getStats: jest.fn(() => ({
        totalScheduled: 5,
        activeAgents: 2,
        totalRuns: 100,
        successfulRuns: 95,
        failedRuns: 5,
        queueLength: 3,
        isRunning: true,
      })),
    };
    (getScheduler as jest.Mock).mockReturnValue(mockScheduler);

    // Mock request/response
    mockRequest = {
      params: { agentId: 'test-agent-123' },
      body: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe('POST /api/agents/:agentId/schedule', () => {
    it('should schedule an agent with valid cron expression', async () => {
      // Arrange
      const mockAgent = {
        id: 'test-agent-123',
        name: 'Test Agent',
        scheduleExpression: '0 */6 * * *',
        scheduleEnabled: true,
        nextRunAt: new Date('2025-06-01T00:00:00Z'),
      };

      mockRequest.body = {
        cronExpression: '0 */6 * * *',
        priority: 'HIGH',
        enabled: true,
      };

      (mockPrismaClient.aIAgent.findUnique as jest.Mock).mockResolvedValue(
        mockAgent,
      );
      mockScheduler.scheduleAgent.mockResolvedValue(undefined);

      // Act
      const handler = scheduleRouter.stack[0].route.stack[3].handle;
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockPrismaClient.aIAgent.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-agent-123' },
      });
      expect(mockScheduler.scheduleAgent).toHaveBeenCalledWith(
        'test-agent-123',
        '0 */6 * * *',
        AgentPriority.HIGH,
        true,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockAgent,
      });
    });

    it('should return 404 if agent not found', async () => {
      // Arrange
      mockRequest.body = {
        cronExpression: '0 */6 * * *',
      };
      (mockPrismaClient.aIAgent.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      // Act
      const handler = scheduleRouter.stack[0].route.stack[3].handle;
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Agent not found',
      });
    });

    it('should use default priority and enabled values', async () => {
      // Arrange
      const mockAgent = { id: 'test-agent-123', name: 'Test Agent' };
      mockRequest.body = {
        cronExpression: '0 */6 * * *',
      };
      (mockPrismaClient.aIAgent.findUnique as jest.Mock).mockResolvedValue(
        mockAgent,
      );

      // Act
      const handler = scheduleRouter.stack[0].route.stack[3].handle;
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockScheduler.scheduleAgent).toHaveBeenCalledWith(
        'test-agent-123',
        '0 */6 * * *',
        AgentPriority.NORMAL,
        true,
      );
    });

    it('should handle scheduler errors', async () => {
      // Arrange
      const mockAgent = { id: 'test-agent-123', name: 'Test Agent' };
      mockRequest.body = {
        cronExpression: '0 */6 * * *',
      };
      (mockPrismaClient.aIAgent.findUnique as jest.Mock).mockResolvedValue(
        mockAgent,
      );
      mockScheduler.scheduleAgent.mockRejectedValue(
        new Error('Scheduler error'),
      );

      // Act
      const handler = scheduleRouter.stack[0].route.stack[3].handle;
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('GET /api/agents/:agentId/schedule', () => {
    it('should get agent schedule info', async () => {
      // Arrange
      const mockAgent = {
        id: 'test-agent-123',
        name: 'Test Agent',
        scheduleExpression: '0 */6 * * *',
        scheduleEnabled: true,
        nextRunAt: new Date('2025-06-01T00:00:00Z'),
        lastRunAt: new Date('2025-05-31T18:00:00Z'),
        status: 'IDLE',
      };
      const mockTaskDetail = {
        agentId: 'test-agent-123',
        nextRun: new Date('2025-06-01T00:00:00Z'),
        lastRun: new Date('2025-05-31T18:00:00Z'),
        runCount: 10,
        isRunning: false,
      };

      (mockPrismaClient.aIAgent.findUnique as jest.Mock).mockResolvedValue(
        mockAgent,
      );
      mockScheduler.getTaskDetails.mockReturnValue([mockTaskDetail]);

      // Act
      const handler = scheduleRouter.stack[1].route.stack[1].handle;
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockPrismaClient.aIAgent.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-agent-123' },
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
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          ...mockAgent,
          taskDetails: mockTaskDetail,
        },
      });
    });

    it('should return 404 if agent not found', async () => {
      // Arrange
      (mockPrismaClient.aIAgent.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      // Act
      const handler = scheduleRouter.stack[1].route.stack[1].handle;
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: 'Agent not found',
      });
    });

    it('should handle no task details', async () => {
      // Arrange
      const mockAgent = {
        id: 'test-agent-123',
        name: 'Test Agent',
        scheduleExpression: null,
        scheduleEnabled: false,
      };
      (mockPrismaClient.aIAgent.findUnique as jest.Mock).mockResolvedValue(
        mockAgent,
      );
      mockScheduler.getTaskDetails.mockReturnValue([]);

      // Act
      const handler = scheduleRouter.stack[1].route.stack[1].handle;
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          ...mockAgent,
          taskDetails: null,
        },
      });
    });
  });

  describe('DELETE /api/agents/:agentId/schedule', () => {
    it('should unschedule an agent', async () => {
      // Arrange
      const updatedAgent = {
        id: 'test-agent-123',
        scheduleEnabled: false,
        scheduleExpression: null,
        nextRunAt: null,
      };
      (mockPrismaClient.aIAgent.update as jest.Mock).mockResolvedValue(
        updatedAgent,
      );

      // Act
      const handler = scheduleRouter.stack[2].route.stack[1].handle;
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockScheduler.unscheduleAgent).toHaveBeenCalledWith(
        'test-agent-123',
      );
      expect(mockPrismaClient.aIAgent.update).toHaveBeenCalledWith({
        where: { id: 'test-agent-123' },
        data: {
          scheduleEnabled: false,
          scheduleExpression: null,
          nextRunAt: null,
        },
      });
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: 'Agent unscheduled successfully',
      });
    });

    it('should handle database errors', async () => {
      // Arrange
      (mockPrismaClient.aIAgent.update as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      // Act
      const handler = scheduleRouter.stack[2].route.stack[1].handle;
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('GET /api/agents/:agentId/schedule/status', () => {
    it('should get scheduler status', async () => {
      // Act
      const handler = scheduleRouter.stack[3].route.stack[1].handle;
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockScheduler.getStats).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: {
          totalScheduled: 5,
          activeAgents: 2,
          totalRuns: 100,
          successfulRuns: 95,
          failedRuns: 5,
          queueLength: 3,
          isRunning: true,
        },
      });
    });

    it('should handle scheduler errors', async () => {
      // Arrange
      mockScheduler.getStats.mockImplementation(() => {
        throw new Error('Scheduler unavailable');
      });

      // Act
      const handler = scheduleRouter.stack[3].route.stack[1].handle;
      await handler(mockRequest as Request, mockResponse as Response, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
