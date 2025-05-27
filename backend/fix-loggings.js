#!/usr/bin/env node

/**
 * Script to find and fix all instances of logMessage with incorrect parameter order.
 * This script is intended to be run once to fix the TypeScript errors in the codebase.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Base directory containing the agent implementations
const baseDir = path.join(__dirname, 'src', 'agents', 'implementations');

// Find all TypeScript files in the implementations directory
const files = fs.readdirSync(baseDir)
  .filter(file => file.endsWith('.ts'))
  .map(file => path.join(baseDir, file));

console.log(`Found ${files.length} TypeScript files to check.`);

// Pattern to match logMessage calls
const logMessagePattern = /this\.logMessage\(\s*['"](\w+)['"]\s*,\s*(?:`|['"])([^`'"]+)(?:`|['"])\s*\)/g;

// Process each file
files.forEach(filePath => {
  const relativePath = path.relative(__dirname, filePath);
  console.log(`Processing ${relativePath}...`);
  
  // Read the file content
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the file contains logMessage calls
  if (content.includes('logMessage')) {
    // Replace the pattern
    content = content.replace(logMessagePattern, 'this.logMessage($1, $2)');
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`- Fixed logMessage calls in ${relativePath}`);
  }
});

console.log('\nFixing calls in specific files with complex formatting...');
// Fix the SEOAgent.ts file specifically, as it has more complex logMessage calls
const seoAgentFile = path.join(baseDir, 'SEOAgent.ts');
if (fs.existsSync(seoAgentFile)) {
  let content = fs.readFileSync(seoAgentFile, 'utf8');
  
  // Special patterns for the SEOAgent
  const patterns = [
    // Fix: this.logMessage('info', `Analyzing ${config.targetKeywords.length} target keywords`,);
    {
      pattern: /this\.logMessage\(\s*['"](\w+)['"]\s*,\s*`([^`]+)`\s*,\s*\)/g,
      replacement: 'this.logMessage($1, `$2`)'
    },
    // Fix: this.logMessage('info', `Analyzing ${config.pagesToOptimize.length} pages`,);
    {
      pattern: /this\.logMessage\(\s*['"](\w+)['"]\s*,\s*`([^`]+)`\s*,\s*\)/g,
      replacement: 'this.logMessage($1, `$2`)'
    },
    // Fix: this.logMessage('info', `Analyzing ${config.competitorUrls.length} competitor websites`,);
    {
      pattern: /this\.logMessage\(\s*['"](\w+)['"]\s*,\s*`([^`]+)`\s*,\s*\)/g,
      replacement: 'this.logMessage($1, `$2`)'
    }
  ];
  
  // Apply each pattern
  patterns.forEach(({pattern, replacement}) => {
    content = content.replace(pattern, replacement);
  });
  
  // Write the updated content back to the file
  fs.writeFileSync(seoAgentFile, content, 'utf8');
  console.log(`- Fixed complex logMessage calls in ${path.relative(__dirname, seoAgentFile)}`);
}

// Fix CustomerSupportAgent.ts file
const customerSupportAgentFile = path.join(baseDir, 'CustomerSupportAgent.ts');
if (fs.existsSync(customerSupportAgentFile)) {
  let content = fs.readFileSync(customerSupportAgentFile, 'utf8');
  
  // Fix the specific patterns in CustomerSupportAgent
  content = content.replace(
    /this\.logMessage\(\s*['"]info['"]\s*,\s*`Interaction logged for customer \${customerId}`\s*\)/g,
    'this.logMessage(\'info\', `Interaction logged for customer ${customerId}`)'
  );
  
  content = content.replace(
    /this\.logMessage\(\s*['"]info['"]\s*,\s*['"]Stopping customer support agent execution['"]\s*\)/g,
    'this.logMessage(\'info\', \'Stopping customer support agent execution\')'
  );
  
  // Write the updated content back to the file
  fs.writeFileSync(customerSupportAgentFile, content, 'utf8');
  console.log(`- Fixed logMessage calls in ${path.relative(__dirname, customerSupportAgentFile)}`);
}

console.log('\nFinished fixing logMessage calls.');
console.log('Please run TypeScript compile again to verify fixes.'); 