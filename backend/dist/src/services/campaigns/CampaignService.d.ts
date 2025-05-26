import { PrismaClient, Campaign, AIAgent, CampaignStatus, CampaignType } from '@prisma/client';
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
export declare class CampaignService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Get all campaigns for a user/project
     * @param userId User ID
     * @param projectId Optional project ID to filter by
     * @param includeRelated Whether to include related data like generated content
     * @returns List of campaigns
     */
    getCampaigns(userId: string, projectId?: string, includeRelated?: boolean): Promise<Campaign[]>;
    /**
     * Get a campaign by ID
     * @param campaignId The ID of the campaign to get
     * @param includeRelated Whether to include related data
     * @returns The campaign data
     */
    getCampaign(campaignId: string, includeRelated?: boolean): Promise<Campaign | null>;
    /**
     * Create a new campaign
     * @param data Campaign data
     * @returns The created campaign
     */
    createCampaign(data: CreateCampaignData): Promise<Campaign>;
    /**
     * Update an existing campaign
     * @param campaignId Campaign ID
     * @param data Update data
     * @returns Updated campaign
     */
    updateCampaign(campaignId: string, data: UpdateCampaignData): Promise<Campaign>;
    /**
     * Delete a campaign
     * @param campaignId Campaign ID
     * @returns Deleted campaign
     */
    deleteCampaign(campaignId: string): Promise<Campaign>;
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
     * Disconnect an agent from a campaign
     * @param agentId Agent ID
     * @param campaignId Campaign ID
     */
    disconnectAgentFromCampaign(agentId: string, campaignId: string): Promise<void>;
    /**
     * Update a campaign status
     * @param campaignId Campaign ID
     * @param status New status
     */
    updateCampaignStatus(campaignId: string, status: CampaignStatus): Promise<Campaign>;
    /**
     * Get campaign analytics
     * @param campaignId Campaign ID
     * @returns Campaign analytics data
     */
    getCampaignAnalytics(campaignId: string): Promise<CampaignAnalytics>;
    /**
     * Schedule a campaign to start and/or end at specific times
     * @param campaignId Campaign ID
     * @param startDate Start date (optional)
     * @param endDate End date (optional)
     * @returns Updated campaign
     */
    scheduleCampaign(campaignId: string, startDate?: Date, endDate?: Date): Promise<Campaign>;
    /**
     * Map agent type to appropriate campaign type
     * @param agentType Type of the agent
     * @returns Appropriate campaign type
     */
    private determineCampaignTypeFromAgent;
    getCampaignDetails(campaignId: string): Promise<any>;
    getAllCampaigns(userId: string): Promise<any[]>;
}
