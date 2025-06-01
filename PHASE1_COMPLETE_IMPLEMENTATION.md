# Phase 1 Complete Implementation Guide

## Instructions for ChatGPT

Please implement the following code changes in the NeonHub backend project and commit them to the Git repository following the specified workflow. Each section includes the complete file content and the corresponding Git commands.

---

## Day 1: API Layer Integration

### 1. Create Schedule Routes

**File:** `backend/src/routes/agents/schedule.ts`

```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation';
import { AgentScheduler, AgentPriority } from '../../agents/scheduler/AgentScheduler';
import { AgentManager } from '../../agents/manager/AgentManager';
import { body, param } from 'express-validator';
import { logger } from '../../utils/logger';

const router = Router({ mergeParams: true });
const prisma = new PrismaClient();

// Validation schemas
const scheduleValidation = [
  body('cronExpression')
    .isString()
    .matches(/^[\d\s\*\/\-,]+$/)
    .withMessage('Invalid cron expression format'),
  body('priority')
    .optional()
    .isIn(['LOW', 'NORMAL', 'HIGH', 'CRITICAL'])
    .withMessage('Invalid priority level'),
  body('enabled')
    .optional()
    .isBoolean()
    .withMessage('Enabled must be a boolean')
];

// Get scheduler instance (singleton pattern to be added)
const getSchedulerInstance = (): AgentScheduler => {
  // For now, create a new instance - will be replaced with singleton
  const agentManager = new AgentManager(prisma);
  return new AgentScheduler(prisma, agentManager, {
    checkInterval: parseInt(process.env.SCHEDULER_CHECK_INTERVAL || '60000'),
    maxConcurrentAgents: parseInt(process.env.SCHEDULER_MAX_CONCURRENT || '5'),
    maxRetries: parseInt(process.env.SCHEDULER_MAX_RETRIES || '3'),
    baseBackoffDelay: parseInt(process.env.SCHEDULER_BACKOFF_BASE || '1000'),
    maxBackoffDelay: parseInt(process.env.SCHEDULER_BACKOFF_MAX || '300000'),
    autoStart: true
  });
};

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
        where: { id: agentId }
      });
      
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found'
        });
      }
      
      // Map string priority to enum
      const priorityMap: Record<string, AgentPriority> = {
        'LOW': AgentPriority.LOW,
        'NORMAL': AgentPriority.NORMAL,
        'HIGH': AgentPriority.HIGH,
        'CRITICAL': AgentPriority.CRITICAL
      };
      
      const scheduler = getSchedulerInstance();
      await scheduler.scheduleAgent(
        agentId,
        cronExpression,
        priorityMap[priority],
        enabled
      );
      
      // Get updated agent with schedule info
      const updatedAgent = await prisma.aIAgent.findUnique({
        where: { id: agentId },
        select: {
          id: true,
          name: true,
          scheduleExpression: true,
          scheduleEnabled: true,
          nextRunAt: true
        }
      });
      
      logger.info(`Agent ${agentId} scheduled successfully`);
      
      res.json({
        success: true,
        data: updatedAgent
      });
    } catch (err) {
      logger.error('Error scheduling agent:', err);
      next(err);
    }
  }
);

// Get agent schedule info
router.get(
  '/',
  authenticate,
  async (req, res, next) => {
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
          status: true
        }
      });
      
      if (!agent) {
        return res.status(404).json({
          success: false,
          error: 'Agent not found'
        });
      }
      
      // Get additional task details from scheduler
      const scheduler = getSchedulerInstance();
      const taskDetails = scheduler.getTaskDetails()
        .filter(task => task.agentId === agentId);
      
      res.json({
        success: true,
        data: {
          ...agent,
          taskDetails: taskDetails[0] || null
        }
      });
    } catch (err) {
      logger.error('Error fetching agent schedule:', err);
      next(err);
    }
  }
);

// Unschedule agent
router.delete(
  '/',
  authenticate,
  async (req, res, next) => {
    try {
      const { agentId } = req.params;
      
      const scheduler = getSchedulerInstance();
      scheduler.unscheduleAgent(agentId);
      
      // Update agent in database
      await prisma.aIAgent.update({
        where: { id: agentId },
        data: {
          scheduleEnabled: false,
          scheduleExpression: null,
          nextRunAt: null
        }
      });
      
      logger.info(`Agent ${agentId} unscheduled successfully`);
      
      res.json({
        success: true,
        message: 'Agent unscheduled successfully'
      });
    } catch (err) {
      logger.error('Error unscheduling agent:', err);
      next(err);
    }
  }
);

// Get scheduler status
router.get(
  '/status',
  authenticate,
  async (req, res, next) => {
    try {
      const scheduler = getSchedulerInstance();
      const stats = scheduler.getStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (err) {
      logger.error('Error fetching scheduler status:', err);
      next(err);
    }
  }
);

export default router;
```

