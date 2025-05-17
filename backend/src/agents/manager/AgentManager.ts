import { PrismaClient, AIAgent, AgentType } from '@prisma/client';
import { BaseAgent } from '../base/BaseAgent';
import { getAgentImplementation } from '../implementations';
import { AgentExecutionConfig } from '../types';

/**
 * Manages the lifecycle and operation of AI agents
 */
export class AgentManager {
  private prisma: PrismaClient;
  private runningAgents: Map<string, BaseAgent> = new Map();

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Starts an agent by ID
   * @param agentId The ID of the agent to start
   * @param campaignId Optional campaign ID to link
   * @param options Optional execution options
   * @returns The result of the agent execution
   */
  async startAgent(agentId: string, campaignId?: string, options: AgentExecutionConfig = {}): Promise<any> {
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
      // Create agent instance based on its type
      const agent = this.createAgentInstance(agentData);
      this.runningAgents.set(agentId, agent);

      // Merge config with any passed options
      const config = {
        ...JSON.parse(JSON.stringify(agentData.configuration)),
        ...options.config
      };

      // Execute the agent with provided campaign ID and options
      const result = await agent.execute(config, {
        campaignId,
        trackMetrics: options.trackMetrics !== false, // Default to true
        tokenUsage: options.tokenUsage
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
   * Create an agent instance based on its type
   * @param agentData The agent data from the database
   * @returns A BaseAgent instance
   */
  private createAgentInstance(agentData: AIAgent): BaseAgent {
    // Get the appropriate agent implementation
    return getAgentImplementation(agentData.agentType, this.prisma, agentData);
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
} 