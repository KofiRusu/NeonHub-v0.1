import { PrismaClient, AIAgent } from '@prisma/client';
import { BaseAgent } from '../base/BaseAgent';
interface AudienceResearchConfig {
  industry: string;
  targetMarket: string;
  demographicFocus?: string[];
  psychographicFocus?: string[];
  competitorAnalysis?: boolean;
  projectId: string;
  keyTerms?: string[];
  dataSourcePriority?: 'ACCURACY' | 'RECENCY' | 'BREADTH';
}
/**
 * Agent for researching and analyzing audience data to refine targeting
 */
export declare class AudienceResearchAgent extends BaseAgent {
  constructor(prisma: PrismaClient, agentData: AIAgent);
  /**
   * Implementation of audience research logic
   * @param config Research configuration
   * @returns Research results and audience insights
   */
  protected executeImpl(config: AudienceResearchConfig): Promise<any>;
  /**
   * Research demographic data for the target market
   */
  private researchDemographics;
  /**
   * Analyze behavioral patterns for the target audience
   */
  private analyzeBehavioralPatterns;
  /**
   * Analyze competitor audience for overlap and differentiation
   */
  private analyzeCompetitorAudience;
  /**
   * Generate audience segments based on all research data
   */
  private generateAudienceSegments;
  /**
   * Generate a summary of the audience research
   */
  private generateResearchSummary;
  private generateAgeDistribution;
  private generateGenderDistribution;
  private generateIncomeDistribution;
  private generateEducationDistribution;
  private generateLocationDistribution;
  private generateChannelPreferences;
  private generatePurchaseFrequency;
  private generateContentPreferences;
  private generateDeviceUsage;
  private generatePeakActivityTimes;
  private generateInterests;
  private generateCompetitors;
  private generateUniqueTraits;
  private assessCompetitivePosition;
  private selectRelevantArchetypes;
  private estimateSegmentSize;
  private getSegmentDemographics;
  private getSegmentBehaviors;
  private getTopChannelsForSegment;
  private generateMessagingRecommendations;
  private getCompetitorPositionForSegment;
  private getTopDemographics;
  private summarizeDemographics;
  private getRandomSubsetWeighted;
  /**
   * Stop any ongoing execution
   */
  protected stopImpl(): Promise<void>;
}
export {};
