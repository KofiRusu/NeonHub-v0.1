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
    costPerToken = {
        'gpt-4': { input: 0.00003, output: 0.00006 },
        'gpt-4-turbo': { input: 0.00001, output: 0.00003 },
        'gpt-3.5-turbo': { input: 0.0000005, output: 0.0000015 },
    };
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is required');
        }
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    async generateContent(prompt, options = {}) {
        try {
            const model = options.model || this.defaultModel;
            const messages = [];
            if (options.systemPrompt) {
                messages.push({ role: 'system', content: options.systemPrompt });
            }
            messages.push({ role: 'user', content: prompt });
            const response = await this.openai.chat.completions.create({
                model,
                messages,
                max_tokens: options.maxTokens || 2000,
                temperature: options.temperature || 0.7,
            });
            const choice = response.choices[0];
            const usage = response.usage;
            if (!choice?.message?.content || !usage) {
                throw new Error('Invalid response from OpenAI API');
            }
            const openAIUsage = {
                promptTokens: usage.prompt_tokens,
                completionTokens: usage.completion_tokens,
                totalTokens: usage.total_tokens,
                estimatedCost: this.calculateCost(model, usage.prompt_tokens, usage.completion_tokens),
            };
            return {
                content: choice.message.content,
                usage: openAIUsage,
                model,
                finishReason: choice.finish_reason,
            };
        }
        catch (error) {
            console.error('OpenAI API Error:', error);
            if (error instanceof Error) {
                throw new Error(`OpenAI generation failed: ${error.message}`);
            }
            throw new Error('OpenAI generation failed: Unknown error');
        }
    }
    async generateTrendAnalysis(data, context) {
        const systemPrompt = `You are an AI marketing trend analyst. Analyze the provided data and return insights in JSON format with the following structure:
{
  "trends": [
    {
      "title": "Trend name",
      "description": "Detailed description",
      "confidence": 0.85,
      "impact": "HIGH|MEDIUM|LOW",
      "timeframe": "SHORT|MEDIUM|LONG",
      "recommendations": ["Action 1", "Action 2"]
    }
  ],
  "marketInsights": {
    "opportunities": ["Opportunity 1", "Opportunity 2"],
    "threats": ["Threat 1", "Threat 2"],
    "emergingPatterns": ["Pattern 1", "Pattern 2"]
  },
  "actionableTasks": [
    {
      "task": "Task description",
      "priority": "HIGH|MEDIUM|LOW",
      "effort": "LOW|MEDIUM|HIGH",
      "impact": "LOW|MEDIUM|HIGH"
    }
  ]
}`;
        const prompt = `${context ? `Context: ${context}\n\n` : ''}Analyze the following marketing data for trends and insights:

${JSON.stringify(data, null, 2)}

Focus on:
1. Emerging trends and patterns
2. Market opportunities and threats
3. Consumer behavior shifts
4. Competitive landscape changes
5. Actionable recommendations

Provide analysis in the specified JSON format.`;
        const result = await this.generateContent(prompt, {
            maxTokens: 2500,
            systemPrompt,
            temperature: 0.3, // Lower temperature for more consistent analysis
        });
        try {
            const analysis = JSON.parse(result.content);
            return {
                analysis,
                usage: result.usage,
            };
        }
        catch (parseError) {
            console.error('Failed to parse OpenAI response as JSON:', parseError);
            throw new Error('Failed to parse trend analysis response');
        }
    }
    async generateMarketingContent(config) {
        const systemPrompt = `You are an expert marketing content creator. Create high-quality, engaging content that converts. Always include:
- Clear value proposition
- Benefit-focused language
- Appropriate tone and style
- SEO optimization when applicable
- Strong call-to-action when requested`;
        const lengthGuide = {
            short: { words: '50-150', readTime: '30 seconds' },
            medium: { words: '200-500', readTime: '1-2 minutes' },
            long: { words: '600-1500', readTime: '3-6 minutes' },
        };
        const prompt = `Create ${config.contentType.replace('_', ' ')} content with these specifications:

Topic: ${config.topic}
Target Audience: ${config.targeting}
Tone: ${config.tone}
Length: ${config.length} (${lengthGuide[config.length].words} words)
${config.keywords ? `Keywords to include: ${config.keywords.join(', ')}` : ''}
${config.callToAction ? `Call to Action: ${config.callToAction}` : ''}

Requirements:
1. Engaging headline/title
2. Clear value proposition
3. Benefit-focused content
4. ${config.tone} tone throughout
5. Optimized for ${config.targeting}
${config.callToAction ? '6. Strong call-to-action' : ''}

Format the response as JSON:
{
  "title": "Engaging title",
  "content": "Main content body",
  "summary": "Brief summary",
  "tags": ["tag1", "tag2", "tag3"]
}`;
        const result = await this.generateContent(prompt, {
            maxTokens: this.getMaxTokensForLength(config.length),
            systemPrompt,
            temperature: 0.7,
        });
        try {
            const parsed = JSON.parse(result.content);
            const wordCount = this.countWords(parsed.content);
            const estimatedReadTime = this.calculateReadTime(wordCount);
            return {
                content: result.content,
                metadata: {
                    wordCount,
                    estimatedReadTime,
                    seoScore: config.keywords
                        ? this.calculateSEOScore(parsed.content, config.keywords)
                        : undefined,
                },
                usage: result.usage,
            };
        }
        catch (parseError) {
            console.error('Failed to parse content generation response:', parseError);
            // Return raw content if JSON parsing fails
            const wordCount = this.countWords(result.content);
            return {
                content: result.content,
                metadata: {
                    wordCount,
                    estimatedReadTime: this.calculateReadTime(wordCount),
                },
                usage: result.usage,
            };
        }
    }
    async generatePersonalizedOutreach(config) {
        const systemPrompt = `You are an expert in personalized outreach and relationship building. Create compelling, personalized messages that feel genuine and build real connections. Focus on value and mutual benefit.`;
        const prompt = `Create a personalized ${config.outreachType.replace('_', ' ')} message with these details:

Lead Information:
- Name: ${config.leadInfo.name}
${config.leadInfo.company ? `- Company: ${config.leadInfo.company}` : ''}
${config.leadInfo.industry ? `- Industry: ${config.leadInfo.industry}` : ''}
${config.leadInfo.role ? `- Role: ${config.leadInfo.role}` : ''}
${config.leadInfo.interests ? `- Interests: ${config.leadInfo.interests.join(', ')}` : ''}

Value Proposition: ${config.value_proposition}
Call to Action: ${config.call_to_action}
Tone: ${config.tone}

Requirements:
1. Highly personalized to the lead
2. Clear value proposition
3. Specific and relevant
4. ${config.tone} tone
5. Brief and impactful
6. Strong but not pushy CTA

${config.outreachType === 'cold_email' ? 'Include both subject line and email body.' : 'Provide the message content.'}

Format as JSON:
${config.outreachType === 'cold_email'
            ? '{"subject": "Email subject", "content": "Email body"}'
            : '{"content": "Message content"}'}`;
        const result = await this.generateContent(prompt, {
            maxTokens: 800,
            systemPrompt,
            temperature: 0.8, // Higher creativity for personalization
        });
        try {
            const parsed = JSON.parse(result.content);
            return {
                ...parsed,
                usage: result.usage,
            };
        }
        catch (parseError) {
            console.error('Failed to parse outreach response:', parseError);
            return {
                content: result.content,
                usage: result.usage,
            };
        }
    }
    calculateCost(model, promptTokens, completionTokens) {
        const costs = this.costPerToken[model];
        if (!costs)
            return 0;
        return promptTokens * costs.input + completionTokens * costs.output;
    }
    getMaxTokensForLength(length) {
        switch (length) {
            case 'short':
                return 300;
            case 'medium':
                return 800;
            case 'long':
                return 2000;
            default:
                return 800;
        }
    }
    countWords(text) {
        return text.trim().split(/\s+/).length;
    }
    calculateReadTime(wordCount) {
        const wordsPerMinute = 200;
        const minutes = Math.ceil(wordCount / wordsPerMinute);
        return minutes === 1 ? '1 minute' : `${minutes} minutes`;
    }
    calculateSEOScore(content, keywords) {
        let score = 0;
        const contentLower = content.toLowerCase();
        keywords.forEach((keyword) => {
            const keywordLower = keyword.toLowerCase();
            const occurrences = (contentLower.match(new RegExp(keywordLower, 'g')) || []).length;
            if (occurrences > 0) {
                score += Math.min(occurrences * 10, 30); // Max 30 points per keyword
            }
        });
        return Math.min(score, 100); // Cap at 100
    }
    // Health check method
    async testConnection() {
        try {
            const result = await this.generateContent('Hello', { maxTokens: 10 });
            return result.content.length > 0;
        }
        catch (error) {
            console.error('OpenAI connection test failed:', error);
            return false;
        }
    }
}
exports.OpenAIService = OpenAIService;
//# sourceMappingURL=openai.service.js.map