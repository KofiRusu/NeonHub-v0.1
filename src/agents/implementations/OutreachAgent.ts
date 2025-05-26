import { PrismaClient, AgentType, ContactMethod } from '@prisma/client';
import { AIAgent } from '../base/AIAgent';
import {
  AgentConfig,
  AgentRunOptions,
  OutreachAgentOutput,
} from '../base/types';

/**
 * Configuration for outreach agents
 */
export interface OutreachAgentConfig extends AgentConfig {
  /** Outreach templates to use */
  templates?: Record<string, string>;
  /** Target audience characteristics */
  targetAudience?: Record<string, any>;
  /** Personalization level */
  personalizationLevel?: 'low' | 'medium' | 'high';
  /** Response style */
  style?: string;
  /** Follow-up strategy */
  followUpStrategy?: {
    /** Days to wait before follow-up */
    days: number;
    /** Maximum number of follow-ups */
    maxFollowUps: number;
    /** Whether to escalate messaging in follow-ups */
    escalate: boolean;
  };
  /** External API configurations */
  apiConfig?: {
    endpoint?: string;
    key?: string;
    model?: string;
    [key: string]: any;
  };
}

/**
 * AI Agent that handles outreach and lead engagement
 */
export class OutreachAgent extends AIAgent<
  OutreachAgentConfig,
  OutreachAgentOutput
> {
  /**
   * Create a new OutreachAgent
   *
   * @param id Agent ID
   * @param config Agent configuration
   * @param prisma Prisma client instance
   */
  constructor(id: string, config: OutreachAgentConfig, prisma: PrismaClient) {
    super(id, AgentType.OUTREACH_MANAGER, config, prisma);
  }

  /**
   * Execute outreach logic
   *
   * @param options Run options
   * @returns Generated outreach content
   */
  protected async execute(
    options: AgentRunOptions,
  ): Promise<OutreachAgentOutput> {
    // Log execution start with context
    this.log('info', 'Starting outreach generation', {
      targetAudience: this.config.targetAudience,
      personalizationLevel: this.config.personalizationLevel,
      context: options.context,
    });

    try {
      // Get task context if available
      const taskId = options.context?.taskId;
      let taskData = null;
      let leadInfo = options.context?.leadInfo;

      if (taskId) {
        taskData = await this.prisma.outreachTask.findUnique({
          where: { id: taskId },
          include: {
            campaign: {
              select: {
                name: true,
                goals: true,
                targeting: true,
              },
            },
          },
        });

        if (taskData) {
          leadInfo = taskData.leadInfo as Record<string, any>;
          this.log('info', 'Retrieved outreach task data', { taskData });
        }
      }

      if (!leadInfo) {
        throw new Error('No lead information provided for outreach');
      }

      // In a real implementation, this would call an LLM service or other AI APIs
      // For demo purposes, we'll simulate outreach generation

      // Add artificial delay to simulate processing
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Generate personalized outreach content
      const contactMethod =
        (taskData?.contactMethod as ContactMethod) || ContactMethod.EMAIL;
      const response = this.generateResponse(leadInfo, contactMethod);

      // Update the task in the database if a task ID was provided
      if (taskId) {
        await this.prisma.outreachTask.update({
          where: { id: taskId },
          data: {
            status: 'SCHEDULED',
            aiResponse: response,
            scheduledAt: new Date(Date.now() + 3600000), // Schedule for 1 hour from now
          },
        });

        this.log('info', 'Updated outreach task with generated response');
      }

      // Return the generated outreach output
      return {
        leadInfo,
        response,
        contactMethod: contactMethod.toString(),
        metadata: {
          personalizationLevel: this.config.personalizationLevel,
          generatedAt: new Date().toISOString(),
          taskId: taskId,
        },
      };
    } catch (error) {
      this.log('error', 'Outreach generation failed', { error });
      throw error;
    }
  }

  /**
   * Generate a personalized response for the lead
   * This is a placeholder for actual LLM integration
   */
  private generateResponse(
    leadInfo: Record<string, any>,
    contactMethod: ContactMethod,
  ): string {
    const name = leadInfo.name || 'valued prospect';
    const company = leadInfo.company ? ` at ${leadInfo.company}` : '';
    const personalizationLevel = this.config.personalizationLevel || 'medium';

    // Select template based on contact method
    let template = '';

    switch (contactMethod) {
      case ContactMethod.EMAIL:
        template = this.generateEmailTemplate(
          name,
          company,
          personalizationLevel,
        );
        break;
      case ContactMethod.LINKEDIN:
        template = this.generateLinkedInTemplate(
          name,
          company,
          personalizationLevel,
        );
        break;
      default:
        template = this.generateGenericTemplate(
          name,
          company,
          personalizationLevel,
        );
    }

    return template;
  }

  /**
   * Generate an email template
   */
  private generateEmailTemplate(
    name: string,
    company: string,
    personalizationLevel: string,
  ): string {
    // Base template with personalization
    let template = `Subject: Opportunity to revolutionize your marketing approach

Dear ${name}${company},

I hope this email finds you well. I recently came across your company and was impressed by your work in the industry.

Our AI-powered marketing platform has helped similar businesses achieve an average of 35% increase in conversion rates and a 28% reduction in customer acquisition costs.

I'd love to schedule a brief call to discuss how we could help you achieve similar results. Would you be available for a 15-minute conversation next week?

Looking forward to connecting,

The NeonHub Team`;

    // Add additional personalization based on level
    if (personalizationLevel === 'high') {
      template = template.replace(
        'I recently came across your company and was impressed by your work in the industry.',
        'I recently came across your company and was particularly impressed by your innovative approach to customer engagement and your recent expansion efforts.',
      );
    }

    return template;
  }

  /**
   * Generate a LinkedIn message template
   */
  private generateLinkedInTemplate(
    name: string,
    company: string,
    personalizationLevel: string,
  ): string {
    return `Hi ${name},

I noticed your work${company} and thought our AI marketing platform might be valuable for your growth goals. We've helped similar companies increase conversions by 35%.

Would you be open to a quick chat about how we could support your marketing efforts?

Best regards,
The NeonHub Team`;
  }

  /**
   * Generate a generic template for other contact methods
   */
  private generateGenericTemplate(
    name: string,
    company: string,
    personalizationLevel: string,
  ): string {
    return `Hello ${name},

I'm reaching out from NeonHub regarding our AI-powered marketing platform that could benefit your work${company}.

We'd love to discuss how our solution could help you achieve your marketing goals.

Best regards,
The NeonHub Team`;
  }
}
