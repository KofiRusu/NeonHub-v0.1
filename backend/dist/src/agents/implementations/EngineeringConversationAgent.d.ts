import { PrismaClient, AIAgent } from '@prisma/client';
import { BaseAgent } from '../base/BaseAgent';
import { AgentExecutionConfig } from '../types';
/**
 * Agent specifically designed to handle specialized engineering domain conversations
 */
export declare class EngineeringConversationAgent extends BaseAgent {
    private domainContext;
    private openai;
    constructor(prisma: PrismaClient, agent: AIAgent);
    /**
     * Execute the engineering conversation agent
     * @param config Configuration options
     * @param options Execution options
     */
    execute(config: any, options?: AgentExecutionConfig): Promise<any>;
    /**
     * Get the default system prompt based on the engineering domain
     */
    private getSystemPrompt;
    /**
     * Get a default initial prompt based on the domain
     */
    private getDefaultPrompt;
    /**
     * Generate a unique conversation ID
     */
    private generateConversationId;
    /**
     * Store the conversation history in the database
     */
    private storeConversationHistory;
}
