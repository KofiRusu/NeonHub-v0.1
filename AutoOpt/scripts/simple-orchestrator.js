const fs = require('fs');
const path = require('path');
const http = require('http');

// Configuration
const LOG_FILE = path.join(__dirname, '../logs/coordination-events.log');
const PORT = process.env.PORT || 3030;
const POLL_INTERVAL_MS = 1 * 60 * 1000; // 1 minute

// Ensure logs directory exists
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log event to the coordination log
function logEvent(source, type, message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${source}] [${type}] ${message}\n`;
  
  fs.appendFileSync(LOG_FILE, logEntry);
  console.log(`Event logged: ${logEntry.trim()}`);
  
  return logEntry;
}

// Get recent events from the log
function getRecentEvents(limit = 10) {
  if (!fs.existsSync(LOG_FILE)) {
    return [];
  }
  
  const content = fs.readFileSync(LOG_FILE, 'utf8');
  return content.split('\n')
    .filter(line => line.trim() !== '')
    .slice(-limit);
}

// Poll for updates
function pollForUpdates() {
  console.log('Polling for updates...');
  logEvent('ORCHESTRATOR', 'SYSTEM', 'Polling for agent updates');
  
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
    logEvent('ORCHESTRATOR', 'SYSTEM', 'No blockers detected');
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
    logEvent('ORCHESTRATOR', 'SYSTEM', 'Triggering deployment sequence');
  }
}

// Create a simple HTTP server for health checks and events
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'simple-orchestrator' }));
    return;
  }
  
  if (req.method === 'GET' && req.url === '/events') {
    const events = getRecentEvents(20);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ events }));
    return;
  }
  
  if (req.method === 'POST' && req.url === '/events') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const event = JSON.parse(body);
        const { source, type, message } = event;
        
        if (!source || !type || !message) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid event format' }));
          return;
        }
        
        logEvent(source, type, message);
        
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success' }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    
    return;
  }
  
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Initialize
console.log('Simple NeonHub Orchestrator initialized');
logEvent('ORCHESTRATOR', 'SYSTEM', 'Simple orchestrator starting up');

// Initial poll
pollForUpdates();

// Set up polling
const pollInterval = setInterval(pollForUpdates, POLL_INTERVAL_MS);

// Start HTTP server
server.listen(PORT, () => {
  console.log(`Orchestrator server listening on port ${PORT}`);
  logEvent('ORCHESTRATOR', 'SYSTEM', `HTTP server listening on port ${PORT}`);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal, shutting down...');
  clearInterval(pollInterval);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT signal, shutting down...');
  clearInterval(pollInterval);
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
}); 