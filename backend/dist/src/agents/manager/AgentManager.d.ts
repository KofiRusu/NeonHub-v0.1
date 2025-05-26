import { PrismaClient, AIAgent, AgentType } from '@prisma/client';
import { AgentExecutionConfig } from '../types';
/**
 * Manages the lifecycle and operation of AI agents
 */
export declare class AgentManager {
    private prisma;
    private agentFactory;
    private runningAgents;
    constructor(prisma: PrismaClient);
    /**
     * Starts an agent by ID
     * @param agentId The ID of the agent to start
     * @param campaignId Optional campaign ID to link
     * @param options Optional execution options
     * @returns The result of the agent execution
     */
    startAgent(agentId: string, campaignId?: string, options?: AgentExecutionConfig): Promise<any>;
    /**
     * Stops a running agent
     * @param agentId The ID of the agent to stop
     */
    stopAgent(agentId: string): Promise<void>;
    /**
     * Get the status of an agent
     * @param agentId The ID of the agent
     * @returns Agent status information
     */
    getAgentStatus(agentId: string): Promise<{
        agentId: string;
        isRunning: boolean;
        status: any;
        lastRunAt?: Date;
        currentSession?: string;
        events?: any[];
        executionTime?: number;
    }>;
    /**
     * Get all running agents
     * @returns Array of running agent information
     */
    getRunningAgents(): Array<{
        agentId: string;
        status: any;
        executionTime?: number;
        eventCount: number;
    }>;
    /**
     * Create a new agent
     * @param agentData Agent creation data
     * @returns Created agent
     */
    createAgent(agentData: {
        name: string;
        description?: string;
        agentType: AgentType;
        projectId: string;
        managerId: string;
        configuration?: any;
    }): Promise<AIAgent>;
    /**
     * Update agent configuration
     * @param agentId Agent ID
     * @param configuration New configuration
     * @returns Updated agent
     */
    updateAgentConfiguration(agentId: string, configuration: any): Promise<AIAgent>;
    /**
     * Get available agent types with their information
     * @returns Array of available agent types
     */
    getAvailableAgentTypes(): Array<{
        type: AgentType;
        name: string;
        description: string;
        version: string;
        defaultConfig: any;
    }>;
    /**
     * Get plugin information for an agent type
     * @param type Agent type
     * @returns Plugin information
     */
    getPluginInfo(type: AgentType): {
        name: string;
        description: string;
        version: string;
    } | null;
    /**
     * Get all scheduled agents that need to run
     * @returns List of agents that should be executed
     */
    getScheduledAgents(): Promise<AIAgent[]>;
    /**
     * Update the next run time for an agent
     * @param agentId Agent ID
     * @param nextRunAt Next scheduled run time
     */
    updateNextRunTime(agentId: string, nextRunAt: Date): Promise<void>;
    /**
     * Run an agent with a given configuration
     * @param agentId Agent ID to run
     * @param config Configuration for the agent
     * @param options Execution options
     * @returns Result of the agent execution
     */
    runAgent(agentId: string, config?: any, options?: AgentExecutionConfig): Promise<any>;
    /**
     * Run an agent immediately without scheduling
     * @param agentId Agent ID to run
     * @param config Configuration for the agent
     * @param options Execution options
     * @returns Result of the agent execution
     */
    runAgentNow(agentId: string, config?: any, options?: AgentExecutionConfig): Promise<any>;
    /**
     * Check if an agent is currently running
     * @param agentId Agent ID
     * @returns Whether the agent is running
     */
    isAgentRunning(agentId: string): boolean;
    /**
     * Get agent execution history
     * @param agentId Agent ID
     * @param limit Number of sessions to return
     * @returns Array of execution sessions
     */
    getAgentExecutionHistory(agentId: string, limit?: number): Promise<any[]>;
    /**
     * Get manager statistics
     * @returns Manager statistics
     */
    getStats(): {
        runningAgentsCount: number;
        totalAgentsCount: Promise<number>;
        availableAgentTypes: number;
    };
}
