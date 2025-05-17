#!/usr/bin/env node
import { PrismaClient, AgentType } from '@prisma/client';
import { getAgentManager, initializeAgentManager } from '../agents';
import chalk from 'chalk';

/**
 * Parse command line arguments
 * @returns Object containing parsed arguments
 */
function parseArgs(): {
  agentId?: string;
  type?: string;
  context?: Record<string, any>;
} {
  const args = process.argv.slice(2);
  const result: {
    agentId?: string;
    type?: string;
    context?: Record<string, any>;
  } = {};

  args.forEach(arg => {
    if (arg.startsWith('--agentId=')) {
      result.agentId = arg.substring('--agentId='.length);
    } else if (arg.startsWith('--type=')) {
      result.type = arg.substring('--type='.length);
    } else if (arg.startsWith('--context=')) {
      try {
        result.context = JSON.parse(arg.substring('--context='.length));
      } catch (error) {
        console.error(chalk.red('Error parsing context JSON:'), error);
        process.exit(1);
      }
    }
  });

  return result;
}

/**
 * Validate agent type and convert to AgentType enum
 * @param type The agent type string
 * @returns The corresponding AgentType enum value
 */
function validateAndGetAgentType(type: string): AgentType {
  switch (type.toLowerCase()) {
    case 'content':
      return AgentType.CONTENT_CREATOR;
    case 'outreach':
      return AgentType.OUTREACH_MANAGER;
    case 'adoptimizer':
      return AgentType.PERFORMANCE_OPTIMIZER;
    case 'trendpredictor':
      return AgentType.TREND_ANALYZER;
    default:
      console.error(chalk.red(`Invalid agent type: ${type}`));
      console.error(chalk.yellow('Valid types are: Content, Outreach, AdOptimizer, TrendPredictor'));
      process.exit(1);
  }
}

/**
 * Display help information
 */
function showHelp(): void {
  console.log(`
${chalk.bold('AI Agent Test CLI')}

${chalk.bold('Usage:')}
  npx tsx src/scripts/testAgent.ts [options]

${chalk.bold('Options:')}
  --agentId=<uuid>                Specify the ID of an existing agent
  --type=<agent-type>             Create a temporary agent of this type
  --context=<JSON string>         Context data to pass to the agent

${chalk.bold('Agent Types:')}
  Content                         Generate marketing content
  Outreach                        Create personalized outreach messages
  AdOptimizer                     Optimize ad performance
  TrendPredictor                  Identify market trends

${chalk.bold('Examples:')}
  # Run an existing agent by ID
  npx tsx src/scripts/testAgent.ts --agentId=123e4567-e89b-12d3-a456-426614174000

  # Create and run a temporary Content agent
  npx tsx src/scripts/testAgent.ts --type=Content

  # Run with context data
  npx tsx src/scripts/testAgent.ts --type=Content --context='{"campaignId":"abc123","topics":["AI","Marketing"]}'

  # Run the first available agent if no arguments are provided
  npx tsx src/scripts/testAgent.ts
`);
}

/**
 * Check if arguments include a help flag
 */
function checkForHelp(): boolean {
  const helpFlags = ['-h', '--help', 'help'];
  return process.argv.some(arg => helpFlags.includes(arg));
}

/**
 * Format and display agent execution result
 */
function displayResult(result: any): void {
  if (result.success) {
    console.log(chalk.green.bold('\n✓ Agent executed successfully\n'));
    console.log(chalk.cyan('Execution time:'), chalk.yellow(`${result.metrics?.duration || 0}ms`));
    console.log(chalk.cyan('Timestamp:'), chalk.yellow(result.timestamp));
    
    console.log(chalk.cyan.bold('\nOutput:'));
    console.log(chalk.yellow(JSON.stringify(result.data, null, 2)));
  } else {
    console.error(chalk.red.bold('\n✗ Agent execution failed\n'));
    console.error(chalk.cyan('Error:'), chalk.red(result.error?.message || 'Unknown error'));
    if (result.error?.stack) {
      console.error(chalk.cyan('Stack:'), chalk.gray(result.error.stack));
    }
    console.error(chalk.cyan('Timestamp:'), chalk.yellow(result.timestamp));
  }
}

/**
 * Create a temporary agent for testing
 */
