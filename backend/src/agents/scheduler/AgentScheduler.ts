import { PrismaClient, AIAgent, AgentStatus, AgentType } from '@prisma/client';
import { CronExpressionParser } from 'cron-parser';
import { AgentManager } from '../manager/AgentManager';
import { logger } from '../../utils/logger';

/**
 * Priority levels for agent execution
 */
export enum AgentPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4,
}

/**
 * Scheduled agent task
 */
interface ScheduledTask {
  agentId: string;
  agent: AIAgent;
  nextRunTime: Date;
  priority: AgentPriority;
  retryCount: number;
  lastError?: string;
  backoffUntil?: Date;
}

/**
 * Options for the agent scheduler
 */
interface SchedulerOptions {
  /**
   * Whether to run missed jobs on startup
   * If true, any jobs that were scheduled to run while the server was down will be run on startup
   */
  runMissedOnStartup?: boolean;

  /**
   * Whether to immediately start scheduling on instantiation
   */
  autoStart?: boolean;

  /**
   * Default time in milliseconds to wait between checking for agents to run
   */
  checkInterval?: number; // milliseconds

  /**
   * Maximum number of agents that can run concurrently
   */
  maxConcurrentAgents?: number;

  /**
   * Maximum retry attempts for failed agents
   */
  maxRetries?: number;

  /**
   * Base delay for exponential backoff (in milliseconds)
   */
  baseBackoffDelay?: number;

  /**
   * Maximum backoff delay (in milliseconds)
   */
  maxBackoffDelay?: number;
}

/**
 * Handles scheduling and automatic execution of agents
 */
export class AgentScheduler {
  private prisma: PrismaClient;
  private agentManager: AgentManager;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private options: Required<SchedulerOptions>;
  private scheduledTasks: Map<string, ScheduledTask> = new Map();
  private runningAgents: Set<string> = new Set();
  private taskQueue: ScheduledTask[] = [];

  /**
   * Create a new agent scheduler
   *
   * @param prisma Prisma client instance
   * @param agentManager Agent manager instance
   * @param options Scheduler options
   */
  constructor(
    prisma: PrismaClient,
    agentManager: AgentManager,
    options: SchedulerOptions = {},
  ) {
    this.prisma = prisma;
    this.agentManager = agentManager;
    this.options = {
      checkInterval: 60000,
      maxConcurrentAgents: 5,
      maxRetries: 3,
      baseBackoffDelay: 1000,
      maxBackoffDelay: 300000,
      runMissedOnStartup: false,
      autoStart: false,
      ...options,
    };

    if (this.options.autoStart) {
      this.start();
    }
  }

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    logger.info(
      `Scheduler started, checking every ${this.options.checkInterval / 1000} seconds`,
    );
    logger.info(`Max concurrent agents: ${this.options.maxConcurrentAgents}`);

    // Load existing scheduled agents
    await this.loadScheduledAgents();

    // Run missed jobs if enabled
    if (this.options.runMissedOnStartup) {
      await this.runMissedJobs();
    }

    // Initial check
    await this.processScheduledTasks();

