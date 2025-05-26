import {
  PrismaClient,
  Campaign,
  AIAgent,
  CampaignStatus,
  CampaignType,
  Prisma,
} from '@prisma/client';

/**
 * Campaign creation data
 */
export interface CreateCampaignData {
  name: string;
  description: string;
  campaignType: CampaignType;
  targetAudience?: string;
  budget?: string | null;
  goals?: string | Record<string, any>;
  startDate?: Date | null;
  endDate?: Date | null;
  ownerId: string;
  projectId: string;
  status?: CampaignStatus;
  agentIds?: string[];
}

/**
 * Campaign update data
 */
export interface UpdateCampaignData {
  name?: string;
  description?: string;
  campaignType?: CampaignType;
  targetAudience?: string;
  budget?: string | null;
  goals?: string | Record<string, any>;
  startDate?: Date | null;
  endDate?: Date | null;
  status?: CampaignStatus;
  agentIds?: string[];
}

/**
 * Campaign analytics data
 */
export interface CampaignAnalytics {
  campaignId: string;
  contentCount: number;
  impressions: number;
  clicks: number;
  conversions: number;
  engagements: number;
  revenueGenerated: number;
  roi: number;
  metricsOverTime: Array<{
    timestamp: Date;
    metrics: Record<string, any>;
  }>;
}

/**
 * Service for managing marketing campaigns
 */
