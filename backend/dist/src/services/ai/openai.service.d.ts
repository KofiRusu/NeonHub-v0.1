export interface OpenAIUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost?: number;
}
export interface OpenAIResponse {
    content: string;
    usage: OpenAIUsage;
    model: string;
    finishReason: string | null;
}
export declare class OpenAIService {
    private openai;
    private defaultModel;
    private costPerToken;
    constructor();
    generateContent(prompt: string, options?: {
        model?: string;
        maxTokens?: number;
        temperature?: number;
        systemPrompt?: string;
    }): Promise<OpenAIResponse>;
    generateTrendAnalysis(data: any, context?: string): Promise<{
        analysis: any;
        usage: OpenAIUsage;
    }>;
    generateMarketingContent(config: {
        contentType: 'blog_post' | 'social_post' | 'email' | 'ad_copy' | 'landing_page';
        topic: string;
        targetAudience: string;
        tone: 'professional' | 'casual' | 'friendly' | 'authoritative' | 'conversational';
        length: 'short' | 'medium' | 'long';
        keywords?: string[];
        callToAction?: string;
    }): Promise<{
        content: string;
        metadata: {
            wordCount: number;
            estimatedReadTime: string;
            seoScore?: number;
        };
        usage: OpenAIUsage;
    }>;
    generatePersonalizedOutreach(config: {
        leadInfo: {
            name: string;
            company?: string;
            industry?: string;
            role?: string;
            interests?: string[];
        };
        outreachType: 'cold_email' | 'follow_up' | 'social_outreach' | 'partnership';
        value_proposition: string;
        call_to_action: string;
        tone: 'formal' | 'casual' | 'friendly';
    }): Promise<{
        subject?: string;
        content: string;
        usage: OpenAIUsage;
    }>;
    private calculateCost;
    private getMaxTokensForLength;
    private countWords;
    private calculateReadTime;
    private calculateSEOScore;
    testConnection(): Promise<boolean>;
}