async function createTemporaryAgent(prisma: PrismaClient, type: AgentType): Promise<string> {
  console.log(chalk.yellow(`Creating temporary ${type} agent for testing...`));
  
  // Generate a basic configuration based on agent type
  const config: any = {
    id: `temp-${Date.now()}`,
    maxRetries: 1,
    autoRetry: true
  };
  
  // Add type-specific configurations
  switch (type) {
    case AgentType.CONTENT_CREATOR:
      config.topics = ['marketing', 'artificial intelligence'];
      config.length = { min: 200, max: 500 };
      config.tone = 'professional';
      break;
    case AgentType.OUTREACH_MANAGER:
      config.personalizationLevel = 'high';
      config.templates = {
        email: 'Default email template',
        linkedin: 'Default LinkedIn template'
      };
      break;
    case AgentType.PERFORMANCE_OPTIMIZER:
      config.platforms = ['FACEBOOK', 'GOOGLE'];
      config.targetMetrics = {
        ctr: 0.02,
        cpc: 2.5
      };
      break;
    case AgentType.TREND_ANALYZER:
      config.sources = ['social_media', 'news', 'search_trends'];
      config.industries = ['marketing', 'technology'];
      config.keywords = ['AI', 'automation', 'personalization'];
      break;
  }
  
  // Create the agent in the database
  const agent = await prisma.aIAgent.create({
    data: {
      name: `Temporary ${type} Agent`,
      description: `Created for testing on ${new Date().toISOString()}`,
      agentType: type,
      status: 'IDLE',
      configuration: config,
      projectId: await getDefaultProjectId(prisma),
      managerId: await getDefaultUserId(prisma)
    }
  });
  
  console.log(chalk.green(`Created temporary agent with ID: ${agent.id}`));
  return agent.id;
}

/**
 * Get a default project ID for testing
 */
async function getDefaultProjectId(prisma: PrismaClient): Promise<string> {
  // Try to find an existing project
  const project = await prisma.project.findFirst({
    select: { id: true }
  });
  
  if (project) {
    return project.id;
  }
  
  // If no project exists, create a test project
  console.log(chalk.yellow('No existing projects found. Creating a test project...'));
  const user = await getDefaultUserId(prisma, true);
  
  const newProject = await prisma.project.create({
    data: {
      name: 'Test Project',
      description: 'Created for agent testing',
      ownerId: user
    }
  });
  
  return newProject.id;
}

/**
 * Get a default user ID for testing
 */
async function getDefaultUserId(prisma: PrismaClient, createIfMissing: boolean = true): Promise<string> {
  // Try to find an existing user
  const user = await prisma.user.findFirst({
    select: { id: true }
  });
  
  if (user) {
    return user.id;
  }
  
  if (!createIfMissing) {
    throw new Error('No users found in the database');
  }
  
  // If no user exists, create a test user
  console.log(chalk.yellow('No existing users found. Creating a test user...'));
  
  const newUser = await prisma.user.create({
    data: {
      name: 'Test User',
      email: `test.user.${Date.now()}@example.com`,
      password: 'hashedpassword', // In a real app, this would be properly hashed
    }
  });
  
  return newUser.id;
}

/**
 * Main execution function
 */
async function main(): Promise<void> {
  console.log(chalk.blue.bold('AI Agent Test CLI'));
  
  // Check for help flag
  if (checkForHelp()) {
    showHelp();
    return;
  }
  
  // Parse arguments
  const args = parseArgs();
  
  // Initialize Prisma client
  const prisma = new PrismaClient();
  
  try {
    // Initialize agent manager
    console.log(chalk.yellow('Initializing Agent Manager...'));
    const manager = await initializeAgentManager(prisma);
    
    let agentId = args.agentId;
    
    // If agent type is specified, create a temporary agent
    if (!agentId && args.type) {
      const agentType = validateAndGetAgentType(args.type);
      agentId = await createTemporaryAgent(prisma, agentType);
    }
    
    // If neither agent ID nor type is specified, try to use the first available agent
    if (!agentId) {
      console.log(chalk.yellow('No agent ID or type specified. Looking for available agents...'));
      
      const agents = await prisma.aIAgent.findMany({
        take: 1,
        orderBy: { createdAt: 'desc' }
      });
      
      if (agents.length === 0) {
        console.error(chalk.red('No agents found in the database.'));
        console.log(chalk.yellow('Please create an agent first or specify a type using --type=<agent-type>'));
        return;
      }
      
      agentId = agents[0].id;
      console.log(chalk.green(`Found agent: ${agents[0].name} (${agents[0].agentType}) with ID: ${agentId}`));
    }
    
    // Run the agent
    console.log(chalk.yellow(`Running agent with ID: ${agentId}`));
    if (args.context) {
      console.log(chalk.yellow('Context:'), args.context);
    }
    
    console.log(chalk.blue('\nExecuting agent...'));
    
    const result = await manager.runAgent(agentId, args.context);
    
    // Display the result
    displayResult(result);
    
  } catch (error) {
    console.error(chalk.red.bold('\n✗ Execution error:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    if (error instanceof Error && error.stack) {
      console.error(chalk.gray(error.stack));
    }
  } finally {
    // Disconnect from database
    await prisma.$disconnect();
  }
}

// Run the main function
main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
}); 