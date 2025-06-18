import { PrismaClient, AIAgent, Platform } from '@prisma/client';
import { BaseAgent } from '../base/BaseAgent';
interface PerformanceConfig {
  campaignId: string;
  platforms: Platform[];
  targetMetrics: {
    ctr?: number;
    cpc?: number;
    conversionRate?: number;
    roi?: number;
  };
  budget?: number;
  optimizationStrategy?: 'AGGRESSIVE' | 'BALANCED' | 'CONSERVATIVE';
  dateRange?: {
    start: Date;
    end: Date;
  };
}
/**
 * Agent for analyzing marketing metrics and optimizing campaigns
 */
export declare class PerformanceOptimizerAgent extends BaseAgent {
  constructor(prisma: PrismaClient, agentData: AIAgent);
  /**
   * Implementation of the performance optimization logic
   * @param config Performance optimization configuration
   * @returns Optimization results
   */
  protected executeImpl(config: PerformanceConfig): Promise<any>;
  /**
   * Fetch current campaign metrics
   * @param campaignId Campaign ID
   * @param platforms Platforms to fetch metrics for
   * @returns Current metrics for the campaign
   */
  private fetchCampaignMetrics;
  /**
   * Generate simulated metrics for a platform
   */
  private generateSimulatedMetrics;
  /**
   * Generate optimization recommendations based on metrics
   * @param currentMetrics Current campaign metrics
   * @param config Optimization configuration
   * @returns Optimization recommendations
   */
  private generateOptimizations;
  /**
   * Store optimization results in the database
   * @param campaignId Campaign ID
   * @param optimizations Optimization recommendations
   * @returns Stored metric records
   */
  private storeOptimizationResults;
  /**
   * Generate a summary of optimization results
   */
  private generateOptimizationSummary;
  /**
   * Stop any ongoing execution
   */
  protected stopImpl(): Promise<void>;
}
export {};
