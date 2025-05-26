export declare class ClaudeService {
    private anthropic;
    private defaultModel;
    constructor();
    generateContent(prompt: string, options?: {
        model?: string;
        maxTokens?: number;
    }): Promise<{
        content: string;
        usage: {
            inputTokens: number;
            outputTokens: number;
        };
    }>;
    generateAnalysis(context: string, data: any): Promise<any>;
}
