import { PrismaClient, AIAgent } from '@prisma/client';
import { BaseAgent, AgentEventType, ExecutionOptions } from '../../agents/base/BaseAgent';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

// Mock implementation of BaseAgent for testing
class TestAgent extends BaseAgent {
  private shouldFail = false;
  private failureCount = 0;
  private maxFailures = 0;

  constructor(prisma: PrismaClient, agentData: AIAgent) {
    super(prisma, agentData);
  }

  setFailureMode(shouldFail: boolean, maxFailures = 1): void {
    this.shouldFail = shouldFail;
    this.maxFailures = maxFailures;
    this.failureCount = 0;
  }

  protected async executeImpl(config: any): Promise<any> {
    if (this.shouldFail && this.failureCount < this.maxFailures) {
      this.failureCount++;
      throw new Error(`Test failure ${this.failureCount}`);
    }

    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return {
      success: true,
      data: 'Test execution completed',
      config
    };
  }

  protected async stopImpl(): Promise<void> {
    this.logEvent(AgentEventType.CUSTOM_EVENT, 'Test agent stopped');
  }

  // Expose protected methods for testing
  public testLogEvent(type: AgentEventType, message: string, data?: any, level?: 'info' | 'warning' | 'error'): void {
    this.logEvent(type, message, data, level);
  }

  public testCheckShouldStop(): boolean {
    return this.checkShouldStop();
  }

  // Expose logMessage as public for testing
  public async testLogMessage(message: string, level?: 'info' | 'warning' | 'error'): Promise<void> {
    return this.logMessage(message, level);
  }
}

// Mock the services
jest.mock('../../../services', () => ({
  getCampaignService: jest.fn(() => ({
    getOrCreateCampaignForAgent: jest.fn().mockResolvedValue({ id: 'test-campaign-id' })
  })),
  getMetricService: jest.fn(() => ({
    logAgentExecutionMetrics: jest.fn().mockResolvedValue(undefined)
  }))
}));