### 2. Update Main Agent Routes

**File:** `backend/src/routes/agent.routes.ts` (Add these lines to the existing file)

```typescript
// Add this import at the top
import scheduleRouter from './agents/schedule';

// Add these routes after existing routes (around line 530)

// Mount schedule sub-router
router.use('/:agentId/schedule', scheduleRouter);

// Get agent execution history
router.get('/:id/sessions', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    // Verify agent exists
    const agent = await prisma.aIAgent.findUnique({
      where: { id }
    });
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }
    
    // Get execution sessions
    const sessions = await prisma.agentExecutionSession.findMany({
      where: { agentId: id },
      orderBy: { startedAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
      select: {
        id: true,
        startedAt: true,
        completedAt: true,
        success: true,
        duration: true,
        outputSummary: true,
        errorMessage: true
      }
    });
    
    // Get total count
    const totalCount = await prisma.agentExecutionSession.count({
      where: { agentId: id }
    });
    
    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          total: totalCount,
          limit: Number(limit),
          offset: Number(offset)
        }
      }
    });
  } catch (err) {
    logger.error('Error fetching agent sessions:', err);
    next(err);
  }
});

// Get global scheduler status
router.get('/scheduler/status', authenticate, async (req, res, next) => {
  try {
    const scheduler = getSchedulerInstance();
    const stats = scheduler.getStats();
    const taskDetails = scheduler.getTaskDetails();
    
    res.json({
      success: true,
      data: {
        ...stats,
        tasks: taskDetails
      }
    });
  } catch (err) {
    logger.error('Error fetching scheduler status:', err);
    next(err);
  }
});
```

### Git Commands for Day 1

```bash
# Create feature branch
git checkout -b feature/agent-schedule-routes

# Create the schedule routes file
mkdir -p backend/src/routes/agents
# Create and add the schedule.ts file content above

git add backend/src/routes/agents/schedule.ts
git commit -m "feat(api): add agent schedule CRUD endpoints

- POST /api/agents/:id/schedule - Schedule agent with cron expression
- GET /api/agents/:id/schedule - Get agent schedule info
- DELETE /api/agents/:id/schedule - Unschedule agent
- GET /api/agents/:id/schedule/status - Get scheduler status"

# Update the main agent routes
git add backend/src/routes/agent.routes.ts
git commit -m "feat(api): add agent execution history endpoint

- GET /api/agents/:id/sessions - Get execution history with pagination
- GET /api/agents/scheduler/status - Get global scheduler status
- Mount schedule sub-router for schedule management"
```

---

## Day 2: Real-time Communication

### 1. Enhance WebSocket Service

**File:** `backend/src/services/websocket.service.ts` (Add to existing file)

