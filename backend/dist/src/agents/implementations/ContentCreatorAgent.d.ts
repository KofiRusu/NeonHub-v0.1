import { PrismaClient, AIAgent, ContentType } from '@prisma/client';
import { BaseAgent } from '../base/BaseAgent';
interface ContentCreationConfig {
    contentType: ContentType;
    topic: string;
    targeting?: string;
    tone?: string;
    keywords?: string[];
    length?: number;
    campaignId?: string;
    promptTemplate?: string;
}
/**
 * Agent for creating content like social media posts, emails, etc.
 */
export declare class ContentCreatorAgent extends BaseAgent {
    constructor(prisma: PrismaClient, agentData: AIAgent);
    /**
     * Implementation of the content creation logic
     * @param config Content creation configuration
     * @returns The created content
     */
    protected executeImpl(config: ContentCreationConfig): Promise<any>;
    /**
     * Simulate content generation (would call AI API in real implementation)
     * @param config Content creation configuration
     * @returns Generated content
     */
    private generateContent;
    private generateSocialPost;
    private generateEmail;
    private generateBlogPost;
    /**
     * Generate simulated paragraph content
     */
    private getSimulatedContentParagraph;
    /**
     * Generate simulated heading
     */
    private getSimulatedHeading;
}
export {};
