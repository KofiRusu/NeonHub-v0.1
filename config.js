/**
 * NeonHub Orchestrator Configuration
 */
module.exports = {
  // Server settings
  PORT: process.env.PORT || 3040,
  
  // Polling interval in milliseconds
  POLL_INTERVAL_MS: process.env.POLL_INTERVAL_MS || 10000, // 10 seconds for testing
  
  // Deployment command
  DEPLOY_COMMAND: process.env.DEPLOY_COMMAND || 'node /Users/kofirusu/NeonHub/services/orchestrator/mock-vercel.js',
  
  // Log file location
  LOG_DIR: process.env.LOG_DIR || '../../logs',
  LOG_FILE: process.env.LOG_FILE || 'coordination-events.log',
  
  // Detection patterns
  PATTERNS: {
    PROJECT_COMPLETE: /\[PROJECT\] \[PROJECT_UPDATE\].*complete/i,
    CI_PASSED: /\[CI\] \[CI_UPDATE\].*passed/i
  }
}; 