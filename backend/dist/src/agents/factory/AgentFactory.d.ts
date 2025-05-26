import { PrismaClient, AIAgent, AgentType } from '@prisma/client';
import { BaseAgent } from '../base/BaseAgent';
export interface AgentPlugin {
    type: AgentType;
    name: string;
    description: string;
    version: string;
    create(prisma: PrismaClient, agentData: AIAgent): BaseAgent;
    validateConfig?(config: any): boolean;
    getDefaultConfig?(): any;
}
export declare class AgentPluginRegistry {
    private plugins;
    /**
     * Register a new agent plugin
     * @param plugin The agent plugin to register
     */
    register(plugin: AgentPlugin): void;
    /**
     * Unregister an agent plugin
     * @param type The agent type to unregister
     */
    unregister(type: AgentType): boolean;
    /**
     * Get a plugin by agent type
     * @param type The agent type
     * @returns The plugin or undefined if not found
     */
    get(type: AgentType): AgentPlugin | undefined;
    /**
     * Get all registered plugins
     * @returns Array of all registered plugins
     */
    getAll(): AgentPlugin[];
    /**
     * Check if a plugin is registered for the given type
     * @param type The agent type
     * @returns True if plugin is registered
     */
    has(type: AgentType): boolean;
    /**
     * Get available agent types
     * @returns Array of available agent types
     */
    getAvailableTypes(): AgentType[];
}
declare const pluginRegistry: AgentPluginRegistry;
/**
 * Factory class for creating agent instances
 */
export declare class AgentFactory {
    private prisma;
    private registry;
    constructor(prisma: PrismaClient, registry?: AgentPluginRegistry);
    /**
     * Create an agent instance
     * @param agentData The agent data from the database
     * @returns A BaseAgent instance
     * @throws Error if no plugin is registered for the agent type
     */
    createAgent(agentData: AIAgent): BaseAgent;
    /**
     * Get default configuration for an agent type
     * @param type The agent type
     * @returns Default configuration or empty object
     */
    getDefaultConfig(type: AgentType): any;
    /**
     * Validate configuration for an agent type
     * @param type The agent type
     * @param config The configuration to validate
     * @returns True if valid, false otherwise
     */
    validateConfig(type: AgentType, config: any): boolean;
    /**
     * Get plugin information for an agent type
     * @param type The agent type
     * @returns Plugin information or null if not found
     */
    getPluginInfo(type: AgentType): {
        name: string;
        description: string;
        version: string;
    } | null;
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
    }>;
    /**
     * Register a new agent plugin
     * @param plugin The agent plugin to register
     */
    registerPlugin(plugin: AgentPlugin): void;
    /**
     * Unregister an agent plugin
     * @param type The agent type to unregister
     */
    unregisterPlugin(type: AgentType): boolean;
}
export { pluginRegistry };
export declare const createAgentFactory: (prisma: PrismaClient) => AgentFactory;
