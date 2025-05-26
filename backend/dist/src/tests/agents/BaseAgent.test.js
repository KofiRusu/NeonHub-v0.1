"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseAgent_1 = require("../../agents/base/BaseAgent");
const jest_mock_extended_1 = require("jest-mock-extended");
// Mock implementation of BaseAgent for testing
class TestAgent extends BaseAgent_1.BaseAgent {
    shouldFail = false;
    failureCount = 0;
    maxFailures = 0;
    constructor(prisma, agentData) {
        super(prisma, agentData);
    }
    setFailureMode(shouldFail, maxFailures = 1) {
        this.shouldFail = shouldFail;
        this.maxFailures = maxFailures;
        this.failureCount = 0;
    }
    async executeImpl(config) {
        if (this.shouldFail && this.failureCount < this.maxFailures) {
            this.failureCount++;
            throw new Error(`Test failure ${this.failureCount}`);
        }
        // Simulate some work
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
            success: true,
            data: 'Test execution completed',
            config,
        };
    }
    async stopImpl() {
        this.logEvent(BaseAgent_1.AgentEventType.CUSTOM_EVENT, 'Test agent stopped');
    }
    // Expose protected methods for testing
    testLogEvent(type, message, data, level) {
        this.logEvent(type, message, data, level);
    }
    testCheckShouldStop() {
        return this.checkShouldStop();
    }
    // Expose logMessage as public for testing
    async testLogMessage(message, level) {
        return this.logMessage(message, level);
    }
}
// Mock the services
jest.mock('../../../services', () => ({
    getCampaignService: jest.fn(() => ({
        getOrCreateCampaignForAgent: jest
            .fn()
            .mockResolvedValue({ id: 'test-campaign-id' }),
    })),
    getMetricService: jest.fn(() => ({
        logAgentExecutionMetrics: jest.fn().mockResolvedValue(undefined),
    })),
}));
describe('BaseAgent', () => {
    let mockPrisma;
    let testAgent;
    let mockAgentData;
    beforeEach(() => {
        mockPrisma = (0, jest_mock_extended_1.mockDeep)();
        mockAgentData = {
            id: 'test-agent-id',
            name: 'Test Agent',
            description: 'Test agent for unit testing',
            agentType: 'CONTENT_CREATOR',
            configuration: { test: true },
            status: 'IDLE',
            projectId: 'test-project-id',
            managerId: 'test-manager-id',
            lastRunAt: null,
            nextRunAt: null,
            scheduleExpression: null,
            scheduleEnabled: false,
            createdAt: new Date(),
            updatedAt: new Date(),
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
                createdAt: new Date(),
            });
            mockPrisma.agentExecutionSession.update.mockResolvedValue({});
        });
        it('should execute successfully and log events', async () => {
            const config = { testConfig: true };
            const options = { trackMetrics: true };
            const result = await testAgent.execute(config, options);
            expect(result).toEqual({
                success: true,
                data: 'Test execution completed',
                config,
                campaignId: 'test-campaign-id',
                executionTime: expect.any(Number),
                sessionId: 'test-session-id',
                events: expect.any(Array),
            });
            // Check that events were logged
            const events = testAgent.getEvents();
            expect(events).toHaveLength(2); // Start and completion events
            expect(events[0].type).toBe(BaseAgent_1.AgentEventType.EXECUTION_STARTED);
            expect(events[1].type).toBe(BaseAgent_1.AgentEventType.EXECUTION_COMPLETED);
        });
        it('should retry on failure and eventually succeed', async () => {
            testAgent.setFailureMode(true, 2); // Fail twice, then succeed
            const config = { testConfig: true };
            const options = { maxRetries: 3, retryDelay: 10 };
            const result = await testAgent.execute(config, options);
            expect(result.success).toBe(true);
            // Check retry events - BaseAgent logs 2 events per retry (info + warning)
            const events = testAgent.getEvents();
            const retryEvents = events.filter((e) => e.type === BaseAgent_1.AgentEventType.RETRY_ATTEMPT);
            expect(retryEvents).toHaveLength(4); // Two retries, each with 2 events (info + warning)
        });
        it('should fail after max retries', async () => {
            testAgent.setFailureMode(true, 5); // Always fail
            const config = { testConfig: true };
            const options = { maxRetries: 2, retryDelay: 10 };
            await expect(testAgent.execute(config, options)).rejects.toThrow('Test failure');
            // Check that session was updated with error
            expect(mockPrisma.agentExecutionSession.update).toHaveBeenCalledWith({
                where: { id: 'test-session-id' },
                data: expect.objectContaining({
                    success: false,
                    errorMessage: expect.stringContaining('Test failure'),
                }),
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
            testAgent.testLogEvent(BaseAgent_1.AgentEventType.CUSTOM_EVENT, 'Test message', testData, 'info');
            const events = testAgent.getEvents();
            expect(events).toHaveLength(1);
            const event = events[0];
            expect(event.type).toBe(BaseAgent_1.AgentEventType.CUSTOM_EVENT);
            expect(event.message).toBe('Test message');
            expect(event.data).toEqual(testData);
            expect(event.level).toBe('info');
            expect(event.timestamp).toBeInstanceOf(Date);
        });
        it('should accumulate multiple events', () => {
            testAgent.testLogEvent(BaseAgent_1.AgentEventType.CUSTOM_EVENT, 'Event 1');
            testAgent.testLogEvent(BaseAgent_1.AgentEventType.CUSTOM_EVENT, 'Event 2');
            testAgent.testLogEvent(BaseAgent_1.AgentEventType.CUSTOM_EVENT, 'Event 3');
            const events = testAgent.getEvents();
            expect(events).toHaveLength(3);
            expect(events.map((e) => e.message)).toEqual([
                'Event 1',
                'Event 2',
                'Event 3',
            ]);
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
                executionTime: undefined,
            });
        });
    });
    describe('stop functionality', () => {
        it('should stop execution gracefully', async () => {
            await testAgent.stop();
            expect(testAgent.testCheckShouldStop()).toBe(true);
            const events = testAgent.getEvents();
            const stopEvent = events.find((e) => e.type === BaseAgent_1.AgentEventType.STOP_REQUESTED);
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
            expect(events[0].type).toBe(BaseAgent_1.AgentEventType.CUSTOM_EVENT);
            expect(events[0].message).toBe('Legacy message');
            expect(events[0].level).toBe('warning');
        });
    });
});
//# sourceMappingURL=BaseAgent.test.js.map