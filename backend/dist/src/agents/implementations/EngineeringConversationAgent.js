'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.EngineeringConversationAgent = void 0;
const BaseAgent_1 = require('../base/BaseAgent');
const openai_1 = __importDefault(require('openai'));
/**
 * Agent specifically designed to handle specialized engineering domain conversations
 */
class EngineeringConversationAgent extends BaseAgent_1.BaseAgent {
  constructor(prisma, agent) {
    super(prisma, agent);
    this.agent = agent;
    // Parse agent configuration
    const config = agent.configuration;
    this.domainContext = config.domainContext || 'general software engineering';
    // Initialize OpenAI client
    this.openai = new openai_1.default({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  /**
   * Implementation of the conversation agent logic
   * @param config Conversation configuration
   * @returns The conversation result
   */
  async executeImpl(config) {
    this.logMessage('info', 'Starting engineering conversation');
    // Initialize conversation session
    const conversationHistory = config.conversationHistory || [];
    const initialPrompt = config.initialPrompt || this.getDefaultPrompt();
    // Create session if it doesn't exist
    if (!this.currentSession) {
      this.currentSession = await this.createSession(config);
    }
    // If there's a specific domain question, process it
    if (config.domainQuestion) {
      this.logMessage(
        'info',
        `Processing domain question: ${config.domainQuestion}`,
      );
      // Build conversation with history + new question
      const messages = [
        { role: 'system', content: initialPrompt },
        ...conversationHistory,
        { role: 'user', content: config.domainQuestion },
      ];
      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: config.model || 'gpt-4',
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: config.temperature || 0.7,
        max_tokens: config.maxTokens || 1500,
      });
      // Get the response
      const response = completion.choices[0]?.message?.content;
      // Add to conversation history
      conversationHistory.push(
        { role: 'user', content: config.domainQuestion },
        { role: 'assistant', content: response || 'No response generated' },
      );
      // Update session
      await this.updateSession({
        conversationId: config.conversationId || this.generateConversationId(),
        conversationHistory,
        lastActivity: new Date(),
      });
      this.logMessage('info', 'Generated engineering response');
      return {
        status: 'success',
        response,
        conversationHistory,
        sessionId: this.currentSession.id,
      };
    }
    return {
      status: 'error',
      error: new Error('No domain question provided'),
    };
  }
  /**
   * Get the default prompt for the engineering conversation
   */
  getDefaultPrompt() {
    return `You are an expert in ${this.domainContext}. 
    Provide detailed, accurate, and practical answers to technical questions in this domain.
    Cite relevant technical standards, best practices, or methodologies where appropriate.
    If you're uncertain about something, be clear about the limitations of your knowledge.`;
  }
  /**
   * Create a new conversation session
   */
  async createSession(config) {
    // In a real implementation, this would create a session in the database
    this.logMessage('info', 'Creating new engineering conversation session');
    return {
      id: this.generateConversationId(),
      createdAt: new Date(),
      lastActivity: new Date(),
      conversationHistory: config.conversationHistory || [],
    };
  }
  /**
   * Update an existing conversation session
   */
  async updateSession(sessionData) {
    // In a real implementation, this would update the session in the database
    this.logMessage('info', `Updating session ${sessionData.conversationId}`);
    this.currentSession = {
      ...this.currentSession,
      ...sessionData,
    };
  }
  /**
   * Generate a unique conversation ID
   */
  generateConversationId() {
    return `eng-conv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
  /**
   * Access the current session
   */
  session() {
    return this.currentSession;
  }
  /**
   * Stop the agent execution
   */
  async stopImpl() {
    this.logMessage('info', 'Stopping engineering conversation agent');
  }
}
exports.EngineeringConversationAgent = EngineeringConversationAgent;
