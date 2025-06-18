'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.AgentScheduler = exports.AgentPriority = void 0;
const client_1 = require('@prisma/client');
const cron_parser_1 = require('cron-parser');
const logger_1 = require('../../utils/logger');
const websocket_service_1 = require('../../services/websocket.service');
/**
 * Priority levels for agent execution
 */
var AgentPriority;
(function (AgentPriority) {
  AgentPriority[(AgentPriority['LOW'] = 1)] = 'LOW';
  AgentPriority[(AgentPriority['NORMAL'] = 2)] = 'NORMAL';
  AgentPriority[(AgentPriority['HIGH'] = 3)] = 'HIGH';
  AgentPriority[(AgentPriority['CRITICAL'] = 4)] = 'CRITICAL';
})(AgentPriority || (exports.AgentPriority = AgentPriority = {}));
/**
 * Handles scheduling and automatic execution of agents
 */
class AgentScheduler {
  /**
   * Get singleton instance of AgentScheduler
   * @param prisma Prisma client instance
   * @param agentManager Agent manager instance
   * @param options Scheduler options
   * @returns AgentScheduler instance
   */
  static getInstance(prisma, agentManager, options) {
    if (!AgentScheduler.instance) {
      if (!prisma || !agentManager) {
        throw new Error(
          'Prisma client and AgentManager must be provided when creating the first instance',
        );
      }
      AgentScheduler.instance = new AgentScheduler(
        prisma,
        agentManager,
        options,
      );
    }
    return AgentScheduler.instance;
  }
  /**
   * Create a new agent scheduler
   *
   * @param prisma Prisma client instance
   * @param agentManager Agent manager instance
   * @param options Scheduler options
   */
  constructor(prisma, agentManager, options = {}) {
    this.isRunning = false;
    this.intervalId = null;
    this.scheduledTasks = new Map();
    this.runningAgents = new Set();
    this.taskQueue = [];
    this.pausedJobs = new Map();
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
  async start() {
    if (this.isRunning) {
      logger_1.logger.warn('Scheduler is already running');
      return;
    }
    this.isRunning = true;
    logger_1.logger.info(
      `Scheduler started, checking every ${this.options.checkInterval / 1000} seconds`,
    );
    logger_1.logger.info(
      `Max concurrent agents: ${this.options.maxConcurrentAgents}`,
    );
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
  stop() {
    if (!this.isRunning) {
      logger_1.logger.warn('Scheduler is not running');
      return;
    }
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger_1.logger.info('Scheduler stopped');
  }
  /**
   * Schedule an agent
   * @param agentId Agent ID
   * @param cronExpression Cron expression
   * @param priority Priority level
   * @param enabled Whether scheduling is enabled
   */
  async scheduleAgent(
    agentId,
    cronExpression,
    priority = AgentPriority.NORMAL,
    enabled = true,
  ) {
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
          const task = {
            agentId,
            agent,
            nextRunTime,
            priority,
            retryCount: 0,
          };
          this.scheduledTasks.set(agentId, task);
          this.addToQueue(task);
          logger_1.logger.info(
            `Agent ${agentId} scheduled with priority ${priority}`,
          );
        }
      } else {
        this.unscheduleAgent(agentId);
      }
    } catch (error) {
      logger_1.logger.error(`Error scheduling agent ${agentId}:`, error);
      throw error;
    }
  }
  /**
   * Unschedule an agent
   * @param agentId Agent ID
   */
  unscheduleAgent(agentId) {
    this.scheduledTasks.delete(agentId);
    this.taskQueue = this.taskQueue.filter((task) => task.agentId !== agentId);
    logger_1.logger.info(`Agent ${agentId} unscheduled`);
  }
  /**
   * Load scheduled agents from database
   */
  async loadScheduledAgents() {
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
            const config = agent.configuration || {};
            const task = {
              agentId: agent.id,
              agent,
              nextRunTime,
              priority: this.getAgentPriority(agent),
              retryCount: 0,
              isPaused: config.isPaused || false,
            };
            this.scheduledTasks.set(agent.id, task);
            this.addToQueue(task);
            // Restore paused state
            if (task.isPaused) {
              this.pausedJobs.set(agent.id, true);
            }
          } catch (error) {
            logger_1.logger.error(
              `Error loading scheduled agent ${agent.id}:`,
              error,
            );
          }
        }
      }
      logger_1.logger.info(
        `Loaded ${this.scheduledTasks.size} scheduled agents`,
      );
    } catch (error) {
      logger_1.logger.error('Error loading scheduled agents:', error);
    }
  }
  /**
   * Process scheduled tasks
   */
  async processScheduledTasks() {
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
          !this.runningAgents.has(task.agentId) &&
          !task.isPaused // Skip paused tasks
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
      logger_1.logger.error('Error processing scheduled tasks:', error);
    }
  }
  /**
   * Execute a scheduled task
   * @param task The task to execute
   */
  async executeTask(task) {
    const startTime = Date.now();
    try {
      this.runningAgents.add(task.agentId);
      logger_1.logger.info(
        `Executing scheduled agent ${task.agentId} (priority: ${task.priority})`,
      );
      // Update agent status
      await this.prisma.aIAgent.update({
        where: { id: task.agentId },
        data: { status: client_1.AgentStatus.RUNNING, lastRunAt: new Date() },
      });
      // Emit WebSocket event for agent started
      try {
        const wsService = websocket_service_1.WebSocketService.getInstance();
        wsService.emitAgentStarted(task.agentId, task.jobId);
      } catch (error) {
        logger_1.logger.warn('WebSocket service not available:', error);
      }
      // Execute the agent
      await this.agentManager.startAgent(task.agentId);
      // Reset retry count on successful execution
      task.retryCount = 0;
      task.lastError = undefined;
      task.backoffUntil = undefined;
      const duration = Date.now() - startTime;
      logger_1.logger.info(
        `Agent ${task.agentId} executed successfully in ${duration}ms`,
      );
      // Emit WebSocket event for agent completed
      try {
        const wsService = websocket_service_1.WebSocketService.getInstance();
        wsService.emitAgentCompleted(task.agentId, task.jobId, duration);
      } catch (error) {
        logger_1.logger.warn('WebSocket service not available:', error);
      }
    } catch (error) {
      logger_1.logger.error(`Error executing agent ${task.agentId}:`, error);
      // Emit WebSocket event for agent failed
      try {
        const wsService = websocket_service_1.WebSocketService.getInstance();
        wsService.emitAgentFailed(
          task.agentId,
          error instanceof Error ? error.message : String(error),
          task.jobId,
        );
      } catch (wsError) {
        logger_1.logger.warn('WebSocket service not available:', wsError);
      }
      await this.handleTaskFailure(task, error);
    } finally {
      this.runningAgents.delete(task.agentId);
      // Emit scheduler status update
      try {
        const wsService = websocket_service_1.WebSocketService.getInstance();
        wsService.emitSchedulerStatus(this.getStats());
      } catch (error) {
        logger_1.logger.warn('WebSocket service not available:', error);
      }
    }
  }
  /**
   * Handle task execution failure
   * @param task The failed task
   * @param error The error that occurred
   */
  async handleTaskFailure(task, error) {
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
      logger_1.logger.warn(
        `Agent ${task.agentId} failed (attempt ${task.retryCount}/${maxRetries}), will retry in ${delay}ms`,
      );
    } else {
      logger_1.logger.error(
        `Agent ${task.agentId} failed after ${maxRetries} attempts, removing from schedule`,
      );
      // Update agent status to ERROR
      await this.prisma.aIAgent.update({
        where: { id: task.agentId },
        data: { status: client_1.AgentStatus.ERROR },
      });
      // Remove from scheduled tasks
      this.unscheduleAgent(task.agentId);
    }
  }
  /**
   * Update next run times for scheduled agents
   */
  async updateNextRunTimes() {
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
          logger_1.logger.error(
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
  async runMissedJobs() {
    const now = new Date();
    const missedTasks = Array.from(this.scheduledTasks.values()).filter(
      (task) => task.nextRunTime < now,
    );
    if (missedTasks.length > 0) {
      logger_1.logger.info(
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
  addToQueue(task) {
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
  getAgentPriority(agent) {
    const config = agent.configuration;
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
      case client_1.AgentType.CUSTOMER_SUPPORT:
        return AgentPriority.HIGH;
      case 'PERFORMANCE_OPTIMIZER':
      case client_1.AgentType.PERFORMANCE_OPTIMIZER:
        return AgentPriority.HIGH;
      case 'TREND_ANALYZER':
      case client_1.AgentType.TREND_ANALYZER:
        return AgentPriority.NORMAL;
      case 'CONTENT_CREATOR':
      case client_1.AgentType.CONTENT_CREATOR:
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
  calculateNextRunTime(cronExpression) {
    try {
      const interval = cron_parser_1.CronExpressionParser.parse(cronExpression);
      return interval.next().toDate();
    } catch (error) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }
  }
  /**
   * Check if the scheduler is running
   */
  isSchedulerRunning() {
    return this.isRunning;
  }
  /**
   * Get scheduler statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      scheduledTasksCount: this.scheduledTasks.size,
      runningAgentsCount: this.runningAgents.size,
      queuedTasksCount: this.taskQueue.length,
      maxConcurrentAgents: this.options.maxConcurrentAgents,
      pausedJobsCount: this.pausedJobs.size,
    };
  }
  /**
   * Get detailed task information
   */
  getTaskDetails() {
    return Array.from(this.scheduledTasks.values()).map((task) => ({
      agentId: task.agentId,
      agentName: task.agent.name,
      priority: task.priority,
      nextRunTime: task.nextRunTime,
      retryCount: task.retryCount,
      lastError: task.lastError,
      backoffUntil: task.backoffUntil,
      isRunning: this.runningAgents.has(task.agentId),
      isPaused: task.isPaused || false,
      jobId: task.jobId || task.agentId,
    }));
  }
  /**
   * Run an agent immediately
   * @param agentId Agent ID
   * @returns Promise resolving when agent execution starts
   */
  async runAgentNow(agentId) {
    try {
      // Check if the agent exists
      const agent = await this.prisma.aIAgent.findUnique({
        where: { id: agentId },
      });
      if (!agent) {
        throw new Error(`Agent with ID ${agentId} not found`);
      }
      // If the agent is already running, don't run it again
      if (this.runningAgents.has(agentId)) {
        logger_1.logger.warn(`Agent ${agentId} is already running`);
        return;
      }
      // Create a temporary task
      const task = {
        agentId,
        agent,
        nextRunTime: new Date(),
        priority: this.getAgentPriority(agent),
        retryCount: 0,
        isManualRun: true,
      };
      // Execute the task immediately
      logger_1.logger.info(`Starting immediate execution of agent ${agentId}`);
      return this.executeTask(task);
    } catch (error) {
      logger_1.logger.error(
        `Error running agent ${agentId} immediately:`,
        error,
      );
      throw error;
    }
  }
  /**
   * Pause a scheduled job
   * @param agentId Agent ID
   * @param jobId Job ID (optional, defaults to agentId)
   */
  async pauseJob(agentId, jobId) {
    const effectiveJobId = jobId || agentId;
    const task = this.scheduledTasks.get(agentId);
    if (!task) {
      throw new Error(`No scheduled task found for agent ${agentId}`);
    }
    // Check if already running
    if (this.runningAgents.has(agentId)) {
      throw new Error(`Cannot pause agent ${agentId} while it is running`);
    }
    // Mark as paused
    task.isPaused = true;
    task.jobId = effectiveJobId;
    this.pausedJobs.set(effectiveJobId, true);
    // Update database to reflect paused state
    await this.prisma.aIAgent.update({
      where: { id: agentId },
      data: {
        status: client_1.AgentStatus.IDLE,
        // Store pause state in configuration
        configuration: {
          ...(task.agent.configuration || {}),
          isPaused: true,
          pausedAt: new Date().toISOString(),
        },
      },
    });
    logger_1.logger.info(`Paused job ${effectiveJobId} for agent ${agentId}`);
    // Emit WebSocket event for agent paused
    try {
      const wsService = websocket_service_1.WebSocketService.getInstance();
      wsService.emitAgentPaused(agentId, effectiveJobId);
    } catch (error) {
      logger_1.logger.warn('WebSocket service not available:', error);
    }
  }
  /**
   * Resume a paused job
   * @param agentId Agent ID
   * @param jobId Job ID (optional, defaults to agentId)
   */
  async resumeJob(agentId, jobId) {
    const effectiveJobId = jobId || agentId;
    const task = this.scheduledTasks.get(agentId);
    if (!task) {
      throw new Error(`No scheduled task found for agent ${agentId}`);
    }
    if (!task.isPaused && !this.pausedJobs.has(effectiveJobId)) {
      throw new Error(
        `Job ${effectiveJobId} for agent ${agentId} is not paused`,
      );
    }
    // Remove paused state
    task.isPaused = false;
    this.pausedJobs.delete(effectiveJobId);
    // Update database
    await this.prisma.aIAgent.update({
      where: { id: agentId },
      data: {
        status: client_1.AgentStatus.IDLE,
        // Remove pause state from configuration
        configuration: {
          ...(task.agent.configuration || {}),
          isPaused: false,
          resumedAt: new Date().toISOString(),
        },
      },
    });
    // Recalculate next run time if it's in the past
    if (task.nextRunTime < new Date() && task.agent.scheduleExpression) {
      task.nextRunTime = this.calculateNextRunTime(
        task.agent.scheduleExpression,
      );
      await this.prisma.aIAgent.update({
        where: { id: agentId },
        data: { nextRunAt: task.nextRunTime },
      });
    }
    logger_1.logger.info(`Resumed job ${effectiveJobId} for agent ${agentId}`);
    // Emit WebSocket event for agent resumed
    try {
      const wsService = websocket_service_1.WebSocketService.getInstance();
      wsService.emitAgentResumed(agentId, effectiveJobId);
    } catch (error) {
      logger_1.logger.warn('WebSocket service not available:', error);
    }
  }
  /**
   * Get paused jobs
   */
  getPausedJobs() {
    return Array.from(this.scheduledTasks.entries())
      .filter(([_, task]) => task.isPaused)
      .map(([agentId, task]) => ({
        agentId,
        jobId: task.jobId || agentId,
      }));
  }
}
exports.AgentScheduler = AgentScheduler;
AgentScheduler.instance = null;
