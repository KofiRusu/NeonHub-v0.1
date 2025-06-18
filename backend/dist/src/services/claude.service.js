'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.ClaudeService = void 0;
const sdk_1 = __importDefault(require('@anthropic-ai/sdk'));
class ClaudeService {
  constructor() {
    this.defaultModel = 'claude-3-sonnet-20240229';
    this.anthropic = new sdk_1.default({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  async generateContent(prompt, options = {}) {
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
  async generateAnalysis(context, data) {
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
exports.ClaudeService = ClaudeService;
