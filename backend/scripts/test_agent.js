/**
 * Script to test an agent setup
 * 
 * Usage: node backend/scripts/test_agent.js <agent_id>
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { getAgentManager } = require('../src/agents');

async function testAgent() {
  // Get agent ID from command line args
  const agentId = process.argv[2];
  
  if (!agentId) {
    console.error('Please provide an agent ID as a command line argument');
    process.exit(1);
  }
  
  // Verify OpenAI API key is set
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.error('Error: OpenAI API key is not properly configured');
    console.error('Please update your .env file with a valid API key');
    process.exit(1);
  }
  
  console.log(`Testing agent with ID: ${agentId}`);
  
  // Initialize Prisma client
  const prisma = new PrismaClient();
  
  try {
    // Get agent manager
    const agentManager = getAgentManager(prisma);
    
    // Start the agent
    console.log('Starting agent...');
    const result = await agentManager.startAgent(agentId);
    
    console.log('Agent execution result:', result);
  } catch (error) {
    console.error('Error executing agent:', error);
  } finally {
    // Disconnect prisma
    await prisma.();
  }
}

testAgent().catch(console.error);
