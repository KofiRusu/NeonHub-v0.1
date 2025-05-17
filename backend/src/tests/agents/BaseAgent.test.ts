import { BaseAgent, ExecutionOptions, TokenUsage } from '../../agents/base/BaseAgent';
import { prisma, createTestAgent, createTestCampaign, createTestExecutionSession } from '../mocks/prismaMock';
import * as campaignServiceModule from '../../../services/CampaignService';
import * as metricServiceModule from '../../../services/MetricService';

// Create a concrete implementation of BaseAgent for testing
class TestAgent extends BaseAgent {
  public executeResult: any = { data: 'test result' };
  public shouldThrow: boolean = false;
  
  protected async executeImpl(config: any): Promise<any> {
    if (this.shouldThrow) {
      throw new Error('Test execution error');
    }
    return this.executeResult;
  }
}

// Mock the services
jest.mock('../../../services/CampaignService', () => ({
  getCampaignService: jest.fn(),
}));

jest.mock('../../../services/MetricService', () => ({
  getMetricService: jest.fn(),
  MetricSource: {
    AGENT: 'agent',
  },
}));

describe('BaseAgent', () => {
  let testAgent: TestAgent;
  let testAgentData: any;
  let mockCampaignService: any;
  let mockMetricService: any;
  
  beforeEach(() => {
    testAgentData = createTestAgent();
    testAgent = new TestAgent(prisma, testAgentData);
    
    // Setup mock campaign service
    mockCampaignService = {
      getOrCreateCampaignForAgent: jest.fn(),
      getCampaign: jest.fn(),
    };
    (campaignServiceModule.getCampaignService as jest.Mock).mockReturnValue(mockCampaignService);
    
    // Setup mock metric service
    mockMetricService = {
      logAgentExecutionMetrics: jest.fn(),
    };
    (metricServiceModule.getMetricService as jest.Mock).mockReturnValue(mockMetricService);
    
    // Setup session creation/update mocks
    prisma.agentExecutionSession.create.mockResolvedValue(createTestExecutionSession());
    prisma.agentExecutionSession.update.mockResolvedValue({} as any);
  });
  
  describe('execute', () => {
    it('should create an execution session and link to campaign', async () => {
      const session = createTestExecutionSession();
      prisma.agentExecutionSession.create.mockResolvedValue(session);
      
      const campaign = createTestCampaign();
      mockCampaignService.getOrCreateCampaignForAgent.mockResolvedValue(campaign);
      
      const config = { topic: 'test' };
      await testAgent.execute(config);
      
      expect(prisma.agentExecutionSession.create).toHaveBeenCalledWith({
        data: {
          agentId: testAgentData.id,
          context: config as any,
        },
      });
      
      expect(mockCampaignService.getOrCreateCampaignForAgent).toHaveBeenCalledWith(
        testAgentData,
        undefined
      );
    });
    
    it('should use campaignId from options if provided', async () => {
      const campaignId = 'campaign-id-from-options';
      const campaign = createTestCampaign({ id: campaignId });
      
      mockCampaignService.getOrCreateCampaignForAgent.mockResolvedValue(campaign);
      
      const options: ExecutionOptions = {
        campaignId,
      };
      
      await testAgent.execute({}, options);
      
      expect(mockCampaignService.getOrCreateCampaignForAgent).toHaveBeenCalledWith(
        testAgentData,
        campaignId
      );
    });
    
    it('should use campaignId from config if provided and not in options', async () => {
      const campaignId = 'campaign-id-from-config';
      const campaign = createTestCampaign({ id: campaignId });
      
      mockCampaignService.getOrCreateCampaignForAgent.mockResolvedValue(campaign);
      
      const config = {
        campaignId,
      };
      
      await testAgent.execute(config);
      
      expect(mockCampaignService.getOrCreateCampaignForAgent).toHaveBeenCalledWith(
        testAgentData,
        campaignId
      );
    });
    
    it('should call executeImpl with the config', async () => {
      const config = { topic: 'test' };
      const campaign = createTestCampaign();
      
      mockCampaignService.getOrCreateCampaignForAgent.mockResolvedValue(campaign);
      
      // Spy on executeImpl
      const executeImplSpy = jest.spyOn(testAgent as any, 'executeImpl');
      
      await testAgent.execute(config);
      
      expect(executeImplSpy).toHaveBeenCalledWith(config);
    });
    
    it('should update execution session after successful execution', async () => {
      const session = createTestExecutionSession();
      prisma.agentExecutionSession.create.mockResolvedValue(session);
      
      const campaign = createTestCampaign();
      mockCampaignService.getOrCreateCampaignForAgent.mockResolvedValue(campaign);
      
      testAgent.executeResult = { success: true, data: 'test' };
      
      await testAgent.execute({});
      
      expect(prisma.agentExecutionSession.update).toHaveBeenCalledWith({
        where: { id: session.id },
        data: expect.objectContaining({
          completedAt: expect.any(Date),
          success: true,
          duration: expect.any(Number),
          outputSummary: expect.any(String),
          metrics: expect.objectContaining({
            executionTime: expect.any(Number),
          }),
        }),
      });
    });
    
    it('should log metrics if trackMetrics is true', async () => {
      const session = createTestExecutionSession();
      prisma.agentExecutionSession.create.mockResolvedValue(session);
      
      const campaign = createTestCampaign();
      mockCampaignService.getOrCreateCampaignForAgent.mockResolvedValue(campaign);
      
      const tokenUsage: TokenUsage = {
        input: 100,
        output: 400,
        total: 500,
      };
      
      await testAgent.execute({}, { trackMetrics: true, tokenUsage });
      
      expect(mockMetricService.logAgentExecutionMetrics).toHaveBeenCalledWith(
        expect.any(Number),
        testAgentData.id,
        testAgentData.agentType,
        testAgentData.projectId,
        session.id,
        campaign.id,
        true,
        tokenUsage
      );
    });
    
    it('should not log metrics if trackMetrics is false', async () => {
      const session = createTestExecutionSession();
      prisma.agentExecutionSession.create.mockResolvedValue(session);
      
      const campaign = createTestCampaign();
      mockCampaignService.getOrCreateCampaignForAgent.mockResolvedValue(campaign);
      
      await testAgent.execute({}, { trackMetrics: false });
      
      expect(mockMetricService.logAgentExecutionMetrics).not.toHaveBeenCalled();
    });
    
    it('should return result with additional execution metadata', async () => {
      const session = createTestExecutionSession();
      prisma.agentExecutionSession.create.mockResolvedValue(session);
      
      const campaign = createTestCampaign();
      mockCampaignService.getOrCreateCampaignForAgent.mockResolvedValue(campaign);
      
      testAgent.executeResult = { data: 'test-data' };
      
      const result = await testAgent.execute({});
      
      expect(result).toEqual(expect.objectContaining({
        data: 'test-data',
        campaignId: campaign.id,
        executionTime: expect.any(Number),
        sessionId: session.id,
      }));
    });
    
    it('should handle execution errors and log failure metrics', async () => {
      const session = createTestExecutionSession();
      prisma.agentExecutionSession.create.mockResolvedValue(session);
      
      const campaign = createTestCampaign();
      mockCampaignService.getOrCreateCampaignForAgent.mockResolvedValue(campaign);
      
      testAgent.shouldThrow = true;
      
      await expect(testAgent.execute({})).rejects.toThrow('Test execution error');
      
      expect(prisma.agentExecutionSession.update).toHaveBeenCalledWith({
        where: { id: session.id },
        data: expect.objectContaining({
          completedAt: expect.any(Date),
          success: false,
          duration: expect.any(Number),
          errorMessage: 'Test execution error',
        }),
      });
      
      expect(mockMetricService.logAgentExecutionMetrics).toHaveBeenCalledWith(
        expect.any(Number),
        testAgentData.id,
        testAgentData.agentType,
        testAgentData.projectId,
        session.id,
        undefined,
        false,
        undefined
      );
    });
  });
  
  describe('stop', () => {
    it('should set shouldStop flag and call stopImpl', async () => {
      const stopImplSpy = jest.spyOn(testAgent as any, 'stopImpl');
      
      // Set agent to running state
      (testAgent as any).isRunning = true;
      
      await testAgent.stop();
      
      expect(testAgent['shouldStop']).toBe(true);
      expect(stopImplSpy).toHaveBeenCalled();
    });
    
    it('should do nothing if agent is not running', async () => {
      const stopImplSpy = jest.spyOn(testAgent as any, 'stopImpl');
      
      // Set agent to not running state
      (testAgent as any).isRunning = false;
      
      await testAgent.stop();
      
      expect(stopImplSpy).not.toHaveBeenCalled();
    });
  });
  
  describe('logMessage', () => {
    it('should update execution session logs', async () => {
      const session = createTestExecutionSession({
        logs: [],
      });
      
      prisma.agentExecutionSession.findFirst.mockResolvedValue(session as any);
      
      await (testAgent as any).logMessage('Test message', 'info');
      
      expect(prisma.agentExecutionSession.findFirst).toHaveBeenCalledWith({
        where: { agentId: testAgentData.id },
        orderBy: { startedAt: 'desc' },
      });
      
      expect(prisma.agentExecutionSession.update).toHaveBeenCalledWith({
        where: { id: session.id },
        data: { 
          logs: [
            {
              timestamp: expect.any(Date),
              level: 'info',
              message: 'Test message',
            }
          ] as any 
        },
      });
    });
    
    it('should append to existing logs if any', async () => {
      const existingLogs = [
        { timestamp: new Date(), level: 'info', message: 'Existing message' }
      ];
      
      const session = createTestExecutionSession({
        logs: existingLogs,
      });
      
      prisma.agentExecutionSession.findFirst.mockResolvedValue(session as any);
      
      await (testAgent as any).logMessage('New message', 'error');
      
      expect(prisma.agentExecutionSession.update).toHaveBeenCalledWith({
        where: { id: session.id },
        data: { 
          logs: [
            ...existingLogs,
            {
              timestamp: expect.any(Date),
              level: 'error',
              message: 'New message',
            }
          ] as any 
        },
      });
    });
    
    it('should log warning if no session found', async () => {
      prisma.agentExecutionSession.findFirst.mockResolvedValue(null);
      
      const consoleSpy = jest.spyOn(console, 'warn');
      
      await (testAgent as any).logMessage('Test message');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(`No session found for agent ${testAgentData.id}`)
      );
      expect(prisma.agentExecutionSession.update).not.toHaveBeenCalled();
    });
  });
}); 