export class CampaignService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get all campaigns for a user/project
   * @param userId User ID
   * @param projectId Optional project ID to filter by
   * @param includeRelated Whether to include related data like generated content
   * @returns List of campaigns
   */
  async getCampaigns(
    userId: string,
    projectId?: string,
    includeRelated = false,
  ): Promise<Campaign[]> {
    const where: Prisma.CampaignWhereInput = {
      ownerId: userId,
    };

    // Add project filter if provided
    if (projectId) {
      where.projectId = projectId;
    }

    return this.prisma.campaign.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: includeRelated
        ? {
            generatedContent: {
              select: {
                id: true,
                title: true,
                contentType: true,
                status: true,
              },
              take: 3,
            },
            outreachTasks: {
              select: {
                id: true,
                title: true,
                status: true,
              },
              take: 3,
            },
            agents: {
              select: {
                id: true,
                name: true,
                agentType: true,
              },
            },
            _count: {
              select: {
                generatedContent: true,
                outreachTasks: true,
              },
            },
          }
        : undefined,
    });
  }

  /**
   * Get a campaign by ID
   * @param campaignId The ID of the campaign to get
   * @param includeRelated Whether to include related data
   * @returns The campaign data
   */
  async getCampaign(
    campaignId: string,
    includeRelated = false,
  ): Promise<Campaign | null> {
    return this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: includeRelated
        ? {
            generatedContent: {
              orderBy: {
                createdAt: 'desc',
              },
            },
            outreachTasks: {
              orderBy: {
                createdAt: 'desc',
              },
            },
            metrics: {
              orderBy: {
                timestamp: 'desc',
              },
            },
            agents: true,
          }
        : undefined,
    });
  }

  /**
   * Create a new campaign
   * @param data Campaign data
   * @returns The created campaign
   */
  async createCampaign(data: CreateCampaignData): Promise<Campaign> {
    const { agentIds, ...campaignData } = data;

    // Parse budget to float if it's a string
    let budget = campaignData.budget;
    if (typeof budget === 'string' && budget.trim() !== '') {
      // Remove any currency symbols and commas
      const cleanedBudget = budget.replace(/[$,]/g, '');
      budget = parseFloat(cleanedBudget);
    }

    // Create campaign
    const campaign = await this.prisma.campaign.create({
      data: {
        ...campaignData,
        budget,
        status: data.status || 'DRAFT',
        agents:
          agentIds && agentIds.length > 0
            ? {
                connect: agentIds.map((id) => ({ id })),
              }
            : undefined,
      },
    });

    return campaign;
  }

  /**
   * Update an existing campaign
   * @param campaignId Campaign ID
   * @param data Update data
   * @returns Updated campaign
   */
  async updateCampaign(
    campaignId: string,
    data: UpdateCampaignData,
  ): Promise<Campaign> {
    const { agentIds, ...campaignData } = data;

    // First, get current agents to determine what needs to be connected/disconnected
    if (agentIds) {
      const currentCampaign = await this.prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          agents: true,
        },
      });

      if (currentCampaign) {
        const currentAgentIds = currentCampaign.agents.map((agent) => agent.id);

        // Determine which agents to disconnect
        const agentsToDisconnect = currentAgentIds.filter(
          (id) => !agentIds.includes(id),
        );

        // Determine which agents to connect
        const agentsToConnect = agentIds.filter(
          (id) => !currentAgentIds.includes(id),
        );

        // Update campaign with agent connections/disconnections
        return this.prisma.campaign.update({
          where: { id: campaignId },
          data: {
            ...campaignData,
            agents: {
              disconnect: agentsToDisconnect.map((id) => ({ id })),
              connect: agentsToConnect.map((id) => ({ id })),
            },
          },
        });
      }
    }

    // If no agent changes or campaign not found, just update the campaign data
    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: campaignData,
    });
  }

  /**
   * Delete a campaign
   * @param campaignId Campaign ID
   * @returns Deleted campaign
   */
  async deleteCampaign(campaignId: string): Promise<Campaign> {
    return this.prisma.campaign.delete({
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
        status: 'ACTIVE',
        goals: {
          primary: 'Automated campaign creation',
          automated: true,
          agentDriven: true,
        },
        targetAudience: 'Auto-generated by agent',
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
   * Disconnect an agent from a campaign
   * @param agentId Agent ID
   * @param campaignId Campaign ID
   */
  async disconnectAgentFromCampaign(
    agentId: string,
    campaignId: string,
  ): Promise<void> {
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        agents: {
          disconnect: { id: agentId },
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
   * Get campaign analytics
   * @param campaignId Campaign ID
   * @returns Campaign analytics data
   */
  async getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics> {
    // Get the campaign
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        generatedContent: true,
        metrics: {
          orderBy: {
            timestamp: 'desc',
          },
        },
        _count: {
          select: {
            generatedContent: true,
            outreachTasks: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }

    // Extract metrics from the most recent records
    const metrics = campaign.metrics || [];
    let impressions = 0;
    let clicks = 0;
    let conversions = 0;
    let engagements = 0;
    let revenueGenerated = 0;

    // Aggregate metrics
    metrics.forEach((metric) => {
      const data = metric.data as any;
      if (data.impressions) impressions += Number(data.impressions);
      if (data.clicks) clicks += Number(data.clicks);
      if (data.conversions) conversions += Number(data.conversions);
      if (data.engagements) engagements += Number(data.engagements);
      if (data.revenue) revenueGenerated += Number(data.revenue);
    });

    // Calculate ROI if we have budget and revenue
    let roi = 0;
    if (campaign.budget) {
      const budget = Number(campaign.budget);
      if (budget > 0) {
        roi = ((revenueGenerated - budget) / budget) * 100;
      }
    }

    // Format metrics over time for visualization
    const metricsOverTime = metrics.map((metric) => ({
      timestamp: metric.timestamp,
      metrics: metric.data,
    }));

    return {
      campaignId,
      contentCount: campaign._count.generatedContent,
      impressions,
      clicks,
      conversions,
      engagements,
      revenueGenerated,
      roi,
      metricsOverTime,
    };
  }

  /**
   * Schedule a campaign to start and/or end at specific times
   * @param campaignId Campaign ID
   * @param startDate Start date (optional)
   * @param endDate End date (optional)
   * @returns Updated campaign
   */
  async scheduleCampaign(
    campaignId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Campaign> {
    const now = new Date();

    // Determine status based on dates
    let status: CampaignStatus = 'SCHEDULED';

    if (startDate && startDate <= now) {
      status = 'ACTIVE';
    }

    if (endDate && endDate <= now) {
      status = 'COMPLETED';
    }

    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        startDate,
        endDate,
        status,
      },
    });
  }

  /**
   * Map agent type to appropriate campaign type
   * @param agentType Type of the agent
   * @returns Appropriate campaign type
   */
  private determineCampaignTypeFromAgent(agentType: string): CampaignType {
    const typeMap: { [key: string]: CampaignType } = {
      CONTENT_CREATOR: 'CONTENT_MARKETING',
      SOCIAL_MEDIA_MANAGER: 'SOCIAL_MEDIA',
      EMAIL_MARKETER: 'EMAIL_CAMPAIGN',
      SEO_SPECIALIST: 'SEO_OPTIMIZATION',
      PERFORMANCE_OPTIMIZER: 'AD_CAMPAIGN',
      OUTREACH_MANAGER: 'AFFILIATE',
      AUDIENCE_RESEARCHER: 'BRAND_AWARENESS',
      TREND_ANALYZER: 'INTEGRATED',
      COPYWRITER: 'CONTENT_MARKETING',
      CUSTOMER_SUPPORT: 'PR',
    };

    return (typeMap[agentType] || 'INTEGRATED') as CampaignType;
  }

  // Method with relation references
  async getCampaignDetails(campaignId: string): Promise<any> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        generatedContent: {
          select: {
            id: true,
            title: true,
            contentType: true,
            platform: true,
            status: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        outreachTasks: true,
        metrics: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 1,
        },
        _count: {
          select: {
            generatedContent: true,
            outreachTasks: true,
          },
        },
      },
    });

    // ... existing code ...
  }

  // Another method using the relation
  async getAllCampaigns(userId: string): Promise<any[]> {
    const campaigns = await this.prisma.campaign.findMany({
      where: { ownerId: userId },
      include: {
        owner: {
          select: {
            name: true,
          },
        },
        generatedContent: true,
        outreachTasks: true,
        metrics: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 1,
        },
        _count: {
          select: {
            generatedContent: true,
            outreachTasks: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // ... existing code ...
  }
}
