import { PrismaClient, AgentType, AgentStatus } from '@prisma/client';
import { AIAgent } from '../base/AIAgent';
import { AgentConfig, AgentResult } from '../base/types';

// Agent implementations
import { ContentAgent, ContentAgentConfig } from '../implementations/ContentAgent';
import { OutreachAgent, OutreachAgentConfig } from '../implementations/OutreachAgent';
import { AdOptimizerAgent, AdOptimizerConfig } from '../implementations/AdOptimizerAgent';
import { TrendPredictorAgent, TrendPredictorConfig } from '../implementations/TrendPredictorAgent';

/**
 * Options for scheduling agent execution
 */
export interface ScheduleOptions {
  /** Agent ID to schedule */
  agentId: string;
  /** Cron expression for scheduling */
  cronExpression?: string;
  /** Interval in milliseconds (alternative to cron) */
  interval?: number;
  /** Whether to run immediately */
  runImmediately?: boolean;
  /** Maximum number of runs (undefined = unlimited) */
  maxRuns?: number;
  /** Context to pass to the agent */
  context?: Record<string, any>;
}

/**
 * Job tracking for scheduled agents
 */
interface ScheduledJob {
  /** Agent ID */
  agentId: string;
  /** Job identifier (for clearing/cancelling) */
  jobId: any;
  /** Next scheduled run time */
  nextRunAt?: Date;
  /** Number of times the job has run */
  runCount: number;
  /** Maximum number of runs (optional) */
  maxRuns?: number;
  /** Context to pass to the agent on execution */
  context?: Record<string, any>;
}

/**
 * Manager for AI agents that handles loading, execution, and scheduling
 */
export class AgentManager {
  /** Prisma client instance */
  private prisma: PrismaClient;
  
  /** Map of loaded agents by ID */
  private agents: Map<string, AIAgent> = new Map();
  
  /** Map of scheduled jobs by agent ID */
  private scheduledJobs: Map<string, ScheduledJob> = new Map();
  
  /** Flag to track if the manager has been initialized */
  private initialized: boolean = false;
  
