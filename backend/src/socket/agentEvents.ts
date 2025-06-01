import { Server as SocketIOServer } from 'socket.io';
import { schedulerSingleton } from '../services/schedulerSingleton';
import { logger } from '../utils/logger';

// Event types
export enum AgentEventType {
  AGENT_STARTED = 'agent:started',
  AGENT_COMPLETED = 'agent:completed',
  AGENT_FAILED = 'agent:failed',
  AGENT_PROGRESS = 'agent:progress',
  AGENT_SCHEDULED = 'agent:scheduled',
}

// Event payload interfaces
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
export function initializeAgentEvents(io: SocketIOServer): void {
  // TODO: AgentScheduler doesn't currently extend EventEmitter
  // The event handling would need to be implemented differently
  // For now, we'll just log that the events are initialized

  logger.info(
    'Agent WebSocket events initialized (event listeners not yet implemented)',
  );

  // The following code is commented out until AgentScheduler supports events:
  /*
  const scheduler = schedulerSingleton.getScheduler();

  // Agent started event
  scheduler.on('agentStarted', (data: AgentStartedEvent) => {
    logger.info(`Broadcasting agent started event: ${data.agentId}`);
    io.emit(AgentEventType.AGENT_STARTED, data);
  });

  // Agent completed event
  scheduler.on('agentCompleted', (data: AgentCompletedEvent) => {
    logger.info(`Broadcasting agent completed event: ${data.agentId}`);
    io.emit(AgentEventType.AGENT_COMPLETED, data);
  });

  // Agent failed event
  scheduler.on('agentFailed', (data: AgentFailedEvent) => {
    logger.info(`Broadcasting agent failed event: ${data.agentId}`);
    io.emit(AgentEventType.AGENT_FAILED, data);
  });

  // Agent progress event
  scheduler.on('agentProgress', (data: AgentProgressEvent) => {
    logger.debug(
      `Broadcasting agent progress event: ${data.agentId} - ${data.progress}%`,
    );
    io.emit(AgentEventType.AGENT_PROGRESS, data);
  });

  // Agent scheduled event
  scheduler.on('agentScheduled', (data: AgentScheduledEvent) => {
    logger.info(`Broadcasting agent scheduled event: ${data.agentId}`);
    io.emit(AgentEventType.AGENT_SCHEDULED, data);
  });
  */
}

/**
 * Emit a custom agent event
 */
export function emitAgentEvent(
  io: SocketIOServer,
  event: string,
  data: any,
): void {
  io.emit(event, data);
}
