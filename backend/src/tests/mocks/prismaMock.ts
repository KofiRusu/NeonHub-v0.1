import {
  PrismaClient,
  AgentType,
  AgentStatus,
  CampaignType,
  CampaignStatus,
} from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { v4 as uuidv4 } from 'uuid';

// Mock Prisma Client
export const prisma = mockDeep<PrismaClient>();

// Reset mocks between tests
beforeEach(() => {
  mockReset(prisma);
});

// Helper for generating test IDs
export const generateId = () => uuidv4();

// Helper to create a test agent
export const createTestAgent = (overrides: Partial<any> = {}) => ({
  id: generateId(),
  name: 'Test Agent',
  description: 'Agent for testing',
  agentType: 'CONTENT_CREATOR' as AgentType,
  status: 'IDLE' as AgentStatus,
  configuration: {} as Record<string, any>,
  projectId: generateId(),
  managerId: generateId(),
  lastRunAt: null,
  nextRunAt: null,
  scheduleExpression: null,
  scheduleEnabled: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create a test campaign
export const createTestCampaign = (overrides: Partial<any> = {}) => ({
  id: generateId(),
  name: 'Test Campaign',
  description: 'Campaign for testing',
  status: 'ACTIVE' as CampaignStatus,
  campaignType: 'SOCIAL_MEDIA' as CampaignType,
  goals: {} as Record<string, any>,
  targeting: {} as Record<string, any>,
  budget: null,
  startDate: null,
  endDate: null,
  projectId: generateId(),
  ownerId: generateId(),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Helper to create a test metric
export const createTestMetric = (overrides: Partial<any> = {}) => ({
  id: generateId(),
  name: 'agent_execution_time',
  value: 1500,
  source: 'agent',
  unit: 'ms',
  dimension: null,
  campaignId: null,
  projectId: generateId(),
  metadata: {} as Record<string, any>,
  timestamp: new Date(),
  ...overrides,
});

// Helper to create a test execution session
export const createTestExecutionSession = (overrides: Partial<any> = {}) => ({
  id: generateId(),
  agentId: generateId(),
  startedAt: new Date(),
  completedAt: null,
  success: null,
  duration: null,
  outputSummary: null,
  logs: [],
  context: {} as Record<string, any>,
  metrics: {} as Record<string, any>,
  errorMessage: null,
  createdAt: new Date(),
  ...overrides,
});

export type MockPrismaClient = DeepMockProxy<PrismaClient>;
