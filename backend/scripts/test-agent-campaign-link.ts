import { PrismaClient } from '@prisma/client';
import { getAgentManager } from '../src/agents';
import { getCampaignService, getMetricService } from '../services';

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Test script to verify the agent-campaign linking functionality
 */
async function testAgentCampaignLink() {
  try {
    console.log('Testing agent-campaign link functionality...');
    
    // 1. Get the first available agent
    const agent = await prisma.aIAgent.findFirst({
      where: {
        status: 'IDLE',
      },
    });
    
    if (!agent) {
      console.error('No available agent found');
      return;
    }
    
    console.log(`Found agent: ${agent.name} (${agent.id})`);
    
    // 2. Get the agent manager
    const agentManager = getAgentManager(prisma);
    
    // 3. Execute the agent with token tracking
    console.log('Executing agent...');
    const result = await agentManager.startAgent(
      agent.id,
      undefined, // Let it create a new campaign
      {
        trackMetrics: true,
        tokenUsage: {
          input: 250,
          output: 1500,
          total: 1750,
          model: 'gpt-4'
        }
      }
    );
    
    console.log('Agent execution result:', result);
    
    // 4. Get the campaign that was created/linked
    if (result.campaignId) {
      const campaignService = getCampaignService(prisma);
      const campaign = await campaignService.getCampaign(result.campaignId);
      
      console.log('Linked campaign:', campaign);
      
      // 5. Get metrics for the campaign
      const metricService = getMetricService(prisma);
      const metrics = await metricService.getCampaignMetrics(result.campaignId);
      
      console.log(`Campaign metrics (${metrics.length}):`);
      metrics.forEach(metric => {
        console.log(`- ${metric.name}: ${metric.value} ${metric.unit || ''}`);
      });
    } else {
      console.log('No campaign was linked to this execution');
    }
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAgentCampaignLink().catch(console.error); 