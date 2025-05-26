"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentScheduler = exports.AgentPriority = void 0;
const client_1 = require("@prisma/client");
const cron_parser_1 = require("cron-parser");
const logger_1 = require("../../utils/logger");
/**
 * Priority levels for agent execution
 */
var AgentPriority;
(function (AgentPriority) {
    AgentPriority[AgentPriority["LOW"] = 1] = "LOW";
    AgentPriority[AgentPriority["NORMAL"] = 2] = "NORMAL";
    AgentPriority[AgentPriority["HIGH"] = 3] = "HIGH";
    AgentPriority[AgentPriority["CRITICAL"] = 4] = "CRITICAL";
})(AgentPriority || (exports.AgentPriority = AgentPriority = {}));
/**
 * Handles scheduling and automatic execution of agents
 */
class AgentScheduler {
    prisma;
    agentManager;
    isRunning = false;
    intervalId = null;
    options;
    scheduledTasks = new Map();
    runningAgents = new Set();
    taskQueue = [];
    /**
     * Create a new agent scheduler
     *
     * @param prisma Prisma client instance
     * @param agentManager Agent manager instance
     * @param options Scheduler options
     */
    constructor(prisma, agentManager, options = {}) {
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
        logger_1.logger.info(`Scheduler started, checking every ${this.options.checkInterval / 1000} seconds`);
        logger_1.logger.info(`Max concurrent agents: ${this.options.maxConcurrentAgents}`);
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
    async scheduleAgent(agentId, cronExpression, priority = AgentPriority.NORMAL, enabled = true) {
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
                    logger_1.logger.info(`Agent ${agentId} scheduled with priority ${priority}`);
                }
            }
            else {
                this.unscheduleAgent(agentId);
            }
        }
        catch (error) {
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
                        const nextRunTime = agent.nextRunAt ||
                            this.calculateNextRunTime(agent.scheduleExpression);
                        const task = {
                            agentId: agent.id,
                            agent,
                            nextRunTime,
                            priority: this.getAgentPriority(agent),
                            retryCount: 0,
                        };
                        this.scheduledTasks.set(agent.id, task);
                        this.addToQueue(task);
                    }
                    catch (error) {
                        logger_1.logger.error(`Error loading scheduled agent ${agent.id}:`, error);
                    }
                }
            }
            logger_1.logger.info(`Loaded ${this.scheduledTasks.size} scheduled agents`);
        }
        catch (error) {
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
                return (task.nextRunTime <= now &&
                    (!task.backoffUntil || task.backoffUntil <= now) &&
                    !this.runningAgents.has(task.agentId));
            });
            // Respect concurrency limit
            const availableSlots = this.options.maxConcurrentAgents - this.runningAgents.size;
            const tasksToExecute = tasksToRun.slice(0, availableSlots);
            for (const task of tasksToExecute) {
                await this.executeTask(task);
            }
            // Update next run times for completed tasks
            await this.updateNextRunTimes();
        }
        catch (error) {
            logger_1.logger.error('Error processing scheduled tasks:', error);
        }
    }
    /**
     * Execute a scheduled task
     * @param task The task to execute
     */
    async executeTask(task) {
        try {
            this.runningAgents.add(task.agentId);
            logger_1.logger.info(`Executing scheduled agent ${task.agentId} (priority: ${task.priority})`);
            // Update agent status
            await this.prisma.aIAgent.update({
                where: { id: task.agentId },
                data: { status: client_1.AgentStatus.RUNNING, lastRunAt: new Date() },
            });
            // Execute the agent
            await this.agentManager.startAgent(task.agentId);
            // Reset retry count on successful execution
            task.retryCount = 0;
            task.lastError = undefined;
            task.backoffUntil = undefined;
            logger_1.logger.info(`Agent ${task.agentId} executed successfully`);
        }
        catch (error) {
            logger_1.logger.error(`Error executing agent ${task.agentId}:`, error);
            await this.handleTaskFailure(task, error);
        }
        finally {
            this.runningAgents.delete(task.agentId);
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
            const delay = Math.min(baseDelay * Math.pow(2, task.retryCount - 1), maxDelay);
            task.backoffUntil = new Date(Date.now() + delay);
            logger_1.logger.warn(`Agent ${task.agentId} failed (attempt ${task.retryCount}/${maxRetries}), will retry in ${delay}ms`);
        }
        else {
            logger_1.logger.error(`Agent ${task.agentId} failed after ${maxRetries} attempts, removing from schedule`);
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
                    const nextRunTime = this.calculateNextRunTime(task.agent.scheduleExpression);
                    task.nextRunTime = nextRunTime;
                    // Update in database
                    await this.prisma.aIAgent.update({
                        where: { id: agentId },
                        data: { nextRunAt: nextRunTime },
                    });
                }
                catch (error) {
                    logger_1.logger.error(`Error updating next run time for agent ${agentId}:`, error);
                }
            }
        }
    }
    /**
     * Run missed jobs on startup
     */
    async runMissedJobs() {
        const now = new Date();
        const missedTasks = Array.from(this.scheduledTasks.values()).filter((task) => task.nextRunTime < now);
        if (missedTasks.length > 0) {
            logger_1.logger.info(`Found ${missedTasks.length} missed jobs, executing them now`);
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
        }
        catch (error) {
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
        }));
    }
}
exports.AgentScheduler = AgentScheduler;
//# sourceMappingURL=AgentScheduler.js.map