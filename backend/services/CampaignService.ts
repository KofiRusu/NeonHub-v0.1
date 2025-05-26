import {
  PrismaClient,
  Campaign,
  AIAgent,
  CampaignStatus,
  CampaignType,
} from '@prisma/client';

/**
 * Service for managing marketing campaigns
 */
export class CampaignService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get a campaign by ID
   * @param campaignId The ID of the campaign to get
   * @returns The campaign data
   */
  async getCampaign(campaignId: string): Promise<Campaign | null> {
    return this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });
  }

  /**
   * Create a new campaign or get an existing one for the agent
   * @param agentData The agent data
   * @param campaignId Optional campaign ID to update instead of creating new
   * @returns The campaign data
   */
  async getOrCreateCampaignForAgent(
    agentData: AIAgent,
    campaignId?: string,
  ): Promise<Campaign> {
    // If campaign ID is provided, connect to that campaign
    if (campaignId) {
      const campaign = await this.getCampaign(campaignId);
      if (!campaign) {
        throw new Error(`Campaign with ID ${campaignId} not found`);
      }

      // Connect agent to campaign if not already connected
      await this.connectAgentToCampaign(agentData.id, campaignId);

      return campaign;
    }

    // Otherwise, look for an existing active campaign for this agent
    const existingCampaign = await this.prisma.campaign.findFirst({
      where: {
        agents: {
          some: {
            id: agentData.id,
          },
        },
        status: { in: ['ACTIVE', 'SCHEDULED'] },
      },
    });

    if (existingCampaign) {
      return existingCampaign;
    }

    // Create a new campaign based on agent type
    const campaignType = this.determineCampaignTypeFromAgent(
      agentData.agentType,
    );

    const newCampaign = await this.prisma.campaign.create({
      data: {
        name: `${agentData.name} Campaign`,
        description: `Campaign created from ${agentData.name} agent run`,
        campaignType,
        status: 'ACTIVE' as CampaignStatus,
        goals: {
          primary: 'Automated campaign creation',
          automated: true,
          agentDriven: true,
        },
        targeting: {
          automated: true,
          source: `Agent: ${agentData.name}`,
        },
        ownerId: agentData.managerId,
        projectId: agentData.projectId,
        agents: {
          connect: { id: agentData.id },
        },
      },
    });

    return newCampaign;
  }

  /**
   * Connect an agent to a campaign
   * @param agentId The agent ID
   * @param campaignId The campaign ID
   */
  async connectAgentToCampaign(
    agentId: string,
    campaignId: string,
  ): Promise<void> {
    // Check if already connected
    const campaign = await this.prisma.campaign.findFirst({
      where: {
        id: campaignId,
        agents: {
          some: {
            id: agentId,
          },
        },
      },
    });

    if (campaign) {
      // Already connected
      return;
    }

    // Connect agent to campaign
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        agents: {
          connect: { id: agentId },
        },
      },
    });
  }

  /**
   * Update a campaign status
   * @param campaignId Campaign ID
   * @param status New status
   */
  async updateCampaignStatus(
    campaignId: string,
    status: CampaignStatus,
  ): Promise<Campaign> {
    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status },
    });
  }

  /**
   * Map agent type to appropriate campaign type
   * @param agentType Type of the agent
   * @returns Appropriate campaign type
   */
  private determineCampaignTypeFromAgent(agentType: string): CampaignType {
    const typeMap: { [key: string]: CampaignType } = {
      CONTENT_CREATOR: 'CONTENT_MARKETING' as CampaignType,
      SOCIAL_MEDIA_MANAGER: 'SOCIAL_MEDIA' as CampaignType,
      EMAIL_MARKETER: 'EMAIL' as CampaignType,
      SEO_SPECIALIST: 'SEO' as CampaignType,
      PERFORMANCE_OPTIMIZER: 'PPC' as CampaignType,
      OUTREACH_MANAGER: 'AFFILIATE' as CampaignType,
      AUDIENCE_RESEARCHER: 'INTEGRATED' as CampaignType,
      TREND_ANALYZER: 'INTEGRATED' as CampaignType,
      COPYWRITER: 'CONTENT_MARKETING' as CampaignType,
      CUSTOMER_SUPPORT: 'PR' as CampaignType,
    };

    return typeMap[agentType] || ('INTEGRATED' as CampaignType);
  }
}

// Singleton instance
let campaignServiceInstance: CampaignService | null = null;

/**
 * Get the singleton instance of CampaignService
 * @param prisma PrismaClient instance
 * @returns CampaignService instance
 */
export function getCampaignService(prisma: PrismaClient): CampaignService {
  if (!campaignServiceInstance) {
    campaignServiceInstance = new CampaignService(prisma);
  }
  return campaignServiceInstance;
}
