import { AgentScheduler } from '../agents/scheduler/AgentScheduler';
/**
 * Singleton service for managing the global AgentScheduler instance
 */
declare class SchedulerSingleton {
  private static instance;
  private scheduler;
  private prisma;
  private isInitialized;
  private constructor();
  /**
   * Get the singleton instance
   */
  static getInstance(): SchedulerSingleton;
  /**
   * Initialize the scheduler
   */
  initialize(): Promise<void>;
  /**
   * Get the scheduler instance
   */
  getScheduler(): AgentScheduler;
  /**
   * Stop the scheduler
   */
  stop(): Promise<void>;
  /**
   * Restart the scheduler
   */
  restart(): Promise<void>;
  /**
   * Health check for the scheduler
   */
  isHealthy(): boolean;
}
export declare const schedulerSingleton: SchedulerSingleton;
export declare const getScheduler: () => AgentScheduler;
export {};
