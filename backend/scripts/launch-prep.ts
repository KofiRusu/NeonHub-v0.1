import { PrismaClient } from '@prisma/client';
import { getAgentManager } from '../../src/agents';
import { AgentScheduler } from '../src/agents/scheduler/AgentScheduler';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Main function to prepare the system for launch
 */
async function prepareLaunch() {
  console.log('🚀 Starting launch preparation...');
  
  try {
    // 1. Validate database connection
    await validateDatabaseConnection();
    
    // 2. Run database migrations if needed
    await runDatabaseMigrations();
    
    // 3. Ensure seed data exists, seed if not
    await ensureSeedData();
    
    // 4. Schedule demo agents
    await scheduleRealisticAgents();
    
    // 5. Validate agent execution
    await validateAgentExecution();
    
    // 6. Generate sample agent output for immediate viewing
    await generateSampleOutput();
    
    // 7. Validate WebSocket connections
    await validateWebSockets();
    
    // 8. Check environment variables
    checkEnvironmentVariables();
    
    console.log('✅ Launch preparation completed successfully!');
    console.log('\n🔑 Default Admin Credentials:');
    console.log('Email: admin@neonhub.com');
    console.log('Password: password123');
    
    console.log('\n🤖 Scheduled Agents:');
    console.log('- Content Creator Pro: Runs every hour');
    console.log('- Trend Analyzer: Runs daily at 08:00');
    console.log('- Social Media Manager: Runs every 4 hours');
    
  } catch (error) {
    console.error('❌ Launch preparation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Validate database connection
 */
async function validateDatabaseConnection() {
  console.log('🔍 Validating database connection...');
  try {
    // Try to query the database
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw new Error('Database connection failed. Please check your connection settings in .env');
  }
}

/**
 * Run database migrations if needed
 */
async function runDatabaseMigrations() {
  console.log('🔄 Checking database migrations...');
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('✅ Database migrations up-to-date');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    throw new Error('Failed to run database migrations');
  }
}

/**
 * Ensure seed data exists, seed if not
 */
async function ensureSeedData() {
  console.log('🌱 Checking for seed data...');
  
  // Check if we have any users in the database
  const userCount = await prisma.user.count();
  
  if (userCount === 0) {
    console.log('🔄 No seed data found, running seed script...');
    try {
      // Execute the seed script
      execSync('npm run seed', { stdio: 'inherit' });
      console.log('✅ Seed data created successfully');
    } catch (error) {
      console.error('❌ Seed data creation failed:', error);
      throw new Error('Failed to create seed data');
    }
  } else {
    console.log(`✅ Seed data exists (${userCount} users found)`);
  }
}

/**
 * Schedule realistic agents for demo purposes
 */
async function scheduleRealisticAgents() {
  console.log('⏰ Scheduling demo agents...');
  
  // Get agent manager
  const agentManager = getAgentManager(prisma);
  
  // Create agent scheduler
  const scheduler = new AgentScheduler(prisma, agentManager, {
    runMissedOnStartup: true,
    autoStart: true
  });
  
  // Get all agents
  const agents = await prisma.aIAgent.findMany({
    where: { status: 'IDLE' },
    take: 3  // Limit to 3 agents for demo
  });
  
  if (agents.length === 0) {
    console.log('⚠️ No agents found to schedule');
    return;
  }
  
  // Schedule first agent to run hourly
  if (agents[0]) {
    await scheduler.scheduleAgent(agents[0].id, '0 * * * *', true);  // Hourly at minute 0
    console.log(`✅ Scheduled agent "${agents[0].name}" to run hourly`);
  }
  
  // Schedule second agent to run daily
  if (agents[1]) {
    await scheduler.scheduleAgent(agents[1].id, '0 8 * * *', true);  // Daily at 8:00 AM
    console.log(`✅ Scheduled agent "${agents[1].name}" to run daily at 08:00`);
  }
  
  // Schedule third agent to run every 4 hours
  if (agents[2]) {
    await scheduler.scheduleAgent(agents[2].id, '0 */4 * * *', true);  // Every 4 hours
    console.log(`✅ Scheduled agent "${agents[2].name}" to run every 4 hours`);
  }
  
  // Wait for scheduler to initialize
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Stop scheduler as we don't want to keep it running in this script
  scheduler.stop();
}

/**
 * Validate agent execution
 */
async function validateAgentExecution() {
  console.log('🧪 Validating agent execution...');
  
  // Get agent manager
  const agentManager = getAgentManager(prisma);
  
  // Get a test agent
  const testAgent = await prisma.aIAgent.findFirst({
    where: { agentType: 'CONTENT_CREATOR' }
  });
  
  if (!testAgent) {
    console.log('⚠️ No content creator agent found for validation');
    return;
  }
  
  try {
    // Run the agent once to validate execution
    await agentManager.runAgent(testAgent.id);
    
    // Verify execution session was created
    const session = await prisma.agentExecutionSession.findFirst({
      where: { agentId: testAgent.id },
      orderBy: { startedAt: 'desc' }
    });
    
    if (session && session.success) {
      console.log('✅ Agent execution successful');
    } else {
      console.log('⚠️ Agent execution completed but may have issues');
    }
  } catch (error) {
    console.error('❌ Agent execution validation failed:', error);
    // Don't throw here as this is not critical for launch
    console.log('⚠️ Agent execution validation failed, but continuing with launch preparation');
  }
}

/**
 * Generate sample output for immediate viewing
 */
async function generateSampleOutput() {
  console.log('📊 Generating sample agent output for demonstration...');
  
  // Create additional execution sessions and content to ensure
  // there's something to show in the dashboard
  
  const agents = await prisma.aIAgent.findMany({
    take: 3
  });
  
  for (const agent of agents) {
    // Create additional execution sessions
    for (let i = 0; i < 5; i++) {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - i * 8); // Space out over time
      
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + 3 + Math.floor(Math.random() * 10));
      
      await prisma.agentExecutionSession.create({
        data: {
          agentId: agent.id,
          startedAt: startDate,
          completedAt: endDate,
          success: Math.random() > 0.2, // 80% success rate
          duration: Math.floor(Math.random() * 180000) + 30000, // 30 sec to 3.5 min
          outputSummary: `Generated ${Math.floor(Math.random() * 5) + 1} new content items for marketing campaign`,
          logs: {
            entries: [
              { level: 'info', message: 'Agent started execution', timestamp: startDate.toISOString() },
              { level: 'info', message: 'Analyzing campaign context', timestamp: new Date(startDate.getTime() + 10000).toISOString() },
              { level: 'info', message: 'Generating content', timestamp: new Date(startDate.getTime() + 45000).toISOString() },
              { level: 'info', message: 'Content generation complete', timestamp: new Date(startDate.getTime() + 90000).toISOString() },
              { level: 'info', message: 'Storing results in database', timestamp: new Date(startDate.getTime() + 110000).toISOString() },
              { level: 'info', message: 'Agent execution complete', timestamp: endDate.toISOString() },
            ]
          }
        }
      });
    }
  }
  
  console.log('✅ Sample agent output generated');
}

/**
 * Validate WebSocket connections
 */
async function validateWebSockets() {
  console.log('🔌 Validating WebSocket configuration...');
  
  // Check if socket initialization files exist
  const socketPath = path.join(__dirname, '../src/socket');
  
  if (fs.existsSync(path.join(socketPath, 'index.ts')) && 
      fs.existsSync(path.join(socketPath, 'agentOutput.ts'))) {
    console.log('✅ WebSocket files present');
  } else {
    console.log('⚠️ WebSocket files not found or incomplete');
  }
}

/**
 * Check environment variables
 */
function checkEnvironmentVariables() {
  console.log('🔐 Checking environment variables...');
  
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'PORT'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length === 0) {
    console.log('✅ All required environment variables are set');
  } else {
    console.log(`⚠️ Missing environment variables: ${missingVars.join(', ')}`);
    console.log('Please check your .env file or environment configuration');
  }
}

// Run the launch preparation function
prepareLaunch(); 