import { AgentManager } from '../../agents/manager/AgentManager';
import { BaseAgent } from '../../agents/base/BaseAgent';
import {
  AgentFactory,
  pluginRegistry,
} from '../../agents/factory/AgentFactory';
import {
  prisma,
  createTestAgent,
  createTestCampaign,
} from '../mocks/prismaMock';

// Mock the BaseAgent
jest.mock('../../agents/base/BaseAgent');

describe('AgentManager', () => {
  let agentManager: AgentManager;
  let mockBaseAgent: jest.Mocked<BaseAgent>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Register a test plugin in the global registry
    pluginRegistry.register({
      type: 'CONTENT_CREATOR',
      name: 'Content Creator',
      description: 'Creates content',
      version: '1.0.0',
      create: (prisma, agentData) => mockBaseAgent,
      getDefaultConfig: () => ({ defaultKey: 'defaultValue' }),
      validateConfig: () => true,
    });

    agentManager = new AgentManager(prisma);
    mockBaseAgent = {
      execute: jest.fn(),
      stop: jest.fn(),
    } as unknown as jest.Mocked<BaseAgent>;
  });

  describe('startAgent', () => {
    it('should check if agent is already running and return early if it is', async () => {
      // Mock isAgentRunning to return true
      jest.spyOn(agentManager, 'isAgentRunning').mockReturnValue(true);

      // Mock agent data to prevent 'agent not found' error
      const agent = createTestAgent();
      prisma.aIAgent.findUnique.mockResolvedValue(agent);

      const result = await agentManager.startAgent('agent-id');

      expect(result).toEqual({
        status: 'already_running',
        agentId: 'agent-id',
      });
      expect(prisma.aIAgent.findUnique).not.toHaveBeenCalled();
    });

    it('should throw error if agent not found', async () => {
      jest.spyOn(agentManager, 'isAgentRunning').mockReturnValue(false);
      prisma.aIAgent.findUnique.mockResolvedValue(null);

      await expect(agentManager.startAgent('non-existent-id')).rejects.toThrow(
        'Agent with ID non-existent-id not found',
      );
    });

    it('should update agent status to RUNNING before execution', async () => {
      jest.spyOn(agentManager, 'isAgentRunning').mockReturnValue(false);
      const agent = createTestAgent();
      prisma.aIAgent.findUnique.mockResolvedValue(agent);

      // Mock the execution to throw to test early steps
      mockBaseAgent.execute.mockRejectedValue(new Error('Test error'));

      try {
        await agentManager.startAgent(agent.id);
      } catch (error) {
        // Expected error
      }

      expect(prisma.aIAgent.update).toHaveBeenCalledWith({
        where: { id: agent.id },
        data: { status: 'RUNNING', lastRunAt: expect.any(Date) },
      });
    });

    it('should create agent instance and execute it with merged config', async () => {
      jest.spyOn(agentManager, 'isAgentRunning').mockReturnValue(false);

      const agent = createTestAgent({
        configuration: { defaultKey: 'defaultValue' },
      });

      prisma.aIAgent.findUnique.mockResolvedValue(agent);

      const customConfig = { customKey: 'customValue' };
      const executionOptions = {
        config: customConfig,
        trackMetrics: true,
        tokenUsage: { input: 100, output: 500, total: 600 },
      };

      const expectedConfig = {
        defaultKey: 'defaultValue',
        customKey: 'customValue',
      };

      mockBaseAgent.execute.mockResolvedValue({ status: 'success' });

      await agentManager.startAgent(agent.id, undefined, executionOptions);

      // The factory createAgent method is called internally, but we can't easily mock it
      // since it's called within the AgentManager. Instead, we verify the execution happened.
      expect(mockBaseAgent.execute).toHaveBeenCalledWith(expectedConfig, {
        campaignId: undefined,
        trackMetrics: true,
        tokenUsage: executionOptions.tokenUsage,
      });
    });

    it('should update agent status to COMPLETED after successful execution', async () => {
      jest.spyOn(agentManager, 'isAgentRunning').mockReturnValue(false);

      const agent = createTestAgent();
      prisma.aIAgent.findUnique.mockResolvedValue(agent);

      const executionResult = {
        status: 'success',
        campaignId: 'campaign-id',
        sessionId: 'session-id',
      };

      mockBaseAgent.execute.mockResolvedValue(executionResult);

      const result = await agentManager.startAgent(agent.id);

      expect(result).toEqual(executionResult);

      expect(prisma.aIAgent.update).toHaveBeenCalledWith({
        where: { id: agent.id },
        data: { status: 'COMPLETED' },
      });
    });

    it('should handle errors during execution and update agent status', async () => {
      jest.spyOn(agentManager, 'isAgentRunning').mockReturnValue(false);

      const agent = createTestAgent();
      prisma.aIAgent.findUnique.mockResolvedValue(agent);

      const testError = new Error('Test execution error');
      mockBaseAgent.execute.mockRejectedValue(testError);

      await expect(agentManager.startAgent(agent.id)).rejects.toThrow(
        testError,
      );

      // Should update status to ERROR
      expect(prisma.aIAgent.update).toHaveBeenCalledWith({
        where: { id: agent.id },
        data: { status: 'ERROR' },
      });
    });

    it('should pass campaign ID to the agent execution', async () => {
      jest.spyOn(agentManager, 'isAgentRunning').mockReturnValue(false);

      const agent = createTestAgent();
      const campaign = createTestCampaign();

      prisma.aIAgent.findUnique.mockResolvedValue(agent);
      mockBaseAgent.execute.mockResolvedValue({ status: 'success' });

      await agentManager.startAgent(agent.id, campaign.id);

      expect(mockBaseAgent.execute).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          campaignId: campaign.id,
        }),
      );
    });
  });

  describe('stopAgent', () => {
    it('should do nothing if agent is not running', async () => {
      jest.spyOn(agentManager, 'isAgentRunning').mockReturnValue(false);

      await agentManager.stopAgent('agent-id');

      expect(prisma.aIAgent.update).not.toHaveBeenCalled();
      expect(prisma.agentExecutionSession.findFirst).not.toHaveBeenCalled();
    });

    it('should stop a running agent and update its status', async () => {
      // Mock there is a running agent
      const agentId = 'agent-id';

      // Mock the map behavior instead of trying to access the private property
      jest
        .spyOn(agentManager, 'isAgentRunning')
        .mockReturnValueOnce(true) // First call: check if running
        .mockReturnValueOnce(false); // Second call: check after stopping

      // Make the private runningAgents Map accessible
      (agentManager as any).runningAgents = new Map([[agentId, mockBaseAgent]]);

      // Mock delete method on Map for stopAgent method
      const mockDelete = jest.fn();
      (agentManager as any).runningAgents.delete = mockDelete;

      const session = {
        id: 'session-id',
        startedAt: new Date(Date.now() - 1000),
      };

      prisma.agentExecutionSession.findFirst.mockResolvedValue(session as any);

      await agentManager.stopAgent(agentId);

      expect(mockBaseAgent.stop).toHaveBeenCalled();

      expect(prisma.aIAgent.update).toHaveBeenCalledWith({
        where: { id: agentId },
        data: { status: 'PAUSED' },
      });

      expect(prisma.agentExecutionSession.update).toHaveBeenCalledWith({
        where: { id: session.id },
        data: {
          completedAt: expect.any(Date),
          success: false,
          duration: expect.any(Number),
          errorMessage: 'Agent execution manually stopped',
        },
      });

      // Verify the map's delete method was called
      expect(mockDelete).toHaveBeenCalledWith(agentId);
    });
  });

  describe('getScheduledAgents', () => {
    it('should fetch agents that need to run based on schedule', async () => {
      const scheduledAgents = [createTestAgent(), createTestAgent()];

      prisma.aIAgent.findMany.mockResolvedValue(scheduledAgents);

      const result = await agentManager.getScheduledAgents();

      expect(result).toEqual(scheduledAgents);
      expect(prisma.aIAgent.findMany).toHaveBeenCalledWith({
        where: {
          scheduleEnabled: true,
          nextRunAt: {
            lte: expect.any(Date),
          },
          status: {
            notIn: ['RUNNING', 'ERROR'],
          },
        },
      });
    });
  });

  describe('updateNextRunTime', () => {
    it('should update the next run time for an agent', async () => {
      const agentId = 'agent-id';
      const nextRunAt = new Date();

      await agentManager.updateNextRunTime(agentId, nextRunAt);

      expect(prisma.aIAgent.update).toHaveBeenCalledWith({
        where: { id: agentId },
        data: { nextRunAt },
      });
    });
  });

  describe('isAgentRunning', () => {
    it('should return true if agent is running', () => {
      const agentId = 'test-agent-id';

      // Set up the private runningAgents map
      (agentManager as any).runningAgents = new Map([[agentId, {}]]);

      expect(agentManager.isAgentRunning(agentId)).toBe(true);
      expect(agentManager.isAgentRunning('other-id')).toBe(false);
    });
  });
});
