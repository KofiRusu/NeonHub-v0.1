"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CampaignService = void 0;
exports.getCampaignService = getCampaignService;
/**
 * Service for managing marketing campaigns
 */
class CampaignService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    /**
     * Get a campaign by ID
     * @param campaignId The ID of the campaign to get
     * @returns The campaign data
     */
    async getCampaign(campaignId) {
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
        const campaignType = this.determineCampaignTypeFromAgent(agentData.agentType);
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
     * Map agent type to appropriate campaign type
     * @param agentType Type of the agent
     * @returns Appropriate campaign type
     */
    determineCampaignTypeFromAgent(agentType) {
        const typeMap = {
            CONTENT_CREATOR: 'CONTENT_MARKETING',
            SOCIAL_MEDIA_MANAGER: 'SOCIAL_MEDIA',
            EMAIL_MARKETER: 'EMAIL',
            SEO_SPECIALIST: 'SEO',
            PERFORMANCE_OPTIMIZER: 'PPC',
            OUTREACH_MANAGER: 'AFFILIATE',
            AUDIENCE_RESEARCHER: 'INTEGRATED',
            TREND_ANALYZER: 'INTEGRATED',
            COPYWRITER: 'CONTENT_MARKETING',
            CUSTOMER_SUPPORT: 'PR',
        };
        return typeMap[agentType] || 'INTEGRATED';
    }
}
exports.CampaignService = CampaignService;
// Singleton instance
let campaignServiceInstance = null;
/**
 * Get the singleton instance of CampaignService
 * @param prisma PrismaClient instance
 * @returns CampaignService instance
 */
function getCampaignService(prisma) {
    if (!campaignServiceInstance) {
        campaignServiceInstance = new CampaignService(prisma);
    }
    return campaignServiceInstance;
}
//# sourceMappingURL=CampaignService.js.map