import { PrismaClient } from '@prisma/client';
export declare enum AgentSocketEvents {
  AGENT_STARTED = 'agent:started',
  AGENT_COMPLETED = 'agent:completed',
  AGENT_FAILED = 'agent:failed',
  AGENT_PROGRESS = 'agent:progress',
  AGENT_PAUSED = 'agent:paused',
  AGENT_RESUMED = 'agent:resumed',
  SCHEDULER_STATUS = 'scheduler:status',
}
export interface AgentProgressData {
  agentId: string;
  jobId?: string;
  progress: number;
  message?: string;
  currentStep?: string;
  totalSteps?: number;
  timestamp: string;
}
export interface AgentEventData {
  agentId: string;
  jobId?: string;
  status: string;
  message?: string;
  error?: string;
  duration?: number;
  timestamp: string;
}
export declare class WebSocketService {
  private io;
  private prisma;
  private static instance;
  constructor(httpServer: any, prisma: PrismaClient);
  static getInstance(httpServer?: any, prisma?: PrismaClient): WebSocketService;
  setupEventHandlers(): void;
  emitAgentStarted(agentId: string, jobId?: string): void;
  emitAgentCompleted(agentId: string, jobId?: string, duration?: number): void;
  emitAgentFailed(agentId: string, error: string, jobId?: string): void;
  emitAgentProgress(
    agentId: string,
    progress: number,
    message?: string,
    currentStep?: string,
    totalSteps?: number,
  ): void;
  emitAgentPaused(agentId: string, jobId?: string): void;
  emitAgentResumed(agentId: string, jobId?: string): void;
  emitSchedulerStatus(stats: any): void;
  emitAgentStatusUpdate(agentId: string, status: any): void;
  emitAgentExecutionLog(agentId: string, log: any): void;
  emitCampaignUpdate(campaignId: string, update: any): void;
}
