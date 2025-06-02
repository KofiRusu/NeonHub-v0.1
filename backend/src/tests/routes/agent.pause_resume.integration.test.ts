import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import { io as ioClient, Socket } from 'socket.io-client';
import { app } from '../../app';
import { AgentScheduler } from '../../agents/scheduler/AgentScheduler';
import { AgentManager } from '../../agents/manager/AgentManager';
import { schedulerSingleton } from '../../services/schedulerSingleton';
import { WebSocketService } from '../../services/websocket.service';

describe('Agent Pause/Resume Integration Tests', () => {
  let prisma: PrismaClient;
  let scheduler: AgentScheduler;
  let agentManager: AgentManager;
  let authToken: string;
  let testAgent: any;
  let socketClient: Socket;
  let wsService: WebSocketService;

  beforeAll(async () => {
    // Initialize Prisma
    prisma = new PrismaClient();

    // Clear test data
    await prisma.aIAgent.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.project.deleteMany({});

    // Create test user and get auth token
    const userResponse = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    });

    authToken = userResponse.body.token;

    // Create test project
    const projectResponse = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Project',
        description: 'Test project for agent scheduling',
      });

    const projectId = projectResponse.body.data.id;

    // Create test agent
    const agentResponse = await request(app)
      .post('/api/agents')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Agent',
        description: 'Test agent for pause/resume',
        agentType: 'CONTENT_CREATOR',
        projectId,
        configuration: {
          priority: 'normal',
        },
      });

    testAgent = agentResponse.body.data;

    // Initialize scheduler
    agentManager = new AgentManager(prisma);
    scheduler = new AgentScheduler(prisma, agentManager, {
      checkInterval: 1000,
      autoStart: true,
    });

    // Initialize WebSocket service
    const httpServer = app.listen(0); // Random port
    wsService = WebSocketService.getInstance(httpServer, prisma);

    // Connect socket client
    const port = (httpServer.address() as any).port;
    socketClient = ioClient(`http://localhost:${port}`);

    // Wait for connection
    await new Promise((resolve) => {
      socketClient.on('connect', resolve);
    });
  });

  afterAll(async () => {
    scheduler.stop();
    socketClient.disconnect();
    await prisma.$disconnect();
  });

  describe('Schedule and Pause Flow', () => {
    it('should schedule an agent and then pause it', async () => {
      // Subscribe to agent updates
      socketClient.emit('subscribe-agent-updates', testAgent.id);

      // Schedule the agent
      const scheduleResponse = await request(app)
        .post(`/api/agents/${testAgent.id}/schedule`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          cronExpression: '*/5 * * * *',
          priority: 'HIGH',
          enabled: true,
        });

      expect(scheduleResponse.status).toBe(200);
      expect(scheduleResponse.body.success).toBe(true);

      // Verify agent is scheduled
      const scheduleInfo = await request(app)
        .get(`/api/agents/${testAgent.id}/schedule`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(scheduleInfo.body.data.scheduleEnabled).toBe(true);
      expect(scheduleInfo.body.data.scheduleExpression).toBe('*/5 * * * *');

      // Set up event listener for pause event
      const pauseEventPromise = new Promise((resolve) => {
        socketClient.once('agent:paused', (data: any) => {
          resolve(data);
        });
      });

      // Pause the agent
      const pauseResponse = await request(app)
        .patch(`/api/agents/${testAgent.id}/schedule/${testAgent.id}/pause`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(pauseResponse.status).toBe(200);
      expect(pauseResponse.body.success).toBe(true);
      expect(pauseResponse.body.data.status).toBe('paused');

      // Wait for WebSocket event
      const pauseEvent = await pauseEventPromise;
      expect(pauseEvent).toMatchObject({
        agentId: testAgent.id,
        status: 'paused',
      });

      // Verify scheduler state
      const stats = scheduler.getStats();
      expect(stats.pausedJobsCount).toBeGreaterThan(0);

      // Verify task details show paused state
      const taskDetails = scheduler.getTaskDetails();
      const agentTask = taskDetails.find((t) => t.agentId === testAgent.id);
      expect(agentTask?.isPaused).toBe(true);
    });

    it('should resume a paused agent', async () => {
      // Set up event listener for resume event
      const resumeEventPromise = new Promise((resolve) => {
        socketClient.once('agent:resumed', (data: any) => {
          resolve(data);
        });
      });

      // Resume the agent
      const resumeResponse = await request(app)
        .patch(`/api/agents/${testAgent.id}/schedule/${testAgent.id}/resume`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(resumeResponse.status).toBe(200);
      expect(resumeResponse.body.success).toBe(true);
      expect(resumeResponse.body.data.status).toBe('resumed');

      // Wait for WebSocket event
      const resumeEvent = await resumeEventPromise;
      expect(resumeEvent).toMatchObject({
        agentId: testAgent.id,
        status: 'resumed',
      });

      // Verify scheduler state
      const taskDetails = scheduler.getTaskDetails();
      const agentTask = taskDetails.find((t) => t.agentId === testAgent.id);
      expect(agentTask?.isPaused).toBe(false);
    });

    it('should not pause a running agent', async () => {
      // Mock agent as running
      await prisma.aIAgent.update({
        where: { id: testAgent.id },
        data: { status: 'RUNNING' },
      });

      // Force scheduler to recognize agent as running
      (scheduler as any).runningAgents.add(testAgent.id);

      // Try to pause
      const pauseResponse = await request(app)
        .patch(`/api/agents/${testAgent.id}/schedule/${testAgent.id}/pause`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(pauseResponse.status).toBe(409);
      expect(pauseResponse.body.error).toContain('while it is running');

      // Clean up
      (scheduler as any).runningAgents.delete(testAgent.id);
      await prisma.aIAgent.update({
        where: { id: testAgent.id },
        data: { status: 'IDLE' },
      });
    });

    it('should handle pause/resume for non-existent agent', async () => {
      const fakeAgentId = 'non-existent-agent-id';

      // Try to pause non-existent agent
      const pauseResponse = await request(app)
        .patch(`/api/agents/${fakeAgentId}/schedule/${fakeAgentId}/pause`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(pauseResponse.status).toBe(404);
      expect(pauseResponse.body.error).toBe('Agent not found');

      // Try to resume non-existent agent
      const resumeResponse = await request(app)
        .patch(`/api/agents/${fakeAgentId}/schedule/${fakeAgentId}/resume`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(resumeResponse.status).toBe(404);
      expect(resumeResponse.body.error).toBe('Agent not found');
    });
  });

  describe('Scheduler Status Endpoint', () => {
    it('should return correct scheduler status', async () => {
      const statusResponse = await request(app)
        .get('/api/agents/schedule/status')
        .set('Authorization', `Bearer ${authToken}`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data).toMatchObject({
        isRunning: true,
        scheduledTasksCount: expect.any(Number),
        runningAgentsCount: expect.any(Number),
        queuedTasksCount: expect.any(Number),
        maxConcurrentAgents: expect.any(Number),
        pausedJobsCount: expect.any(Number),
      });
    });
  });

  describe('Get Paused Jobs Endpoint', () => {
    it('should return list of paused jobs', async () => {
      // First pause an agent
      await scheduler.pauseJob(testAgent.id, 'test-job-123');

      const pausedJobsResponse = await request(app)
        .get('/api/agents/schedule/paused')
        .set('Authorization', `Bearer ${authToken}`);

      expect(pausedJobsResponse.status).toBe(200);
      expect(pausedJobsResponse.body.success).toBe(true);
      expect(pausedJobsResponse.body.data).toBeInstanceOf(Array);

      const pausedJob = pausedJobsResponse.body.data.find(
        (job: any) => job.agentId === testAgent.id,
      );
      expect(pausedJob).toBeDefined();
      expect(pausedJob.jobId).toBe('test-job-123');
    });
  });
});
