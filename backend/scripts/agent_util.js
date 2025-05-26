/**
 * Agent utility script
 *
 * This script provides helper functions for managing agents without relying on CLI tools
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Get all agents of a specific type
 * @param {string} agentType The type of agents to retrieve
 * @returns {Promise<Array>} The list of agents
 */
async function getAgentsByType(agentType) {
  try {
    const agents = await prisma.aIAgent.findMany({
      where: {
        agentType: agentType,
      },
      select: {
        id: true,
        name: true,
        description: true,
        agentType: true,
        status: true,
      },
    });

    return agents;
  } catch (error) {
    console.error('Error retrieving agents:', error);
    throw error;
  }
}

/**
 * Find an agent by name pattern
 * @param {string} namePattern Part of the agent name to search for
 * @param {string} agentType Optional agent type to filter by
 * @returns {Promise<Object|null>} The found agent or null
 */
async function findAgentByName(namePattern, agentType = null) {
  try {
    const whereClause = {
      name: {
        contains: namePattern,
        mode: 'insensitive',
      },
    };

    if (agentType) {
      whereClause.agentType = agentType;
    }

    const agent = await prisma.aIAgent.findFirst({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        agentType: true,
        status: true,
      },
    });

    return agent;
  } catch (error) {
    console.error('Error finding agent:', error);
    throw error;
  }
}

/**
 * Get the latest conversation session for an agent
 * @param {string} agentId The agent ID
 * @returns {Promise<Object|null>} The session data or null
 */
async function getLatestAgentSession(agentId) {
  try {
    const session = await prisma.agentExecutionSession.findFirst({
      where: {
        agentId: agentId,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });

    return session;
  } catch (error) {
    console.error('Error retrieving session:', error);
    throw error;
  }
}

/**
 * Create a new agent execution session with imported conversation
 * @param {string} agentId The agent ID
 * @param {Object} context The context object with conversation data
 * @returns {Promise<Object>} The created session
 */
async function createAgentSession(agentId, context) {
  try {
    const session = await prisma.agentExecutionSession.create({
      data: {
        agentId: agentId,
        context: context,
        success: true,
        outputSummary: 'Imported conversation',
      },
    });

    return session;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

/**
 * Print agent information as JSON
 * @param {Array|Object} data The agent data to print
 */
function printAgentInfo(data) {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Main function to handle command-line usage
 */
async function main() {
  const command = process.argv[2];

  try {
    switch (command) {
      case 'list':
        const agentType = process.argv[3] || 'ENGINEERING_CONVERSATION';
        const agents = await getAgentsByType(agentType);
        printAgentInfo(agents);
        break;

      case 'find':
        const namePattern = process.argv[3];
        if (!namePattern) {
          console.error('Error: Name pattern is required');
          console.error(
            'Usage: node agent_util.js find <name_pattern> [agent_type]',
          );
          process.exit(1);
        }
        const typeFilter = process.argv[4];
        const agent = await findAgentByName(namePattern, typeFilter);
        printAgentInfo(agent);
        break;

      case 'session':
        const agentId = process.argv[3];
        if (!agentId) {
          console.error('Error: Agent ID is required');
          console.error('Usage: node agent_util.js session <agent_id>');
          process.exit(1);
        }
        const session = await getLatestAgentSession(agentId);
        printAgentInfo(session);
        break;

      default:
        console.error('Unknown command:', command);
        console.error('Usage:');
        console.error('  node agent_util.js list [agent_type]');
        console.error('  node agent_util.js find <name_pattern> [agent_type]');
        console.error('  node agent_util.js session <agent_id>');
        process.exit(1);
    }
  } catch (error) {
    console.error('Command failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the main function if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

// Export functions for use in other scripts
module.exports = {
  getAgentsByType,
  findAgentByName,
  getLatestAgentSession,
  createAgentSession,
  printAgentInfo,
};
