import { Server } from 'socket.io';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { getAgentManager } from '../agents';

export enum AgentSocketEvents {
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
  progress: number; // 0-100
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

export class WebSocketService {
  private io: Server;
  private prisma: PrismaClient;
  private static instance: WebSocketService;

  constructor(httpServer: any, prisma: PrismaClient) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });
    this.prisma = prisma;
    this.setupEventHandlers();
  }

  static getInstance(
    httpServer?: any,
    prisma?: PrismaClient,
  ): WebSocketService {
    if (!WebSocketService.instance) {
      if (!httpServer || !prisma) {
        throw new Error(
          'HTTP server and Prisma client required for first initialization',
        );
      }
      WebSocketService.instance = new WebSocketService(httpServer, prisma);
    }
    return WebSocketService.instance;
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('subscribe-agent-updates', (agentId) => {
        socket.join(`agent-${agentId}`);
      });

      socket.on('unsubscribe-agent-updates', (agentId) => {
        socket.leave(`agent-${agentId}`);
      });

      socket.on('subscribe-scheduler-updates', () => {
        socket.join('scheduler-updates');
      });

      socket.on('unsubscribe-scheduler-updates', () => {
        socket.leave('scheduler-updates');
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // Agent execution events
  emitAgentStarted(agentId: string, jobId?: string) {
    const data: AgentEventData = {
      agentId,
      jobId,
      status: 'started',
      timestamp: new Date().toISOString(),
    };
    this.io.to(`agent-${agentId}`).emit(AgentSocketEvents.AGENT_STARTED, data);
  }

  emitAgentCompleted(agentId: string, jobId?: string, duration?: number) {
    const data: AgentEventData = {
      agentId,
      jobId,
      status: 'completed',
      duration,
      timestamp: new Date().toISOString(),
    };
    this.io
      .to(`agent-${agentId}`)
      .emit(AgentSocketEvents.AGENT_COMPLETED, data);
  }

  emitAgentFailed(agentId: string, error: string, jobId?: string) {
    const data: AgentEventData = {
      agentId,
      jobId,
      status: 'failed',
      error,
      timestamp: new Date().toISOString(),
    };
    this.io.to(`agent-${agentId}`).emit(AgentSocketEvents.AGENT_FAILED, data);
  }

  emitAgentProgress(
    agentId: string,
    progress: number,
    message?: string,
    currentStep?: string,
    totalSteps?: number,
  ) {
    const data: AgentProgressData = {
      agentId,
      progress,
      message,
      currentStep,
      totalSteps,
      timestamp: new Date().toISOString(),
    };
    this.io.to(`agent-${agentId}`).emit(AgentSocketEvents.AGENT_PROGRESS, data);
  }

  emitAgentPaused(agentId: string, jobId?: string) {
    const data: AgentEventData = {
      agentId,
      jobId,
      status: 'paused',
      timestamp: new Date().toISOString(),
    };
    this.io.to(`agent-${agentId}`).emit(AgentSocketEvents.AGENT_PAUSED, data);
  }

  emitAgentResumed(agentId: string, jobId?: string) {
    const data: AgentEventData = {
      agentId,
      jobId,
      status: 'resumed',
      timestamp: new Date().toISOString(),
    };
    this.io.to(`agent-${agentId}`).emit(AgentSocketEvents.AGENT_RESUMED, data);
  }

  emitSchedulerStatus(stats: any) {
    this.io.to('scheduler-updates').emit(AgentSocketEvents.SCHEDULER_STATUS, {
      stats,
      timestamp: new Date().toISOString(),
    });
  }

  // Legacy methods for backward compatibility
  emitAgentStatusUpdate(agentId: string, status: any) {
    this.io.to(`agent-${agentId}`).emit('agent-status-update', {
      agentId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  emitAgentExecutionLog(agentId: string, log: any) {
    this.io.to(`agent-${agentId}`).emit('agent-log', {
      agentId,
      log,
      timestamp: new Date().toISOString(),
    });
  }

  emitCampaignUpdate(campaignId: string, update: any) {
    this.io.emit('campaign-update', {
      campaignId,
      update,
      timestamp: new Date().toISOString(),
    });
  }
}
