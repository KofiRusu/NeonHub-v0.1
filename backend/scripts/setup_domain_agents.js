/**
 * Script to set up domain-specific engineering conversation agents
 *
 * This script creates multiple agents, each specializing in a different
 * software engineering domain.
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client
const prisma = new PrismaClient();

// Define engineering domains
const engineeringDomains = [
  {
    name: 'Frontend Development',
    description:
      'Specializes in frontend technologies, frameworks, UI/UX implementation, and responsive design.',
    domainContext: 'frontend development',
    initialPrompt:
      'What are the current best practices for building performant and accessible frontend applications?',
  },
  {
    name: 'Backend Development',
    description:
      'Focused on server-side architecture, API design, database management, and scalability.',
    domainContext: 'backend development',
    initialPrompt:
      'What are the most effective patterns for designing scalable and maintainable APIs?',
  },
  {
    name: 'DevOps Engineering',
    description:
      'Expertise in CI/CD pipelines, infrastructure as code, containerization, and cloud services.',
    domainContext: 'DevOps engineering',
    initialPrompt:
      'What are the key considerations for setting up a modern CI/CD pipeline with infrastructure as code?',
  },
  {
    name: 'Database Architecture',
    description:
      'Focused on database design, optimization, migration strategies, and data modeling.',
    domainContext: 'database architecture and management',
    initialPrompt:
      'What are the tradeoffs between different database types and when should each be used?',
  },
  {
    name: 'Mobile Development',
    description:
      'Specializes in native and cross-platform mobile app development strategies and patterns.',
    domainContext: 'mobile app development',
    initialPrompt:
      'What are the current best approaches for developing cross-platform mobile applications?',
  },
  {
    name: 'Security Engineering',
    description:
      'Focused on application security, secure coding practices, pen testing, and threat modeling.',
    domainContext: 'application security and secure coding',
    initialPrompt:
      'What are the OWASP top 10 vulnerabilities and how can developers mitigate them?',
  },
  {
    name: 'Machine Learning Engineering',
    description:
      'Specializes in ML model development, deployment, monitoring, and MLOps.',
    domainContext: 'machine learning engineering and MLOps',
    initialPrompt:
      'What are the best practices for deploying and monitoring machine learning models in production?',
  },
];

/**
 * Create an agent for a specific engineering domain
 */
async function createDomainAgent(domain, projectId, userId) {
  console.log(`Creating agent for ${domain.name}...`);

  try {
    // Create the agent
    const agent = await prisma.aIAgent.create({
      data: {
        name: `${domain.name} Specialist`,
        description: domain.description,
        agentType: 'ENGINEERING_CONVERSATION',
        status: 'IDLE',
        scheduleEnabled: false,
        configuration: {
          domainContext: domain.domainContext,
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 2048,
          initialPrompt: domain.initialPrompt,
        },
        project: {
          connect: { id: projectId },
        },
        manager: {
          connect: { id: userId },
        },
      },
    });

    console.log(`Created agent: ${agent.name} (${agent.id})`);
    return agent;
  } catch (error) {
    console.error(`Error creating agent for ${domain.name}:`, error);
    throw error;
  }
}

/**
 * Main function to set up all domain agents
 */
async function setupDomainAgents() {
  try {
    // Check if we need to create a project for these agents
    console.log('Checking for an Engineering project...');

    let project = await prisma.project.findFirst({
      where: {
        name: 'Engineering Domains',
      },
    });

    // If no project exists, get the first admin user
    if (!project) {
      console.log('No Engineering project found. Creating one...');

      // Find an admin user
      const adminUser = await prisma.user.findFirst({
        where: {
          role: 'ADMIN',
        },
      });

      // If no admin, find any user
      const anyUser = !adminUser ? await prisma.user.findFirst() : adminUser;

      if (!anyUser) {
        throw new Error(
          'No users found in the database. Please create a user first.',
        );
      }

      // Create the project
      project = await prisma.project.create({
        data: {
          name: 'Engineering Domains',
          description:
            'Specialized engineering domain conversations for different software sectors',
          owner: {
            connect: { id: anyUser.id },
          },
          members: {
            connect: [{ id: anyUser.id }],
          },
        },
      });

      console.log(`Created Engineering Domains project with ID: ${project.id}`);
    }

    // Create agents for each domain
    for (const domain of engineeringDomains) {
      await createDomainAgent(domain, project.id, project.ownerId);
    }

    console.log('\nAll domain agents created successfully!');
    console.log('\nTo start a conversation with an agent, use:');
    console.log('./start_agents.sh run-agent <agent_id>');
  } catch (error) {
    console.error('Error setting up domain agents:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup
setupDomainAgents().catch(console.error);
