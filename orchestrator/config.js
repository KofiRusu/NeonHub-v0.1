/**
 * NeonHub Orchestrator Configuration
 */
module.exports = {
  // Server settings
  PORT: process.env.PORT || 3030,
  
  // Polling interval in milliseconds
  POLL_INTERVAL_MS: process.env.POLL_INTERVAL_MS || 60000, // Default: 1 minute
  
  // Deployment command
  DEPLOY_COMMAND: process.env.DEPLOY_COMMAND || 'node ./orchestrator/mock-vercel.js',
  
  // Log file location
  LOG_DIR: process.env.LOG_DIR || '../../logs',
  LOG_FILE: process.env.LOG_FILE || 'coordination-events.log',
  
  // Detection patterns
  PATTERNS: {
    PROJECT_COMPLETE: /\[PROJECT\] \[PROJECT_UPDATE\].*complete/i,
    CI_PASSED: /\[CI\] \[CI_UPDATE\].*passed/i
  }
}; 