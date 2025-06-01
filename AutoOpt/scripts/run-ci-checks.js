const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Path to coordination log
const COORDINATION_LOG = path.join(__dirname, '../logs/coordination-events.log');

// Log event to the coordination log
function logEvent(source, type, message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${source}] [${type}] ${message}\n`;
  
  fs.appendFileSync(COORDINATION_LOG, logEntry);
  console.log(`Event logged: ${logEntry.trim()}`);
  return logEntry;
}

// Run CI checks
console.log('Running CI checks...');
logEvent('CI', 'CI_UPDATE', 'Starting full CI suite');

try {
  // Run linting
  console.log('Running linting...');
  execSync('npm run lint', { stdio: 'pipe' });
  logEvent('CI', 'CI_UPDATE', 'Linting passed');
  
  // Run type checking
  console.log('Running type checking...');
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  logEvent('CI', 'CI_UPDATE', 'Type checking passed');
  
  // Run tests
  console.log('Running tests...');
  execSync('npm test', { stdio: 'pipe' });
  logEvent('CI', 'CI_UPDATE', 'Tests passed');
  
  // Run coverage check
  console.log('Running coverage check...');
  execSync('npm run test:coverage', { stdio: 'pipe' });
  logEvent('CI', 'CI_UPDATE', 'Coverage check passed');
  
  // All checks passed
  logEvent('CI', 'CI_UPDATE', 'All CI checks complete successfully');
  console.log('All CI checks passed!');
} catch (error) {
  const errorMessage = error.message || 'Unknown error';
  logEvent('CI', 'CI_UPDATE', `Blocker: CI checks failed: ${errorMessage}`);
  console.error('CI checks failed:', errorMessage);
} 