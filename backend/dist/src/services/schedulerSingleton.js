'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getScheduler = exports.schedulerSingleton = void 0;
const client_1 = require('@prisma/client');
const AgentScheduler_1 = require('../agents/scheduler/AgentScheduler');
const AgentManager_1 = require('../agents/manager/AgentManager');
const logger_1 = require('../utils/logger');
/**
 * Singleton service for managing the global AgentScheduler instance
 */
class SchedulerSingleton {
  constructor() {
    this.scheduler = null;
    this.isInitialized = false;
    this.prisma = new client_1.PrismaClient();
  }
  /**
   * Get the singleton instance
   */
  static getInstance() {
    if (!SchedulerSingleton.instance) {
      SchedulerSingleton.instance = new SchedulerSingleton();
    }
    return SchedulerSingleton.instance;
  }
  /**
   * Initialize the scheduler
   */
  async initialize() {
    if (this.isInitialized) {
      logger_1.logger.warn('Scheduler already initialized');
      return;
    }
    try {
      const agentManager = new AgentManager_1.AgentManager(this.prisma);
      // Create scheduler with configuration from environment
      this.scheduler = new AgentScheduler_1.AgentScheduler(
        this.prisma,
        agentManager,
        {
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
        },
      );
      // Start the scheduler
      await this.scheduler.start();
      this.isInitialized = true;
      logger_1.logger.info(
        'Agent scheduler initialized and started successfully',
      );
    } catch (error) {
      logger_1.logger.error('Failed to initialize scheduler:', error);
      throw error;
    }
  }
  /**
   * Get the scheduler instance
   */
  getScheduler() {
    if (!this.scheduler || !this.isInitialized) {
      throw new Error('Scheduler not initialized. Call initialize() first.');
    }
    return this.scheduler;
  }
  /**
   * Stop the scheduler
   */
  async stop() {
    if (this.scheduler) {
      this.scheduler.stop();
      this.isInitialized = false;
      logger_1.logger.info('Agent scheduler stopped');
    }
  }
  /**
   * Restart the scheduler
   */
  async restart() {
    await this.stop();
    await this.initialize();
  }
  /**
   * Health check for the scheduler
   */
  isHealthy() {
    if (!this.scheduler || !this.isInitialized) {
      return false;
    }
    const stats = this.scheduler.getStats();
    return stats.isRunning;
  }
}
// Export singleton instance
exports.schedulerSingleton = SchedulerSingleton.getInstance();
// Export helper function to get scheduler directly
const getScheduler = () => {
  return exports.schedulerSingleton.getScheduler();
};
exports.getScheduler = getScheduler;
