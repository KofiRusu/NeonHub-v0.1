import { PrismaClient, AIAgent, AgentType } from '@prisma/client';
import { BaseAgent } from '../base/BaseAgent';
import { ContentCreatorAgent } from './ContentCreatorAgent';
import { TrendAnalyzerAgent } from './TrendAnalyzerAgent';
import { OutreachManagerAgent } from './OutreachManagerAgent';
import { PerformanceOptimizerAgent } from './PerformanceOptimizerAgent';
import { AudienceResearchAgent } from './AudienceResearchAgent';
import { SEOAgent } from './SEOAgent';
import { CustomerSupportAgent } from './CustomerSupportAgent';

/**
 * Factory function to get the appropriate agent implementation based on type
 * 
 * @param agentType The type of agent to create
 * @param prisma Prisma client instance
 * @param agentData Agent data from the database
 * @returns BaseAgent instance
 */
export function getAgentImplementation(
  agentType: AgentType | string,
  prisma: PrismaClient,
  agentData: AIAgent
): BaseAgent {
  switch (agentType) {
    case 'CONTENT_CREATOR':
      return new ContentCreatorAgent(prisma, agentData);
    case 'TREND_ANALYZER':
      return new TrendAnalyzerAgent(prisma, agentData);
    case 'OUTREACH_MANAGER':
      return new OutreachManagerAgent(prisma, agentData);
    case 'PERFORMANCE_OPTIMIZER':
      return new PerformanceOptimizerAgent(prisma, agentData);
    case 'AUDIENCE_RESEARCH':
      return new AudienceResearchAgent(prisma, agentData);
    case 'SEO':
      return new SEOAgent(prisma, agentData);
    case 'CUSTOMER_SUPPORT':
      return new CustomerSupportAgent(prisma, agentData);
    default:
      throw new Error(`Unknown agent type: ${agentType}`);
  }
}

// Export all agent implementations
export {
  ContentCreatorAgent,
  TrendAnalyzerAgent,
  OutreachManagerAgent,
  PerformanceOptimizerAgent,
  AudienceResearchAgent,
  SEOAgent,
  CustomerSupportAgent
}; 