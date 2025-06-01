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

// Run project audit
console.log('Running project audit...');
logEvent('PROJECT', 'PROJECT_UPDATE', 'Starting project codebase audit');

try {
  // Check for README and documentation
  const hasReadme = fs.existsSync(path.join(__dirname, '../README.md'));
  logEvent('PROJECT', 'PROJECT_UPDATE', `README.md exists: ${hasReadme}`);
  
  // Check package.json for scripts
  const packageJson = require('../package.json');
  const scripts = Object.keys(packageJson.scripts || {});
  logEvent('PROJECT', 'PROJECT_UPDATE', `Found ${scripts.length} npm scripts: ${scripts.join(', ')}`);
  
  // Check for important files
  const importantFiles = [
    'docker-compose.yml',
    'Dockerfile',
    '.env.example',
    'architecture.md',
    'IMPLEMENTATION_PLAN.md'
  ];
  
  const missingFiles = importantFiles.filter(file => !fs.existsSync(path.join(__dirname, '..', file)));
  
  if (missingFiles.length > 0) {
    logEvent('PROJECT', 'PROJECT_UPDATE', `Missing important files: ${missingFiles.join(', ')}`);
  } else {
    logEvent('PROJECT', 'PROJECT_UPDATE', 'All important files present');
  }
  
  // Count frontend components
  const frontendComponents = countFiles(path.join(__dirname, '../frontend/src/components'));
  logEvent('PROJECT', 'PROJECT_UPDATE', `Frontend has ${frontendComponents} component files`);
  
  // Count backend routes
  const backendRoutes = countFiles(path.join(__dirname, '../backend/src/routes'));
  logEvent('PROJECT', 'PROJECT_UPDATE', `Backend has ${backendRoutes} route files`);
  
  // All checks passed
  logEvent('PROJECT', 'PROJECT_UPDATE', 'Project audit complete');
  console.log('Project audit complete!');
} catch (error) {
  const errorMessage = error.message || 'Unknown error';
  logEvent('PROJECT', 'PROJECT_UPDATE', `Blocker: Project audit failed: ${errorMessage}`);
  console.error('Project audit failed:', errorMessage);
}

// Helper to count files in a directory recursively
function countFiles(dir) {
  if (!fs.existsSync(dir)) {
    return 0;
  }
  
  let count = 0;
  
  function traverseDir(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        traverseDir(fullPath);
      } else if (stats.isFile()) {
        count++;
      }
    }
  }
  
  traverseDir(dir);
  return count;
} 