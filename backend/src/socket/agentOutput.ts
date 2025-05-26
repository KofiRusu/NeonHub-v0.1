import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { AgentLogEntry } from '../agents/base/types';

/**
 * Configure Socket.io for agent real-time output
 * @param httpServer The HTTP server to attach Socket.io to
 * @param prisma Prisma client for database operations
 * @returns Configured Socket.io server
 */
export function configureAgentSocket(
  httpServer: HttpServer,
  prisma: PrismaClient,
): SocketIOServer {
  // Create Socket.io server
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
  });

  // Create a namespace for agent events
  const agentNamespace = io.of('/agents');

  // Handle connections
  agentNamespace.on('connection', (socket) => {
    console.log('Client connected to agent namespace', socket.id);

    // Handle joining an agent room
    socket.on('join:agent', (agentId: string) => {
      if (!agentId) return;

      // Join the room for this specific agent
      socket.join(`agent:${agentId}`);
      console.log(`Client ${socket.id} joined agent room: ${agentId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected from agent namespace', socket.id);
    });
  });

  return io;
}

/**
 * Emit an agent start event
 * @param io Socket.io server
 * @param agentId ID of the agent
 * @param metadata Additional metadata about the execution
 */
export function emitAgentStart(
  io: SocketIOServer,
  agentId: string,
  metadata: {
    agentType: string;
    name: string;
    context?: Record<string, any>;
  },
): void {
  io.of('/agents')
    .to(`agent:${agentId}`)
    .emit('agent:start', {
      agentId,
      timestamp: new Date(),
      ...metadata,
    });
}

/**
 * Emit an agent log event
 * @param io Socket.io server
 * @param agentId ID of the agent
 * @param log Log entry to emit
 */
export function emitAgentLog(
  io: SocketIOServer,
  agentId: string,
  log: AgentLogEntry,
): void {
  io.of('/agents').to(`agent:${agentId}`).emit('agent:log', {
    agentId,
    log,
  });
}

/**
 * Emit an agent done event
 * @param io Socket.io server
 * @param agentId ID of the agent
 * @param result Result data
 */
export function emitAgentDone(
  io: SocketIOServer,
  agentId: string,
  result: {
    success: boolean;
    data?: any;
    metrics?: Record<string, any>;
    duration?: number;
  },
): void {
  io.of('/agents')
    .to(`agent:${agentId}`)
    .emit('agent:done', {
      agentId,
      timestamp: new Date(),
      ...result,
    });
}

/**
 * Emit an agent error event
 * @param io Socket.io server
 * @param agentId ID of the agent
 * @param error Error details
 */
export function emitAgentError(
  io: SocketIOServer,
  agentId: string,
  error: {
    message: string;
    stack?: string;
  },
): void {
  io.of('/agents').to(`agent:${agentId}`).emit('agent:error', {
    agentId,
    timestamp: new Date(),
    error,
  });
}

// Store a global reference to the Socket.io server
let _io: SocketIOServer | null = null;

/**
 * Get the Socket.io server instance
 * @returns Socket.io server instance
 */
export function getSocketIO(): SocketIOServer | null {
  return _io;
}

/**
 * Set the global Socket.io server instance
 * @param io Socket.io server instance
 */
export function setSocketIO(io: SocketIOServer): void {
  _io = io;
}
