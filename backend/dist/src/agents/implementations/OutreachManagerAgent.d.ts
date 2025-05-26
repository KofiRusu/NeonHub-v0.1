import { PrismaClient, AIAgent, ContactMethod, OutreachType } from '@prisma/client';
import { BaseAgent } from '../base/BaseAgent';
interface OutreachConfig {
    campaignId: string;
    outreachType: OutreachType;
    contactMethod: ContactMethod;
    targeting: string;
    messageTemplate?: string;
    personalizationLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
    sendSchedule?: string;
    maxOutreachPerDay?: number;
    followUpDays?: number[];
}
/**
 * Agent for handling cold email, DM campaigns and other outreach activities
 */
export declare class OutreachManagerAgent extends BaseAgent {
    constructor(prisma: PrismaClient, agentData: AIAgent);
    /**
     * Implementation of the outreach management logic
     * @param config Outreach configuration
     * @returns Results of the outreach operation
     */
    protected executeImpl(config: OutreachConfig): Promise<any>;
    /**
     * Create outreach tasks for a campaign
     * @param config Outreach configuration
     * @param campaignId Campaign ID
     * @param userId User ID of the campaign owner
     * @returns Created outreach tasks
     */
    private createOutreachTasks;
    /**
     * Generate personalized message for a contact
     * @param config Outreach configuration
     * @param contact Contact information
     * @returns Personalized message
     */
    private generatePersonalizedMessage;
    /**
     * Generate a personal note based on contact info and personalization level
     */
    private generatePersonalNote;
    /**
     * Get default message template based on outreach type and contact method
     */
    private getDefaultTemplate;
    /**
     * Generate audience segments for simulation
     */
    private generateAudienceSegments;
    /**
     * Generate a summary of outreach activities
     */
    private generateOutreachSummary;
}
export {};