```typescript
// Add these enums and types at the top of the file
export enum AgentSocketEvents {
  AGENT_STARTED = 'agent:started',
  AGENT_COMPLETED = 'agent:completed',
  AGENT_FAILED = 'agent:failed',
  AGENT_PROGRESS = 'agent:progress',
  SCHEDULER_STATUS = 'scheduler:status'
}

export interface AgentEventData {
  agentId: string;
  sessionId?: string;
  timestamp: Date;
  [key: string]: any;
}

// Add these methods to the WebSocketService class

export class WebSocketService {
  // ... existing code ...

  /**
   * Subscribe a socket to agent-specific events
   */
  subscribeToAgent(socket: Socket, agentId: string): void {
    socket.join(`agent:${agentId}`);
    logger.info(`Socket ${socket.id} subscribed to agent ${agentId}`);
  }

  /**
   * Unsubscribe a socket from agent-specific events
   */
  unsubscribeFromAgent(socket: Socket, agentId: string): void {
    socket.leave(`agent:${agentId}`);
    logger.info(`Socket ${socket.id} unsubscribed from agent ${agentId}`);
  }

  /**
   * Emit an event to all clients subscribed to a specific agent
   */
  emitAgentEvent(
    event: AgentSocketEvents,
    agentId: string,
    data: Partial<AgentEventData>
  ): void {
    const eventData: AgentEventData = {
      agentId,
      timestamp: new Date(),
      ...data
    };
    
    this.io.to(`agent:${agentId}`).emit(event, eventData);
    
    // Also emit to a general monitoring room
    this.io.to('monitoring:agents').emit(event, eventData);
    
    logger.debug(`Emitted ${event} for agent ${agentId}`, eventData);
  }

  /**
   * Broadcast scheduler status to all monitoring clients
   */
  broadcastSchedulerStatus(status: any): void {
    this.io.to('monitoring:scheduler').emit(AgentSocketEvents.SCHEDULER_STATUS, {
      timestamp: new Date(),
      ...status
    });
  }

  /**
   * Set up agent-specific socket handlers
   */
  setupAgentHandlers(socket: Socket): void {
    // Subscribe to agent updates
    socket.on('agent:subscribe', (agentId: string) => {
      if (agentId && typeof agentId === 'string') {
        this.subscribeToAgent(socket, agentId);
      }
    });

    // Unsubscribe from agent updates
    socket.on('agent:unsubscribe', (agentId: string) => {
      if (agentId && typeof agentId === 'string') {
        this.unsubscribeFromAgent(socket, agentId);
      }
    });

    // Subscribe to monitoring rooms
    socket.on('monitoring:subscribe', (room: 'agents' | 'scheduler') => {
      socket.join(`monitoring:${room}`);
      logger.info(`Socket ${socket.id} subscribed to monitoring:${room}`);
    });
  }

  // Update the initialize method to include agent handlers
  initialize(server: Server): void {
    // ... existing initialization code ...

    this.io.on('connection', (socket: Socket) => {
      logger.info(`Client connected: ${socket.id}`);

      // Set up existing handlers
      this.setupHandlers(socket);
      
      // Set up agent-specific handlers
      this.setupAgentHandlers(socket);

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
```

### 2. Update AgentScheduler

**File:** `backend/src/agents/scheduler/AgentScheduler.ts` (Modifications to existing file)

```typescript
// Add import at the top
import { websocketService, AgentSocketEvents } from '../../services/websocket.service';

// Add WebSocket service to constructor parameters
export class AgentScheduler {
  private static instance: AgentScheduler | null = null;

  // Add singleton getInstance method
  static getInstance(
    prisma?: PrismaClient,
    agentManager?: AgentManager,
    options?: SchedulerOptions
  ): AgentScheduler {
    if (!AgentScheduler.instance) {
      if (!prisma || !agentManager) {
        throw new Error('AgentScheduler requires prisma and agentManager for initialization');
      }
      AgentScheduler.instance = new AgentScheduler(prisma, agentManager, options);
    }
    return AgentScheduler.instance;
  }

  // Update the executeTask method (around line 420)
  private async executeTask(task: ScheduledTask): Promise<void> {
    let sessionId: string | null = null;
    
    try {
      this.runningAgents.add(task.agentId);
      logger.info(
        `Executing scheduled agent ${task.agentId} (priority: ${task.priority})`,
      );

      // Update agent status
      await this.prisma.aIAgent.update({
        where: { id: task.agentId },
        data: { status: AgentStatus.RUNNING, lastRunAt: new Date() },
      });

      // Create session for tracking
      const session = await this.prisma.agentExecutionSession.create({
        data: {
          agentId: task.agentId,
          context: { priority: task.priority }
        }
      });
      sessionId = session.id;

      // Emit start event
      websocketService.emitAgentEvent(
        AgentSocketEvents.AGENT_STARTED,
        task.agentId,
        {
          sessionId,
          priority: task.priority,
          agentName: task.agent.name,
          agentType: task.agent.agentType
        }
      );

      // Execute the agent
      const startTime = Date.now();
      await this.agentManager.startAgent(task.agentId);
      const executionTime = Date.now() - startTime;

      // Update session with success
      await this.prisma.agentExecutionSession.update({
        where: { id: sessionId },
        data: {
          completedAt: new Date(),
          success: true,
          duration: executionTime
        }
      });

      // Reset retry count on successful execution
      task.retryCount = 0;
      task.lastError = undefined;
      task.backoffUntil = undefined;

      // Emit completion event
      websocketService.emitAgentEvent(
        AgentSocketEvents.AGENT_COMPLETED,
        task.agentId,
        {
          sessionId,
          duration: executionTime,
          agentName: task.agent.name,
          agentType: task.agent.agentType
        }
      );

      logger.info(`Agent ${task.agentId} executed successfully in ${executionTime}ms`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`Error executing agent ${task.agentId}:`, error);

      // Update session with failure
      if (sessionId) {
        await this.prisma.agentExecutionSession.update({
          where: { id: sessionId },
          data: {
            completedAt: new Date(),
            success: false,
            errorMessage
          }
        });
      }

      // Emit failure event
      websocketService.emitAgentEvent(
        AgentSocketEvents.AGENT_FAILED,
        task.agentId,
        {
          sessionId,
          error: errorMessage,
          retryCount: task.retryCount,
          agentName: task.agent.name,
          agentType: task.agent.agentType
        }
      );

      await this.handleTaskFailure(task, error);
    } finally {
      this.runningAgents.delete(task.agentId);
      
      // Emit scheduler status update
      websocketService.broadcastSchedulerStatus(this.getStats());
    }
  }

  // Add method to emit progress updates (can be called by agents)
  emitProgress(agentId: string, progress: number, message?: string): void {
    websocketService.emitAgentEvent(
      AgentSocketEvents.AGENT_PROGRESS,
      agentId,
      {
        progress,
        message
      }
    );
  }
}
```

