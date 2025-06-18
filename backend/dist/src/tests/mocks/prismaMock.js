'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.createTestExecutionSession =
  exports.createTestMetric =
  exports.createTestCampaign =
  exports.createTestAgent =
  exports.generateId =
  exports.prisma =
    void 0;
const jest_mock_extended_1 = require('jest-mock-extended');
const uuid_1 = require('uuid');
// Mock Prisma Client
exports.prisma = (0, jest_mock_extended_1.mockDeep)();
// Reset mocks between tests
beforeEach(() => {
  (0, jest_mock_extended_1.mockReset)(exports.prisma);
});
// Helper for generating test IDs
const generateId = () => (0, uuid_1.v4)();
exports.generateId = generateId;
// Helper to create a test agent
const createTestAgent = (overrides = {}) => ({
  id: (0, exports.generateId)(),
  name: 'Test Agent',
  description: 'Agent for testing',
  agentType: 'CONTENT_CREATOR',
  status: 'IDLE',
  configuration: {},
  projectId: (0, exports.generateId)(),
  managerId: (0, exports.generateId)(),
  lastRunAt: null,
  nextRunAt: null,
  scheduleExpression: null,
  scheduleEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
exports.createTestAgent = createTestAgent;
// Helper to create a test campaign
const createTestCampaign = (overrides = {}) => ({
  id: (0, exports.generateId)(),
  name: 'Test Campaign',
  description: 'Campaign for testing',
  status: 'ACTIVE',
  campaignType: 'SOCIAL_MEDIA',
  goals: {},
  targeting: {},
  budget: null,
  startDate: null,
  endDate: null,
  projectId: (0, exports.generateId)(),
  ownerId: (0, exports.generateId)(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});
exports.createTestCampaign = createTestCampaign;
// Helper to create a test metric
const createTestMetric = (overrides = {}) => ({
  id: (0, exports.generateId)(),
  name: 'agent_execution_time',
  value: 1500,
  source: 'agent',
  unit: 'ms',
  dimension: null,
  campaignId: null,
  projectId: (0, exports.generateId)(),
  metadata: {},
  timestamp: new Date(),
  ...overrides,
});
exports.createTestMetric = createTestMetric;
// Helper to create a test execution session
const createTestExecutionSession = (overrides = {}) => ({
  id: (0, exports.generateId)(),
  agentId: (0, exports.generateId)(),
  startedAt: new Date(),
  completedAt: null,
  success: null,
  duration: null,
  outputSummary: null,
  logs: [],
  context: {},
  metrics: {},
  errorMessage: null,
  createdAt: new Date(),
  ...overrides,
});
exports.createTestExecutionSession = createTestExecutionSession;
