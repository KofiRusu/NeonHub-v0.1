import { PrismaClient, AIAgent, AgentType } from '@prisma/client';
import { BaseAgent } from '../base/BaseAgent';
import { AgentFactory, createAgentFactory } from '../factory/AgentFactory';
import { AgentExecutionConfig } from '../types';

/**
 * Manages the lifecycle and operation of AI agents
 */
export class AgentManager {
  private prisma: PrismaClient;
  private agentFactory: AgentFactory;
  private runningAgents: Map<string, BaseAgent> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.agentFactory = createAgentFactory(prisma);
  }

  /**
   * Starts an agent by ID
   * @param agentId The ID of the agent to start
   * @param campaignId Optional campaign ID to link
   * @param options Optional execution options
   * @returns The result of the agent execution
   */
  async startAgent(
    agentId: string,
    campaignId?: string,
    options: AgentExecutionConfig = {},
  ): Promise<any> {
    // Check if agent is already running
    if (this.isAgentRunning(agentId)) {
      console.log(`Agent ${agentId} is already running`);
      return { status: 'already_running', agentId };
    }

    // Fetch agent details from database
    const agentData = await this.prisma.aIAgent.findUnique({
      where: { id: agentId },
    });

    if (!agentData) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    // Update agent status to RUNNING
    await this.prisma.aIAgent.update({
      where: { id: agentId },
      data: { status: 'RUNNING', lastRunAt: new Date() },
    });

    try {
      // Create agent instance using factory
      const agent = this.agentFactory.createAgent(agentData);
      this.runningAgents.set(agentId, agent);

      // Merge config with any passed options
      const config = {
        ...JSON.parse(JSON.stringify(agentData.configuration)),
        ...options.config,
      };

      // Execute the agent with provided campaign ID and options
      const result = await agent.execute(config, {
        campaignId,
        trackMetrics: options.trackMetrics !== false, // Default to true
        tokenUsage: options.tokenUsage,
        maxRetries: options.maxRetries,
        retryDelay: options.retryDelay,
      });

      // Update agent status to COMPLETED
      await this.prisma.aIAgent.update({
        where: { id: agentId },
        data: { status: 'COMPLETED' },
      });

      // Remove from running agents
      this.runningAgents.delete(agentId);

      return result;
    } catch (error) {
      console.error(`Error executing agent ${agentId}:`, error);

      // Update agent status to ERROR
      await this.prisma.aIAgent.update({
        where: { id: agentId },
        data: { status: 'ERROR' },
      });

      // BaseAgent class handles session updates and metrics logging

      // Remove from running agents
      this.runningAgents.delete(agentId);

      throw error;
    }
  }

  /**
   * Stops a running agent
   * @param agentId The ID of the agent to stop
   */
  async stopAgent(agentId: string): Promise<void> {
    const agent = this.runningAgents.get(agentId);
    if (!agent) {
      console.log(`Agent ${agentId} is not running`);
      return;
    }

    // Tell the agent to stop
    await agent.stop();

    // Update agent status to PAUSED
    await this.prisma.aIAgent.update({
      where: { id: agentId },
      data: { status: 'PAUSED' },
    });

    // Update the latest session
    const latestSession = await this.prisma.agentExecutionSession.findFirst({
      where: { agentId },
      orderBy: { startedAt: 'desc' },
    });

    if (latestSession) {
      await this.prisma.agentExecutionSession.update({
        where: { id: latestSession.id },
        data: {
          completedAt: new Date(),
          success: false,
          duration: Date.now() - latestSession.startedAt.getTime(),
          errorMessage: 'Agent execution manually stopped',
        },
      });
    }

    // Remove from running agents
    this.runningAgents.delete(agentId);
  }

  /**
   * Get the status of an agent
   * @param agentId The ID of the agent
   * @returns Agent status information
   */
  async getAgentStatus(agentId: string): Promise<{
    agentId: string;
    isRunning: boolean;
    status: any;
    lastRunAt?: Date;
    currentSession?: string;
    events?: any[];
    executionTime?: number;
  }> {
    const agentData = await this.prisma.aIAgent.findUnique({
      where: { id: agentId },
    });

    if (!agentData) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    const runningAgent = this.runningAgents.get(agentId);
    const isRunning = this.isAgentRunning(agentId);

    let agentStatus = null;
    if (runningAgent) {
      agentStatus = runningAgent.getStatus();
    }

    return {
      agentId,
      isRunning,
      status: agentData.status,
      lastRunAt: agentData.lastRunAt || undefined,
      currentSession: agentStatus?.currentSessionId || undefined,
      events: runningAgent?.getEvents() || [],
      executionTime: agentStatus?.executionTime,
    };
  }

  /**
   * Get all running agents
   * @returns Array of running agent information
   */
  getRunningAgents(): Array<{
    agentId: string;
    status: any;
    executionTime?: number;
    eventCount: number;
  }> {
    return Array.from(this.runningAgents.entries()).map(([agentId, agent]) => {
      const status = agent.getStatus();
      return {
        agentId,
        status: status,
        executionTime: status.executionTime,
        eventCount: status.eventCount,
      };
    });
  }

  /**
   * Create a new agent
   * @param agentData Agent creation data
   * @returns Created agent
   */
  async createAgent(agentData: {
    name: string;
    description?: string;
    agentType: AgentType;
    projectId: string;
    managerId: string;
    configuration?: any;
  }): Promise<AIAgent> {
    // Get default configuration for the agent type
    const defaultConfig = this.agentFactory.getDefaultConfig(
      agentData.agentType,
    );

    // Merge with provided configuration
    const configuration = {
      ...defaultConfig,
      ...agentData.configuration,
    };

    // Validate configuration
    if (!this.agentFactory.validateConfig(agentData.agentType, configuration)) {
      throw new Error(
        `Invalid configuration for agent type: ${agentData.agentType}`,
      );
    }

    return await this.prisma.aIAgent.create({
      data: {
        name: agentData.name,
        description: agentData.description,
        agentType: agentData.agentType,
        projectId: agentData.projectId,
        managerId: agentData.managerId,
        configuration: configuration,
        status: 'IDLE',
      },
    });
  }

  /**
   * Update agent configuration
   * @param agentId Agent ID
   * @param configuration New configuration
   * @returns Updated agent
   */
  async updateAgentConfiguration(
    agentId: string,
    configuration: any,
  ): Promise<AIAgent> {
    const agent = await this.prisma.aIAgent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }

    // Validate new configuration
    if (!this.agentFactory.validateConfig(agent.agentType, configuration)) {
      throw new Error(
        `Invalid configuration for agent type: ${agent.agentType}`,
      );
    }

    return await this.prisma.aIAgent.update({
      where: { id: agentId },
      data: { configuration },
    });
  }

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
  }> {
    return this.agentFactory.getAvailableAgentTypes();
  }

  /**
   * Get plugin information for an agent type
   * @param type Agent type
   * @returns Plugin information
   */
  getPluginInfo(
    type: AgentType,
  ): { name: string; description: string; version: string } | null {
    return this.agentFactory.getPluginInfo(type);
  }

  /**
   * Get all scheduled agents that need to run
   * @returns List of agents that should be executed
   */
  async getScheduledAgents(): Promise<AIAgent[]> {
    const now = new Date();
    return this.prisma.aIAgent.findMany({
      where: {
        scheduleEnabled: true,
        nextRunAt: {
          lte: now,
        },
        status: {
          notIn: ['RUNNING', 'ERROR'],
        },
      },
    });
  }

  /**
   * Update the next run time for an agent
   * @param agentId Agent ID
   * @param nextRunAt Next scheduled run time
   */
  async updateNextRunTime(agentId: string, nextRunAt: Date): Promise<void> {
    await this.prisma.aIAgent.update({
      where: { id: agentId },
      data: { nextRunAt },
    });
  }

  /**
   * Check if an agent is currently running
   * @param agentId Agent ID
   * @returns Whether the agent is running
   */
  isAgentRunning(agentId: string): boolean {
    return this.runningAgents.has(agentId);
  }

  /**
   * Get agent execution history
   * @param agentId Agent ID
   * @param limit Number of sessions to return
   * @returns Array of execution sessions
   */
  async getAgentExecutionHistory(agentId: string, limit = 10): Promise<any[]> {
    return await this.prisma.agentExecutionSession.findMany({
      where: { agentId },
      orderBy: { startedAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get manager statistics
   * @returns Manager statistics
   */
  getStats(): {
    runningAgentsCount: number;
    totalAgentsCount: Promise<number>;
    availableAgentTypes: number;
  } {
    return {
      runningAgentsCount: this.runningAgents.size,
      totalAgentsCount: this.prisma.aIAgent.count(),
      availableAgentTypes: this.agentFactory.getAvailableAgentTypes().length,
    };
  }
}
