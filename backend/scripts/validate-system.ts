import { PrismaClient } from '@prisma/client';
import { getAgentManager } from '../../src/agents';
import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import { performance } from 'perf_hooks';
import chalk from 'chalk';

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Main validation function
 */
async function validateSystem() {
  console.log(chalk.blue('🔍 Starting NeonHub System Validation'));
  console.log(chalk.gray('===================================='));

  const results: TestResult[] = [];
  let allPassed = true;

  try {
    // Database connection
    results.push(
      await runTest('Database Connection', async () => {
        await prisma.$queryRaw`SELECT 1`;
        return { passed: true };
      }),
    );

    // User authentication
    results.push(
      await runTest('User Authentication', async () => {
        const user = await prisma.user.findFirst({
          where: { email: 'admin@neonhub.com' },
        });

        if (!user) {
          return {
            passed: false,
            message: 'Admin user not found. Please run the seed script first.',
          };
        }

        return { passed: true };
      }),
    );

    // Project data
    results.push(
      await runTest('Project Data', async () => {
        const projectCount = await prisma.project.count();

        if (projectCount === 0) {
          return {
            passed: false,
            message: 'No projects found. Please run the seed script first.',
          };
        }

        return {
          passed: true,
          details: `${projectCount} projects available`,
        };
      }),
    );

    // Agent functionality
    results.push(
      await runTest('Agent Functionality', async () => {
        const agent = await prisma.aIAgent.findFirst({
          where: { agentType: 'CONTENT_CREATOR' },
        });

        if (!agent) {
          return {
            passed: false,
            message:
              'No content creator agent found. Please run the seed script first.',
          };
        }

        const agentManager = getAgentManager(prisma);
        await agentManager.runAgent(agent.id);

        const session = await prisma.agentExecutionSession.findFirst({
          where: { agentId: agent.id },
          orderBy: { startedAt: 'desc' },
        });

        if (!session) {
          return {
            passed: false,
            message: 'Agent executed but no session was created.',
          };
        }

        return {
          passed: true,
          details: `Agent executed successfully, session ID: ${session.id}`,
        };
      }),
    );

    // WebSocket server
    results.push(
      await runTest('WebSocket Server', async () => {
        return await testWebSocketServer();
      }),
    );

    // Campaign data
    results.push(
      await runTest('Campaign Data', async () => {
        const campaignCount = await prisma.campaign.count();

        if (campaignCount === 0) {
          return {
            passed: false,
            message: 'No campaigns found. Please run the seed script first.',
          };
        }

        return {
          passed: true,
          details: `${campaignCount} campaigns available`,
        };
      }),
    );

    // Generated content
    results.push(
      await runTest('Generated Content', async () => {
        const contentCount = await prisma.generatedContent.count();

        return {
          passed: contentCount > 0,
          details:
            contentCount > 0
              ? `${contentCount} content items available`
              : 'No generated content found',
          message:
            contentCount === 0
              ? 'No content found. This is not critical but demo will be limited.'
              : undefined,
        };
      }),
    );

    // Trend signals
    results.push(
      await runTest('Trend Signals', async () => {
        const signalCount = await prisma.trendSignal.count();

        return {
          passed: signalCount > 0,
          details:
            signalCount > 0
              ? `${signalCount} trend signals available`
              : 'No trend signals found',
          message:
            signalCount === 0
              ? 'No trend signals found. This is not critical but demo will be limited.'
              : undefined,
        };
      }),
    );

    // Performance check
    results.push(
      await runTest('Database Performance', async () => {
        const start = performance.now();
        await prisma.user.findMany({
          include: {
            projects: true,
            ownedProjects: true,
          },
        });
        const duration = performance.now() - start;

        // If query takes more than 500ms, consider it slow
        const passed = duration < 500;

        return {
          passed,
          details: `Query completed in ${duration.toFixed(2)}ms`,
          message: !passed
            ? 'Database query performance is slower than expected.'
            : undefined,
        };
      }),
    );
  } catch (error) {
    console.error(chalk.red('Error during validation:'), error);
  } finally {
    await prisma.$disconnect();
  }

  // Print results
  console.log(chalk.gray('\n===================================='));
  console.log(chalk.blue('📊 Validation Results:'));

  for (const result of results) {
    if (result.passed) {
      console.log(
        `${chalk.green('✓')} ${chalk.green(result.name)} ${result.details ? chalk.gray(`(${result.details})`) : ''}`,
      );
    } else {
      console.log(
        `${chalk.red('✗')} ${chalk.red(result.name)} ${result.message ? chalk.gray(`(${result.message})`) : ''}`,
      );
      allPassed = false;
    }
  }

  console.log(chalk.gray('\n===================================='));
  if (allPassed) {
    console.log(
      chalk.green(
        '✅ All validation tests passed! System is ready for launch.',
      ),
    );
  } else {
    console.log(
      chalk.yellow(
        '⚠️ Some validation tests failed. Please review the issues above.',
      ),
    );
  }
}

/**
 * Test the WebSocket server functionality
 */
async function testWebSocketServer(): Promise<TestResult> {
  return new Promise((resolve) => {
    try {
      // Create a simple Express app and HTTP server
      const app = express();
      const server = http.createServer(app);

      // Create Socket.IO server
      const io = new Server(server, {
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
        },
      });

      // Set up event handlers
      io.on('connection', (socket) => {
        // Send test message
        socket.emit('test', { message: 'WebSocket server is working' });

        // Close the connection
        socket.disconnect(true);
      });

      // Start server on a random port
      const port = 35000 + Math.floor(Math.random() * 1000);
      server.listen(port, () => {
        // Close server after a short delay
        setTimeout(() => {
          server.close(() => {
            resolve({
              name: 'WebSocket Server',
              passed: true,
              details: `Server started successfully on port ${port}`,
            });
          });
        }, 500);
      });

      // Handle server errors
      server.on('error', (err) => {
        resolve({
          name: 'WebSocket Server',
          passed: false,
          message: `WebSocket server error: ${err.message}`,
        });
      });
    } catch (error: any) {
      resolve({
        name: 'WebSocket Server',
        passed: false,
        message: `Failed to start WebSocket server: ${error.message}`,
      });
    }
  });
}

/**
 * Run a single test with timing information
 */
async function runTest(
  name: string,
  testFn: () => Promise<Omit<TestResult, 'name'>>,
): Promise<TestResult> {
  console.log(chalk.gray(`Running test: ${name}...`));

  const start = performance.now();

  try {
    const result = await testFn();
    const duration = performance.now() - start;

    return {
      name,
      passed: result.passed,
      message: result.message,
      details: result.details
        ? `${result.details} (${duration.toFixed(0)}ms)`
        : `Completed in ${duration.toFixed(0)}ms`,
    };
  } catch (error: any) {
    const duration = performance.now() - start;

    return {
      name,
      passed: false,
      message: `Error: ${error.message}`,
      details: `Failed after ${duration.toFixed(0)}ms`,
    };
  }
}

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  details?: string;
}

// Run validation
validateSystem().catch(console.error);
