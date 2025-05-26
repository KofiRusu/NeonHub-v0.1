export interface AgentLogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
}

export interface AgentExecutionResult {
  status: 'success' | 'error';
  data?: any;
  error?: Error;
  campaignId?: string;
  executionTime?: number;
  sessionId?: string;
}

export type AgentResult = AgentExecutionResult;

export interface AgentExecutionOptions {
  config?: Record<string, any>;
  campaignId?: string;
  trackMetrics?: boolean;
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
}

export interface AgentMetrics {
  executionTime: number;
  success: boolean;
  tokenUsage?: {
    input: number;
    output: number;
    total: number;
  };
}
