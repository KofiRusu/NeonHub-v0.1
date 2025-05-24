#!/bin/bash

# Setup script for configuring agent environment

echo "Setting up environment for NeonHub background agents..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOL
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=neonhub
POSTGRES_PORT=5434
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/neonhub?schema=public

# Node Environment
NODE_ENV=development
PORT=5000
BACKEND_PORT=5001

# JWT Configuration
JWT_SECRET=developmentsecretkey

# Frontend URLs
CLIENT_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# OpenAI API Key (Required for AI agents)
OPENAI_API_KEY=your_openai_api_key_here

# Agent Configuration
AGENT_SCHEDULER_ENABLED=true
AGENT_SCHEDULER_INTERVAL=30000
AGENT_RUN_MISSED_ON_STARTUP=true
EOL
    echo ".env file created successfully."
    echo ""
    echo "⚠️  IMPORTANT: You must edit the .env file and add your OpenAI API key."
    echo "   Without this key, the AI agents will not function."
    echo "   Edit the file now? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        ${EDITOR:-vi} .env
    fi
else
    echo ".env file already exists."
    # Check if OPENAI_API_KEY is set to the default value
    if grep -q "OPENAI_API_KEY=your_openai_api_key_here" .env; then
        echo "⚠️  Warning: OPENAI_API_KEY is set to the default value."
        echo "   You must update the .env file with your actual OpenAI API key."
        echo "   Edit the file now? (y/n)"
        read -r response
        if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
            ${EDITOR:-vi} .env
        fi
    fi
fi

# Create a .env file in the backend directory for direct Node.js execution
echo "Creating backend/.env symlink..."
if [ ! -L backend/.env ] && [ ! -f backend/.env ]; then
    ln -s ../.env backend/.env
    echo "Created symlink to .env in backend directory."
elif [ -f backend/.env ] && [ ! -L backend/.env ]; then
    echo "A regular .env file exists in backend directory. Replacing with symlink..."
    rm backend/.env
    ln -s ../.env backend/.env
    echo "Created symlink to .env in backend directory."
else
    echo "Symlink already exists in backend directory."
fi

# Create an agent scheduler configuration file
echo "Creating agent scheduler configuration..."
mkdir -p backend/config
cat > backend/config/agent.config.js << EOL
/**
 * Configuration for background agents
 */
module.exports = {
  scheduler: {
    // Whether to enable the agent scheduler on startup
    enabled: process.env.AGENT_SCHEDULER_ENABLED === 'true',
    
    // Interval in milliseconds to check for scheduled agents
    checkInterval: parseInt(process.env.AGENT_SCHEDULER_INTERVAL || '30000'),
    
    // Whether to run missed jobs on startup
    runMissedOnStartup: process.env.AGENT_RUN_MISSED_ON_STARTUP === 'true',
    
    // Maximum number of concurrent agents
    maxConcurrentAgents: parseInt(process.env.MAX_CONCURRENT_AGENTS || '5'),
  },
  
  // Default configuration for different agent types
  defaults: {
    CONTENT_CREATOR: {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2048,
    },
    TREND_ANALYZER: {
      model: 'gpt-4',
      temperature: 0.3,
      maxTokens: 1024,
    },
    OUTREACH_MANAGER: {
      model: 'gpt-4',
      temperature: 0.5,
      maxTokens: 1536,
    },
    PERFORMANCE_OPTIMIZER: {
      model: 'gpt-4',
      temperature: 0.2,
      maxTokens: 1024,
    },
    ENGINEERING_CONVERSATION: {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2048,
    }
  }
};
EOL
echo "Agent configuration created successfully."

# Create a test agent script
echo "Creating test agent script..."
mkdir -p backend/scripts
cat > backend/scripts/test_agent.js << EOL
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
  
  console.log(\`Testing agent with ID: \${agentId}\`);
  
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
    await prisma.$disconnect();
  }
}

testAgent().catch(console.error);
EOL
echo "Test agent script created successfully."

# Create a script to run the scheduler standalone
echo "Creating standalone scheduler script..."
cat > backend/scripts/run_scheduler.js << EOL
/**
 * Script to run the agent scheduler standalone
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { AgentScheduler } = require('../src/agents/scheduler/AgentScheduler');
const { getAgentManager } = require('../src/agents');
const agentConfig = require('../config/agent.config');

async function runScheduler() {
  // Verify OpenAI API key is set
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.error('Error: OpenAI API key is not properly configured');
    console.error('Please update your .env file with a valid API key');
    process.exit(1);
  }

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
    
    console.log(\`Scheduler running, checking every \${agentConfig.scheduler.checkInterval / 1000} seconds\`);
    console.log('Press Ctrl+C to stop');
    
    // Keep script running
    process.stdin.resume();
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Stopping scheduler...');
      scheduler.stop();
      await prisma.$disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error starting scheduler:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

runScheduler().catch(console.error);
EOL
echo "Standalone scheduler script created successfully."

# Make scripts executable
chmod +x backend/scripts/test_agent.js
chmod +x backend/scripts/run_scheduler.js
chmod +x setup_agents_env.sh

# Check database migration
if [[ -f backend/prisma/migrations/add_engineering_conversation_agent.sql ]]; then
    echo "Engineering conversation agent migration exists."
else
    echo "Creating engineering conversation agent migration..."
    mkdir -p backend/prisma/migrations/manual
    cat > backend/prisma/migrations/manual/add_engineering_conversation_agent.sql << EOL
-- AlterEnum
ALTER TYPE "AgentType" ADD VALUE 'ENGINEERING_CONVERSATION';

-- Create Conversations table for engineering conversations
CREATE TABLE "EngineeringConversation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngineeringConversation_pkey" PRIMARY KEY ("id")
);

-- Add indices
CREATE INDEX "EngineeringConversation_agentId_idx" ON "EngineeringConversation"("agentId");
CREATE INDEX "EngineeringConversation_domain_idx" ON "EngineeringConversation"("domain");
CREATE INDEX "EngineeringConversation_status_idx" ON "EngineeringConversation"("status");

-- Add foreign key constraint
ALTER TABLE "EngineeringConversation" ADD CONSTRAINT "EngineeringConversation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EOL
    echo "Engineering conversation agent migration created."
fi

echo "Environment setup complete!"
echo ""
echo "To test an agent: ./start_agents.sh run-agent <agent_id>"
echo "To run the scheduler standalone: ./start_agents.sh start"
echo "To set up domain-specific agents: ./manage_domain_chats.sh setup"
echo ""
echo "⚠️  REMINDER: Make sure you've set up your OPENAI_API_KEY in the .env file." 