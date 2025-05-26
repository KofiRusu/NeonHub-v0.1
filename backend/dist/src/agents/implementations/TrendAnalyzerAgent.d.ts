import { PrismaClient, AIAgent } from '@prisma/client';
import { BaseAgent } from '../base/BaseAgent';
interface TrendAnalysisConfig {
    keywords: string[];
    industry: string;
    timeframe: 'day' | 'week' | 'month';
    sources?: string[];
    projectId: string;
}
/**
 * Agent for analyzing marketing trends and generating trend signals
 */
export declare class TrendAnalyzerAgent extends BaseAgent {
    constructor(prisma: PrismaClient, agentData: AIAgent);
    /**
     * Implementation of the trend analysis logic
     * @param config Trend analysis configuration
     * @returns The analyzed trends
     */
    protected executeImpl(config: TrendAnalysisConfig): Promise<any>;
    /**
     * Simulate trend analysis (would call external APIs in real implementation)
     * @param config Trend analysis configuration
     * @returns Generated trend signals
     */
    private analyzeTrends;
    /**
     * Generate a summary of trend signals
     * @param trends The trend signals to summarize
     * @returns A text summary
     */
    private generateTrendSummary;
}
export {};
