import { PrismaClient, AIAgent } from '@prisma/client';
import { BaseAgent } from '../base/BaseAgent';
import { AgentExecutionResult } from '../base/types';
/**
 * Configuration interface for the Customer Support Agent
 */
export interface CustomerSupportAgentConfig {
    /**
     * The context or description of the customer issue/query
     */
    customerQuery?: string;
    /**
     * Customer information for personalization
     */
    customerInfo?: {
        name?: string;
        email?: string;
        accountId?: string;
        tier?: string;
        history?: {
            previousQueries?: string[];
            purchaseHistory?: {
                productId: string;
                productName: string;
                purchaseDate: string;
            }[];
        };
    };
    /**
     * Product or service information
     */
    productContext?: {
        productId?: string;
        productName?: string;
        category?: string;
        features?: string[];
        knownIssues?: string[];
    };
    /**
     * Support knowledge base parameters
     */
    knowledgeBase?: {
        searchDepth?: 'basic' | 'intermediate' | 'deep';
        categories?: string[];
        maxResults?: number;
    };
    /**
     * Response style configuration
     */
    responseStyle?: {
        tone?: 'friendly' | 'professional' | 'technical' | 'empathetic';
        format?: 'concise' | 'detailed';
        includeFAQs?: boolean;
        includeLinks?: boolean;
    };
    /**
     * Escalation settings
     */
    escalationThreshold?: number;
    /**
     * Maximum response length
     */
    maxResponseLength?: number;
}
/**
 * Customer Support Agent for handling customer queries, generating responses,
 * and managing support cases.
 *
 * Features include query analysis, knowledge base search, personalized responses,
 * and automatic escalation for complex issues.
 */
export declare class CustomerSupportAgent extends BaseAgent {
    constructor(prisma: PrismaClient, agentData: AIAgent);
    /**
     * Execute the customer support request
     * @param config Agent configuration
     * @returns Execution result with support response
     */
    protected executeImpl(config: CustomerSupportAgentConfig): Promise<AgentExecutionResult>;
    /**
     * Analyze the customer query for intent, sentiment, and complexity
     */
    private analyzeQuery;
    /**
     * Search knowledge base for relevant articles
     */
    private searchKnowledgeBase;
    /**
     * Generate a personalized response based on the query and analysis
     */
    private generateResponse;
    /**
     * Log customer interaction for future reference
     */
    private logCustomerInteraction;
    /**
     * Stop any ongoing execution
     */
    protected stopImpl(): Promise<void>;
    /**
     * Simulate processing time for async operations
     */
    private simulateProcessing;
}
