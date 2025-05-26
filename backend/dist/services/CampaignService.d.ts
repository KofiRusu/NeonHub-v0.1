import { PrismaClient, Campaign, AIAgent, CampaignStatus } from '@prisma/client';
/**
 * Service for managing marketing campaigns
 */
export declare class CampaignService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Get a campaign by ID
     * @param campaignId The ID of the campaign to get
     * @returns The campaign data
     */
    getCampaign(campaignId: string): Promise<Campaign | null>;
    /**
     * Create a new campaign or get an existing one for the agent
     * @param agentData The agent data
     * @param campaignId Optional campaign ID to update instead of creating new
     * @returns The campaign data
     */
    getOrCreateCampaignForAgent(agentData: AIAgent, campaignId?: string): Promise<Campaign>;
    /**
     * Connect an agent to a campaign
     * @param agentId The agent ID
     * @param campaignId The campaign ID
     */
    connectAgentToCampaign(agentId: string, campaignId: string): Promise<void>;
    /**
     * Update a campaign status
     * @param campaignId Campaign ID
     * @param status New status
     */
    updateCampaignStatus(campaignId: string, status: CampaignStatus): Promise<Campaign>;
    /**
     * Map agent type to appropriate campaign type
     * @param agentType Type of the agent
     * @returns Appropriate campaign type
     */
    private determineCampaignTypeFromAgent;
}
/**
 * Get the singleton instance of CampaignService
 * @param prisma PrismaClient instance
 * @returns CampaignService instance
 */
export declare function getCampaignService(prisma: PrismaClient): CampaignService;
