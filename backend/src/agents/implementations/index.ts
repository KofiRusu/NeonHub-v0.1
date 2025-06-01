import { PrismaClient, AIAgent, AgentType } from '@prisma/client';
import { BaseAgent } from '../base/BaseAgent';
import { AgentPlugin, pluginRegistry } from '../factory/AgentFactory';

// Import all agent implementations
import { ContentCreatorAgent } from './ContentCreatorAgent';
import { TrendAnalyzerAgent } from './TrendAnalyzerAgent';
import { OutreachManagerAgent } from './OutreachManagerAgent';
import { PerformanceOptimizerAgent } from './PerformanceOptimizerAgent';
import { AudienceResearchAgent } from './AudienceResearchAgent';
import { SEOAgent } from './SEOAgent';
import { CustomerSupportAgent } from './CustomerSupportAgent';
import { EngineeringConversationAgent } from './EngineeringConversationAgent';

// Define plugins for each agent type
const contentCreatorPlugin: AgentPlugin = {
  type: AgentType.CONTENT_CREATOR,
  name: 'Content Creator Agent',
  description: 'Creates engaging content for various platforms and formats',
  version: '1.0.0',
  create: (prisma: PrismaClient, agentData: AIAgent) =>
    new ContentCreatorAgent(prisma, agentData),
  validateConfig: (config: any) => {
    return (
      config &&
      typeof config === 'object' &&
      (config.topics || config.contentType || config.platform)
    );
  },
  getDefaultConfig: () => ({
    topics: ['marketing', 'technology'],
    contentType: 'BLOG_POST',
    platform: 'WEBSITE',
    tone: 'professional',
    length: { min: 200, max: 800 },
    includeImages: false,
    seoOptimized: true,
  }),
};

const trendAnalyzerPlugin: AgentPlugin = {
  type: AgentType.TREND_ANALYZER,
  name: 'Trend Analyzer Agent',
  description: 'Analyzes market trends and identifies opportunities',
  version: '1.0.0',
  create: (prisma: PrismaClient, agentData: AIAgent) =>
    new TrendAnalyzerAgent(prisma, agentData),
  validateConfig: (config: any) => {
    return (
      config &&
      typeof config === 'object' &&
      (config.sources || config.industries || config.keywords)
    );
  },
  getDefaultConfig: () => ({
    sources: ['social_media', 'news', 'search_trends'],
    industries: ['technology', 'marketing'],
    keywords: ['AI', 'automation', 'digital transformation'],
    timeframe: '7d',
    confidenceThreshold: 0.7,
  }),
};

const outreachManagerPlugin: AgentPlugin = {
  type: AgentType.OUTREACH_MANAGER,
  name: 'Outreach Manager Agent',
  description: 'Manages outreach campaigns and lead generation',
  version: '1.0.0',
  create: (prisma: PrismaClient, agentData: AIAgent) =>
    new OutreachManagerAgent(prisma, agentData),
  validateConfig: (config: any) => {
    return (
      config &&
      typeof config === 'object' &&
      (config.outreachType || config.templates || config.personalizationLevel)
    );
  },
  getDefaultConfig: () => ({
    outreachType: 'COLD_EMAIL',
    personalizationLevel: 'high',
    templates: {
      email: 'Professional email template',
      linkedin: 'LinkedIn connection template',
    },
    followUpSequence: true,
    maxFollowUps: 3,
  }),
};

const performanceOptimizerPlugin: AgentPlugin = {
  type: AgentType.PERFORMANCE_OPTIMIZER,
  name: 'Performance Optimizer Agent',
  description: 'Optimizes campaign performance and ad spend',
  version: '1.0.0',
  create: (prisma: PrismaClient, agentData: AIAgent) =>
    new PerformanceOptimizerAgent(prisma, agentData),
  validateConfig: (config: any) => {
    return (
      config &&
      typeof config === 'object' &&
      (config.platforms || config.targetMetrics || config.optimizationGoals)
    );
  },
  getDefaultConfig: () => ({
    platforms: ['FACEBOOK', 'GOOGLE'],
    targetMetrics: {
      ctr: 0.02,
      cpc: 2.5,
      roas: 4.0,
    },
    optimizationGoals: ['cost_efficiency', 'reach'],
    bidStrategy: 'automatic',
  }),
};

const audienceResearchPlugin: AgentPlugin = {
  type: 'AUDIENCE_RESEARCHER' as AgentType,
  name: 'Audience Research Agent',
  description: 'Researches and analyzes target audiences',
  version: '1.0.0',
  create: (prisma: PrismaClient, agentData: AIAgent) =>
    new AudienceResearchAgent(prisma, agentData),
  validateConfig: (config: any) => {
    return (
      config &&
      typeof config === 'object' &&
      (config.demographics || config.interests || config.behaviors)
    );
  },
  getDefaultConfig: () => ({
    demographics: {
      ageRange: [25, 45],
      locations: ['US', 'CA', 'UK'],
      languages: ['en'],
    },
    interests: ['technology', 'business', 'marketing'],
    behaviors: ['online_shoppers', 'mobile_users'],
    researchDepth: 'comprehensive',
  }),
};

const seoPlugin: AgentPlugin = {
  type: 'SEO_SPECIALIST' as AgentType,
  name: 'SEO Specialist Agent',
  description: 'Optimizes content and strategies for search engines',
  version: '1.0.0',
  create: (prisma: PrismaClient, agentData: AIAgent) =>
    new SEOAgent(prisma, agentData),
  validateConfig: (config: any) => {
    return (
      config &&
      typeof config === 'object' &&
      (config.keywords || config.targetPages || config.optimizationType)
    );
  },
  getDefaultConfig: () => ({
    keywords: ['primary keyword', 'secondary keyword'],
    targetPages: ['homepage', 'product pages'],
    optimizationType: 'on_page',
    competitorAnalysis: true,
    technicalSEO: true,
  }),
};

const customerSupportPlugin: AgentPlugin = {
  type: AgentType.CUSTOMER_SUPPORT,
  name: 'Customer Support Agent',
  description: 'Provides automated customer support and assistance',
  version: '1.0.0',
  create: (prisma: PrismaClient, agentData: AIAgent) =>
    new CustomerSupportAgent(prisma, agentData),
  validateConfig: (config: any) => {
    return (
      config &&
      typeof config === 'object' &&
      (config.supportChannels || config.knowledgeBase || config.escalationRules)
    );
  },
  getDefaultConfig: () => ({
    supportChannels: ['email', 'chat', 'phone'],
    knowledgeBase: 'default',
    escalationRules: {
      complexityThreshold: 0.8,
      sentimentThreshold: 0.3,
    },
    responseTime: 'immediate',
  }),
};

// Register all plugins
export function registerAllAgentPlugins(): void {
  pluginRegistry.register(contentCreatorPlugin);
  pluginRegistry.register(trendAnalyzerPlugin);
  pluginRegistry.register(outreachManagerPlugin);
  pluginRegistry.register(performanceOptimizerPlugin);
  pluginRegistry.register(audienceResearchPlugin);
  pluginRegistry.register(seoPlugin);
  pluginRegistry.register(customerSupportPlugin);

  console.log('All agent plugins registered successfully');
}

// Legacy function for backward compatibility
export function getAgentImplementation(
  agentType: AgentType,
  prisma: PrismaClient,
  agentData: AIAgent,
): BaseAgent {
  const plugin = pluginRegistry.get(agentType);

  if (!plugin) {
    throw new Error(`No implementation found for agent type: ${agentType}`);
  }

  return plugin.create(prisma, agentData);
}

// Auto-register plugins when this module is imported
registerAllAgentPlugins();
