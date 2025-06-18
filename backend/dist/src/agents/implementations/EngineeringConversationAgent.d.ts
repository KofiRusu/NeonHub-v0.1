import { PrismaClient, AIAgent } from '@prisma/client';
import { BaseAgent } from '../base/BaseAgent';
import { AgentExecutionConfig } from '../types';
/**
 * Interface for engineering conversation agent configuration
 */
interface EngineeringConversationConfig extends AgentExecutionConfig {
  conversationHistory?: Array<{
    role: string;
    content: string;
  }>;
  initialPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  conversationId?: string;
  domainQuestion?: string;
}
/**
 * Agent specifically designed to handle specialized engineering domain conversations
 */
export declare class EngineeringConversationAgent extends BaseAgent {
  private domainContext;
  private openai;
  private currentSession;
  private agent;
  constructor(prisma: PrismaClient, agent: AIAgent);
  /**
   * Implementation of the conversation agent logic
   * @param config Conversation configuration
   * @returns The conversation result
   */
  protected executeImpl(config: EngineeringConversationConfig): Promise<any>;
  /**
   * Get the default prompt for the engineering conversation
   */
  private getDefaultPrompt;
  /**
   * Create a new conversation session
   */
  private createSession;
  /**
   * Update an existing conversation session
   */
  private updateSession;
  /**
   * Generate a unique conversation ID
   */
  private generateConversationId;
  /**
   * Access the current session
   */
  session(): any;
  /**
   * Stop the agent execution
   */
  protected stopImpl(): Promise<void>;
}
export {};
