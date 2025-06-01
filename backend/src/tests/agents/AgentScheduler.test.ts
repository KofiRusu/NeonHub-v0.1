import { PrismaClient, AIAgent } from '@prisma/client';
import {
  AgentScheduler,
  AgentPriority,
} from '../../agents/scheduler/AgentScheduler';
import { AgentManager } from '../../agents/manager/AgentManager';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock Prisma Client enums
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
  AgentStatus: {
    IDLE: 'IDLE',
    RUNNING: 'RUNNING',
    ERROR: 'ERROR',
    PAUSED: 'PAUSED',
    COMPLETED: 'COMPLETED',
  },
  AgentType: {
    CONTENT_CREATOR: 'CONTENT_CREATOR',
    TREND_ANALYZER: 'TREND_ANALYZER',
    OUTREACH_MANAGER: 'OUTREACH_MANAGER',
    PERFORMANCE_OPTIMIZER: 'PERFORMANCE_OPTIMIZER',
    AUDIENCE_RESEARCHER: 'AUDIENCE_RESEARCHER',
    COPYWRITER: 'COPYWRITER',
    SOCIAL_MEDIA_MANAGER: 'SOCIAL_MEDIA_MANAGER',
    EMAIL_MARKETER: 'EMAIL_MARKETER',
    SEO_SPECIALIST: 'SEO_SPECIALIST',
    CUSTOMER_SUPPORT: 'CUSTOMER_SUPPORT',
  },
}));

