import { PrismaClient, AIAgent } from '@prisma/client';
import { BaseAgent } from '../base/BaseAgent';
import { AgentExecutionResult } from '../base/types';
/**
 * Configuration interface for the SEO Agent
 */
export interface SEOAgentConfig {
    /**
     * Keywords to target for SEO optimization
     */
    targetKeywords?: string[];
    /**
     * Website URL to analyze
     */
    websiteUrl?: string;
    /**
     * Specific pages to optimize
     */
    pagesToOptimize?: string[];
    /**
     * Minimum target keyword density (percentage)
     */
    keywordDensityTarget?: number;
    /**
     * Competitor websites to analyze
     */
    competitorUrls?: string[];
    /**
     * Whether to generate schema markup
     */
    generateSchemaMarkup?: boolean;
    /**
     * Maximum number of recommendations to generate
     */
    maxRecommendations?: number;
}
/**
 * SEO Agent for analyzing and optimizing website content for search engines
 *
 * Provides recommendations for improving search rankings, analyzing keyword
 * performance, generating meta tags, and optimizing content structure.
 */
export declare class SEOAgent extends BaseAgent {
    constructor(prisma: PrismaClient, agentData: AIAgent);
    /**
     * Execute the SEO analysis and optimization
     * @param config Agent configuration
     * @returns Execution result with SEO recommendations
     */
    protected executeImpl(config: SEOAgentConfig): Promise<AgentExecutionResult>;
    /**
     * Simulate keyword analysis
     */
    private analyzeKeywords;
    /**
     * Simulate competitor analysis
     */
    private analyzeCompetitors;
    /**
     * Generate SEO recommendations
     */
    private generateRecommendations;
    /**
     * Check for technical SEO issues
     */
    private checkTechnicalSEO;
    /**
     * Generate schema markup
     */
    private generateSchemaMarkup;
    /**
     * Stop any ongoing execution
     */
    protected stopImpl(): Promise<void>;
    /**
     * Simulate processing time for async operations
     */
    private simulateProcessing;
}
