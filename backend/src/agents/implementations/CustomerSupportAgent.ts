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
  escalationThreshold?: number; // 0-100, higher means more likely to escalate

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
export class CustomerSupportAgent extends BaseAgent {
  constructor(prisma: PrismaClient, agentData: AIAgent) {
    super(prisma, agentData);
  }

  /**
   * Execute the customer support request
   * @param config Agent configuration
   * @returns Execution result with support response
   */
  protected async executeImpl(
    config: CustomerSupportAgentConfig,
  ): Promise<AgentExecutionResult> {
    try {
      this.logMessage('info', 'Starting customer support request');

      // Validate configuration
      if (!config.customerQuery) {
        return {
          status: 'error',
          error: new Error('Customer query is required'),
        };
      }

      // Initialize results
      const results: any = {
        query: config.customerQuery,
        analysis: {},
        response: {},
        relatedArticles: [],
        escalationNeeded: false,
      };

      // Analyze the customer query
      this.logMessage('info', 'Analyzing customer query');
      results.analysis = await this.analyzeQuery(config.customerQuery);

      // Search knowledge base
      this.logMessage('info', 'Searching knowledge base');
      results.relatedArticles = await this.searchKnowledgeBase(
        config.customerQuery,
        config.knowledgeBase?.categories,
        config.knowledgeBase?.maxResults || 3,
      );

      // Check if this should be escalated
      const complexityScore = results.analysis.complexity;
      const escalationThreshold = config.escalationThreshold || 70;
      results.escalationNeeded = complexityScore > escalationThreshold;

      if (results.escalationNeeded) {
        this.logMessage('info', 'Issue complexity requires escalation');
      }

      // Generate personalized response
      this.logMessage('info', 'Generating response');
      results.response = await this.generateResponse(
        config.customerQuery,
        results.analysis,
        results.relatedArticles,
        results.escalationNeeded,
        config,
      );

      // Log customer interaction
      if (config.customerInfo?.accountId) {
        this.logMessage(
          'info',
          `Logging interaction for customer ${config.customerInfo.accountId}`,
        );
        await this.logCustomerInteraction(
          config.customerInfo.accountId,
          config.customerQuery,
          results.response,
        );
      }

      this.logMessage(
        'info',
        'Customer support request completed successfully',
      );

      return {
        status: 'success',
        data: results,
      };
    } catch (error) {
      this.logMessage('error', `Error during customer support: ${error}`);
      return {
        status: 'error',
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Analyze the customer query for intent, sentiment, and complexity
   */
  private async analyzeQuery(query: string): Promise<any> {
    await this.simulateProcessing(1000);

    // Simulate query analysis
    const categories = [
      'Technical Support',
      'Billing Question',
      'Feature Request',
      'Bug Report',
      'Account Management',
      'Product Information',
    ];

    const intents = [
      'Get Information',
      'Solve Problem',
      'Request Feature',
      'Express Frustration',
      'Request Refund',
      'Cancel Service',
    ];

    const sentiments = ['Positive', 'Neutral', 'Negative', 'Very Negative'];

    // Generate random analysis for simulation
    return {
      category: categories[Math.floor(Math.random() * categories.length)],
      intent: intents[Math.floor(Math.random() * intents.length)],
      sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
      complexity: Math.floor(Math.random() * 100), // 0-100 scale
      keywords: query
        .split(' ')
        .filter((word) => word.length > 4)
        .slice(0, 3),
      urgency: Math.floor(Math.random() * 100), // 0-100 scale
      estimatedResponseTime: Math.floor(Math.random() * 10) + 1, // 1-10 minutes
    };
  }

  /**
   * Search knowledge base for relevant articles
   */
  private async searchKnowledgeBase(
    query: string,
    categories?: string[],
    maxResults = 3,
  ): Promise<any[]> {
    await this.simulateProcessing(1500);

    // Sample knowledge base articles
    const allArticles = [
      {
        id: 'kb-001',
        title: 'How to Reset Your Password',
        category: 'Account Management',
        summary: 'Step-by-step guide to reset your account password',
        url: '/help/kb/password-reset',
        relevanceScore: 0.95,
      },
      {
        id: 'kb-002',
        title: 'Billing Cycle Explained',
        category: 'Billing',
        summary: 'Understanding your billing cycle and payment dates',
        url: '/help/kb/billing-cycle',
        relevanceScore: 0.87,
      },
      {
        id: 'kb-003',
        title: 'Troubleshooting Connection Issues',
        category: 'Technical Support',
        summary: 'Common connection problems and their solutions',
        url: '/help/kb/connection-troubleshooting',
        relevanceScore: 0.92,
      },
      {
        id: 'kb-004',
        title: 'Feature Request Process',
        category: 'Product',
        summary: 'How to submit and track feature requests',
        url: '/help/kb/feature-requests',
        relevanceScore: 0.78,
      },
      {
        id: 'kb-005',
        title: 'Account Cancellation Policy',
        category: 'Account Management',
        summary:
          'Understanding the process and policies for account cancellation',
        url: '/help/kb/cancellation-policy',
        relevanceScore: 0.89,
      },
      {
        id: 'kb-006',
        title: 'Common Error Codes',
        category: 'Technical Support',
        summary:
          'Explanations and solutions for frequently encountered error codes',
        url: '/help/kb/error-codes',
        relevanceScore: 0.91,
      },
      {
        id: 'kb-007',
        title: 'Upgrading Your Subscription',
        category: 'Billing',
        summary: 'How to upgrade your account to access more features',
        url: '/help/kb/upgrade-subscription',
        relevanceScore: 0.85,
      },
    ];

    // Filter by categories if provided
    let filteredArticles = allArticles;
    if (categories && categories.length > 0) {
      filteredArticles = allArticles.filter((article) =>
        categories.some((cat) =>
          article.category.toLowerCase().includes(cat.toLowerCase()),
        ),
      );
    }

    // Shuffle and assign random relevance scores
    filteredArticles = filteredArticles.map((article) => ({
      ...article,
      relevanceScore: Math.random() * 0.3 + 0.7, // 0.7-1.0 range
    }));

    // Sort by relevance and limit results
    return filteredArticles
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxResults);
  }

  /**
   * Generate a personalized response based on the query and analysis
   */
  private async generateResponse(
    query: string,
    analysis: any,
    relatedArticles: any[],
    needsEscalation: boolean,
    config: CustomerSupportAgentConfig,
  ): Promise<any> {
    await this.simulateProcessing(2000);

    const customerName = config.customerInfo?.name || 'valued customer';
    const tone = config.responseStyle?.tone || 'professional';
    const format = config.responseStyle?.format || 'concise';

    // Generate appropriate greeting based on tone
    let greeting = '';
    switch (tone) {
      case 'friendly':
        greeting = `Hi ${customerName}! Thanks for reaching out to us today.`;
        break;
      case 'empathetic':
        greeting = `Hello ${customerName}, I understand you're having an issue and I'm here to help.`;
        break;
      case 'technical':
        greeting = `Hello ${customerName}, I've analyzed your technical query.`;
        break;
      case 'professional':
      default:
        greeting = `Hello ${customerName}, thank you for contacting our support team.`;
        break;
    }

    // Generate response based on analysis
    let mainResponse = '';
    if (analysis.category === 'Technical Support') {
      mainResponse =
        'Based on your description, this appears to be a technical issue. ' +
        'I recommend first trying to clear your browser cache and cookies, then restart your application. ' +
        'If the problem persists, please check your network connection and try again.';
    } else if (analysis.category === 'Billing Question') {
      mainResponse =
        'Regarding your billing question, your current billing cycle runs from the 1st to the end of each month. ' +
        'Payments are processed on the 1st, and you can update your payment method at any time from your account settings.';
    } else if (analysis.category === 'Feature Request') {
      mainResponse =
        'Thank you for your feature suggestion! We appreciate your feedback and have logged this request for our product team to review. ' +
        'We regularly evaluate new feature requests as part of our product roadmap planning.';
    } else {
      mainResponse =
        "I've reviewed your question and can help you with this. " +
        'Our team is dedicated to providing the best possible experience and solution for our customers.';
    }

    // Add knowledge base references if configured
    let articleReferences = '';
    if (config.responseStyle?.includeLinks && relatedArticles.length > 0) {
      articleReferences = '\n\nYou may also find these resources helpful:\n';
      relatedArticles.forEach((article) => {
        articleReferences += `- ${article.title}: ${article.url}\n`;
      });
    }

    // Add escalation message if needed
    let escalationMessage = '';
    if (needsEscalation) {
      escalationMessage =
        "\n\nBased on the complexity of your issue, I've escalated this to our specialized support team. " +
        'A support representative will contact you directly within the next 24 hours to further assist you.';
    }

    // Closing message
    const closing =
      "If you have any further questions, please don't hesitate to ask. " +
      "We're always here to help!\n\nBest regards,\nSupport Team";

    // Assemble full response
    const fullResponse = `${greeting}\n\n${mainResponse}${articleReferences}${escalationMessage}\n\n${closing}`;

    // Truncate if max length specified
    const finalResponse =
      config.maxResponseLength && fullResponse.length > config.maxResponseLength
        ? fullResponse.substring(0, config.maxResponseLength) + '...'
        : fullResponse;

    return {
      text: finalResponse,
      sentiment: tone,
      format: format,
      includedArticles: relatedArticles.length,
      escalated: needsEscalation,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Log customer interaction for future reference
   */
  private async logCustomerInteraction(
    customerId: string,
    query: string,
    response: any,
  ): Promise<void> {
    await this.simulateProcessing(500);

    // In a real implementation, this would save to database
    this.logMessage('info', `Interaction logged for customer ${customerId}`);
  }

  /**
   * Stop any ongoing execution
   */
  protected async stopImpl(): Promise<void> {
    this.logMessage('info', 'Stopping customer support agent execution');
  }

  /**
   * Simulate processing time for async operations
   */
  private simulateProcessing(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
