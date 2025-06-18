'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.CampaignService = void 0;
/**
 * Service for managing marketing campaigns
 */
class CampaignService {
  constructor(prisma) {
    this.prisma = prisma;
  }
  /**
   * Get all campaigns for a user/project
   * @param userId User ID
   * @param projectId Optional project ID to filter by
   * @param includeRelated Whether to include related data like generated content
   * @returns List of campaigns
   */
  async getCampaigns(userId, projectId, includeRelated = false) {
    const where = {
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
  async getCampaign(campaignId, includeRelated = false) {
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
  async createCampaign(data) {
    const { agentIds, ...campaignData } = data;
    // Create a new object with parsed budget
    const parsedData = { ...campaignData };
    let numericBudget = null;
    // Parse budget to number if it's a string
    if (
      typeof parsedData.budget === 'string' &&
      parsedData.budget.trim() !== ''
    ) {
      // Remove any currency symbols and commas
      const cleanedBudget = parsedData.budget.replace(/[$,]/g, '');
      // Assign to a new variable to avoid type errors
      numericBudget = parseFloat(cleanedBudget);
    }
    // Create campaign data object with correctly typed fields
    const campaignCreateData = {
      ...parsedData,
      budget: numericBudget,
      // Ensure goals is always a valid JSON value
      goals: parsedData.goals
        ? JSON.parse(JSON.stringify(parsedData.goals))
        : {},
      // Ensure targeting is a valid JSON value
      targeting:
        typeof parsedData.targeting === 'string'
          ? { description: parsedData.targeting }
          : parsedData.targeting || {},
      status: data.status || 'DRAFT',
      agents:
        agentIds && agentIds.length > 0
          ? {
              connect: agentIds.map((id) => ({ id })),
            }
          : undefined,
    };
    // Remove budget if it's null to use the schema default
    if (numericBudget === null) {
      delete campaignCreateData.budget;
    }
    // Create campaign with properly typed fields
    const campaign = await this.prisma.campaign.create({
      data: campaignCreateData,
    });
    return campaign;
  }
  /**
   * Update an existing campaign
   * @param campaignId Campaign ID
   * @param data Update data
   * @returns Updated campaign
   */
  async updateCampaign(campaignId, data) {
    const { agentIds, ...campaignData } = data;
    // Create a new object with parsed budget
    const parsedData = { ...campaignData };
    let numericBudget = null;
    // Parse budget to number if it's a string
    if (
      typeof parsedData.budget === 'string' &&
      parsedData.budget.trim() !== ''
    ) {
      // Remove any currency symbols and commas
      const cleanedBudget = parsedData.budget.replace(/[$,]/g, '');
      numericBudget = parseFloat(cleanedBudget);
    }
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
        // Update campaign with agent connections/disconnections and typed budget
        return this.prisma.campaign.update({
          where: { id: campaignId },
          data: {
            ...parsedData,
            budget: numericBudget !== null ? numericBudget : undefined,
            // Ensure goals is always a valid JSON value if provided
            goals: parsedData.goals
              ? JSON.parse(JSON.stringify(parsedData.goals))
              : undefined,
            // Ensure targeting is a valid JSON value
            targeting:
              parsedData.targeting !== undefined
                ? typeof parsedData.targeting === 'string'
                  ? { description: parsedData.targeting }
                  : parsedData.targeting
                : undefined,
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
      data: {
        ...parsedData,
        budget: numericBudget !== null ? numericBudget : undefined,
        // Ensure goals is always a valid JSON value if provided
        goals: parsedData.goals
          ? JSON.parse(JSON.stringify(parsedData.goals))
          : undefined,
        // Ensure targeting is a valid JSON value
        targeting:
          parsedData.targeting !== undefined
            ? typeof parsedData.targeting === 'string'
              ? { description: parsedData.targeting }
              : parsedData.targeting
            : undefined,
      },
    });
  }
  /**
   * Delete a campaign
   * @param campaignId Campaign ID
   * @returns Deleted campaign
   */
  async deleteCampaign(campaignId) {
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
  async getOrCreateCampaignForAgent(agentData, campaignId) {
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
        targeting: 'Auto-generated by agent',
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
  async connectAgentToCampaign(agentId, campaignId) {
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
  async disconnectAgentFromCampaign(agentId, campaignId) {
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
  async updateCampaignStatus(campaignId, status) {
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
  async getCampaignAnalytics(campaignId) {
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
      // Access the metadata field which contains our metrics data
      const data = metric.metadata ? metric.metadata : {};
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
      metrics: metric.metadata ? metric.metadata : {},
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
  async scheduleCampaign(campaignId, startDate, endDate) {
    const now = new Date();
    // Determine status based on dates
    let status = 'SCHEDULED';
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
  determineCampaignTypeFromAgent(agentType) {
    // Map agent types to valid CampaignType enum values
    switch (agentType) {
      case 'CONTENT_CREATOR':
        return 'CONTENT_MARKETING';
      case 'SOCIAL_MEDIA_MANAGER':
        return 'SOCIAL_MEDIA';
      case 'EMAIL_MARKETER':
        return 'EMAIL';
      case 'SEO_SPECIALIST':
        return 'SEO';
      case 'PERFORMANCE_OPTIMIZER':
        return 'PPC';
      case 'OUTREACH_MANAGER':
        return 'AFFILIATE';
      case 'AUDIENCE_RESEARCHER':
        return 'PR';
      case 'TREND_ANALYZER':
        return 'INTEGRATED';
      case 'COPYWRITER':
        return 'CONTENT_MARKETING';
      case 'CUSTOMER_SUPPORT':
        return 'PR';
      default:
        return 'INTEGRATED';
    }
  }
  // Method with relation references
  async getCampaignDetails(campaignId) {
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
  async getAllCampaigns(userId) {
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
    // Return the campaigns
    return campaigns;
  }
}
exports.CampaignService = CampaignService;
