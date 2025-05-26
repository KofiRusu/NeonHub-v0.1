"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const prismaMock_1 = require("../mocks/prismaMock");
const agents_1 = require("../../agents");
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
                }
                else if (path === '/:agentId/campaigns') {
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
let runAgentHandler;
let getMetricsHandler;
let getCampaignsHandler;
describe('Agent Campaign Routes', () => {
    let mockReq;
    let mockRes;
    let mockAgentManager;
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
        agents_1.getAgentManager.mockReturnValue(mockAgentManager);
    });
    describe('POST /:agentId/run', () => {
        it('should return 400 if agent ID is missing', async () => {
            mockReq.params = {};
            await runAgentHandler(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Agent ID is required' }));
        });
        it('should return 404 if agent not found', async () => {
            mockReq.params = { agentId: 'non-existent-id' };
            prismaMock_1.prisma.aIAgent.findUnique.mockResolvedValue(null);
            await runAgentHandler(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Agent with ID non-existent-id not found',
            }));
        });
        it('should return 404 if campaign ID provided but not found', async () => {
            mockReq.params = { agentId: 'agent-id' };
            mockReq.body = { campaignId: 'non-existent-campaign' };
            prismaMock_1.prisma.campaign.findUnique.mockResolvedValue(null);
            await runAgentHandler(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Campaign with ID non-existent-campaign not found',
            }));
        });
        it('should return 409 if agent is already running', async () => {
            mockReq.params = { agentId: 'agent-id' };
            const agent = (0, prismaMock_1.createTestAgent)();
            prismaMock_1.prisma.aIAgent.findUnique.mockResolvedValue(agent);
            mockAgentManager.isAgentRunning.mockReturnValue(true);
            await runAgentHandler(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(409);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Agent agent-id is already running',
                status: 'already_running',
            }));
        });
        it('should start the agent with correct parameters and return success', async () => {
            const agentId = 'agent-id';
            const campaignId = 'campaign-id';
            const config = { topic: 'test' };
            const tokenUsage = { input: 100, output: 400, total: 500 };
            mockReq.params = { agentId };
            mockReq.body = { campaignId, config, tokenUsage };
            const agent = (0, prismaMock_1.createTestAgent)({ id: agentId });
            const campaign = (0, prismaMock_1.createTestCampaign)({ id: campaignId });
            prismaMock_1.prisma.aIAgent.findUnique.mockResolvedValue(agent);
            prismaMock_1.prisma.campaign.findUnique.mockResolvedValue(campaign);
            mockAgentManager.isAgentRunning.mockReturnValue(false);
            mockAgentManager.startAgent.mockResolvedValue({
                status: 'success',
                data: 'test-result',
            });
            await runAgentHandler(mockReq, mockRes);
            expect(mockAgentManager.startAgent).toHaveBeenCalledWith(agentId, campaignId, {
                config,
                trackMetrics: true,
                tokenUsage,
            });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                data: { status: 'success', data: 'test-result' },
            });
        });
        it('should handle errors and return 500', async () => {
            mockReq.params = { agentId: 'agent-id' };
            const agent = (0, prismaMock_1.createTestAgent)();
            prismaMock_1.prisma.aIAgent.findUnique.mockResolvedValue(agent);
            mockAgentManager.isAgentRunning.mockReturnValue(false);
            mockAgentManager.startAgent.mockRejectedValue(new Error('Test error'));
            await runAgentHandler(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Test error' }));
        });
    });
    describe('GET /:agentId/metrics', () => {
        it('should return 400 if agent ID is missing', async () => {
            mockReq.params = {};
            await getMetricsHandler(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Agent ID is required' }));
        });
        it('should return metrics for an agent', async () => {
            mockReq.params = { agentId: 'agent-id' };
            const metrics = [(0, prismaMock_1.createTestMetric)(), (0, prismaMock_1.createTestMetric)()];
            prismaMock_1.prisma.metric.findMany.mockResolvedValue(metrics);
            await getMetricsHandler(mockReq, mockRes);
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
                (0, prismaMock_1.createTestMetric)({ campaignId }),
                (0, prismaMock_1.createTestMetric)({ campaignId: 'other-campaign' }),
            ];
            prismaMock_1.prisma.metric.findMany.mockResolvedValue(allMetrics);
            await getMetricsHandler(mockReq, mockRes);
            // Should only return metrics for the specified campaign
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                count: 1,
                data: [allMetrics[0]],
            });
        });
        it('should handle errors and return 500', async () => {
            mockReq.params = { agentId: 'agent-id' };
            prismaMock_1.prisma.metric.findMany.mockRejectedValue(new Error('Test error'));
            await getMetricsHandler(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Test error' }));
        });
    });
    describe('GET /:agentId/campaigns', () => {
        it('should return 400 if agent ID is missing', async () => {
            mockReq.params = {};
            await getCampaignsHandler(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Agent ID is required' }));
        });
        it('should return campaigns linked to an agent', async () => {
            mockReq.params = { agentId: 'agent-id' };
            const campaigns = [(0, prismaMock_1.createTestCampaign)(), (0, prismaMock_1.createTestCampaign)()];
            prismaMock_1.prisma.campaign.findMany.mockResolvedValue(campaigns);
            await getCampaignsHandler(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'success',
                count: 2,
                data: campaigns,
            });
            expect(prismaMock_1.prisma.campaign.findMany).toHaveBeenCalledWith({
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
            prismaMock_1.prisma.campaign.findMany.mockRejectedValue(new Error('Test error'));
            await getCampaignsHandler(mockReq, mockRes);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Test error' }));
        });
    });
});
//# sourceMappingURL=agentCampaign.routes.test.js.map