import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { AgentManager } from '../agents/manager/AgentManager';
import { AgentScheduler } from '../agents/scheduler/AgentScheduler';
import { AgentEvent } from '../agents/base/BaseAgent';
/**
 * WebSocket service for real-time agent status updates
 */
export declare class AgentStatusSocket {
    private io;
    private prisma;
    private agentManager;
    private agentScheduler;
    private statusUpdateInterval;
    private connectedClients;
    constructor(io: SocketIOServer, prisma: PrismaClient, agentManager: AgentManager, agentScheduler: AgentScheduler);
    /**
     * Setup socket event handlers
     */
    private setupSocketHandlers;
    /**
     * Send initial status to a newly connected client
     */
    private sendInitialStatus;
    /**
     * Send agent status to a specific socket
     */
    private sendAgentStatus;
    /**
     * Send scheduler status to a specific socket
     */
    private sendSchedulerStatus;
    /**
     * Broadcast agent status update to all subscribed clients
     */
    broadcastAgentStatusUpdate(agentId: string): Promise<void>;
    /**
     * Broadcast agent event to subscribed clients
     */
    broadcastAgentEvent(agentId: string, event: AgentEvent): void;
    /**
     * Broadcast scheduler status update
     */
    broadcastSchedulerStatusUpdate(): void;
    /**
     * Broadcast global system event
     */
    broadcastSystemEvent(event: {
        type: string;
        message: string;
        data?: any;
        level: 'info' | 'warning' | 'error';
    }): void;
    /**
     * Start periodic status broadcasts
     */
    private startStatusBroadcast;
    /**
     * Stop periodic status broadcasts
     */
    stopStatusBroadcast(): void;
    /**
     * Broadcast periodic status updates
     */
    private broadcastPeriodicUpdates;
    /**
     * Get connected clients count
     */
    getConnectedClientsCount(): number;
    /**
     * Get socket server instance
     */
    getSocketServer(): SocketIOServer;
    /**
     * Cleanup resources
     */
    cleanup(): void;
}
