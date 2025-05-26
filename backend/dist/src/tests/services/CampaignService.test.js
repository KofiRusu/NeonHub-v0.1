"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CampaignService_1 = require("../../../services/CampaignService");
const prismaMock_1 = require("../mocks/prismaMock");
describe('CampaignService', () => {
    let campaignService;
    beforeEach(() => {
        campaignService = new CampaignService_1.CampaignService(prismaMock_1.prisma);
    });
    describe('getCampaign', () => {
        it('should get a campaign by ID', async () => {
            const testCampaign = (0, prismaMock_1.createTestCampaign)();
            prismaMock_1.prisma.campaign.findUnique.mockResolvedValue(testCampaign);
            const result = await campaignService.getCampaign(testCampaign.id);
            expect(result).toEqual(testCampaign);
            expect(prismaMock_1.prisma.campaign.findUnique).toHaveBeenCalledWith({
                where: { id: testCampaign.id },
            });
        });
        it('should return null if campaign not found', async () => {
            prismaMock_1.prisma.campaign.findUnique.mockResolvedValue(null);
            const result = await campaignService.getCampaign('non-existent-id');
            expect(result).toBeNull();
        });
    });
    describe('getOrCreateCampaignForAgent', () => {
        it('should return existing campaign if campaign ID is provided', async () => {
            const testAgent = (0, prismaMock_1.createTestAgent)();
            const testCampaign = (0, prismaMock_1.createTestCampaign)();
            prismaMock_1.prisma.campaign.findUnique.mockResolvedValue(testCampaign);
            prismaMock_1.prisma.campaign.findFirst.mockResolvedValue(null);
            const result = await campaignService.getOrCreateCampaignForAgent(testAgent, testCampaign.id);
            expect(result).toEqual(testCampaign);
            expect(prismaMock_1.prisma.campaign.findUnique).toHaveBeenCalledWith({
                where: { id: testCampaign.id },
            });
        });
        it('should throw error if provided campaign ID is not found', async () => {
            const testAgent = (0, prismaMock_1.createTestAgent)();
            prismaMock_1.prisma.campaign.findUnique.mockResolvedValue(null);
            await expect(campaignService.getOrCreateCampaignForAgent(testAgent, 'non-existent-id')).rejects.toThrow('Campaign with ID non-existent-id not found');
        });
        it('should return existing active campaign for agent if no ID provided', async () => {
            const testAgent = (0, prismaMock_1.createTestAgent)();
            const testCampaign = (0, prismaMock_1.createTestCampaign)();
            prismaMock_1.prisma.campaign.findFirst.mockResolvedValue(testCampaign);
            const result = await campaignService.getOrCreateCampaignForAgent(testAgent);
            expect(result).toEqual(testCampaign);
            expect(prismaMock_1.prisma.campaign.findFirst).toHaveBeenCalledWith({
                where: {
                    agents: {
                        some: {
                            id: testAgent.id,
                        },
                    },
                    status: { in: ['ACTIVE', 'SCHEDULED'] },
                },
            });
        });
        it('should create new campaign if no active campaign exists', async () => {
            const testAgent = (0, prismaMock_1.createTestAgent)({
                agentType: 'CONTENT_CREATOR',
                name: 'Content Creator',
                projectId: 'project-id',
                managerId: 'manager-id',
            });
            const newCampaign = (0, prismaMock_1.createTestCampaign)({
                name: `${testAgent.name} Campaign`,
                projectId: testAgent.projectId,
                ownerId: testAgent.managerId,
            });
            prismaMock_1.prisma.campaign.findFirst.mockResolvedValue(null);
            prismaMock_1.prisma.campaign.create.mockResolvedValue(newCampaign);
            const result = await campaignService.getOrCreateCampaignForAgent(testAgent);
            expect(result).toEqual(newCampaign);
            expect(prismaMock_1.prisma.campaign.create).toHaveBeenCalled();
            const createArg = prismaMock_1.prisma.campaign.create.mock.calls[0][0];
            expect(createArg.data.name).toContain(testAgent.name);
            expect(createArg.data.projectId).toBe(testAgent.projectId);
            expect(createArg.data.ownerId).toBe(testAgent.managerId);
            expect(createArg.data.campaignType).toBe('CONTENT_MARKETING');
        });
    });
    describe('connectAgentToCampaign', () => {
        it('should do nothing if agent already connected to campaign', async () => {
            const agentId = 'agent-id';
            const campaignId = 'campaign-id';
            const campaign = (0, prismaMock_1.createTestCampaign)({ id: campaignId });
            prismaMock_1.prisma.campaign.findFirst.mockResolvedValue(campaign);
            await campaignService.connectAgentToCampaign(agentId, campaignId);
            expect(prismaMock_1.prisma.campaign.update).not.toHaveBeenCalled();
        });
        it('should connect agent to campaign if not already connected', async () => {
            const agentId = 'agent-id';
            const campaignId = 'campaign-id';
            prismaMock_1.prisma.campaign.findFirst.mockResolvedValue(null);
            await campaignService.connectAgentToCampaign(agentId, campaignId);
            expect(prismaMock_1.prisma.campaign.update).toHaveBeenCalledWith({
                where: { id: campaignId },
                data: {
                    agents: {
                        connect: { id: agentId },
                    },
                },
            });
        });
    });
    describe('updateCampaignStatus', () => {
        it('should update campaign status', async () => {
            const campaignId = 'campaign-id';
            const updatedCampaign = (0, prismaMock_1.createTestCampaign)({
                id: campaignId,
                status: 'COMPLETED',
            });
            prismaMock_1.prisma.campaign.update.mockResolvedValue(updatedCampaign);
            const result = await campaignService.updateCampaignStatus(campaignId, 'COMPLETED');
            expect(result).toEqual(updatedCampaign);
            expect(prismaMock_1.prisma.campaign.update).toHaveBeenCalledWith({
                where: { id: campaignId },
                data: { status: 'COMPLETED' },
            });
        });
    });
    describe('getCampaignService', () => {
        it('should return singleton instance', () => {
            const service1 = (0, CampaignService_1.getCampaignService)(prismaMock_1.prisma);
            const service2 = (0, CampaignService_1.getCampaignService)(prismaMock_1.prisma);
            expect(service1).toBe(service2);
        });
    });
});
//# sourceMappingURL=CampaignService.test.js.map