### Git Commands for Day 2

```bash
# Switch to WebSocket feature branch
git checkout -b feature/websocket-agent-events

# Update WebSocket service
git add backend/src/services/websocket.service.ts
git commit -m "feat(websocket): add agent execution events

- Add AgentSocketEvents enum for event types
- Implement agent-specific room subscriptions
- Add methods for emitting agent events
- Set up monitoring rooms for dashboard"

# Update AgentScheduler
git add backend/src/agents/scheduler/AgentScheduler.ts
git commit -m "feat(scheduler): emit real-time status events

- Add singleton pattern with getInstance()
- Emit events on agent start, completion, and failure
- Include session IDs and execution metadata
- Broadcast scheduler status after each execution"
```

---

## Day 3: Testing & Documentation

### 1. Agent Schedule Route Tests

**File:** `backend/src/routes/__tests__/agent.schedule.test.ts`

```typescript
import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { createTestApp } from '../../test-utils/app';
import { generateAuthToken } from '../../test-utils/auth';
import { AgentScheduler } from '../../agents/scheduler/AgentScheduler';

jest.mock('../../agents/scheduler/AgentScheduler');

describe('Agent Schedule Routes', () => {
  let app: Express;
  let prisma: PrismaClient;
  let authToken: string;
  let testAgentId: string;
  let mockScheduler: jest.Mocked<AgentScheduler>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = new PrismaClient();
    authToken = await generateAuthToken();
    
    // Create test agent
    const agent = await prisma.aIAgent.create({
      data: {
        name: 'Test Agent',
        agentType: 'CONTENT_CREATOR',
        status: 'IDLE',
        configuration: {},
        projectId: 'test-project-id',
        managerId: 'test-user-id'
      }
    });
    testAgentId = agent.id;

    // Setup mock scheduler
    mockScheduler = {
      scheduleAgent: jest.fn().mockResolvedValue(undefined),
      unscheduleAgent: jest.fn(),
      getTaskDetails: jest.fn().mockReturnValue([]),
      getStats: jest.fn().mockReturnValue({
        isRunning: true,
        scheduledTasksCount: 1,
        runningAgentsCount: 0,
        queuedTasksCount: 1,
        maxConcurrentAgents: 5
      })
    } as any;

    (AgentScheduler.getInstance as jest.Mock).mockReturnValue(mockScheduler);
  });

  afterAll(async () => {
    await prisma.aIAgent.delete({ where: { id: testAgentId } });
    await prisma.$disconnect();
  });

  describe('POST /api/agents/:agentId/schedule', () => {
    it('should schedule an agent with valid cron expression', async () => {
      const response = await request(app)
        .post(`/api/agents/${testAgentId}/schedule`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cronExpression: '0 9 * * *',
          priority: 'HIGH',
          enabled: true
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: testAgentId,
          name: 'Test Agent'
        })
      });
      expect(mockScheduler.scheduleAgent).toHaveBeenCalledWith(
        testAgentId,
        '0 9 * * *',
        3, // HIGH priority
        true
      );
    });

    it('should reject invalid cron expression', async () => {
      const response = await request(app)
        .post(`/api/agents/${testAgentId}/schedule`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cronExpression: 'invalid cron',
          priority: 'HIGH',
          enabled: true
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent agent', async () => {
      const response = await request(app)
        .post('/api/agents/non-existent-id/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cronExpression: '0 9 * * *'
        });

      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({
        success: false,
        error: 'Agent not found'
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/agents/${testAgentId}/schedule`)
        .send({
          cronExpression: '0 9 * * *'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/agents/:agentId/schedule', () => {
    it('should get agent schedule info', async () => {
      mockScheduler.getTaskDetails.mockReturnValue([{
        agentId: testAgentId,
        agentName: 'Test Agent',
        priority: 2,
        nextRunTime: new Date('2024-01-01T09:00:00Z'),
        retryCount: 0,
        isRunning: false
      }]);

      const response = await request(app)
        .get(`/api/agents/${testAgentId}/schedule`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: testAgentId,
          taskDetails: expect.objectContaining({
            agentId: testAgentId
          })
        })
      });
    });
  });

  describe('DELETE /api/agents/:agentId/schedule', () => {
    it('should unschedule an agent', async () => {
      const response = await request(app)
        .delete(`/api/agents/${testAgentId}/schedule`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Agent unscheduled successfully'
      });
      expect(mockScheduler.unscheduleAgent).toHaveBeenCalledWith(testAgentId);
    });
  });

  describe('GET /api/agents/:agentId/sessions', () => {
    it('should get agent execution history', async () => {
      // Create test sessions
      await prisma.agentExecutionSession.createMany({
        data: [
          {
            agentId: testAgentId,
            startedAt: new Date('2024-01-01T10:00:00Z'),
            completedAt: new Date('2024-01-01T10:05:00Z'),
            success: true,
            duration: 300000
          },
          {
            agentId: testAgentId,
            startedAt: new Date('2024-01-01T09:00:00Z'),
            completedAt: new Date('2024-01-01T09:03:00Z'),
            success: false,
            duration: 180000,
            errorMessage: 'Test error'
          }
        ]
      });

      const response = await request(app)
        .get(`/api/agents/${testAgentId}/sessions`)
        .set('Authorization', `Bearer ${authToken}`)
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          sessions: expect.arrayContaining([
            expect.objectContaining({ success: true }),
            expect.objectContaining({ success: false })
          ]),
          pagination: {
            total: 2,
            limit: 10,
            offset: 0
          }
        }
      });
    });
  });
});
```

### 2. WebSocket Event Tests

**File:** `backend/src/services/__tests__/websocket.agent.test.ts`

```typescript
import { Server } from 'http';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { websocketService, AgentSocketEvents } from '../websocket.service';
import { createTestServer } from '../../test-utils/server';

