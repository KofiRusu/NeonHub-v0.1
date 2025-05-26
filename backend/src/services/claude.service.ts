import Anthropic from '@anthropic-ai/sdk';

export class ClaudeService {
  private anthropic: Anthropic;
  private defaultModel = 'claude-3-sonnet-20240229';

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateContent(
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
    } = {},
  ): Promise<{
    content: string;
    usage: {
      inputTokens: number;
      outputTokens: number;
    };
  }> {
    try {
      const response = await this.anthropic.messages.create({
        model: options.model || this.defaultModel,
        max_tokens: options.maxTokens || 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      return {
        content:
          response.content[0].type === 'text' ? response.content[0].text : '',
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
        },
      };
    } catch (error) {
      console.error('Claude API Error:', error);
      throw new Error(`Claude generation failed: ${error}`);
    }
  }

  async generateAnalysis(context: string, data: any): Promise<any> {
    const prompt = `${context}

Data to analyze:
${JSON.stringify(data, null, 2)}

Provide detailed analysis with actionable insights in JSON format.`;

    const result = await this.generateContent(prompt, { maxTokens: 1500 });
    return {
      analysis: JSON.parse(result.content),
      tokensUsed: result.usage,
    };
  }
}
