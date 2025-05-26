import { PrismaClient, AIAgent } from '@prisma/client';
import {
  AgentFactory,
  AgentPlugin,
  AgentPluginRegistry,
} from '../../agents/factory/AgentFactory';
import { BaseAgent } from '../../agents/base/BaseAgent';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';

// Mock agent implementation for testing
class MockAgent extends BaseAgent {
  protected async executeImpl(config: any): Promise<any> {
    return { success: true, data: 'mock execution' };
  }
}

describe('AgentPluginRegistry', () => {
  let registry: AgentPluginRegistry;
  let mockPlugin: AgentPlugin;

  beforeEach(() => {
    registry = new AgentPluginRegistry();

    mockPlugin = {
      type: 'CONTENT_CREATOR' as any,
      name: 'Test Content Creator',
      description: 'A test content creator plugin',
      version: '1.0.0',
      create: jest.fn((prisma, agentData) => new MockAgent(prisma, agentData)),
      validateConfig: jest.fn(() => true),
      getDefaultConfig: jest.fn(() => ({ defaultKey: 'defaultValue' })),
    };
  });

  describe('register', () => {
    it('should register a plugin successfully', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      registry.register(mockPlugin);

      expect(registry.has('CONTENT_CREATOR' as any)).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Registered agent plugin: Test Content Creator v1.0.0',
        ),
      );

      consoleSpy.mockRestore();
    });

    it('should warn when overwriting existing plugin', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      registry.register(mockPlugin);
      registry.register(mockPlugin); // Register again

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Plugin for agent type CONTENT_CREATOR is already registered',
        ),
      );

      consoleWarnSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });
  });

  describe('unregister', () => {
    it('should unregister a plugin successfully', () => {
      registry.register(mockPlugin);

      const result = registry.unregister('CONTENT_CREATOR' as any);

      expect(result).toBe(true);
      expect(registry.has('CONTENT_CREATOR' as any)).toBe(false);
    });

    it('should return false when unregistering non-existent plugin', () => {
      const result = registry.unregister('CONTENT_CREATOR' as any);

      expect(result).toBe(false);
    });
  });

  describe('get', () => {
    it('should return plugin when it exists', () => {
      registry.register(mockPlugin);

      const plugin = registry.get('CONTENT_CREATOR' as any);

      expect(plugin).toBe(mockPlugin);
    });

    it('should return undefined when plugin does not exist', () => {
      const plugin = registry.get('CONTENT_CREATOR' as any);

      expect(plugin).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all registered plugins', () => {
      const plugin2: AgentPlugin = {
        ...mockPlugin,
        type: 'TREND_ANALYZER' as any,
        name: 'Test Trend Analyzer',
      };

      registry.register(mockPlugin);
      registry.register(plugin2);

      const plugins = registry.getAll();

      expect(plugins).toHaveLength(2);
      expect(plugins).toContain(mockPlugin);
      expect(plugins).toContain(plugin2);
    });

    it('should return empty array when no plugins registered', () => {
      const plugins = registry.getAll();

      expect(plugins).toEqual([]);
    });
  });

  describe('getAvailableTypes', () => {
    it('should return all registered agent types', () => {
      const plugin2: AgentPlugin = {
        ...mockPlugin,
        type: 'TREND_ANALYZER' as any,
        name: 'Test Trend Analyzer',
      };

      registry.register(mockPlugin);
      registry.register(plugin2);

      const types = registry.getAvailableTypes();

      expect(types).toHaveLength(2);
      expect(types).toContain('CONTENT_CREATOR');
      expect(types).toContain('TREND_ANALYZER');
    });
  });
});

