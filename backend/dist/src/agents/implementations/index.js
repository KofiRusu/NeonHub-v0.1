'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.registerAllAgentPlugins = registerAllAgentPlugins;
exports.getAgentImplementation = getAgentImplementation;
const AgentFactory_1 = require('../factory/AgentFactory');
// Import all agent implementations
const ContentCreatorAgent_1 = require('./ContentCreatorAgent');
const TrendAnalyzerAgent_1 = require('./TrendAnalyzerAgent');
const OutreachManagerAgent_1 = require('./OutreachManagerAgent');
const PerformanceOptimizerAgent_1 = require('./PerformanceOptimizerAgent');
const AudienceResearchAgent_1 = require('./AudienceResearchAgent');
const SEOAgent_1 = require('./SEOAgent');
const CustomerSupportAgent_1 = require('./CustomerSupportAgent');
// Define plugins for each agent type
const contentCreatorPlugin = {
  type: 'CONTENT_CREATOR',
  name: 'Content Creator Agent',
  description: 'Creates engaging content for various platforms and formats',
  version: '1.0.0',
  create: (prisma, agentData) =>
    new ContentCreatorAgent_1.ContentCreatorAgent(prisma, agentData),
  validateConfig: (config) => {
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
const trendAnalyzerPlugin = {
  type: 'TREND_ANALYZER',
  name: 'Trend Analyzer Agent',
  description: 'Analyzes market trends and identifies opportunities',
  version: '1.0.0',
  create: (prisma, agentData) =>
    new TrendAnalyzerAgent_1.TrendAnalyzerAgent(prisma, agentData),
  validateConfig: (config) => {
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
const outreachManagerPlugin = {
  type: 'OUTREACH_MANAGER',
  name: 'Outreach Manager Agent',
  description: 'Manages outreach campaigns and lead generation',
  version: '1.0.0',
  create: (prisma, agentData) =>
    new OutreachManagerAgent_1.OutreachManagerAgent(prisma, agentData),
  validateConfig: (config) => {
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
const performanceOptimizerPlugin = {
  type: 'PERFORMANCE_OPTIMIZER',
  name: 'Performance Optimizer Agent',
  description: 'Optimizes campaign performance and ad spend',
  version: '1.0.0',
  create: (prisma, agentData) =>
    new PerformanceOptimizerAgent_1.PerformanceOptimizerAgent(
      prisma,
      agentData,
    ),
  validateConfig: (config) => {
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
const audienceResearchPlugin = {
  type: 'AUDIENCE_RESEARCHER',
  name: 'Audience Research Agent',
  description: 'Researches and analyzes target audiences',
  version: '1.0.0',
  create: (prisma, agentData) =>
    new AudienceResearchAgent_1.AudienceResearchAgent(prisma, agentData),
  validateConfig: (config) => {
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
const seoPlugin = {
  type: 'SEO_SPECIALIST',
  name: 'SEO Specialist Agent',
  description: 'Optimizes content and strategies for search engines',
  version: '1.0.0',
  create: (prisma, agentData) => new SEOAgent_1.SEOAgent(prisma, agentData),
  validateConfig: (config) => {
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
const customerSupportPlugin = {
  type: 'CUSTOMER_SUPPORT',
  name: 'Customer Support Agent',
  description: 'Provides automated customer support and assistance',
  version: '1.0.0',
  create: (prisma, agentData) =>
    new CustomerSupportAgent_1.CustomerSupportAgent(prisma, agentData),
  validateConfig: (config) => {
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
function registerAllAgentPlugins() {
  AgentFactory_1.pluginRegistry.register(contentCreatorPlugin);
  AgentFactory_1.pluginRegistry.register(trendAnalyzerPlugin);
  AgentFactory_1.pluginRegistry.register(outreachManagerPlugin);
  AgentFactory_1.pluginRegistry.register(performanceOptimizerPlugin);
  AgentFactory_1.pluginRegistry.register(audienceResearchPlugin);
  AgentFactory_1.pluginRegistry.register(seoPlugin);
  AgentFactory_1.pluginRegistry.register(customerSupportPlugin);
  console.log('All agent plugins registered successfully');
}
// Legacy function for backward compatibility
function getAgentImplementation(agentType, prisma, agentData) {
  const plugin = AgentFactory_1.pluginRegistry.get(agentType);
  if (!plugin) {
    throw new Error(`No implementation found for agent type: ${agentType}`);
  }
  return plugin.create(prisma, agentData);
}
// Auto-register plugins when this module is imported
registerAllAgentPlugins();
