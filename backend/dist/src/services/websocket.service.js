'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.WebSocketService = exports.AgentSocketEvents = void 0;
const socket_io_1 = require('socket.io');
var AgentSocketEvents;
(function (AgentSocketEvents) {
  AgentSocketEvents['AGENT_STARTED'] = 'agent:started';
  AgentSocketEvents['AGENT_COMPLETED'] = 'agent:completed';
  AgentSocketEvents['AGENT_FAILED'] = 'agent:failed';
  AgentSocketEvents['AGENT_PROGRESS'] = 'agent:progress';
  AgentSocketEvents['AGENT_PAUSED'] = 'agent:paused';
  AgentSocketEvents['AGENT_RESUMED'] = 'agent:resumed';
  AgentSocketEvents['SCHEDULER_STATUS'] = 'scheduler:status';
})(AgentSocketEvents || (exports.AgentSocketEvents = AgentSocketEvents = {}));
class WebSocketService {
  constructor(httpServer, prisma) {
    this.io = new socket_io_1.Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });
    this.prisma = prisma;
    this.setupEventHandlers();
  }
  static getInstance(httpServer, prisma) {
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
  emitAgentStarted(agentId, jobId) {
    const data = {
      agentId,
      jobId,
      status: 'started',
      timestamp: new Date().toISOString(),
    };
    this.io.to(`agent-${agentId}`).emit(AgentSocketEvents.AGENT_STARTED, data);
  }
  emitAgentCompleted(agentId, jobId, duration) {
    const data = {
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
  emitAgentFailed(agentId, error, jobId) {
    const data = {
      agentId,
      jobId,
      status: 'failed',
      error,
      timestamp: new Date().toISOString(),
    };
    this.io.to(`agent-${agentId}`).emit(AgentSocketEvents.AGENT_FAILED, data);
  }
  emitAgentProgress(agentId, progress, message, currentStep, totalSteps) {
    const data = {
      agentId,
      progress,
      message,
      currentStep,
      totalSteps,
      timestamp: new Date().toISOString(),
    };
    this.io.to(`agent-${agentId}`).emit(AgentSocketEvents.AGENT_PROGRESS, data);
  }
  emitAgentPaused(agentId, jobId) {
    const data = {
      agentId,
      jobId,
      status: 'paused',
      timestamp: new Date().toISOString(),
    };
    this.io.to(`agent-${agentId}`).emit(AgentSocketEvents.AGENT_PAUSED, data);
  }
  emitAgentResumed(agentId, jobId) {
    const data = {
      agentId,
      jobId,
      status: 'resumed',
      timestamp: new Date().toISOString(),
    };
    this.io.to(`agent-${agentId}`).emit(AgentSocketEvents.AGENT_RESUMED, data);
  }
  emitSchedulerStatus(stats) {
    this.io.to('scheduler-updates').emit(AgentSocketEvents.SCHEDULER_STATUS, {
      stats,
      timestamp: new Date().toISOString(),
    });
  }
  // Legacy methods for backward compatibility
  emitAgentStatusUpdate(agentId, status) {
    this.io.to(`agent-${agentId}`).emit('agent-status-update', {
      agentId,
      status,
      timestamp: new Date().toISOString(),
    });
  }
  emitAgentExecutionLog(agentId, log) {
    this.io.to(`agent-${agentId}`).emit('agent-log', {
      agentId,
      log,
      timestamp: new Date().toISOString(),
    });
  }
  emitCampaignUpdate(campaignId, update) {
    this.io.emit('campaign-update', {
      campaignId,
      update,
      timestamp: new Date().toISOString(),
    });
  }
}
exports.WebSocketService = WebSocketService;