  /**
   * Create a new AgentManager
   * 
   * @param prisma Prisma client instance
   */
  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }
  
  /**
   * Initialize the agent manager
   * Loads agents from the database
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('AgentManager already initialized');
      return;
    }
    
    try {
      console.log('Initializing AgentManager...');
      
      // Load agents from database
      const dbAgents = await this.prisma.aIAgent.findMany({
        where: {
          status: {
            not: AgentStatus.ERROR
          }
        }
      });
      
      console.log(`Found ${dbAgents.length} agents in database`);
      
      // Load each agent
      for (const dbAgent of dbAgents) {
        await this.loadAgent(dbAgent.id);
      }
      
      this.initialized = true;
      console.log('AgentManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize AgentManager:', error);
      throw error;
    }
  }
  
  /**
   * Load an agent from the database
   * 
   * @param agentId ID of the agent to load
   * @returns The loaded agent instance
   */
  public async loadAgent(agentId: string): Promise<AIAgent> {
    // Check if already loaded
    if (this.agents.has(agentId)) {
      return this.agents.get(agentId)!;
    }
    
    // Fetch agent from database
    const dbAgent = await this.prisma.aIAgent.findUnique({
      where: { id: agentId }
    });
    
    if (!dbAgent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }
    
    console.log(`Loading agent: ${dbAgent.name} (${dbAgent.agentType})`);
    
    // Parse configuration
    const config = dbAgent.configuration as AgentConfig;
    
    // Create appropriate agent instance
    let agent: AIAgent;
    
    switch (dbAgent.agentType) {
      case AgentType.CONTENT_CREATOR:
        agent = new ContentAgent(agentId, config as ContentAgentConfig, this.prisma);
        break;
        
      case AgentType.OUTREACH_MANAGER:
        agent = new OutreachAgent(agentId, config as OutreachAgentConfig, this.prisma);
        break;
        
      case AgentType.PERFORMANCE_OPTIMIZER:
        agent = new AdOptimizerAgent(agentId, config as AdOptimizerConfig, this.prisma);
        break;
        
      case AgentType.TREND_ANALYZER:
        agent = new TrendPredictorAgent(agentId, config as TrendPredictorConfig, this.prisma);
        break;
        
      default:
        throw new Error(`Unsupported agent type: ${dbAgent.agentType}`);
    }
    
    // Store in loaded agents map
    this.agents.set(agentId, agent);
    
    return agent;
  }
  
  /**
   * Run a specific agent
   * 
   * @param agentId ID of the agent to run
   * @param context Optional context to pass to the agent
   * @returns The agent's execution result
   */
  public async runAgent(agentId: string, context?: Record<string, any>): Promise<AgentResult> {
    // Load agent if not already loaded
    if (!this.agents.has(agentId)) {
      await this.loadAgent(agentId);
    }
    
    const agent = this.agents.get(agentId)!;
    
    console.log(`Running agent: ${agentId}`);
    
    // Execute the agent
    return agent.run({ context });
  }
  
  /**
   * Schedule an agent to run on a recurring basis
   * 
   * @param options Scheduling options
   * @returns Job ID for reference
   */
  public scheduleAgent(options: ScheduleOptions): string {
    const { agentId, interval, runImmediately = false, maxRuns, context } = options;
    
    // Check if agent is loaded
    if (!this.agents.has(agentId)) {
      throw new Error(`Agent ${agentId} is not loaded`);
    }
    
    // Clear any existing schedule for this agent
    this.clearSchedule(agentId);
    
    // Create job ID
    const jobId = `job_${agentId}_${Date.now()}`;
    
    // For demo purposes, we're using simple setInterval
    // In production, use a proper job scheduler with persistence
    const timerId = setInterval(async () => {
      try {
        // Get the job
        const job = this.scheduledJobs.get(agentId)!;
        
        // Check if max runs reached
        if (job.maxRuns !== undefined && job.runCount >= job.maxRuns) {
          this.clearSchedule(agentId);
          return;
        }
        
        // Update job run count
        job.runCount++;
        this.scheduledJobs.set(agentId, job);
        
        // Run the agent
        await this.runAgent(agentId, context);
        
        // Update next run time
        job.nextRunAt = new Date(Date.now() + (interval || 0));
        this.scheduledJobs.set(agentId, job);
      } catch (error) {
        console.error(`Error running scheduled agent ${agentId}:`, error);
      }
    }, interval || 3600000); // Default to hourly if no interval specified
    
    // Store job information
    this.scheduledJobs.set(agentId, {
      agentId,
      jobId,
      runCount: 0,
      maxRuns,
      nextRunAt: interval ? new Date(Date.now() + interval) : undefined,
      context
    });
    
    // Run immediately if specified
    if (runImmediately) {
      // Execute async but don't wait
      this.runAgent(agentId, context).catch(error => {
        console.error(`Error running agent ${agentId} immediately:`, error);
      });
    }
    
    console.log(`Scheduled agent ${agentId} with job ID ${jobId}`);
    return jobId;
  }
  
  /**
   * Clear a scheduled job
   * 
   * @param agentId ID of the agent to unschedule
   */
  public clearSchedule(agentId: string): void {
    if (this.scheduledJobs.has(agentId)) {
      const job = this.scheduledJobs.get(agentId)!;
      
      // Clear the interval
      clearInterval(job.jobId);
      
      // Remove from scheduled jobs
      this.scheduledJobs.delete(agentId);
      
      console.log(`Cleared schedule for agent ${agentId}`);
    }
  }
  
  /**
   * Run multiple agents in parallel
   * 
   * @param agentIds IDs of agents to run
   * @param context Optional context to pass to all agents
   * @returns Results for each agent
   */
  public async runAgents(agentIds: string[], context?: Record<string, any>): Promise<Map<string, AgentResult>> {
    console.log(`Running ${agentIds.length} agents in parallel`);
    
    // Run all agents in parallel
    const resultPromises = agentIds.map(agentId => 
      this.runAgent(agentId, context)
        .then(result => [agentId, result] as [string, AgentResult])
        .catch(error => {
          console.error(`Error running agent ${agentId}:`, error);
          return [agentId, {
            success: false,
            error: {
              message: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined
            },
            timestamp: new Date()
          }] as [string, AgentResult];
        })
    );
    
    // Wait for all agents to complete
    const results = await Promise.all(resultPromises);
    
    // Convert to map
    return new Map(results);
  }
  
  /**
   * Get a list of all loaded agents
   * 
   * @returns Array of agent IDs
   */
  public getLoadedAgents(): string[] {
    return Array.from(this.agents.keys());
  }
  
  /**
   * Get a list of all scheduled jobs
   * 
   * @returns Map of agent IDs to their next scheduled run time
   */
  public getScheduledJobs(): Map<string, Date | undefined> {
    const schedules = new Map<string, Date | undefined>();
    
    for (const [agentId, job] of this.scheduledJobs.entries()) {
      schedules.set(agentId, job.nextRunAt);
    }
    
    return schedules;
  }
  
  /**
   * Check if an agent is loaded
   * 
   * @param agentId Agent ID to check
   * @returns True if the agent is loaded
   */
  public isAgentLoaded(agentId: string): boolean {
    return this.agents.has(agentId);
  }
  
  /**
   * Check if an agent is scheduled
   * 
   * @param agentId Agent ID to check
   * @returns True if the agent has a scheduled job
   */
  public isAgentScheduled(agentId: string): boolean {
    return this.scheduledJobs.has(agentId);
  }
  
  /**
   * Get the last result for an agent
   * 
   * @param agentId Agent ID
   * @returns The last execution result, if available
   */
  public getLastResult(agentId: string): AgentResult | undefined {
    if (!this.agents.has(agentId)) {
      return undefined;
    }
    
    return this.agents.get(agentId)!.getLastResult();
  }
  
  /**
   * Clean up resources when shutting down
   */
  public shutdown(): void {
    // Clear all scheduled jobs
    for (const agentId of this.scheduledJobs.keys()) {
      this.clearSchedule(agentId);
    }
    
    console.log('AgentManager shutdown complete');
  }
} 