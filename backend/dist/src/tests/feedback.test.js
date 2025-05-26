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
describe('Feedback API Routes', () => {
    let testProject;
    let testCampaign;
    let testContent;
    let testFeedback;
    let authToken;
    beforeAll(async () => {
        // Setup test data
        const testUser = await index_1.prisma.user.create({
            data: {
                name: 'Test User',
                email: 'feedback-test@example.com',
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
                description: 'Test project for feedback API tests',
                ownerId: testUser.id,
            },
        });
        testCampaign = await index_1.prisma.campaign.create({
            data: {
                name: 'Test Campaign',
                description: 'Test campaign for feedback API tests',
                campaignType: 'CONTENT_MARKETING',
                goals: {},
                targeting: {},
                status: 'DRAFT',
                ownerId: testUser.id,
                projectId: testProject.id,
            },
        });
        // Create a test agent
        const testAgent = await index_1.prisma.aIAgent.create({
            data: {
                name: 'Test Agent',
                description: 'Test agent for feedback tests',
                agentType: 'CONTENT_CREATOR',
                status: 'IDLE',
                configuration: {},
                projectId: testProject.id,
                managerId: testUser.id,
            },
        });
        // Create test content
        testContent = await index_1.prisma.generatedContent.create({
            data: {
                title: 'Test Content',
                content: 'This is test content for feedback API tests',
                contentType: 'BLOG_POST',
                status: 'DRAFT',
                agentId: testAgent.id,
                campaignId: testCampaign.id,
            },
        });
        // Create test feedback
        testFeedback = await index_1.prisma.feedback.create({
            data: {
                channel: 'IN_APP',
                content: 'This is test feedback',
                sentiment: 'POSITIVE',
                sourceType: 'CONTENT',
                sourceId: testContent.id,
                userId: testUser.id,
                contentId: testContent.id,
            },
        });
    });
    afterAll(async () => {
        // Clean up test data
        await index_1.prisma.feedback.deleteMany({
            where: { content: 'This is test feedback' },
        });
        await index_1.prisma.generatedContent.deleteMany({
            where: { title: 'Test Content' },
        });
        await index_1.prisma.aIAgent.deleteMany({
            where: { name: 'Test Agent' },
        });
        await index_1.prisma.campaign.deleteMany({
            where: { name: 'Test Campaign' },
        });
        await index_1.prisma.project.deleteMany({
            where: { name: 'Test Project' },
        });
        await index_1.prisma.user.deleteMany({
            where: { email: 'feedback-test@example.com' },
        });
    });
    // Test GET /api/feedback
    it('should get all feedback entries', async () => {
        // TODO: Implement this test
        expect(true).toBe(true);
    });
    // Test GET /api/feedback/:id
    it('should get a single feedback entry by ID', async () => {
        // TODO: Implement this test
        expect(true).toBe(true);
    });
    // Test POST /api/feedback
    it('should create a new feedback entry', async () => {
        // TODO: Implement this test
        expect(true).toBe(true);
    });
    // Test PUT /api/feedback/:id
    it('should update a feedback entry', async () => {
        // TODO: Implement this test
        expect(true).toBe(true);
    });
    // Test DELETE /api/feedback/:id
    it('should delete a feedback entry', async () => {
        // TODO: Implement this test
        expect(true).toBe(true);
    });
    // Test GET /api/feedback/sentiment-summary
    it('should get sentiment summary', async () => {
        // TODO: Implement this test
        expect(true).toBe(true);
    });
});
//# sourceMappingURL=feedback.test.js.map