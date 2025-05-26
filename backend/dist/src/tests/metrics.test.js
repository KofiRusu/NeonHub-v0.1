"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const jwt_1 = require("../utils/jwt");
// Mocking authentication
jest.mock('../middleware/auth.middleware', () => ({
    protect: (req, res, next) => {
        req.user = { id: 'test-user-id' };
        next();
    },
}));
describe('Metrics API Routes', () => {
    let testProject;
    let testCampaign;
    let testMetric;
    let authToken;
    beforeAll(async () => {
        // Setup test data
        const testUser = await index_1.prisma.user.create({
            data: {
                name: 'Test User',
                email: 'metric-test@example.com',
                password: 'hashed-password',
            },
        });
        authToken = (0, jwt_1.generateJWT)({
            id: testUser.id,
            email: testUser.email,
            role: testUser.role,
        });
        testProject = await index_1.prisma.project.create({
            data: {
                name: 'Test Project',
                description: 'Test project for metric API tests',
                ownerId: testUser.id,
            },
        });
        testCampaign = await index_1.prisma.campaign.create({
            data: {
                name: 'Test Campaign',
                description: 'Test campaign for metric API tests',
                campaignType: 'SOCIAL_MEDIA',
                goals: {},
                targeting: {},
                status: 'DRAFT',
                ownerId: testUser.id,
                projectId: testProject.id,
            },
        });
        testMetric = await index_1.prisma.metric.create({
            data: {
                name: 'Test Metric',
                source: 'TEST',
                value: 100,
                unit: 'count',
                campaignId: testCampaign.id,
                projectId: testProject.id,
            },
        });
    });
    afterAll(async () => {
        // Clean up test data
        await index_1.prisma.metric.deleteMany({
            where: { name: 'Test Metric' },
        });
        await index_1.prisma.campaign.deleteMany({
            where: { name: 'Test Campaign' },
        });
        await index_1.prisma.project.deleteMany({
            where: { name: 'Test Project' },
        });
        await index_1.prisma.user.deleteMany({
            where: { email: 'metric-test@example.com' },
        });
    });
    // Test GET /api/metrics
    it('should get all metrics', async () => {
        // TODO: Implement this test
        expect(true).toBe(true);
    });
    // Test GET /api/metrics/:id
    it('should get a single metric by ID', async () => {
        // TODO: Implement this test
        expect(true).toBe(true);
    });
    // Test POST /api/metrics
    it('should create a new metric', async () => {
        // TODO: Implement this test
        expect(true).toBe(true);
    });
    // Test PUT /api/metrics/:id
    it('should update a metric', async () => {
        // TODO: Implement this test
        expect(true).toBe(true);
    });
    // Test DELETE /api/metrics/:id
    it('should delete a metric', async () => {
        // TODO: Implement this test
        expect(true).toBe(true);
    });
    // Test GET /api/metrics/summary
    it('should get metrics summary', async () => {
        // TODO: Implement this test
        expect(true).toBe(true);
    });
});
//# sourceMappingURL=metrics.test.js.map