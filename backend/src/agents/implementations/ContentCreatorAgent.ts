import { PrismaClient, AIAgent, ContentType } from '@prisma/client';
import { BaseAgent } from '../base/BaseAgent';

interface ContentCreationConfig {
  contentType: ContentType;
  topic: string;
  targetAudience?: string;
  tone?: string;
  keywords?: string[];
  length?: number;
  campaignId?: string;
  promptTemplate?: string;
}

/**
 * Agent for creating content like social media posts, emails, etc.
 */
export class ContentCreatorAgent extends BaseAgent {
  constructor(prisma: PrismaClient, agentData: AIAgent) {
    super(prisma, agentData);
  }

  /**
   * Implementation of the content creation logic
   * @param config Content creation configuration
   * @returns The created content
   */
  protected async executeImpl(config: ContentCreationConfig): Promise<any> {
    // Log start of content creation
    await this.logMessage(`Starting content creation for ${config.topic}`);

    // Validate configuration
    if (!config.contentType) {
      throw new Error('Content type is required');
    }
    if (!config.topic) {
      throw new Error('Topic is required');
    }

    try {
      // In a real implementation, this would call OpenAI or Claude APIs
      // For now, we'll just simulate the content creation
      const content = await this.generateContent(config);

      // Store the generated content in the database
      const generatedContent = await this.prisma.generatedContent.create({
        data: {
          title: `${config.contentType} about ${config.topic}`,
          content: content,
          contentType: config.contentType,
          status: 'DRAFT',
          aiAgentId: this.agentData.id,
          metadata: config as any,
          ...(config.campaignId ? { campaignId: config.campaignId } : {}),
        },
      });

      await this.logMessage(
        `Content created successfully with ID: ${generatedContent.id}`,
      );

      return {
        status: 'success',
        contentId: generatedContent.id,
        content: generatedContent,
      };
    } catch (error) {
      await this.logMessage(
        `Error creating content: ${error instanceof Error ? error.message : String(error)}`,
        'error',
      );
      throw error;
    }
  }

  /**
   * Simulate content generation (would call AI API in real implementation)
   * @param config Content creation configuration
   * @returns Generated content
   */
  private async generateContent(
    config: ContentCreationConfig,
  ): Promise<string> {
    // Check if agent should stop
    if (this.checkShouldStop()) {
      throw new Error('Content creation was stopped');
    }

    await this.logMessage('Generating content...');

    // Simulate API call and processing time
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Generate different content based on type
    switch (config.contentType) {
      case 'SOCIAL_POST':
        return this.generateSocialPost(config);
      case 'EMAIL':
        return this.generateEmail(config);
      case 'BLOG_POST':
        return this.generateBlogPost(config);
      default:
        return `Placeholder content about ${config.topic} for ${config.contentType}`;
    }
  }

  private generateSocialPost(config: ContentCreationConfig): string {
    const { topic, tone = 'professional', keywords = [] } = config;
    const hashtagsStr = keywords
      .map((k) => `#${k.replace(/\s+/g, '')}`)
      .join(' ');

    return `📣 Exciting insights about ${topic}!

${this.getSimulatedContentParagraph(topic, 1, tone)}

${hashtagsStr}

Learn more at our website! 🚀`;
  }

  private generateEmail(config: ContentCreationConfig): string {
    const {
      topic,
      tone = 'professional',
      targetAudience = 'customers',
    } = config;

    return `Subject: Important Update: ${topic}

Dear Valued ${targetAudience},

I hope this email finds you well. 

${this.getSimulatedContentParagraph(topic, 1, tone)}

${this.getSimulatedContentParagraph(topic, 2, tone)}

Please don't hesitate to reach out if you have any questions.

Best regards,
The NeonHub Team`;
  }

  private generateBlogPost(config: ContentCreationConfig): string {
    const { topic, tone = 'professional', length = 3 } = config;

    let content = `# ${topic.charAt(0).toUpperCase() + topic.slice(1)}: A Comprehensive Guide\n\n`;

    for (let i = 1; i <= length; i++) {
      content += `## ${this.getSimulatedHeading(topic, i)}\n\n`;
      content += `${this.getSimulatedContentParagraph(topic, i, tone)}\n\n`;
      content += `${this.getSimulatedContentParagraph(topic, i + 10, tone)}\n\n`;
    }

    content += `## Conclusion\n\n`;
    content += `${this.getSimulatedContentParagraph('conclusion about ' + topic, 20, tone)}`;

    return content;
  }

  /**
   * Generate simulated paragraph content
   */
  private getSimulatedContentParagraph(
    topic: string,
    seed: number,
    tone: string,
  ): string {
    const toneAdjectives: Record<string, string[]> = {
      professional: [
        'valuable',
        'effective',
        'strategic',
        'insightful',
        'practical',
      ],
      casual: ['awesome', 'cool', 'fantastic', 'amazing', 'great'],
      humorous: ['hilarious', 'funny', 'entertaining', 'amusing', 'comical'],
      formal: [
        'significant',
        'substantial',
        'noteworthy',
        'considerable',
        'remarkable',
      ],
    };

    const adjectives = toneAdjectives[tone] || toneAdjectives.professional;
    const adjective = adjectives[seed % adjectives.length];

    return `This is a ${adjective} simulated paragraph about ${topic}. In a real implementation, this would be generated by an AI language model like OpenAI's GPT or Anthropic's Claude. The content would be tailored to the specific topic, tone, and target audience as specified in the agent configuration.`;
  }

  /**
   * Generate simulated heading
   */
  private getSimulatedHeading(topic: string, seed: number): string {
    const headings = [
      `Understanding ${topic}`,
      `The Benefits of ${topic}`,
      `How to Implement ${topic}`,
      `${topic} Best Practices`,
      `The Future of ${topic}`,
      `${topic} Case Studies`,
      `Common ${topic} Mistakes to Avoid`,
    ];

    return headings[seed % headings.length];
  }
}
