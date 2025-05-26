import { Server } from 'socket.io';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { getAgentManager } from '../agents';

export class WebSocketService {
  private io: Server;
  private prisma: PrismaClient;

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

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('subscribe-agent-updates', (agentId) => {
        socket.join(`agent-${agentId}`);
      });

      socket.on('unsubscribe-agent-updates', (agentId) => {
        socket.leave(`agent-${agentId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

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
