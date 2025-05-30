import { PrismaClient } from '@prisma/client';
import { AgentScheduler } from '../agents/scheduler/AgentScheduler';
import { AgentManager } from '../agents/manager/AgentManager';
import { logger } from '../utils/logger';

/**
 * Singleton service for managing the global AgentScheduler instance
 */
class SchedulerSingleton {
  private static instance: SchedulerSingleton;
  private scheduler: AgentScheduler | null = null;
  private prisma: PrismaClient;
  private isInitialized = false;

  private constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): SchedulerSingleton {
    if (!SchedulerSingleton.instance) {
      SchedulerSingleton.instance = new SchedulerSingleton();
    }
    return SchedulerSingleton.instance;
  }

  /**
   * Initialize the scheduler
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn('Scheduler already initialized');
      return;
    }

    try {
      const agentManager = new AgentManager(this.prisma);

      // Create scheduler with configuration from environment
      this.scheduler = new AgentScheduler(this.prisma, agentManager, {
        checkInterval: parseInt(
          process.env.SCHEDULER_CHECK_INTERVAL || '60000',
        ),
        maxConcurrentAgents: parseInt(
          process.env.SCHEDULER_MAX_CONCURRENT || '5',
        ),
        maxRetries: parseInt(process.env.SCHEDULER_MAX_RETRIES || '3'),
        baseBackoffDelay: parseInt(
          process.env.SCHEDULER_BACKOFF_BASE || '1000',
        ),
        maxBackoffDelay: parseInt(
          process.env.SCHEDULER_BACKOFF_MAX || '300000',
        ),
        autoStart: true,
      });

      // Start the scheduler
      await this.scheduler.start();
      this.isInitialized = true;

      logger.info('Agent scheduler initialized and started successfully');
    } catch (error) {
      logger.error('Failed to initialize scheduler:', error);
      throw error;
    }
  }

  /**
   * Get the scheduler instance
   */
  public getScheduler(): AgentScheduler {
    if (!this.scheduler || !this.isInitialized) {
      throw new Error('Scheduler not initialized. Call initialize() first.');
    }
    return this.scheduler;
  }

  /**
   * Stop the scheduler
   */
  public async stop(): Promise<void> {
    if (this.scheduler) {
      this.scheduler.stop();
      this.isInitialized = false;
      logger.info('Agent scheduler stopped');
    }
  }

  /**
   * Restart the scheduler
   */
  public async restart(): Promise<void> {
    await this.stop();
    await this.initialize();
  }

  /**
   * Health check for the scheduler
   */
  public isHealthy(): boolean {
    if (!this.scheduler || !this.isInitialized) {
      return false;
    }

    const stats = this.scheduler.getStats();
    return stats.isRunning;
  }
}

// Export singleton instance
export const schedulerSingleton = SchedulerSingleton.getInstance();

// Export helper function to get scheduler directly
export const getScheduler = (): AgentScheduler => {
  return schedulerSingleton.getScheduler();
};
