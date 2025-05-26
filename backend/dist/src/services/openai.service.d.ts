export declare class OpenAIService {
    private openai;
    private defaultModel;
    constructor();
    generateContent(prompt: string, options?: {
        model?: string;
        maxTokens?: number;
        temperature?: number;
    }): Promise<{
        content: string;
        usage: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
        };
    }>;
    generateTrendAnalysis(data: any): Promise<any>;
}
