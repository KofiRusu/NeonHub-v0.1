'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.AgentStatusSocket = void 0;
/**
 * WebSocket service for real-time agent status updates
 */
class AgentStatusSocket {
  constructor(io, prisma, agentManager, agentScheduler) {
    this.statusUpdateInterval = null;
    this.connectedClients = new Set();
    this.io = io;
    this.prisma = prisma;
    this.agentManager = agentManager;
    this.agentScheduler = agentScheduler;
    this.setupSocketHandlers();
    this.startStatusBroadcast();
  }
  /**
   * Setup socket event handlers
   */
  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      this.connectedClients.add(socket.id);
      // Send initial status when client connects
      this.sendInitialStatus(socket);
      // Handle agent status subscription
      socket.on('subscribe:agent:status', (agentId) => {
        socket.join(`agent:${agentId}`);
        this.sendAgentStatus(socket, agentId);
      });
      // Handle agent status unsubscription
      socket.on('unsubscribe:agent:status', (agentId) => {
        socket.leave(`agent:${agentId}`);
      });
      // Handle scheduler status subscription
      socket.on('subscribe:scheduler:status', () => {
        socket.join('scheduler:status');
        this.sendSchedulerStatus(socket);
      });
      // Handle scheduler status unsubscription
      socket.on('unsubscribe:scheduler:status', () => {
        socket.leave('scheduler:status');
      });
      // Handle agent execution events subscription
      socket.on('subscribe:agent:events', (agentId) => {
        socket.join(`agent:${agentId}:events`);
      });
      // Handle agent execution events unsubscription
      socket.on('unsubscribe:agent:events', (agentId) => {
        socket.leave(`agent:${agentId}:events`);
      });
      // Handle global events subscription
      socket.on('subscribe:global:events', () => {
        socket.join('global:events');
      });
      // Handle global events unsubscription
      socket.on('unsubscribe:global:events', () => {
        socket.leave('global:events');
      });
      // Handle agent control commands
      socket.on('agent:start', async (data) => {
        try {
          const result = await this.agentManager.startAgent(
            data.agentId,
            data.campaignId,
            data.options,
          );
          socket.emit('agent:start:response', { success: true, result });
          this.broadcastAgentStatusUpdate(data.agentId);
        } catch (error) {
          socket.emit('agent:start:response', {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });
      socket.on('agent:stop', async (agentId) => {
        try {
          await this.agentManager.stopAgent(agentId);
          socket.emit('agent:stop:response', { success: true });
          this.broadcastAgentStatusUpdate(agentId);
        } catch (error) {
          socket.emit('agent:stop:response', {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });
      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.connectedClients.delete(socket.id);
      });
    });
  }
  /**
   * Send initial status to a newly connected client
   */
  async sendInitialStatus(socket) {
    try {
      // Send running agents
      const runningAgents = this.agentManager.getRunningAgents();
      socket.emit('agents:running', runningAgents);
      // Send scheduler status
      const schedulerStats = this.agentScheduler.getStats();
      socket.emit('scheduler:status', schedulerStats);
      // Send manager stats
      const managerStats = this.agentManager.getStats();
      socket.emit('manager:stats', managerStats);
    } catch (error) {
      console.error('Error sending initial status:', error);
    }
  }
  /**
   * Send agent status to a specific socket
   */
  async sendAgentStatus(socket, agentId) {
    try {
      const status = await this.agentManager.getAgentStatus(agentId);
      socket.emit('agent:status', status);
    } catch (error) {
      socket.emit('agent:status:error', {
        agentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  /**
   * Send scheduler status to a specific socket
   */
  sendSchedulerStatus(socket) {
    try {
      const stats = this.agentScheduler.getStats();
      const taskDetails = this.agentScheduler.getTaskDetails();
      socket.emit('scheduler:status', { stats, taskDetails });
    } catch (error) {
      socket.emit('scheduler:status:error', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
  /**
   * Broadcast agent status update to all subscribed clients
   */
  async broadcastAgentStatusUpdate(agentId) {
    try {
      const status = await this.agentManager.getAgentStatus(agentId);
      this.io.to(`agent:${agentId}`).emit('agent:status:update', status);
    } catch (error) {
      console.error(
        `Error broadcasting agent status update for ${agentId}:`,
        error,
      );
    }
  }
  /**
   * Broadcast agent event to subscribed clients
   */
  broadcastAgentEvent(agentId, event) {
    this.io
      .to(`agent:${agentId}:events`)
      .emit('agent:event', { agentId, event });
    this.io.to('global:events').emit('global:agent:event', { agentId, event });
  }
  /**
   * Broadcast scheduler status update
   */
  broadcastSchedulerStatusUpdate() {
    try {
      const stats = this.agentScheduler.getStats();
      const taskDetails = this.agentScheduler.getTaskDetails();
      this.io
        .to('scheduler:status')
        .emit('scheduler:status:update', { stats, taskDetails });
    } catch (error) {
      console.error('Error broadcasting scheduler status update:', error);
    }
  }
  /**
   * Broadcast global system event
   */
  broadcastSystemEvent(event) {
    this.io.to('global:events').emit('system:event', {
      ...event,
      timestamp: new Date(),
    });
  }
  /**
   * Start periodic status broadcasts
   */
  startStatusBroadcast() {
    // Broadcast status updates every 5 seconds
    this.statusUpdateInterval = setInterval(() => {
      this.broadcastPeriodicUpdates();
    }, 5000);
  }
  /**
   * Stop periodic status broadcasts
   */
  stopStatusBroadcast() {
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
      this.statusUpdateInterval = null;
    }
  }
  /**
   * Broadcast periodic status updates
   */
  async broadcastPeriodicUpdates() {
    try {
      // Broadcast running agents status
      const runningAgents = this.agentManager.getRunningAgents();
      this.io.emit('agents:running:update', runningAgents);
      // Broadcast scheduler status
      this.broadcastSchedulerStatusUpdate();
      // Broadcast manager stats
      const managerStats = this.agentManager.getStats();
      this.io.emit('manager:stats:update', managerStats);
    } catch (error) {
      console.error('Error in periodic status broadcast:', error);
    }
  }
  /**
   * Get connected clients count
   */
  getConnectedClientsCount() {
    return this.connectedClients.size;
  }
  /**
   * Get socket server instance
   */
  getSocketServer() {
    return this.io;
  }
  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopStatusBroadcast();
    this.connectedClients.clear();
  }
}
exports.AgentStatusSocket = AgentStatusSocket;
