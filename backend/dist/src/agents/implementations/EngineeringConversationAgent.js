"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EngineeringConversationAgent = void 0;
const BaseAgent_1 = require("../base/BaseAgent");
const openai_1 = __importDefault(require("openai"));
/**
 * Agent specifically designed to handle specialized engineering domain conversations
 */
class EngineeringConversationAgent extends BaseAgent_1.BaseAgent {
    domainContext;
    openai;
    constructor(prisma, agent) {
        super(prisma, agent);
        // Parse agent configuration
        const config = agent.configuration;
        this.domainContext = config.domainContext || 'general software engineering';
        // Initialize OpenAI client
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    /**
     * Execute the engineering conversation agent
     * @param config Configuration options
     * @param options Execution options
     */
    async execute(config, options = {}) {
        // Start an execution session
        await this.startSession(options);
        try {
            this.log(`Starting engineering conversation in domain: ${this.domainContext}`);
            // Get conversation history or initialize new conversation
            const conversationHistory = config.conversationHistory || [];
            const initialPrompt = config.initialPrompt || this.getDefaultPrompt();
            // If this is a new conversation, add the system message
            if (conversationHistory.length === 0) {
                conversationHistory.push({
                    role: 'system',
                    content: this.getSystemPrompt(),
                });
                // Add the initial prompt as a user message
                conversationHistory.push({
                    role: 'user',
                    content: initialPrompt,
                });
            }
            // Process the conversation using OpenAI
            const completion = await this.openai.chat.completions.create({
                model: config.model || 'gpt-4',
                messages: conversationHistory,
                temperature: config.temperature || 0.7,
                max_tokens: config.maxTokens || 1500,
            });
            // Get the assistant's response
            const responseMessage = completion.choices[0].message;
            // Add the response to the conversation history
            conversationHistory.push(responseMessage);
            // Store the updated conversation history
            await this.storeConversationHistory(conversationHistory);
            // Prepare result
            const result = {
                response: responseMessage.content,
                conversationId: config.conversationId || this.generateConversationId(),
                conversationHistory: conversationHistory,
                domain: this.domainContext,
            };
            // Complete the session successfully
            await this.completeSession(true);
            return result;
        }
        catch (error) {
            // Log the error
            this.log(`Error in engineering conversation: ${error.message}`, 'error');
            // Complete the session with error
            await this.completeSession(false, error.message);
            throw error;
        }
    }
    /**
     * Get the default system prompt based on the engineering domain
     */
    getSystemPrompt() {
        return `You are a specialized assistant focused on ${this.domainContext}. 
You provide expert guidance, answer technical questions, and help with development tasks in this domain.
Be concise, practical, and solution-oriented in your responses.
When providing code examples, ensure they follow best practices for ${this.domainContext}.`;
    }
    /**
     * Get a default initial prompt based on the domain
     */
    getDefaultPrompt() {
        return `I'm starting a new development conversation focused on ${this.domainContext}. Please provide an overview of key considerations, best practices, and the latest technologies in this domain.`;
    }
    /**
     * Generate a unique conversation ID
     */
    generateConversationId() {
        return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    /**
     * Store the conversation history in the database
     */
    async storeConversationHistory(conversationHistory) {
        // Get the agent ID
        const agentId = this.agent.id;
        // Store the conversation using the agent execution session
        await this.prisma.agentExecutionSession.update({
            where: { id: this.currentSession.id },
            data: {
                context: {
                    conversationHistory: conversationHistory,
                },
            },
        });
    }
}
exports.EngineeringConversationAgent = EngineeringConversationAgent;
//# sourceMappingURL=EngineeringConversationAgent.js.map