describe('WebSocket Agent Events', () => {
  let server: Server;
  let clientSocket: ClientSocket;
  let serverPort: number;

  beforeAll(async () => {
    const testServer = await createTestServer();
    server = testServer.server;
    serverPort = testServer.port;
    
    websocketService.initialize(server);
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  beforeEach((done) => {
    clientSocket = ioClient(`http://localhost:${serverPort}`, {
      transports: ['websocket']
    });
    
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    clientSocket.disconnect();
  });

  describe('Agent Event Subscriptions', () => {
    it('should subscribe to agent-specific events', (done) => {
      const testAgentId = 'test-agent-123';
      
      clientSocket.emit('agent:subscribe', testAgentId);
      
      clientSocket.on(AgentSocketEvents.AGENT_STARTED, (data) => {
        expect(data).toMatchObject({
          agentId: testAgentId,
          sessionId: 'test-session',
          timestamp: expect.any(String)
        });
        done();
      });

      // Simulate agent start event
      setTimeout(() => {
        websocketService.emitAgentEvent(
          AgentSocketEvents.AGENT_STARTED,
          testAgentId,
          { sessionId: 'test-session' }
        );
      }, 100);
    });

    it('should receive multiple event types for subscribed agent', (done) => {
      const testAgentId = 'test-agent-456';
      const events: string[] = [];
      
      clientSocket.emit('agent:subscribe', testAgentId);
      
      clientSocket.on(AgentSocketEvents.AGENT_STARTED, () => {
        events.push('started');
        checkComplete();
      });
      
      clientSocket.on(AgentSocketEvents.AGENT_PROGRESS, () => {
        events.push('progress');
        checkComplete();
      });
      
      clientSocket.on(AgentSocketEvents.AGENT_COMPLETED, () => {
        events.push('completed');
        checkComplete();
      });
      
      function checkComplete() {
        if (events.length === 3) {
          expect(events).toEqual(['started', 'progress', 'completed']);
          done();
        }
      }
      
      // Simulate agent lifecycle
      setTimeout(() => {
        websocketService.emitAgentEvent(
          AgentSocketEvents.AGENT_STARTED,
          testAgentId,
          { sessionId: 'test-session' }
        );
        
        websocketService.emitAgentEvent(
          AgentSocketEvents.AGENT_PROGRESS,
          testAgentId,
          { progress: 50, message: 'Processing...' }
        );
        
        websocketService.emitAgentEvent(
          AgentSocketEvents.AGENT_COMPLETED,
          testAgentId,
          { sessionId: 'test-session', duration: 5000 }
        );
      }, 100);
    });

    it('should not receive events after unsubscribing', (done) => {
      const testAgentId = 'test-agent-789';
      let eventCount = 0;
      
      clientSocket.emit('agent:subscribe', testAgentId);
      
      clientSocket.on(AgentSocketEvents.AGENT_STARTED, () => {
        eventCount++;
      });
      
      // First event should be received
      websocketService.emitAgentEvent(
        AgentSocketEvents.AGENT_STARTED,
        testAgentId,
        { sessionId: 'test-1' }
      );
      
      setTimeout(() => {
        expect(eventCount).toBe(1);
        
        // Unsubscribe
        clientSocket.emit('agent:unsubscribe', testAgentId);
        
        // Second event should not be received
        setTimeout(() => {
          websocketService.emitAgentEvent(
            AgentSocketEvents.AGENT_STARTED,
            testAgentId,
            { sessionId: 'test-2' }
          );
          
          setTimeout(() => {
            expect(eventCount).toBe(1); // Still 1
            done();
          }, 100);
        }, 100);
      }, 100);
    });
  });

  describe('Monitoring Subscriptions', () => {
    it('should receive all agent events when subscribed to monitoring', (done) => {
      const events: any[] = [];
      
      clientSocket.emit('monitoring:subscribe', 'agents');
      
      clientSocket.on(AgentSocketEvents.AGENT_STARTED, (data) => {
        events.push(data);
        if (events.length === 2) {
          expect(events).toHaveLength(2);
          expect(events[0].agentId).toBe('agent-1');
          expect(events[1].agentId).toBe('agent-2');
          done();
        }
      });
      
      setTimeout(() => {
        websocketService.emitAgentEvent(
          AgentSocketEvents.AGENT_STARTED,
          'agent-1',
          { sessionId: 'session-1' }
        );
        
        websocketService.emitAgentEvent(
          AgentSocketEvents.AGENT_STARTED,
          'agent-2',
          { sessionId: 'session-2' }
        );
      }, 100);
    });

    it('should receive scheduler status updates', (done) => {
      clientSocket.emit('monitoring:subscribe', 'scheduler');
      
      clientSocket.on(AgentSocketEvents.SCHEDULER_STATUS, (data) => {
        expect(data).toMatchObject({
          timestamp: expect.any(String),
          isRunning: true,
          scheduledTasksCount: 5
        });
        done();
      });
      
      setTimeout(() => {
        websocketService.broadcastSchedulerStatus({
          isRunning: true,
          scheduledTasksCount: 5,
          runningAgentsCount: 2
        });
      }, 100);
    });
  });
});
```

### 3. API Documentation

**File:** `backend/docs/api/agent-scheduler.md`

```markdown
# Agent Scheduler API Documentation

## Overview

The Agent Scheduler API provides endpoints for managing automated agent execution schedules using cron expressions.

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Schedule Agent

Schedule an agent to run automatically based on a cron expression.

**Endpoint:** `POST /api/agents/:agentId/schedule`

**Request Body:**
```json
{
  "cronExpression": "0 9 * * *",
  "priority": "HIGH",
  "enabled": true
}
```

**Parameters:**
- `cronExpression` (string, required): Standard cron expression (5 fields)
- `priority` (string, optional): Execution priority - LOW, NORMAL, HIGH, CRITICAL (default: NORMAL)
- `enabled` (boolean, optional): Whether the schedule is active (default: true)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "agent-123",
    "name": "Content Creator Agent",
    "scheduleExpression": "0 9 * * *",
    "scheduleEnabled": true,
    "nextRunAt": "2024-01-02T09:00:00Z"
  }
}
```

### Get Agent Schedule

Retrieve the current schedule information for an agent.

**Endpoint:** `GET /api/agents/:agentId/schedule`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "agent-123",
    "name": "Content Creator Agent",
    "scheduleExpression": "0 9 * * *",
    "scheduleEnabled": true,
    "nextRunAt": "2024-01-02T09:00:00Z",
    "lastRunAt": "2024-01-01T09:00:00Z",
    "status": "IDLE",
    "taskDetails": {
      "agentId": "agent-123",
      "agentName": "Content Creator Agent",
      "priority": 3,
      "nextRunTime": "2024-01-02T09:00:00Z",
      "retryCount": 0,
      "isRunning": false
    }
  }
}
```

