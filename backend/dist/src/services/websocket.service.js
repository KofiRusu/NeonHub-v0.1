"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketService = void 0;
const socket_io_1 = require("socket.io");
class WebSocketService {
    io;
    prisma;
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
//# sourceMappingURL=websocket.service.js.map