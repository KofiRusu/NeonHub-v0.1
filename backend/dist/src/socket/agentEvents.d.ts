import { Server as SocketIOServer } from 'socket.io';
export declare enum AgentEventType {
  AGENT_STARTED = 'agent:started',
  AGENT_COMPLETED = 'agent:completed',
  AGENT_FAILED = 'agent:failed',
  AGENT_PROGRESS = 'agent:progress',
  AGENT_SCHEDULED = 'agent:scheduled',
}
export interface AgentStartedEvent {
  agentId: string;
  sessionId: string;
  timestamp: Date;
  scheduledBy: 'cron' | 'manual';
}
export interface AgentCompletedEvent {
  agentId: string;
  sessionId: string;
  timestamp: Date;
  duration: number;
  result: any;
}
export interface AgentFailedEvent {
  agentId: string;
  sessionId: string;
  timestamp: Date;
  error: string;
  retryCount: number;
  willRetry: boolean;
}
export interface AgentProgressEvent {
  agentId: string;
  sessionId: string;
  timestamp: Date;
  progress: number;
  message: string;
}
export interface AgentScheduledEvent {
  agentId: string;
  cronExpression: string;
  nextRunAt: Date;
  enabled: boolean;
}
/**
 * Initialize agent event handlers for Socket.IO
 */
export declare function initializeAgentEvents(io: SocketIOServer): void;
/**
 * Emit a custom agent event
 */
export declare function emitAgentEvent(
  io: SocketIOServer,
  event: string,
  data: any,
): void;
