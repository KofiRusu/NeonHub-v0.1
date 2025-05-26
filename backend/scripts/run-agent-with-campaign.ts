import { PrismaClient, AgentType } from '@prisma/client';
import { getAgentManager } from '../src/agents';
import { getCampaignService, getMetricService } from '../services';

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Script to run an agent with campaign tracking.
 * This demonstrates how to use the new campaign/metrics functionality.
 */
async function runAgentWithCampaign() {
  try {
    console.log('Running agent with campaign tracking...');

    // Step 1: Check for an existing campaign
    const campaign = await prisma.campaign.findFirst({
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(
      campaign
        ? `Found existing campaign: ${campaign.name}`
        : 'No existing campaign found',
    );

    // Step 2: Find or create an agent
    let agent = await prisma.aIAgent.findFirst({
      where: {
        agentType: 'CONTENT_CREATOR', // Use a content creator agent
        status: 'IDLE',
      },
    });

    if (!agent) {
      console.log('No idle content creator agent found, creating one...');

      // Get a project and user ID for the agent
      const project = await prisma.project.findFirst();
      const user = await prisma.user.findFirst();

      if (!project || !user) {
        throw new Error('No project or user found to create agent');
      }

      // Create a content creator agent
      agent = await prisma.aIAgent.create({
        data: {
          name: 'Campaign Content Creator',
          description: 'Agent for creating campaign content',
          agentType: 'CONTENT_CREATOR',
          status: 'IDLE',
          scheduleEnabled: false,
          projectId: project.id,
          managerId: user.id,
          configuration: {
            topics: ['marketing', 'automation', 'AI'],
            tone: 'professional',
            contentType: 'BLOG_POST',
          },
        },
      });

      console.log(`Created a new agent: ${agent.name} (${agent.id})`);
    } else {
      console.log(`Found existing agent: ${agent.name} (${agent.id})`);
    }

    // Step 3: Set up execution parameters
    const campaignId = campaign?.id; // Use existing campaign or let the system create one
    const tokenUsage = {
      input: 350,
      output: 2200,
      total: 2550,
      model: 'claude-3-opus-20240229',
    };

    const config = {
      topic: 'How AI is transforming digital marketing',
      contentType: 'BLOG_POST',
      tone: 'professional',
      keywords: ['AI', 'marketing', 'automation', 'personalization'],
      length: 'MEDIUM',
    };

    // Step 4: Run the agent
    console.log('Starting agent execution...');
    const agentManager = getAgentManager(prisma);

    const result = await agentManager.startAgent(agent.id, campaignId, {
      config,
      trackMetrics: true,
      tokenUsage,
    });

    console.log('Agent execution completed!');
    console.log('Result:', JSON.stringify(result, null, 2));

    // Step 5: Get the campaign and metrics
    if (result.campaignId) {
      const campaignService = getCampaignService(prisma);
      const resultCampaign = await campaignService.getCampaign(
        result.campaignId,
      );

      console.log('\nCampaign details:');
      console.log(`- ID: ${resultCampaign?.id}`);
      console.log(`- Name: ${resultCampaign?.name}`);
      console.log(`- Status: ${resultCampaign?.status}`);
      console.log(`- Type: ${resultCampaign?.campaignType}`);

      // Get metrics for the campaign
      const metricService = getMetricService(prisma);
      const metrics = await metricService.getCampaignMetrics(result.campaignId);

      console.log(`\nCampaign metrics (${metrics.length}):`);
      metrics.forEach((metric) => {
        console.log(`- ${metric.name}: ${metric.value} ${metric.unit || ''}`);
      });
    }

    console.log('\nScript completed successfully');
  } catch (error) {
    console.error('Script failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
runAgentWithCampaign().catch(console.error);
