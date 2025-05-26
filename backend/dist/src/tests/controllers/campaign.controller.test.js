"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../../app");
const services_1 = require("../../services");
// Mock services
jest.mock('../../services');
const mockGetCampaignService = services_1.getCampaignService;
const mockCampaignService = {
    getCampaigns: jest.fn(),
    getCampaign: jest.fn(),
    createCampaign: jest.fn(),
    updateCampaign: jest.fn(),
    deleteCampaign: jest.fn(),
    getCampaignAnalytics: jest.fn(),
    scheduleCampaign: jest.fn(),
};
// Mock middleware for authentication
jest.mock('../../middleware/auth.middleware', () => ({
    protect: (req, res, next) => {
        req.user = {
            id: 'user-123',
            email: 'test@example.com',
            role: 'USER',
        };
        next();
    },
}));
describe('Campaign Controller', () => {
    beforeEach(() => {
        mockGetCampaignService.mockReturnValue(mockCampaignService);
        jest.clearAllMocks();
    });
    afterAll(async () => {
        app_1.server.close();
    });
    describe('GET /api/campaigns', () => {
        it('should return all campaigns for a user', async () => {
            const mockCampaigns = [
                { id: 'campaign-1', name: 'Campaign 1', ownerId: 'user-123' },
                { id: 'campaign-2', name: 'Campaign 2', ownerId: 'user-123' },
            ];
            mockCampaignService.getCampaigns.mockResolvedValueOnce(mockCampaigns);
            const response = await (0, supertest_1.default)(app_1.app).get('/api/campaigns').expect(200);
            expect(mockCampaignService.getCampaigns).toHaveBeenCalledWith('user-123', undefined, false);
            expect(response.body).toEqual({
                success: true,
                data: mockCampaigns,
            });
        });
        it('should filter campaigns by project ID', async () => {
            const mockCampaigns = [
                {
                    id: 'campaign-1',
                    name: 'Campaign 1',
                    ownerId: 'user-123',
                    projectId: 'project-456',
                },
            ];
            mockCampaignService.getCampaigns.mockResolvedValueOnce(mockCampaigns);
            const response = await (0, supertest_1.default)(app_1.app)
                .get('/api/campaigns?projectId=project-456')
                .expect(200);
            expect(mockCampaignService.getCampaigns).toHaveBeenCalledWith('user-123', 'project-456', false);
            expect(response.body).toEqual({
                success: true,
                data: mockCampaigns,
            });
        });
        it('should include related data when includeRelated is true', async () => {
            const mockCampaigns = [
                { id: 'campaign-1', name: 'Campaign 1', ownerId: 'user-123' },
            ];
            mockCampaignService.getCampaigns.mockResolvedValueOnce(mockCampaigns);
            const response = await (0, supertest_1.default)(app_1.app)
                .get('/api/campaigns?includeRelated=true')
                .expect(200);
            expect(mockCampaignService.getCampaigns).toHaveBeenCalledWith('user-123', undefined, true);
            expect(response.body).toEqual({
                success: true,
                data: mockCampaigns,
            });
        });
    });
    describe('GET /api/campaigns/:id', () => {
        it('should return a campaign by ID', async () => {
            const mockCampaign = {
                id: 'campaign-123',
                name: 'Test Campaign',
                ownerId: 'user-123',
            };
            mockCampaignService.getCampaign.mockResolvedValueOnce(mockCampaign);
            const response = await (0, supertest_1.default)(app_1.app)
                .get('/api/campaigns/campaign-123')
                .expect(200);
            expect(mockCampaignService.getCampaign).toHaveBeenCalledWith('campaign-123', false);
            expect(response.body).toEqual({
                success: true,
                data: mockCampaign,
            });
        });
        it('should return 404 if campaign not found', async () => {
            mockCampaignService.getCampaign.mockResolvedValueOnce(null);
            const response = await (0, supertest_1.default)(app_1.app)
                .get('/api/campaigns/non-existent')
                .expect(404);
            expect(response.body).toEqual({
                success: false,
                message: 'Campaign not found',
            });
        });
        it('should return 403 if user is not authorized to access the campaign', async () => {
            const mockCampaign = {
                id: 'campaign-123',
                name: 'Test Campaign',
                ownerId: 'different-user',
            };
            mockCampaignService.getCampaign.mockResolvedValueOnce(mockCampaign);
            const response = await (0, supertest_1.default)(app_1.app)
                .get('/api/campaigns/campaign-123')
                .expect(403);
            expect(response.body).toEqual({
                success: false,
                message: 'Not authorized to access this campaign',
            });
        });
    });
    describe('POST /api/campaigns', () => {
        it('should create a new campaign', async () => {
            const campaignData = {
                name: 'New Campaign',
                description: 'Test description',
                campaignType: 'CONTENT_MARKETING',
                projectId: 'project-456',
            };
            const mockCampaign = {
                id: 'campaign-123',
                ...campaignData,
                ownerId: 'user-123',
                status: 'DRAFT',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            mockCampaignService.createCampaign.mockResolvedValueOnce(mockCampaign);
            const response = await (0, supertest_1.default)(app_1.app)
                .post('/api/campaigns')
                .send(campaignData)
                .expect(201);
            expect(mockCampaignService.createCampaign).toHaveBeenCalledWith({
                ...campaignData,
                ownerId: 'user-123',
            });
            expect(response.body).toEqual({
                success: true,
                data: mockCampaign,
            });
        });
        it('should return 400 if required fields are missing', async () => {
            const response = await (0, supertest_1.default)(app_1.app)
                .post('/api/campaigns')
                .send({
                name: 'New Campaign',
            })
                .expect(400);
            expect(response.body).toEqual({
                success: false,
                message: expect.stringContaining('Please provide'),
            });
            expect(mockCampaignService.createCampaign).not.toHaveBeenCalled();
        });
        it('should return 400 for invalid campaign type', async () => {
            const response = await (0, supertest_1.default)(app_1.app)
                .post('/api/campaigns')
                .send({
                name: 'New Campaign',
                description: 'Test description',
                campaignType: 'INVALID_TYPE',
                projectId: 'project-456',
            })
                .expect(400);
            expect(response.body).toEqual({
                success: false,
                message: 'Invalid campaign type',
            });
            expect(mockCampaignService.createCampaign).not.toHaveBeenCalled();
        });
    });
    describe('PUT /api/campaigns/:id', () => {
        it('should update a campaign', async () => {
            const updateData = {
                name: 'Updated Campaign',
                description: 'Updated description',
                status: 'ACTIVE',
            };
            const existingCampaign = {
                id: 'campaign-123',
                name: 'Original Campaign',
                description: 'Original description',
                status: 'DRAFT',
                ownerId: 'user-123',
            };
            const updatedCampaign = {
                ...existingCampaign,
                ...updateData,
            };
            mockCampaignService.getCampaign.mockResolvedValueOnce(existingCampaign);
            mockCampaignService.updateCampaign.mockResolvedValueOnce(updatedCampaign);
            const response = await (0, supertest_1.default)(app_1.app)
                .put('/api/campaigns/campaign-123')
                .send(updateData)
                .expect(200);
            expect(mockCampaignService.getCampaign).toHaveBeenCalledWith('campaign-123');
            expect(mockCampaignService.updateCampaign).toHaveBeenCalledWith('campaign-123', updateData);
            expect(response.body).toEqual({
                success: true,
                data: updatedCampaign,
            });
        });
        it('should return 404 if campaign not found', async () => {
            mockCampaignService.getCampaign.mockResolvedValueOnce(null);
            const response = await (0, supertest_1.default)(app_1.app)
                .put('/api/campaigns/non-existent')
                .send({
                name: 'Updated Campaign',
            })
                .expect(404);
            expect(response.body).toEqual({
                success: false,
                message: 'Campaign not found',
            });
            expect(mockCampaignService.updateCampaign).not.toHaveBeenCalled();
        });
        it('should return 403 if user is not authorized to update the campaign', async () => {
            const existingCampaign = {
                id: 'campaign-123',
                name: 'Original Campaign',
                ownerId: 'different-user',
            };
            mockCampaignService.getCampaign.mockResolvedValueOnce(existingCampaign);
            const response = await (0, supertest_1.default)(app_1.app)
                .put('/api/campaigns/campaign-123')
                .send({
                name: 'Updated Campaign',
            })
                .expect(403);
            expect(response.body).toEqual({
                success: false,
                message: 'Not authorized to update this campaign',
            });
            expect(mockCampaignService.updateCampaign).not.toHaveBeenCalled();
        });
    });
    describe('DELETE /api/campaigns/:id', () => {
        it('should delete a campaign', async () => {
            const existingCampaign = {
                id: 'campaign-123',
                name: 'Campaign to Delete',
                ownerId: 'user-123',
            };
            mockCampaignService.getCampaign.mockResolvedValueOnce(existingCampaign);
            mockCampaignService.deleteCampaign.mockResolvedValueOnce(existingCampaign);
            const response = await (0, supertest_1.default)(app_1.app)
                .delete('/api/campaigns/campaign-123')
                .expect(204);
            expect(mockCampaignService.getCampaign).toHaveBeenCalledWith('campaign-123');
            expect(mockCampaignService.deleteCampaign).toHaveBeenCalledWith('campaign-123');
        });
        it('should return 404 if campaign not found', async () => {
            mockCampaignService.getCampaign.mockResolvedValueOnce(null);
            const response = await (0, supertest_1.default)(app_1.app)
                .delete('/api/campaigns/non-existent')
                .expect(404);
            expect(response.body).toEqual({
                success: false,
                message: 'Campaign not found',
            });
            expect(mockCampaignService.deleteCampaign).not.toHaveBeenCalled();
        });
        it('should return 403 if user is not authorized to delete the campaign', async () => {
            const existingCampaign = {
                id: 'campaign-123',
                name: 'Campaign to Delete',
                ownerId: 'different-user',
            };
            mockCampaignService.getCampaign.mockResolvedValueOnce(existingCampaign);
            const response = await (0, supertest_1.default)(app_1.app)
                .delete('/api/campaigns/campaign-123')
                .expect(403);
            expect(response.body).toEqual({
                success: false,
                message: 'Not authorized to delete this campaign',
            });
            expect(mockCampaignService.deleteCampaign).not.toHaveBeenCalled();
        });
    });
    describe('GET /api/campaigns/:id/analytics', () => {
        it('should return campaign analytics', async () => {
            const existingCampaign = {
                id: 'campaign-123',
                name: 'Test Campaign',
                ownerId: 'user-123',
            };
            const mockAnalytics = {
                campaignId: 'campaign-123',
                contentCount: 5,
                impressions: 1000,
                clicks: 200,
                conversions: 50,
                engagements: 300,
                revenueGenerated: 1500,
                roi: 150,
                metricsOverTime: [
                    {
                        timestamp: new Date().toISOString(),
                        metrics: {
                            impressions: 500,
                            clicks: 100,
                        },
                    },
                ],
            };
            mockCampaignService.getCampaign.mockResolvedValueOnce(existingCampaign);
            mockCampaignService.getCampaignAnalytics.mockResolvedValueOnce(mockAnalytics);
            const response = await (0, supertest_1.default)(app_1.app)
                .get('/api/campaigns/campaign-123/analytics')
                .expect(200);
            expect(mockCampaignService.getCampaign).toHaveBeenCalledWith('campaign-123');
            expect(mockCampaignService.getCampaignAnalytics).toHaveBeenCalledWith('campaign-123');
            expect(response.body).toEqual({
                success: true,
                data: mockAnalytics,
            });
        });
        it('should return 404 if campaign not found', async () => {
            mockCampaignService.getCampaign.mockResolvedValueOnce(null);
            const response = await (0, supertest_1.default)(app_1.app)
                .get('/api/campaigns/non-existent/analytics')
                .expect(404);
            expect(response.body).toEqual({
                success: false,
                message: 'Campaign not found',
            });
            expect(mockCampaignService.getCampaignAnalytics).not.toHaveBeenCalled();
        });
    });
    describe('POST /api/campaigns/:id/schedule', () => {
        it('should schedule a campaign', async () => {
            const existingCampaign = {
                id: 'campaign-123',
                name: 'Test Campaign',
                ownerId: 'user-123',
            };
            const scheduleData = {
                startDate: '2023-01-01T00:00:00.000Z',
                endDate: '2023-12-31T23:59:59.999Z',
            };
            const scheduledCampaign = {
                ...existingCampaign,
                startDate: new Date(scheduleData.startDate),
                endDate: new Date(scheduleData.endDate),
                status: 'SCHEDULED',
            };
            mockCampaignService.getCampaign.mockResolvedValueOnce(existingCampaign);
            mockCampaignService.scheduleCampaign.mockResolvedValueOnce(scheduledCampaign);
            const response = await (0, supertest_1.default)(app_1.app)
                .post('/api/campaigns/campaign-123/schedule')
                .send(scheduleData)
                .expect(200);
            expect(mockCampaignService.getCampaign).toHaveBeenCalledWith('campaign-123');
            expect(mockCampaignService.scheduleCampaign).toHaveBeenCalledWith('campaign-123', new Date(scheduleData.startDate), new Date(scheduleData.endDate));
            expect(response.body).toEqual({
                success: true,
                data: scheduledCampaign,
            });
        });
        it('should return 400 if no dates are provided', async () => {
            const response = await (0, supertest_1.default)(app_1.app)
                .post('/api/campaigns/campaign-123/schedule')
                .send({})
                .expect(400);
            expect(response.body).toEqual({
                success: false,
                message: 'Please provide at least one of startDate or endDate',
            });
            expect(mockCampaignService.scheduleCampaign).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=campaign.controller.test.js.map