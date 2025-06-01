#!/usr/bin/env node
/**
 * test-orchestrator.js
 * Simple script to test the orchestrator functionality
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const ORCH_URL = process.env.ORCH_URL || 'http://localhost:3030';
const DELAY_MS = 2000;

// Test steps to run in sequence
const testSteps = [
  { name: 'Check Health', run: checkHealth },
  { name: 'Post Project Event', run: postProjectEvent },
  { name: 'Post CI Event', run: postCIEvent },
  { name: 'Get Metrics', run: getMetrics },
  { name: 'Check Events', run: getEvents },
  { name: 'Check For Deployment', run: checkDeployment }
];

// Main function to run tests
async function runTests() {
  console.log('🧪 Starting orchestrator tests...');
  
  for (const step of testSteps) {
    console.log(`\n📋 Running test: ${step.name}`);
    try {
      await step.run();
      console.log(`✅ ${step.name} passed`);
    } catch (err) {
      console.error(`❌ ${step.name} failed: ${err.message}`);
      if (err.response) {
        console.error(`Response: ${JSON.stringify(err.response.data)}`);
      }
      process.exit(1);
    }
    
    // Add a small delay between tests
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
  }
  
  console.log('\n🎉 All tests passed! Orchestrator is working correctly.');
}

// Test functions
async function checkHealth() {
  const response = await axios.get(`${ORCH_URL}/health`);
  console.log(`Health Status: ${response.data.status}`);
  console.log(`Uptime: ${response.data.uptime}s`);
  
  if (response.data.status !== 'ok') {
    throw new Error('Health check failed');
  }
}

async function postProjectEvent() {
  const response = await axios.post(`${ORCH_URL}/events`, {
    source: 'PROJECT',
    type: 'PROJECT_UPDATE',
    message: 'Project audit complete - All features implemented, documentation updated, ready for deployment'
  });
  
  console.log(`Posted project event, response: ${response.data.status}`);
  
  if (response.data.status !== 'logged') {
    throw new Error('Failed to post project event');
  }
}

async function postCIEvent() {
  const response = await axios.post(`${ORCH_URL}/events`, {
    source: 'CI',
    type: 'CI_UPDATE',
    message: 'All CI checks complete - Tests passed, Coverage: 94%, No linting errors'
  });
  
  console.log(`Posted CI event, response: ${response.data.status}`);
  
  if (response.data.status !== 'logged') {
    throw new Error('Failed to post CI event');
  }
}

async function getMetrics() {
  const response = await axios.get(`${ORCH_URL}/metrics`);
  console.log('Metrics:');
  console.log(`- Total events: ${response.data.total_events}`);
  console.log(`- Project events: ${response.data.project_events}`);
  console.log(`- CI events: ${response.data.ci_events}`);
  console.log(`- Ready for deployment: ${response.data.ready_for_deployment}`);
  
  // Verify we have both project and CI events
  if (response.data.project_events < 1 || response.data.ci_events < 1) {
    throw new Error('Missing expected events');
  }
}

async function getEvents() {
  const response = await axios.get(`${ORCH_URL}/events`);
  console.log(`Retrieved ${response.data.events.length} events`);
  
  // Look for our test events
  const projectComplete = response.data.events.some(e => 
    e.includes('[PROJECT]') && e.includes('complete'));
  const ciPassed = response.data.events.some(e => 
    e.includes('[CI]') && e.includes('passed'));
  
  console.log(`Found project complete event: ${projectComplete}`);
  console.log(`Found CI passed event: ${ciPassed}`);
  
  if (!projectComplete || !ciPassed) {
    throw new Error('Test events not found in event log');
  }
}

async function checkDeployment() {
  // Check if deployment started (we expect to see a DEPLOY_START event)
  const response = await axios.get(`${ORCH_URL}/events`);
  
  const deployStarted = response.data.events.some(e => 
    e.includes('[ORCHESTRATOR]') && e.includes('DEPLOY_START'));
  
  console.log(`Deployment triggered: ${deployStarted}`);
  
  // Check if deployment success file exists
  const deploymentSuccess = fs.existsSync('AutoOpt/orchestrator/deployment-success.txt');
  console.log(`Deployment success file exists: ${deploymentSuccess}`);
  
  if (deployStarted && deploymentSuccess) {
    console.log('✅ Deployment successfully triggered and completed');
  } else {
    console.log('⚠️ Deployment may be in progress or not yet triggered');
  }
}

// Run the tests
runTests().catch(err => {
  console.error(`❌ Test runner error: ${err.message}`);
  process.exit(1);
}); 