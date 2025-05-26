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
export declare function configureAgentSocket(httpServer: HttpServer, prisma: PrismaClient): SocketIOServer;
/**
 * Emit an agent start event
 * @param io Socket.io server
 * @param agentId ID of the agent
 * @param metadata Additional metadata about the execution
 */
export declare function emitAgentStart(io: SocketIOServer, agentId: string, metadata: {
    agentType: string;
    name: string;
    context?: Record<string, any>;
}): void;
/**
 * Emit an agent log event
 * @param io Socket.io server
 * @param agentId ID of the agent
 * @param log Log entry to emit
 */
export declare function emitAgentLog(io: SocketIOServer, agentId: string, log: AgentLogEntry): void;
/**
 * Emit an agent done event
 * @param io Socket.io server
 * @param agentId ID of the agent
 * @param result Result data
 */
export declare function emitAgentDone(io: SocketIOServer, agentId: string, result: {
    success: boolean;
    data?: any;
    metrics?: Record<string, any>;
    duration?: number;
}): void;
/**
 * Emit an agent error event
 * @param io Socket.io server
 * @param agentId ID of the agent
 * @param error Error details
 */
export declare function emitAgentError(io: SocketIOServer, agentId: string, error: {
    message: string;
    stack?: string;
}): void;
/**
 * Get the Socket.io server instance
 * @returns Socket.io server instance
 */
export declare function getSocketIO(): SocketIOServer | null;
/**
 * Set the global Socket.io server instance
 * @param io Socket.io server instance
 */
export declare function setSocketIO(io: SocketIOServer): void;
