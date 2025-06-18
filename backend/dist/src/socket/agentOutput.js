'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.configureAgentSocket = configureAgentSocket;
exports.emitAgentStart = emitAgentStart;
exports.emitAgentLog = emitAgentLog;
exports.emitAgentDone = emitAgentDone;
exports.emitAgentError = emitAgentError;
exports.getSocketIO = getSocketIO;
exports.setSocketIO = setSocketIO;
const socket_io_1 = require('socket.io');
/**
 * Configure Socket.io for agent real-time output
 * @param httpServer The HTTP server to attach Socket.io to
 * @param prisma Prisma client for database operations
 * @returns Configured Socket.io server
 */
function configureAgentSocket(httpServer, prisma) {
  // Create Socket.io server
  const io = new socket_io_1.Server(httpServer, {
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
    socket.on('join:agent', (agentId) => {
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
function emitAgentStart(io, agentId, metadata) {
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
function emitAgentLog(io, agentId, log) {
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
function emitAgentDone(io, agentId, result) {
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
function emitAgentError(io, agentId, error) {
  io.of('/agents').to(`agent:${agentId}`).emit('agent:error', {
    agentId,
    timestamp: new Date(),
    error,
  });
}
// Store a global reference to the Socket.io server
let _io = null;
/**
 * Get the Socket.io server instance
 * @returns Socket.io server instance
 */
function getSocketIO() {
  return _io;
}
/**
 * Set the global Socket.io server instance
 * @param io Socket.io server instance
 */
function setSocketIO(io) {
  _io = io;
}