    // Set up interval for subsequent checks
    this.intervalId = setInterval(() => {
      this.processScheduledTasks();
    }, this.options.checkInterval);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      logger.warn('Scheduler is not running');
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    logger.info('Scheduler stopped');
  }

  /**
   * Schedule an agent
   * @param agentId Agent ID
   * @param cronExpression Cron expression
   * @param priority Priority level
   * @param enabled Whether scheduling is enabled
   */
  async scheduleAgent(
    agentId: string,
    cronExpression: string,
    priority: AgentPriority = AgentPriority.NORMAL,
    enabled = true,
  ): Promise<void> {
    try {
      // Validate cron expression
      const nextRunTime = this.calculateNextRunTime(cronExpression);

      // Update agent in database
      await this.prisma.aIAgent.update({
        where: { id: agentId },
        data: {
          scheduleExpression: cronExpression,
          scheduleEnabled: enabled,
          nextRunAt: enabled ? nextRunTime : null,
        },
      });

      if (enabled) {
        // Get agent data
        const agent = await this.prisma.aIAgent.findUnique({
          where: { id: agentId },
        });

        if (agent) {
          const task: ScheduledTask = {
            agentId,
            agent,
            nextRunTime,
            priority,
            retryCount: 0,
          };

          this.scheduledTasks.set(agentId, task);
          this.addToQueue(task);
          logger.info(`Agent ${agentId} scheduled with priority ${priority}`);
        }
      } else {
        this.unscheduleAgent(agentId);
      }
    } catch (error) {
      logger.error(`Error scheduling agent ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Unschedule an agent
   * @param agentId Agent ID
   */
  unscheduleAgent(agentId: string): void {
    this.scheduledTasks.delete(agentId);
    this.taskQueue = this.taskQueue.filter((task) => task.agentId !== agentId);
    logger.info(`Agent ${agentId} unscheduled`);
  }

  /**
   * Load scheduled agents from database
   */
  private async loadScheduledAgents(): Promise<void> {
    try {
      const agents = await this.prisma.aIAgent.findMany({
        where: {
          scheduleEnabled: true,
          scheduleExpression: {
            not: null,
          },
        },
      });

      for (const agent of agents) {
        if (agent.scheduleExpression) {
          try {
            const nextRunTime =
              agent.nextRunAt ||
              this.calculateNextRunTime(agent.scheduleExpression);

            const task: ScheduledTask = {
              agentId: agent.id,
              agent,
              nextRunTime,
              priority: this.getAgentPriority(agent),
              retryCount: 0,
            };

            this.scheduledTasks.set(agent.id, task);
            this.addToQueue(task);
          } catch (error) {
            logger.error(`Error loading scheduled agent ${agent.id}:`, error);
          }
        }
      }

      logger.info(`Loaded ${this.scheduledTasks.size} scheduled agents`);
    } catch (error) {
      logger.error('Error loading scheduled agents:', error);
    }
  }

  /**
   * Process scheduled tasks
   */
  private async processScheduledTasks(): Promise<void> {
    try {
      const now = new Date();

      // Sort queue by priority and next run time
      this.taskQueue.sort((a, b) => {
        // First by priority (higher priority first)
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        // Then by next run time (earlier first)
        return a.nextRunTime.getTime() - b.nextRunTime.getTime();
      });

      // Process tasks that are ready to run
      const tasksToRun = this.taskQueue.filter((task) => {
        return (
          task.nextRunTime <= now &&
          (!task.backoffUntil || task.backoffUntil <= now) &&
          !this.runningAgents.has(task.agentId)
        );
      });

      // Respect concurrency limit
      const availableSlots =
        this.options.maxConcurrentAgents - this.runningAgents.size;
      const tasksToExecute = tasksToRun.slice(0, availableSlots);

      for (const task of tasksToExecute) {
        await this.executeTask(task);
      }

      // Update next run times for completed tasks
      await this.updateNextRunTimes();
    } catch (error) {
      logger.error('Error processing scheduled tasks:', error);
    }
  }

  /**
   * Execute a scheduled task
   * @param task The task to execute
   */
  private async executeTask(task: ScheduledTask): Promise<void> {
    try {
      this.runningAgents.add(task.agentId);
      logger.info(
        `Executing scheduled agent ${task.agentId} (priority: ${task.priority})`,
      );

      // Update agent status
      await this.prisma.aIAgent.update({
        where: { id: task.agentId },
        data: { status: AgentStatus.RUNNING, lastRunAt: new Date() },
      });

      // Execute the agent
      await this.agentManager.startAgent(task.agentId);

      // Reset retry count on successful execution
      task.retryCount = 0;
      task.lastError = undefined;
      task.backoffUntil = undefined;

      logger.info(`Agent ${task.agentId} executed successfully`);
    } catch (error) {
      logger.error(`Error executing agent ${task.agentId}:`, error);
      await this.handleTaskFailure(task, error);
    } finally {
      this.runningAgents.delete(task.agentId);
    }
  }

  /**
   * Handle task execution failure
   * @param task The failed task
   * @param error The error that occurred
   */
  private async handleTaskFailure(
    task: ScheduledTask,
    error: any,
  ): Promise<void> {
    task.retryCount++;
    task.lastError = error instanceof Error ? error.message : String(error);

    const maxRetries = this.options.maxRetries;

    if (task.retryCount <= maxRetries) {
      // Calculate backoff delay with exponential backoff
      const baseDelay = this.options.baseBackoffDelay;
      const maxDelay = this.options.maxBackoffDelay;
      const delay = Math.min(
        baseDelay * Math.pow(2, task.retryCount - 1),
        maxDelay,
      );

      task.backoffUntil = new Date(Date.now() + delay);

      logger.warn(
        `Agent ${task.agentId} failed (attempt ${task.retryCount}/${maxRetries}), will retry in ${delay}ms`,
      );
    } else {
      logger.error(
        `Agent ${task.agentId} failed after ${maxRetries} attempts, removing from schedule`,
      );

      // Update agent status to ERROR
      await this.prisma.aIAgent.update({
        where: { id: task.agentId },
        data: { status: AgentStatus.ERROR },
      });

      // Remove from scheduled tasks
      this.unscheduleAgent(task.agentId);
    }
  }

  /**
   * Update next run times for scheduled agents
   */
  private async updateNextRunTimes(): Promise<void> {
    for (const [agentId, task] of this.scheduledTasks) {
      if (task.agent.scheduleExpression && task.nextRunTime <= new Date()) {
        try {
          const nextRunTime = this.calculateNextRunTime(
            task.agent.scheduleExpression,
          );
          task.nextRunTime = nextRunTime;

          // Update in database
          await this.prisma.aIAgent.update({
            where: { id: agentId },
            data: { nextRunAt: nextRunTime },
          });
        } catch (error) {
          logger.error(
            `Error updating next run time for agent ${agentId}:`,
            error,
          );
        }
      }
    }
  }

  /**
   * Run missed jobs on startup
   */
  private async runMissedJobs(): Promise<void> {
    const now = new Date();
    const missedTasks = Array.from(this.scheduledTasks.values()).filter(
      (task) => task.nextRunTime < now,
    );

    if (missedTasks.length > 0) {
      logger.info(
        `Found ${missedTasks.length} missed jobs, executing them now`,
      );

      for (const task of missedTasks) {
        if (this.runningAgents.size < this.options.maxConcurrentAgents) {
          await this.executeTask(task);
        }
      }
    }
  }

  /**
   * Add task to queue
   * @param task The task to add
   */
  private addToQueue(task: ScheduledTask): void {
    // Remove existing task if present
    this.taskQueue = this.taskQueue.filter((t) => t.agentId !== task.agentId);
    // Add new task
    this.taskQueue.push(task);
  }

  /**
   * Get agent priority based on agent configuration
   * @param agent The agent
   * @returns Priority level
   */
  private getAgentPriority(agent: AIAgent): AgentPriority {
    const config = agent.configuration as any;

    if (config?.priority) {
      switch (config.priority.toLowerCase()) {
        case 'critical':
          return AgentPriority.CRITICAL;
        case 'high':
          return AgentPriority.HIGH;
        case 'low':
          return AgentPriority.LOW;
        default:
          return AgentPriority.NORMAL;
      }
    }

    // Default priority based on agent type
    switch (agent.agentType) {
      case 'CUSTOMER_SUPPORT':
      case AgentType.CUSTOMER_SUPPORT:
        return AgentPriority.HIGH;
      case 'PERFORMANCE_OPTIMIZER':
      case AgentType.PERFORMANCE_OPTIMIZER:
        return AgentPriority.HIGH;
      case 'TREND_ANALYZER':
      case AgentType.TREND_ANALYZER:
        return AgentPriority.NORMAL;
      case 'CONTENT_CREATOR':
      case AgentType.CONTENT_CREATOR:
        return AgentPriority.NORMAL;
      default:
        return AgentPriority.NORMAL;
    }
  }

  /**
   * Calculate the next run time for a cron expression
   * @param cronExpression Cron expression
   * @returns Next run date
   */
  calculateNextRunTime(cronExpression: string): Date {
    try {
      const interval = CronExpressionParser.parse(cronExpression);
      return interval.next().toDate();
    } catch (error) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }
  }

  /**
   * Check if the scheduler is running
   */
  isSchedulerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get scheduler statistics
   */
  getStats(): {
    isRunning: boolean;
    scheduledTasksCount: number;
    runningAgentsCount: number;
    queuedTasksCount: number;
    maxConcurrentAgents: number;
  } {
    return {
      isRunning: this.isRunning,
      scheduledTasksCount: this.scheduledTasks.size,
      runningAgentsCount: this.runningAgents.size,
      queuedTasksCount: this.taskQueue.length,
      maxConcurrentAgents: this.options.maxConcurrentAgents,
    };
  }

  /**
   * Get detailed task information
   */
  getTaskDetails(): Array<{
    agentId: string;
    agentName: string;
    priority: AgentPriority;
    nextRunTime: Date;
    retryCount: number;
    lastError?: string;
    backoffUntil?: Date;
    isRunning: boolean;
  }> {
    return Array.from(this.scheduledTasks.values()).map((task) => ({
      agentId: task.agentId,
      agentName: task.agent.name,
      priority: task.priority,
      nextRunTime: task.nextRunTime,
      retryCount: task.retryCount,
      lastError: task.lastError,
      backoffUntil: task.backoffUntil,
      isRunning: this.runningAgents.has(task.agentId),
    }));
  }
}
