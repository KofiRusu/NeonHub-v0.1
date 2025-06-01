const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const COORDINATION_LOG = path.join(__dirname, '../logs/coordination-events.log');
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// Ensure logs directory exists
const logsDir = path.dirname(COORDINATION_LOG);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log event to the coordination log
function logEvent(source, type, message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${source}] [${type}] ${message}\n`;
  
  fs.appendFileSync(COORDINATION_LOG, logEntry);
  console.log(`Event logged: ${logEntry.trim()}`);
  
  // If this is a blocker, escalate
  if (message.toLowerCase().includes('blocker')) {
    console.error(`⚠️ BLOCKER DETECTED: ${message}`);
    // Here you could implement additional notification mechanisms
  }
  
  return logEntry;
}

// Get recent events from the log
function getRecentEvents(limit = 10) {
  if (!fs.existsSync(COORDINATION_LOG)) {
    return [];
  }
  
  const content = fs.readFileSync(COORDINATION_LOG, 'utf8');
  return content.split('\n')
    .filter(line => line.trim() !== '')
    .slice(-limit);
}

// Poll for updates
function pollForUpdates() {
  console.log('Polling for updates...');
  
  // Get recent events
  const recentEvents = getRecentEvents(20);
  
  // Check for blockers
  const blockers = recentEvents.filter(event => 
    event.toLowerCase().includes('blocker') || 
    event.toLowerCase().includes('failed') || 
    event.toLowerCase().includes('error')
  );
  
  if (blockers.length > 0) {
    console.log('Blockers detected:');
    blockers.forEach(blocker => console.log(` - ${blocker}`));
    logEvent('ORCHESTRATOR', 'CURSOR_UPDATE', `Blockers detected: ${blockers.length} issues found`);
  } else {
    console.log('No blockers detected.');
  }
  
  // Check for completion from both agents
  const projectComplete = recentEvents.some(event => 
    event.includes('[PROJECT_UPDATE]') && 
    event.toLowerCase().includes('complete')
  );
  
  const ciComplete = recentEvents.some(event => 
    event.includes('[CI_UPDATE]') && 
    event.toLowerCase().includes('complete')
  );
  
  if (projectComplete && ciComplete) {
    console.log('All tasks reported complete! Running smoke tests...');
    logEvent('ORCHESTRATOR', 'CURSOR_UPDATE', 'All tasks complete, running smoke tests');
    
    try {
      // Run smoke tests
      execSync('npm run smoke', { stdio: 'inherit' });
      logEvent('ORCHESTRATOR', 'CURSOR_UPDATE', 'Smoke tests passed, preparing deployment');
      
      // Deploy
      execSync('npx vercel --prod', { stdio: 'inherit' });
      logEvent('ORCHESTRATOR', 'CURSOR_UPDATE', 'Deployment complete');
    } catch (error) {
      logEvent('ORCHESTRATOR', 'CURSOR_UPDATE', `Blocker: Smoke tests or deployment failed: ${error.message}`);
    }
  }
}

// Initialize
console.log('NeonHub Master Orchestrator initialized');
logEvent('ORCHESTRATOR', 'CURSOR_UPDATE', 'Orchestrator monitoring started');

// Set up polling
setInterval(pollForUpdates, POLL_INTERVAL_MS);

// Initial poll
pollForUpdates();

console.log(`Orchestrator running. Polling every ${POLL_INTERVAL_MS / 60000} minutes.`); 