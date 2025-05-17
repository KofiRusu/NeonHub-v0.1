import { PrismaClient } from '@prisma/client';
import * as cron from 'cron-parser';
import { AgentManager } from '../manager/AgentManager';
import { logger } from '../../utils/logger';

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
  checkInterval: number; // milliseconds
}

/**
 * Handles scheduling and automatic execution of agents
 */
export class AgentScheduler {
  private prisma: PrismaClient;
  private agentManager: AgentManager;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private options: SchedulerOptions;

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
    options: SchedulerOptions = { checkInterval: 60000 }
  ) {
    this.prisma = prisma;
    this.agentManager = agentManager;
    this.options = options;

    if (this.options.autoStart) {
      this.start();
    }
  }
  
  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    logger.info(`Scheduler started, checking every ${this.options.checkInterval / 1000} seconds`);

    // Initial check
    this.checkScheduledAgents();

    // Set up interval for subsequent checks
    this.intervalId = setInterval(() => {
      this.checkScheduledAgents();
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
   * Check for and run scheduled agents
   */
  private async checkScheduledAgents(): Promise<void> {
    try {
      const agents = await this.prisma.aIAgent.findMany({
        where: {
          scheduleEnabled: true,
          scheduleExpression: {
            not: null,
          },
          status: {
            notIn: ['RUNNING', 'ERROR'],
          },
        },
      });

      const now = new Date();

      for (const agent of agents) {
        if (agent.scheduleExpression) {
          try {
            const interval = new cron.Parser().parse(agent.scheduleExpression);
            const nextRun = interval.next().toDate();

            // Update next run time
            await this.prisma.aIAgent.update({
              where: { id: agent.id },
              data: { nextRunAt: nextRun },
            });

            logger.info(`Next run for agent ${agent.id} scheduled at ${nextRun}`);
          } catch (error) {
            logger.error(`Error parsing schedule expression for agent ${agent.id}:`, error);
          }
        }
      }
    } catch (error) {
      logger.error('Error checking scheduled agents:', error);
    }
  }
  
  /**
   * Calculate the next run time for a cron expression
   * @param cronExpression Cron expression
   * @returns Next run date
   */
  calculateNextRunTime(cronExpression: string): Date {
    try {
      const interval = new cron.Parser().parse(cronExpression);
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
} 