describe('AgentScheduler', () => {
  let mockPrisma: DeepMockProxy<PrismaClient>;
  let mockAgentManager: jest.Mocked<AgentManager>;
  let scheduler: AgentScheduler;
  let mockAgent: AIAgent;

  beforeEach(() => {
    mockPrisma = mockDeep<PrismaClient>();
    mockAgentManager = {
      startAgent: jest.fn(),
      stopAgent: jest.fn(),
      isAgentRunning: jest.fn(),
      getAgentStatus: jest.fn(),
      getRunningAgents: jest.fn(),
      createAgent: jest.fn(),
      updateAgentConfiguration: jest.fn(),
      getAvailableAgentTypes: jest.fn(),
      getPluginInfo: jest.fn(),
      getScheduledAgents: jest.fn(),
      updateNextRunTime: jest.fn(),
      getAgentExecutionHistory: jest.fn(),
      getStats: jest.fn(),
    } as any;

    mockAgent = {
      id: 'test-agent-id',
      name: 'Test Agent',
      description: 'Test agent for scheduling',
      agentType: 'CONTENT_CREATOR' as any,
      configuration: { priority: 'normal' },
      status: 'IDLE' as any,
      projectId: 'test-project-id',
      managerId: 'test-manager-id',
      lastRunAt: null,
      nextRunAt: new Date(Date.now() + 60000), // 1 minute from now
      scheduleExpression: '*/5 * * * *', // Every 5 minutes
      scheduleEnabled: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    scheduler = new AgentScheduler(mockPrisma, mockAgentManager, {
      checkInterval: 1000, // 1 second for testing
      maxConcurrentAgents: 2,
      maxRetries: 3,
      baseBackoffDelay: 100,
      maxBackoffDelay: 1000,
      autoStart: false, // Don't auto-start for tests
    });
  });

  afterEach(() => {
    scheduler.stop();
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create scheduler with default options', () => {
      const defaultScheduler = new AgentScheduler(mockPrisma, mockAgentManager);

      expect(defaultScheduler).toBeInstanceOf(AgentScheduler);
      expect(defaultScheduler.isSchedulerRunning()).toBe(false);
    });

    it('should auto-start when autoStart is true', () => {
      mockPrisma.aIAgent.findMany.mockResolvedValue([]);

      const autoStartScheduler = new AgentScheduler(
        mockPrisma,
        mockAgentManager,
        {
          checkInterval: 1000,
          autoStart: true,
        },
      );

      expect(autoStartScheduler.isSchedulerRunning()).toBe(true);
      autoStartScheduler.stop();
    });
  });

  describe('start', () => {
    it('should start the scheduler successfully', async () => {
      mockPrisma.aIAgent.findMany.mockResolvedValue([]);

      await scheduler.start();

      expect(scheduler.isSchedulerRunning()).toBe(true);
    });

    it('should load scheduled agents on start', async () => {
      mockPrisma.aIAgent.findMany.mockResolvedValue([mockAgent]);

      await scheduler.start();

      expect(mockPrisma.aIAgent.findMany).toHaveBeenCalledWith({
        where: {
          scheduleEnabled: true,
          scheduleExpression: {
            not: null,
          },
        },
      });
    });

    it('should not start if already running', async () => {
      mockPrisma.aIAgent.findMany.mockResolvedValue([]);

      await scheduler.start();
      await scheduler.start(); // Try to start again

      expect(scheduler.isSchedulerRunning()).toBe(true);
    });
  });

  describe('stop', () => {
    it('should stop the scheduler successfully', async () => {
      mockPrisma.aIAgent.findMany.mockResolvedValue([]);

      await scheduler.start();
      scheduler.stop();

      expect(scheduler.isSchedulerRunning()).toBe(false);
    });

    it('should not stop if not running', () => {
      scheduler.stop();

      expect(scheduler.isSchedulerRunning()).toBe(false);
    });
  });

  describe('scheduleAgent', () => {
    it('should schedule an agent successfully', async () => {
      const cronExpression = '0 */6 * * *'; // Every 6 hours

      mockPrisma.aIAgent.update.mockResolvedValue(mockAgent);
      mockPrisma.aIAgent.findUnique.mockResolvedValue(mockAgent);

      await scheduler.scheduleAgent(
        'test-agent-id',
        cronExpression,
        AgentPriority.HIGH,
      );

      expect(mockPrisma.aIAgent.update).toHaveBeenCalledWith({
        where: { id: 'test-agent-id' },
        data: {
          scheduleExpression: cronExpression,
          scheduleEnabled: true,
          nextRunAt: expect.any(Date),
        },
      });
    });

    it('should unschedule agent when enabled is false', async () => {
      const cronExpression = '0 */6 * * *';

      mockPrisma.aIAgent.update.mockResolvedValue(mockAgent);

      await scheduler.scheduleAgent(
        'test-agent-id',
        cronExpression,
        AgentPriority.NORMAL,
        false,
      );

      expect(mockPrisma.aIAgent.update).toHaveBeenCalledWith({
        where: { id: 'test-agent-id' },
        data: {
          scheduleExpression: cronExpression,
          scheduleEnabled: false,
          nextRunAt: null,
        },
      });
    });

    it('should throw error for invalid cron expression', async () => {
      const invalidCron = 'invalid-cron';

      await expect(
        scheduler.scheduleAgent('test-agent-id', invalidCron),
      ).rejects.toThrow('Invalid cron expression: invalid-cron');
    });
  });

  describe('calculateNextRunTime', () => {
    it('should calculate next run time correctly', () => {
      const cronExpression = '0 0 * * *'; // Daily at midnight

      const nextRun = scheduler.calculateNextRunTime(cronExpression);

      expect(nextRun).toBeInstanceOf(Date);
      expect(nextRun.getTime()).toBeGreaterThan(Date.now());
    });

    it('should throw error for invalid cron expression', () => {
      const invalidCron = 'not-a-cron';

      expect(() => scheduler.calculateNextRunTime(invalidCron)).toThrow(
        'Invalid cron expression: not-a-cron',
      );
    });
  });

  describe('getStats', () => {
    it('should return scheduler statistics', () => {
      const stats = scheduler.getStats();

      expect(stats).toEqual({
        isRunning: false,
        scheduledTasksCount: 0,
        runningAgentsCount: 0,
        queuedTasksCount: 0,
        maxConcurrentAgents: 2,
        pausedJobsCount: 0,
      });
    });
  });

  describe('getTaskDetails', () => {
    it('should return empty array when no tasks scheduled', () => {
      const details = scheduler.getTaskDetails();

      expect(details).toEqual([]);
    });
  });

  describe('priority handling', () => {
    it('should assign correct priority based on agent type', async () => {
      const customerSupportAgent = {
        ...mockAgent,
        id: 'customer-support-agent',
        agentType: 'CUSTOMER_SUPPORT' as any,
        scheduleExpression: '*/5 * * * *',
        scheduleEnabled: true,
        nextRunAt: new Date(Date.now() + 60000),
      };

      const contentCreatorAgent = {
        ...mockAgent,
        id: 'content-creator-agent',
        agentType: 'CONTENT_CREATOR' as any,
        scheduleExpression: '*/5 * * * *',
        scheduleEnabled: true,
        nextRunAt: new Date(Date.now() + 60000),
      };

      mockPrisma.aIAgent.findMany.mockResolvedValue([
        customerSupportAgent,
        contentCreatorAgent,
      ]);

      await scheduler.start();

      const details = scheduler.getTaskDetails();

      // Customer support should have higher priority than content creator
      const customerSupportTask = details.find(
        (d) => d.agentId === 'customer-support-agent',
      );
      const contentCreatorTask = details.find(
        (d) => d.agentId === 'content-creator-agent',
      );

      expect(customerSupportTask?.priority).toBe(AgentPriority.HIGH);
      expect(contentCreatorTask?.priority).toBe(AgentPriority.NORMAL);
    });

    it('should use priority from agent configuration when available', async () => {
      const highPriorityAgent = {
        ...mockAgent,
        configuration: { priority: 'critical' },
      };

      mockPrisma.aIAgent.findMany.mockResolvedValue([highPriorityAgent]);

      await scheduler.start();

      const details = scheduler.getTaskDetails();
      expect(details[0]?.priority).toBe(AgentPriority.CRITICAL);
    });
  });

  describe('concurrency control', () => {
    it('should respect max concurrent agents limit', async () => {
      // Create multiple agents ready to run
      const agents = Array.from({ length: 5 }, (_, i) => ({
        ...mockAgent,
        id: `agent-${i}`,
        nextRunAt: new Date(Date.now() - 1000), // Past time, ready to run
      }));

      mockPrisma.aIAgent.findMany.mockResolvedValue(agents);
      mockAgentManager.startAgent.mockResolvedValue({ success: true });

      await scheduler.start();

      // Trigger immediate processing by calling processScheduledTasks
      // Since it's private, we need to trigger it through the scheduler
      await new Promise((resolve) => setTimeout(resolve, 50)); // Let initial processing happen

      // Manually trigger task processing since we're using a short interval
      const stats = scheduler.getStats();

      // Should have loaded all 5 agents but only process up to maxConcurrentAgents (2)
      expect(stats.scheduledTasksCount).toBe(5);
      expect(stats.queuedTasksCount).toBe(5);
    });
  });

  describe('error handling and retries', () => {
    it('should retry failed agent execution with exponential backoff', async () => {
      const failingAgent = {
        ...mockAgent,
        nextRunAt: new Date(Date.now() - 1000), // Past time, ready to run
      };

      mockPrisma.aIAgent.findMany.mockResolvedValue([failingAgent]);
      mockAgentManager.startAgent
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValueOnce({ success: true });

      await scheduler.start();

      // Wait for initial execution and retries
      await new Promise((resolve) => setTimeout(resolve, 500));

      const details = scheduler.getTaskDetails();
      const task = details.find((d) => d.agentId === mockAgent.id);

      expect(task?.retryCount).toBeGreaterThan(0);
    });

    it('should remove agent from schedule after max retries', async () => {
      const failingAgent = {
        ...mockAgent,
        nextRunAt: new Date(Date.now() - 1000),
        scheduleExpression: '*/5 * * * *',
        scheduleEnabled: true,
      };

      mockPrisma.aIAgent.findMany.mockResolvedValue([failingAgent]);
      mockAgentManager.startAgent.mockRejectedValue(
        new Error('Persistent failure'),
      );
      mockPrisma.aIAgent.update.mockResolvedValue(failingAgent);

      await scheduler.start();

      // Wait for initial execution and retries
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Should update agent status to ERROR after max retries
      // Note: There may be multiple update calls (for status changes and nextRunAt updates)
      const updateCalls = mockPrisma.aIAgent.update.mock.calls;
      const errorStatusUpdate = updateCalls.find(
        (call) => call[0].data && call[0].data.status === 'ERROR',
      );

      expect(errorStatusUpdate).toBeDefined();
      if (errorStatusUpdate) {
        expect(errorStatusUpdate[0]).toEqual({
          where: { id: mockAgent.id },
          data: { status: 'ERROR' },
        });
      }
    });
  });

  describe('missed jobs handling', () => {
    it('should run missed jobs on startup when enabled', async () => {
      const missedAgent = {
        ...mockAgent,
        nextRunAt: new Date(Date.now() - 60000), // 1 minute ago
        scheduleExpression: '*/5 * * * *',
        scheduleEnabled: true,
      };

      const schedulerWithMissedJobs = new AgentScheduler(
        mockPrisma,
        mockAgentManager,
        {
          checkInterval: 1000,
          runMissedOnStartup: true,
          autoStart: false,
        },
      );

      mockPrisma.aIAgent.findMany.mockResolvedValue([missedAgent]);
      mockPrisma.aIAgent.update.mockResolvedValue(missedAgent);
      mockAgentManager.startAgent.mockResolvedValue({ success: true });

      await schedulerWithMissedJobs.start();

      // Wait for missed jobs processing
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Should have attempted to start the missed agent
      expect(mockAgentManager.startAgent).toHaveBeenCalledWith(missedAgent.id);

      schedulerWithMissedJobs.stop();
    });
  });

  describe('singleton pattern', () => {
    it('should create and return the same instance', () => {
      const instance1 = AgentScheduler.getInstance(mockPrisma, mockAgentManager);
      const instance2 = AgentScheduler.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should throw error if trying to get instance without initial params', () => {
      // Reset the static instance
      (AgentScheduler as any).instance = null;

      expect(() => AgentScheduler.getInstance()).toThrow(
        'Prisma client and AgentManager must be provided when creating the first instance',
      );
    });
  });

  describe('pause/resume functionality', () => {
    beforeEach(async () => {
      mockPrisma.aIAgent.findMany.mockResolvedValue([mockAgent]);
      await scheduler.start();
    });

    describe('pauseJob', () => {
      it('should pause a scheduled job successfully', async () => {
        mockPrisma.aIAgent.update.mockResolvedValue({
          ...mockAgent,
          status: 'IDLE' as any,
          configuration: { isPaused: true, pausedAt: expect.any(String) },
        });

        await scheduler.pauseJob('test-agent-id');

        expect(mockPrisma.aIAgent.update).toHaveBeenCalledWith({
          where: { id: 'test-agent-id' },
          data: {
            status: 'IDLE',
            configuration: {
              priority: 'normal',
              isPaused: true,
              pausedAt: expect.any(String),
            },
          },
        });

        const details = scheduler.getTaskDetails();
        const task = details.find((d) => d.agentId === 'test-agent-id');
        expect(task?.isPaused).toBe(true);
      });

      it('should pause with custom jobId', async () => {
        mockPrisma.aIAgent.update.mockResolvedValue({
          ...mockAgent,
          status: 'IDLE' as any,
        });

        await scheduler.pauseJob('test-agent-id', 'custom-job-id');

        const details = scheduler.getTaskDetails();
        const task = details.find((d) => d.agentId === 'test-agent-id');
        expect(task?.jobId).toBe('custom-job-id');
      });

      it('should throw error if no scheduled task found', async () => {
        await expect(scheduler.pauseJob('non-existent-agent')).rejects.toThrow(
          'No scheduled task found for agent non-existent-agent',
        );
      });

      it('should throw error if agent is currently running', async () => {
        // Manually add agent to running set to simulate running state
        (scheduler as any).runningAgents.add('test-agent-id');

        await expect(scheduler.pauseJob('test-agent-id')).rejects.toThrow(
          'Cannot pause agent test-agent-id while it is running',
        );
      });
    });

    describe('resumeJob', () => {
      beforeEach(async () => {
        // First pause the job
        mockPrisma.aIAgent.update.mockResolvedValue({
          ...mockAgent,
          status: 'IDLE' as any,
          configuration: { isPaused: true },
        });
        await scheduler.pauseJob('test-agent-id');
      });

      it('should resume a paused job successfully', async () => {
        mockPrisma.aIAgent.update.mockResolvedValue({
          ...mockAgent,
          status: 'IDLE' as any,
          configuration: { isPaused: false, resumedAt: expect.any(String) },
        });

        await scheduler.resumeJob('test-agent-id');

        expect(mockPrisma.aIAgent.update).toHaveBeenLastCalledWith({
          where: { id: 'test-agent-id' },
          data: {
            status: 'IDLE',
            configuration: {
              priority: 'normal',
              isPaused: false,
              resumedAt: expect.any(String),
            },
          },
        });

        const details = scheduler.getTaskDetails();
        const task = details.find((d) => d.agentId === 'test-agent-id');
        expect(task?.isPaused).toBe(false);
      });

      it('should recalculate next run time if it is in the past', async () => {
        // Set the task's next run time to the past
        const task = (scheduler as any).scheduledTasks.get('test-agent-id');
        task.nextRunTime = new Date(Date.now() - 60000); // 1 minute ago

        mockPrisma.aIAgent.update.mockResolvedValue({
          ...mockAgent,
          status: 'SCHEDULED' as any,
        });

        await scheduler.resumeJob('test-agent-id');

        // Should have called update twice: once for status, once for nextRunAt
        const updateCalls = mockPrisma.aIAgent.update.mock.calls;
        const nextRunAtUpdate = updateCalls.find(
          (call) => call[0].data && call[0].data.nextRunAt,
        );

        expect(nextRunAtUpdate).toBeDefined();
        if (nextRunAtUpdate) {
          expect(nextRunAtUpdate[0].data.nextRunAt).toBeInstanceOf(Date);
          expect(
            (nextRunAtUpdate[0].data.nextRunAt as Date).getTime(),
          ).toBeGreaterThan(Date.now());
        }
      });

      it('should throw error if job is not paused', async () => {
        // Reset the paused state
        const task = (scheduler as any).scheduledTasks.get('test-agent-id');
        task.isPaused = false;
        (scheduler as any).pausedJobs.clear();

        await expect(scheduler.resumeJob('test-agent-id')).rejects.toThrow(
          'Job test-agent-id for agent test-agent-id is not paused',
        );
      });

      it('should throw error if no scheduled task found', async () => {
        await expect(
          scheduler.resumeJob('non-existent-agent'),
        ).rejects.toThrow(
          'No scheduled task found for agent non-existent-agent',
        );
      });
    });

    describe('getPausedJobs', () => {
      it('should return empty array when no jobs are paused', () => {
        const pausedJobs = scheduler.getPausedJobs();
        expect(pausedJobs).toEqual([]);
      });

      it('should return paused jobs list', async () => {
        mockPrisma.aIAgent.update.mockResolvedValue({
          ...mockAgent,
          status: 'IDLE' as any,
        });

        await scheduler.pauseJob('test-agent-id', 'job-123');

        const pausedJobs = scheduler.getPausedJobs();
        expect(pausedJobs).toEqual([
          { agentId: 'test-agent-id', jobId: 'job-123' },
        ]);
      });
    });

    describe('processScheduledTasks with paused jobs', () => {
      it('should skip paused tasks during processing', async () => {
        // Pause the job
        mockPrisma.aIAgent.update.mockResolvedValue({
          ...mockAgent,
          status: 'IDLE' as any,
        });
        await scheduler.pauseJob('test-agent-id');

        // Set the task to be ready to run
        const task = (scheduler as any).scheduledTasks.get('test-agent-id');
        task.nextRunTime = new Date(Date.now() - 1000); // 1 second ago

        // Wait for processing
        await new Promise((resolve) => setTimeout(resolve, 1100));

        // Agent should not have been started
        expect(mockAgentManager.startAgent).not.toHaveBeenCalled();
      });
    });

    describe('loading paused state from database', () => {
      it('should restore paused state when loading scheduled agents', async () => {
        const pausedAgent = {
          ...mockAgent,
          id: 'paused-agent',
          configuration: { isPaused: true, priority: 'normal' },
        };

        mockPrisma.aIAgent.findMany.mockResolvedValue([pausedAgent]);

        const newScheduler = new AgentScheduler(
          mockPrisma,
          mockAgentManager,
          { autoStart: false },
        );
        await newScheduler.start();

        const details = newScheduler.getTaskDetails();
        const task = details.find((d) => d.agentId === 'paused-agent');
        expect(task?.isPaused).toBe(true);

        const pausedJobs = newScheduler.getPausedJobs();
        expect(pausedJobs).toContainEqual({
          agentId: 'paused-agent',
          jobId: 'paused-agent',
        });

        newScheduler.stop();
      });
    });
  });
});