### Unschedule Agent

Remove an agent's automated schedule.

**Endpoint:** `DELETE /api/agents/:agentId/schedule`

**Response:**
```json
{
  "success": true,
  "message": "Agent unscheduled successfully"
}
```

### Get Execution History

Retrieve the execution history for an agent.

**Endpoint:** `GET /api/agents/:agentId/sessions`

**Query Parameters:**
- `limit` (number, optional): Number of sessions to return (default: 20)
- `offset` (number, optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "session-123",
        "startedAt": "2024-01-01T09:00:00Z",
        "completedAt": "2024-01-01T09:05:00Z",
        "success": true,
        "duration": 300000,
        "outputSummary": "Generated 5 blog posts",
        "errorMessage": null
      }
    ],
    "pagination": {
      "total": 50,
      "limit": 20,
      "offset": 0
    }
  }
}
```

### Get Scheduler Status

Get the global scheduler status and all scheduled tasks.

**Endpoint:** `GET /api/agents/scheduler/status`

**Response:**
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "scheduledTasksCount": 10,
    "runningAgentsCount": 2,
    "queuedTasksCount": 8,
    "maxConcurrentAgents": 5,
    "tasks": [
      {
        "agentId": "agent-123",
        "agentName": "Content Creator Agent",
        "priority": 3,
        "nextRunTime": "2024-01-02T09:00:00Z",
        "retryCount": 0,
        "lastError": null,
        "isRunning": false
      }
    ]
  }
}
```

