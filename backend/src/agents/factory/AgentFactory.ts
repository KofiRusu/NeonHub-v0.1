import { PrismaClient, AIAgent, AgentType } from '@prisma/client';
import { BaseAgent } from '../base/BaseAgent';

// Plugin interface for agent implementations
export interface AgentPlugin {
  type: AgentType;
  name: string;
  description: string;
  version: string;
  create(prisma: PrismaClient, agentData: AIAgent): BaseAgent;
  validateConfig?(config: any): boolean;
  getDefaultConfig?(): any;
}

// Registry for agent plugins
export class AgentPluginRegistry {
  private plugins: Map<AgentType, AgentPlugin> = new Map();

  /**
   * Register a new agent plugin
   * @param plugin The agent plugin to register
   */
  register(plugin: AgentPlugin): void {
    if (this.plugins.has(plugin.type)) {
      console.warn(
        `Plugin for agent type ${plugin.type} is already registered. Overwriting...`,
      );
    }

    this.plugins.set(plugin.type, plugin);
    console.log(
      `Registered agent plugin: ${plugin.name} v${plugin.version} for type ${plugin.type}`,
    );
  }

  /**
   * Unregister an agent plugin
   * @param type The agent type to unregister
   */
  unregister(type: AgentType): boolean {
    return this.plugins.delete(type);
  }

  /**
   * Get a plugin by agent type
   * @param type The agent type
   * @returns The plugin or undefined if not found
   */
  get(type: AgentType): AgentPlugin | undefined {
    return this.plugins.get(type);
  }

  /**
   * Get all registered plugins
   * @returns Array of all registered plugins
   */
  getAll(): AgentPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Check if a plugin is registered for the given type
   * @param type The agent type
   * @returns True if plugin is registered
   */
  has(type: AgentType): boolean {
    return this.plugins.has(type);
  }

  /**
   * Get available agent types
   * @returns Array of available agent types
   */
  getAvailableTypes(): AgentType[] {
    return Array.from(this.plugins.keys());
  }
}

// Singleton instance of the plugin registry
const pluginRegistry = new AgentPluginRegistry();

/**
 * Factory class for creating agent instances
 */
export class AgentFactory {
  private prisma: PrismaClient;
  private registry: AgentPluginRegistry;

  constructor(
    prisma: PrismaClient,
    registry: AgentPluginRegistry = pluginRegistry,
  ) {
    this.prisma = prisma;
    this.registry = registry;
  }

  /**
   * Create an agent instance
   * @param agentData The agent data from the database
   * @returns A BaseAgent instance
   * @throws Error if no plugin is registered for the agent type
   */
  createAgent(agentData: AIAgent): BaseAgent {
    const plugin = this.registry.get(agentData.agentType);

    if (!plugin) {
      throw new Error(
        `No plugin registered for agent type: ${agentData.agentType}`,
      );
    }

    // Validate configuration if plugin provides validation
    if (
      plugin.validateConfig &&
      !plugin.validateConfig(agentData.configuration)
    ) {
      throw new Error(
        `Invalid configuration for agent type: ${agentData.agentType}`,
      );
    }

    return plugin.create(this.prisma, agentData);
  }

  /**
   * Get default configuration for an agent type
   * @param type The agent type
   * @returns Default configuration or empty object
   */
  getDefaultConfig(type: AgentType): any {
    const plugin = this.registry.get(type);
    return plugin?.getDefaultConfig?.() || {};
  }

  /**
   * Validate configuration for an agent type
   * @param type The agent type
   * @param config The configuration to validate
   * @returns True if valid, false otherwise
   */
  validateConfig(type: AgentType, config: any): boolean {
    const plugin = this.registry.get(type);
    return plugin?.validateConfig?.(config) ?? true;
  }

  /**
   * Get plugin information for an agent type
   * @param type The agent type
   * @returns Plugin information or null if not found
   */
  getPluginInfo(
    type: AgentType,
  ): { name: string; description: string; version: string } | null {
    const plugin = this.registry.get(type);
    if (!plugin) return null;

    return {
      name: plugin.name,
      description: plugin.description,
      version: plugin.version,
    };
  }

  /**
   * Get all available agent types with their plugin information
   * @returns Array of agent type information
   */
  getAvailableAgentTypes(): Array<{
    type: AgentType;
    name: string;
    description: string;
    version: string;
    defaultConfig: any;
  }> {
    return this.registry.getAll().map((plugin) => ({
      type: plugin.type,
      name: plugin.name,
      description: plugin.description,
      version: plugin.version,
      defaultConfig: plugin.getDefaultConfig?.() || {},
    }));
  }

  /**
   * Register a new agent plugin
   * @param plugin The agent plugin to register
   */
  registerPlugin(plugin: AgentPlugin): void {
    this.registry.register(plugin);
  }

  /**
   * Unregister an agent plugin
   * @param type The agent type to unregister
   */
  unregisterPlugin(type: AgentType): boolean {
    return this.registry.unregister(type);
  }
}

// Export the singleton registry for global access
export { pluginRegistry };

// Default factory instance
export const createAgentFactory = (prisma: PrismaClient): AgentFactory => {
  return new AgentFactory(prisma);
};
