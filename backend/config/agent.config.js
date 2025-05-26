/**
 * Configuration for background agents
 */
module.exports = {
  scheduler: {
    // Whether to enable the agent scheduler on startup
    enabled: process.env.AGENT_SCHEDULER_ENABLED === 'true',

    // Interval in milliseconds to check for scheduled agents
    checkInterval: parseInt(process.env.AGENT_SCHEDULER_INTERVAL || '30000'),

    // Whether to run missed jobs on startup
    runMissedOnStartup: process.env.AGENT_RUN_MISSED_ON_STARTUP === 'true',

    // Maximum number of concurrent agents
    maxConcurrentAgents: parseInt(process.env.MAX_CONCURRENT_AGENTS || '5'),
  },

  // Default configuration for different agent types
  defaults: {
    CONTENT_CREATOR: {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2048,
    },
    TREND_ANALYZER: {
      model: 'gpt-4',
      temperature: 0.3,
      maxTokens: 1024,
    },
    OUTREACH_MANAGER: {
      model: 'gpt-4',
      temperature: 0.5,
      maxTokens: 1536,
    },
    PERFORMANCE_OPTIMIZER: {
      model: 'gpt-4',
      temperature: 0.2,
      maxTokens: 1024,
    },
    ENGINEERING_CONVERSATION: {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2048,
    },
  },
};
