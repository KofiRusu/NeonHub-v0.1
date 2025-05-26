import { PrismaClient } from '@prisma/client';
import { AgentManager } from '../manager/AgentManager';
/**
 * Priority levels for agent execution
 */
export declare enum AgentPriority {
    LOW = 1,
    NORMAL = 2,
    HIGH = 3,
    CRITICAL = 4
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
    checkInterval?: number;
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
export declare class AgentScheduler {
    private prisma;
    private agentManager;
    private isRunning;
    private intervalId;
    private options;
    private scheduledTasks;
    private runningAgents;
    private taskQueue;
    /**
     * Create a new agent scheduler
     *
     * @param prisma Prisma client instance
     * @param agentManager Agent manager instance
     * @param options Scheduler options
     */
    constructor(prisma: PrismaClient, agentManager: AgentManager, options?: SchedulerOptions);
    /**
     * Start the scheduler
     */
    start(): Promise<void>;
    /**
     * Stop the scheduler
     */
    stop(): void;
    /**
     * Schedule an agent
     * @param agentId Agent ID
     * @param cronExpression Cron expression
     * @param priority Priority level
     * @param enabled Whether scheduling is enabled
     */
    scheduleAgent(agentId: string, cronExpression: string, priority?: AgentPriority, enabled?: boolean): Promise<void>;
    /**
     * Unschedule an agent
     * @param agentId Agent ID
     */
    unscheduleAgent(agentId: string): void;
    /**
     * Load scheduled agents from database
     */
    private loadScheduledAgents;
    /**
     * Process scheduled tasks
     */
    private processScheduledTasks;
    /**
     * Execute a scheduled task
     * @param task The task to execute
     */
    private executeTask;
    /**
     * Handle task execution failure
     * @param task The failed task
     * @param error The error that occurred
     */
    private handleTaskFailure;
    /**
     * Update next run times for scheduled agents
     */
    private updateNextRunTimes;
    /**
     * Run missed jobs on startup
     */
    private runMissedJobs;
    /**
     * Add task to queue
     * @param task The task to add
     */
    private addToQueue;
    /**
     * Get agent priority based on agent configuration
     * @param agent The agent
     * @returns Priority level
     */
    private getAgentPriority;
    /**
     * Calculate the next run time for a cron expression
     * @param cronExpression Cron expression
     * @returns Next run date
     */
    calculateNextRunTime(cronExpression: string): Date;
    /**
     * Check if the scheduler is running
     */
    isSchedulerRunning(): boolean;
    /**
     * Get scheduler statistics
     */
    getStats(): {
        isRunning: boolean;
        scheduledTasksCount: number;
        runningAgentsCount: number;
        queuedTasksCount: number;
        maxConcurrentAgents: number;
    };
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
    }>;
}
export {};