describe('BaseAgent', () => {
  let mockPrisma: DeepMockProxy<PrismaClient>;
  let testAgent: TestAgent;
  let mockAgentData: AIAgent;

  beforeEach(() => {
    mockPrisma = mockDeep<PrismaClient>();
    
    mockAgentData = {
      id: 'test-agent-id',
      name: 'Test Agent',
      description: 'Test agent for unit testing',
      agentType: 'CONTENT_CREATOR' as any,
      configuration: { test: true },
      status: 'IDLE',
      projectId: 'test-project-id',
      managerId: 'test-manager-id',
      lastRunAt: null,
      nextRunAt: null,
      scheduleExpression: null,
      scheduleEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    testAgent = new TestAgent(mockPrisma, mockAgentData);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    beforeEach(() => {
      mockPrisma.agentExecutionSession.create.mockResolvedValue({
        id: 'test-session-id',
        agentId: 'test-agent-id',
        startedAt: new Date(),
        completedAt: null,
        success: null,
        duration: null,
        outputSummary: null,
        logs: null,
        context: null,
        metrics: null,
        errorMessage: null,
        createdAt: new Date()
      });

      mockPrisma.agentExecutionSession.update.mockResolvedValue({} as any);
    });

    it('should execute successfully and log events', async () => {
      const config = { testConfig: true };
      const options: ExecutionOptions = { trackMetrics: true };

      const result = await testAgent.execute(config, options);

      expect(result).toEqual({
        success: true,
        data: 'Test execution completed',
        config,
        campaignId: 'test-campaign-id',
        executionTime: expect.any(Number),
        sessionId: 'test-session-id',
        events: expect.any(Array)
      });

      // Check that events were logged
      const events = testAgent.getEvents();
      expect(events).toHaveLength(2); // Start and completion events
      expect(events[0].type).toBe(AgentEventType.EXECUTION_STARTED);
      expect(events[1].type).toBe(AgentEventType.EXECUTION_COMPLETED);
    });

    it('should retry on failure and eventually succeed', async () => {
      testAgent.setFailureMode(true, 2); // Fail twice, then succeed
      
      const config = { testConfig: true };
      const options: ExecutionOptions = { maxRetries: 3, retryDelay: 10 };

      const result = await testAgent.execute(config, options);

      expect(result.success).toBe(true);
      
      // Check retry events - BaseAgent logs 2 events per retry (info + warning)
      const events = testAgent.getEvents();
      const retryEvents = events.filter(e => e.type === AgentEventType.RETRY_ATTEMPT);
      expect(retryEvents).toHaveLength(4); // Two retries, each with 2 events (info + warning)
    });

    it('should fail after max retries', async () => {
      testAgent.setFailureMode(true, 5); // Always fail
      
      const config = { testConfig: true };
      const options: ExecutionOptions = { maxRetries: 2, retryDelay: 10 };

      await expect(testAgent.execute(config, options)).rejects.toThrow('Test failure');
      
      // Check that session was updated with error
      expect(mockPrisma.agentExecutionSession.update).toHaveBeenCalledWith({
        where: { id: 'test-session-id' },
        data: expect.objectContaining({
          success: false,
          errorMessage: expect.stringContaining('Test failure')
        })
      });
    });

    it('should handle stop request during execution', async () => {
      // Start execution in background
      const executePromise = testAgent.execute({ testConfig: true });
      
      // Stop the agent immediately
      await testAgent.stop();
      
      // Execution should be interrupted
      await expect(executePromise).rejects.toThrow('Agent execution stopped by user request');
    });
  });

  describe('event logging', () => {
    it('should log events with correct structure', () => {
      const testData = { key: 'value' };
      testAgent.testLogEvent(AgentEventType.CUSTOM_EVENT, 'Test message', testData, 'info');

      const events = testAgent.getEvents();
      expect(events).toHaveLength(1);
      
      const event = events[0];
      expect(event.type).toBe(AgentEventType.CUSTOM_EVENT);
      expect(event.message).toBe('Test message');
      expect(event.data).toEqual(testData);
      expect(event.level).toBe('info');
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('should accumulate multiple events', () => {
      testAgent.testLogEvent(AgentEventType.CUSTOM_EVENT, 'Event 1');
      testAgent.testLogEvent(AgentEventType.CUSTOM_EVENT, 'Event 2');
      testAgent.testLogEvent(AgentEventType.CUSTOM_EVENT, 'Event 3');

      const events = testAgent.getEvents();
      expect(events).toHaveLength(3);
      expect(events.map(e => e.message)).toEqual(['Event 1', 'Event 2', 'Event 3']);
    });
  });

  describe('status management', () => {
    it('should return correct status when idle', () => {
      const status = testAgent.getStatus();
      
      expect(status).toEqual({
        isRunning: false,
        shouldStop: false,
        currentSessionId: null,
        eventCount: 0,
        executionTime: undefined
      });
    });
  });

  describe('stop functionality', () => {
    it('should stop execution gracefully', async () => {
      await testAgent.stop();
      
      expect(testAgent.testCheckShouldStop()).toBe(true);
      
      const events = testAgent.getEvents();
      const stopEvent = events.find(e => e.type === AgentEventType.STOP_REQUESTED);
      expect(stopEvent).toBeDefined();
    });

    it('should not stop if not running', async () => {
      // Agent is not running, stop should be a no-op
      await testAgent.stop();
      
      // Should still set the stop flag
      expect(testAgent.testCheckShouldStop()).toBe(true);
    });
  });

  describe('legacy logMessage method', () => {
    it('should work for backward compatibility', async () => {
      await testAgent.testLogMessage('Legacy message', 'warning');
      
      const events = testAgent.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(AgentEventType.CUSTOM_EVENT);
      expect(events[0].message).toBe('Legacy message');
      expect(events[0].level).toBe('warning');
    });
  });
}); 