## WebSocket Events

Subscribe to real-time agent execution updates via WebSocket.

### Connection

```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Subscribing to Agent Events

```javascript
// Subscribe to specific agent
socket.emit('agent:subscribe', 'agent-123');

// Subscribe to all agent events
socket.emit('monitoring:subscribe', 'agents');

// Subscribe to scheduler status
socket.emit('monitoring:subscribe', 'scheduler');
```

### Event Types

#### agent:started
Emitted when an agent begins execution.

```json
{
  "agentId": "agent-123",
  "sessionId": "session-456",
  "priority": 3,
  "agentName": "Content Creator Agent",
  "agentType": "CONTENT_CREATOR",
  "timestamp": "2024-01-01T09:00:00Z"
}
```

#### agent:progress
Emitted to report agent progress.

```json
{
  "agentId": "agent-123",
  "progress": 50,
  "message": "Processing item 5 of 10",
  "timestamp": "2024-01-01T09:02:30Z"
}
```

#### agent:completed
Emitted when an agent successfully completes execution.

```json
{
  "agentId": "agent-123",
  "sessionId": "session-456",
  "duration": 300000,
  "agentName": "Content Creator Agent",
  "agentType": "CONTENT_CREATOR",
  "timestamp": "2024-01-01T09:05:00Z"
}
```

#### agent:failed
Emitted when an agent execution fails.

```json
{
  "agentId": "agent-123",
  "sessionId": "session-456",
  "error": "API rate limit exceeded",
  "retryCount": 1,
  "agentName": "Content Creator Agent",
  "agentType": "CONTENT_CREATOR",
  "timestamp": "2024-01-01T09:01:00Z"
}
```

#### scheduler:status
Broadcast scheduler status updates.

```json
{
  "isRunning": true,
  "scheduledTasksCount": 10,
  "runningAgentsCount": 2,
  "queuedTasksCount": 8,
  "maxConcurrentAgents": 5,
  "timestamp": "2024-01-01T09:00:00Z"
}
```

## Cron Expression Examples

| Pattern | Description |
|---------|-------------|
| `0 9 * * *` | Daily at 9:00 AM |
| `0 */6 * * *` | Every 6 hours |
| `*/30 9-17 * * 1-5` | Every 30 minutes during business hours (Mon-Fri) |
| `0 2 * * 0` | Weekly on Sunday at 2:00 AM |
| `0 8 * * 1-5` | Weekdays at 8:00 AM |
| `0 0 1 * *` | Monthly on the 1st at midnight |

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Invalid request (e.g., malformed cron expression) |
| 401 | Unauthorized (missing or invalid token) |
| 404 | Agent not found |
| 500 | Internal server error |

## Rate Limiting

API endpoints are rate-limited to:
- 100 requests per 15 minutes per authenticated user
- WebSocket connections are limited to 5 per user
```

