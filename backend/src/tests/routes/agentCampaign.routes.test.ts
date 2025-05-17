import { Request, Response } from 'express';
import campaignRoutes from '../../routes/agents/campaign';
import { prisma, createTestAgent, createTestCampaign, createTestMetric } from '../mocks/prismaMock';
import { getAgentManager } from '../../agents';

// Mock express router
jest.mock('express', () => {
  const expressActual = jest.requireActual('express');
  
  return {
    ...expressActual,
    Router: () => ({
      post: jest.fn((path, ...handlers) => {
        // Store the route handlers for testing
        if (path === '/:agentId/run') {
          runAgentHandler = handlers[handlers.length - 1];
        }
        return this;
      }),
      get: jest.fn((path, ...handlers) => {
        // Store the route handlers for testing
        if (path === '/:agentId/metrics') {
          getMetricsHandler = handlers[handlers.length - 1];
        } else if (path === '/:agentId/campaigns') {
          getCampaignsHandler = handlers[handlers.length - 1];
        }
        return this;
      }),
    }),
  };
});

// Mock the agent manager
jest.mock('../../agents', () => ({
  getAgentManager: jest.fn(),
}));

// Mock the auth middleware
jest.mock('../../middleware/auth', () => ({
  authenticateToken: jest.fn((req, res, next) => next()),
}));

// Reference to route handlers
let runAgentHandler: (req: Request, res: Response) => Promise<any>;
let getMetricsHandler: (req: Request, res: Response) => Promise<any>;
let getCampaignsHandler: (req: Request, res: Response) => Promise<any>;

describe('Agent Campaign Routes', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockAgentManager: any;
  
  beforeEach(() => {
    // Initialize the module to capture route handlers
    require('../../routes/agents/campaign');
    
    // Setup mock request and response
    mockReq = {
      params: {},
      body: {},
      query: {},
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    // Setup mock agent manager
    mockAgentManager = {
      startAgent: jest.fn(),
      isAgentRunning: jest.fn(),
    };
    (getAgentManager as jest.Mock).mockReturnValue(mockAgentManager);
  });
  
  describe('POST /:agentId/run', () => {
    it('should return 400 if agent ID is missing', async () => {
      mockReq.params = {};
      
      await runAgentHandler(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Agent ID is required' })
      );
    });
    
    it('should return 404 if agent not found', async () => {
      mockReq.params = { agentId: 'non-existent-id' };
      
      prisma.aIAgent.findUnique.mockResolvedValue(null);
      
      await runAgentHandler(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Agent with ID non-existent-id not found' })
      );
    });
    
    it('should return 404 if campaign ID provided but not found', async () => {
      mockReq.params = { agentId: 'agent-id' };
      mockReq.body = { campaignId: 'non-existent-campaign' };
      
      prisma.campaign.findUnique.mockResolvedValue(null);
      
      await runAgentHandler(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Campaign with ID non-existent-campaign not found' })
      );
    });
    
    it('should return 409 if agent is already running', async () => {
      mockReq.params = { agentId: 'agent-id' };
      
      const agent = createTestAgent();
      prisma.aIAgent.findUnique.mockResolvedValue(agent);
      
      mockAgentManager.isAgentRunning.mockReturnValue(true);
      
      await runAgentHandler(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ 
          error: 'Agent agent-id is already running',
          status: 'already_running'
        })
      );
    });
    
    it('should start the agent with correct parameters and return success', async () => {
      const agentId = 'agent-id';
      const campaignId = 'campaign-id';
      const config = { topic: 'test' };
      const tokenUsage = { input: 100, output: 400, total: 500 };
      
      mockReq.params = { agentId };
      mockReq.body = { campaignId, config, tokenUsage };
      
      const agent = createTestAgent({ id: agentId });
      const campaign = createTestCampaign({ id: campaignId });
      
      prisma.aIAgent.findUnique.mockResolvedValue(agent);
      prisma.campaign.findUnique.mockResolvedValue(campaign);
      
      mockAgentManager.isAgentRunning.mockReturnValue(false);
      mockAgentManager.startAgent.mockResolvedValue({ status: 'success', data: 'test-result' });
      
      await runAgentHandler(mockReq as Request, mockRes as Response);
      
      expect(mockAgentManager.startAgent).toHaveBeenCalledWith(
        agentId,
        campaignId,
        {
          config,
          trackMetrics: true,
          tokenUsage
        }
      );
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        data: { status: 'success', data: 'test-result' },
      });
    });
    
    it('should handle errors and return 500', async () => {
      mockReq.params = { agentId: 'agent-id' };
      
      const agent = createTestAgent();
      prisma.aIAgent.findUnique.mockResolvedValue(agent);
      
      mockAgentManager.isAgentRunning.mockReturnValue(false);
      mockAgentManager.startAgent.mockRejectedValue(new Error('Test error'));
      
      await runAgentHandler(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Test error' })
      );
    });
  });
  
  describe('GET /:agentId/metrics', () => {
    it('should return 400 if agent ID is missing', async () => {
      mockReq.params = {};
      
      await getMetricsHandler(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Agent ID is required' })
      );
    });
    
    it('should return metrics for an agent', async () => {
      mockReq.params = { agentId: 'agent-id' };
      
      const metrics = [
        createTestMetric(),
        createTestMetric(),
      ];
      
      prisma.metric.findMany.mockResolvedValue(metrics);
      
      await getMetricsHandler(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        count: 2,
        data: metrics,
      });
    });
    
    it('should filter metrics by campaign ID if provided', async () => {
      const agentId = 'agent-id';
      const campaignId = 'campaign-id';
      
      mockReq.params = { agentId };
      mockReq.query = { campaignId };
      
      const allMetrics = [
        createTestMetric({ campaignId }),
        createTestMetric({ campaignId: 'other-campaign' }),
      ];
      
      prisma.metric.findMany.mockResolvedValue(allMetrics);
      
      await getMetricsHandler(mockReq as Request, mockRes as Response);
      
      // Should only return metrics for the specified campaign
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        count: 1,
        data: [allMetrics[0]],
      });
    });
    
    it('should handle errors and return 500', async () => {
      mockReq.params = { agentId: 'agent-id' };
      
      prisma.metric.findMany.mockRejectedValue(new Error('Test error'));
      
      await getMetricsHandler(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Test error' })
      );
    });
  });
  
  describe('GET /:agentId/campaigns', () => {
    it('should return 400 if agent ID is missing', async () => {
      mockReq.params = {};
      
      await getCampaignsHandler(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Agent ID is required' })
      );
    });
    
    it('should return campaigns linked to an agent', async () => {
      mockReq.params = { agentId: 'agent-id' };
      
      const campaigns = [
        createTestCampaign(),
        createTestCampaign(),
      ];
      
      prisma.campaign.findMany.mockResolvedValue(campaigns);
      
      await getCampaignsHandler(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'success',
        count: 2,
        data: campaigns,
      });
      
      expect(prisma.campaign.findMany).toHaveBeenCalledWith({
        where: {
          agents: {
            some: {
              id: 'agent-id',
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    });
    
    it('should handle errors and return 500', async () => {
      mockReq.params = { agentId: 'agent-id' };
      
      prisma.campaign.findMany.mockRejectedValue(new Error('Test error'));
      
      await getCampaignsHandler(mockReq as Request, mockRes as Response);
      
      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Test error' })
      );
    });
  });
}); 