"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIService = void 0;
const openai_1 = __importDefault(require("openai"));
class OpenAIService {
    openai;
    defaultModel = 'gpt-4';
    constructor() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    async generateContent(prompt, options = {}) {
        try {
            const response = await this.openai.chat.completions.create({
                model: options.model || this.defaultModel,
                messages: [{ role: 'user', content: prompt }],
                max_tokens: options.maxTokens || 2000,
                temperature: options.temperature || 0.7,
            });
            return {
                content: response.choices[0].message.content || '',
                usage: {
                    promptTokens: response.usage?.prompt_tokens || 0,
                    completionTokens: response.usage?.completion_tokens || 0,
                    totalTokens: response.usage?.total_tokens || 0,
                },
            };
        }
        catch (error) {
            console.error('OpenAI API Error:', error);
            throw new Error(`OpenAI generation failed: ${error}`);
        }
    }
    async generateTrendAnalysis(data) {
        const prompt = `Analyze the following data for marketing trends and insights:
${JSON.stringify(data, null, 2)}

Provide:
1. Key trends identified
2. Confidence scores (0-1)
3. Recommended actions
4. Market implications

Response as JSON.`;
        const result = await this.generateContent(prompt, { maxTokens: 1500 });
        return {
            analysis: JSON.parse(result.content),
            tokensUsed: result.usage,
        };
    }
}
exports.OpenAIService = OpenAIService;
//# sourceMappingURL=openai.service.js.map