describe('AgentFactory', () => {
  let mockPrisma: DeepMockProxy<PrismaClient>;
  let registry: AgentPluginRegistry;
  let factory: AgentFactory;
  let mockPlugin: AgentPlugin;
  let mockAgentData: AIAgent;

  beforeEach(() => {
    mockPrisma = mockDeep<PrismaClient>();
    registry = new AgentPluginRegistry();
    factory = new AgentFactory(mockPrisma, registry);

    mockPlugin = {
      type: 'CONTENT_CREATOR' as any,
      name: 'Test Content Creator',
      description: 'A test content creator plugin',
      version: '1.0.0',
      create: jest.fn((prisma, agentData) => new MockAgent(prisma, agentData)),
      validateConfig: jest.fn(() => true),
      getDefaultConfig: jest.fn(() => ({ defaultKey: 'defaultValue' })),
    };

    mockAgentData = {
      id: 'test-agent-id',
      name: 'Test Agent',
      description: 'Test agent',
      agentType: 'CONTENT_CREATOR' as any,
      configuration: { testConfig: true },
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
  });

  describe('createAgent', () => {
    it('should create agent successfully when plugin exists', () => {
      registry.register(mockPlugin);

      const agent = factory.createAgent(mockAgentData);

      expect(agent).toBeInstanceOf(MockAgent);
      expect(mockPlugin.create).toHaveBeenCalledWith(mockPrisma, mockAgentData);
    });

    it('should throw error when no plugin registered for agent type', () => {
      expect(() => factory.createAgent(mockAgentData)).toThrow(
        'No plugin registered for agent type: CONTENT_CREATOR',
      );
    });

    it('should validate configuration when plugin provides validation', () => {
      const validateConfigSpy = jest.fn(() => false);
      mockPlugin.validateConfig = validateConfigSpy;
      registry.register(mockPlugin);

      expect(() => factory.createAgent(mockAgentData)).toThrow(
        'Invalid configuration for agent type: CONTENT_CREATOR',
      );

      expect(validateConfigSpy).toHaveBeenCalledWith(
        mockAgentData.configuration,
      );
    });

    it('should skip validation when plugin does not provide validation', () => {
      delete mockPlugin.validateConfig;
      registry.register(mockPlugin);

      const agent = factory.createAgent(mockAgentData);

      expect(agent).toBeInstanceOf(MockAgent);
    });
  });

  describe('getDefaultConfig', () => {
    it('should return default config when plugin provides it', () => {
      registry.register(mockPlugin);

      const config = factory.getDefaultConfig('CONTENT_CREATOR' as any);

      expect(config).toEqual({ defaultKey: 'defaultValue' });
      expect(mockPlugin.getDefaultConfig).toHaveBeenCalled();
    });

    it('should return empty object when plugin does not provide default config', () => {
      delete mockPlugin.getDefaultConfig;
      registry.register(mockPlugin);

      const config = factory.getDefaultConfig('CONTENT_CREATOR' as any);

      expect(config).toEqual({});
    });

    it('should return empty object when plugin does not exist', () => {
      const config = factory.getDefaultConfig('CONTENT_CREATOR' as any);

      expect(config).toEqual({});
    });
  });

  describe('validateConfig', () => {
    it('should validate config when plugin provides validation', () => {
      const validateConfigSpy = jest.fn(() => true);
      mockPlugin.validateConfig = validateConfigSpy;
      registry.register(mockPlugin);

      const testConfig = { test: true };
      const isValid = factory.validateConfig(
        'CONTENT_CREATOR' as any,
        testConfig,
      );

      expect(isValid).toBe(true);
      expect(validateConfigSpy).toHaveBeenCalledWith(testConfig);
    });

    it('should return true when plugin does not provide validation', () => {
      delete mockPlugin.validateConfig;
      registry.register(mockPlugin);

      const isValid = factory.validateConfig('CONTENT_CREATOR' as any, {
        test: true,
      });

      expect(isValid).toBe(true);
    });

    it('should return true when plugin does not exist', () => {
      const isValid = factory.validateConfig('CONTENT_CREATOR' as any, {
        test: true,
      });

      expect(isValid).toBe(true);
    });
  });

  describe('getPluginInfo', () => {
    it('should return plugin info when plugin exists', () => {
      registry.register(mockPlugin);

      const info = factory.getPluginInfo('CONTENT_CREATOR' as any);

      expect(info).toEqual({
        name: 'Test Content Creator',
        description: 'A test content creator plugin',
        version: '1.0.0',
      });
    });

    it('should return null when plugin does not exist', () => {
      const info = factory.getPluginInfo('CONTENT_CREATOR' as any);

      expect(info).toBeNull();
    });
  });

  describe('getAvailableAgentTypes', () => {
    it('should return all available agent types with their info', () => {
      const plugin2: AgentPlugin = {
        ...mockPlugin,
        type: 'TREND_ANALYZER' as any,
        name: 'Test Trend Analyzer',
        description: 'A test trend analyzer plugin',
        getDefaultConfig: () => ({ trendConfig: true }),
      };

      registry.register(mockPlugin);
      registry.register(plugin2);

      const types = factory.getAvailableAgentTypes();

      expect(types).toHaveLength(2);
      expect(types).toContainEqual({
        type: 'CONTENT_CREATOR',
        name: 'Test Content Creator',
        description: 'A test content creator plugin',
        version: '1.0.0',
        defaultConfig: { defaultKey: 'defaultValue' },
      });
      expect(types).toContainEqual({
        type: 'TREND_ANALYZER',
        name: 'Test Trend Analyzer',
        description: 'A test trend analyzer plugin',
        version: '1.0.0',
        defaultConfig: { trendConfig: true },
      });
    });

    it('should return empty array when no plugins registered', () => {
      const types = factory.getAvailableAgentTypes();

      expect(types).toEqual([]);
    });
  });

  describe('registerPlugin', () => {
    it('should register plugin in the registry', () => {
      const registrySpy = jest.spyOn(registry, 'register');

      factory.registerPlugin(mockPlugin);

      expect(registrySpy).toHaveBeenCalledWith(mockPlugin);
    });
  });

  describe('unregisterPlugin', () => {
    it('should unregister plugin from the registry', () => {
      const registrySpy = jest.spyOn(registry, 'unregister');

      const result = factory.unregisterPlugin('CONTENT_CREATOR' as any);

      expect(registrySpy).toHaveBeenCalledWith('CONTENT_CREATOR');
    });
  });
});
