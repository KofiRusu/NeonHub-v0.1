/**
 * Script to run the agent scheduler standalone
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { AgentScheduler } = require('../src/agents/scheduler/AgentScheduler');
const { getAgentManager } = require('../src/agents');
const agentConfig = require('../config/agent.config');

async function runScheduler() {
  console.log('Starting standalone agent scheduler...');
  
  // Initialize Prisma client
  const prisma = new PrismaClient();
  
  try {
    // Get agent manager
    const agentManager = getAgentManager(prisma);
    
    // Create and start scheduler
    const scheduler = new AgentScheduler(
      prisma,
      agentManager,
      {
        runMissedOnStartup: agentConfig.scheduler.runMissedOnStartup,
        autoStart: true,
        checkInterval: agentConfig.scheduler.checkInterval
      }
    );
    
    console.log(`Scheduler running, checking every ${agentConfig.scheduler.checkInterval / 1000} seconds`);
    console.log('Press Ctrl+C to stop');
    
    // Keep script running
    process.stdin.resume();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Stopping scheduler...');
      scheduler.stop();
      await prisma.();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error starting scheduler:', error);
    await prisma.();
    process.exit(1);
  }
}

runScheduler().catch(console.error);