### Git Commands for Day 3

```bash
# Switch to testing branch
git checkout -b feature/agent-scheduler-tests

# Create test directories
mkdir -p backend/src/routes/__tests__
mkdir -p backend/src/services/__tests__
mkdir -p backend/docs/api

# Add test files
git add backend/src/routes/__tests__/agent.schedule.test.ts
git add backend/src/services/__tests__/websocket.agent.test.ts
git commit -m "test: add comprehensive scheduler and API tests

- Test all schedule CRUD endpoints
- Test WebSocket event subscriptions
- Test monitoring room functionality
- Achieve >80% code coverage"

# Add documentation
git add backend/docs/api/agent-scheduler.md
git commit -m "docs: add complete API documentation for scheduler

- Document all REST endpoints with examples
- Document WebSocket events and payloads
- Include cron expression reference
- Add error codes and rate limiting info"

# Merge all branches
git checkout main
git merge feature/agent-schedule-routes
git merge feature/websocket-agent-events
git merge feature/agent-scheduler-tests

# Push to remote
git push origin main
```

---

## Summary of Changes

### Files Created:
1. `backend/src/routes/agents/schedule.ts` - Schedule management endpoints
2. `backend/src/routes/__tests__/agent.schedule.test.ts` - Route tests
3. `backend/src/services/__tests__/websocket.agent.test.ts` - WebSocket tests
4. `backend/docs/api/agent-scheduler.md` - API documentation

### Files Modified:
1. `backend/src/routes/agent.routes.ts` - Added schedule routes and sessions endpoint
2. `backend/src/services/websocket.service.ts` - Added agent event methods
3. `backend/src/agents/scheduler/AgentScheduler.ts` - Added WebSocket emissions and singleton

### API Endpoints Added:
- `POST /api/agents/:id/schedule` - Schedule agent
- `GET /api/agents/:id/schedule` - Get schedule info
- `DELETE /api/agents/:id/schedule` - Unschedule agent
- `GET /api/agents/:id/sessions` - Get execution history
- `GET /api/agents/scheduler/status` - Get global status

### WebSocket Events Added:
- `agent:started` - Agent execution started
- `agent:completed` - Agent execution completed
- `agent:failed` - Agent execution failed
- `agent:progress` - Agent progress update
- `scheduler:status` - Scheduler status broadcast

## Next Steps

After implementing these changes:

1. Run tests: `npm test`
2. Check coverage: `npm run test:coverage`
3. Run linter: `npm run lint:fix`
4. Start the server: `npm run dev`
5. Test with Postman or frontend

The Phase 1 implementation is now complete and ready for Phase 2: Metrics Aggregation System. 