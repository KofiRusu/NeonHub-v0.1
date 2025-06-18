'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.io = exports.server = exports.app = exports.prisma = void 0;
const express_1 = __importDefault(require('express'));
const cors_1 = __importDefault(require('cors'));
const helmet_1 = __importDefault(require('helmet'));
const client_1 = require('@prisma/client');
const socket_io_1 = require('socket.io');
const http_1 = __importDefault(require('http'));
const auth_1 = require('./middleware/auth');
const logger_1 = require('./utils/logger');
// Import routes
const auth_routes_1 = __importDefault(require('./routes/auth.routes'));
const user_routes_1 = __importDefault(require('./routes/user.routes'));
const project_routes_1 = __importDefault(require('./routes/project.routes'));
const task_routes_1 = __importDefault(require('./routes/task.routes'));
const document_routes_1 = __importDefault(require('./routes/document.routes'));
const message_routes_1 = __importDefault(require('./routes/message.routes'));
const agent_routes_1 = __importDefault(require('./routes/agent.routes'));
const campaign_routes_1 = __importDefault(require('./routes/campaign.routes'));
const metrics_routes_1 = __importDefault(require('./routes/metrics.routes'));
const feedback_routes_1 = __importDefault(require('./routes/feedback.routes'));
// Create Express app
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
exports.server = server;
// Initialize Socket.io
const io = new socket_io_1.Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
exports.io = io;
// Create Prisma client
exports.prisma = new client_1.PrismaClient();
// Middleware
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Logging middleware
app.use((req, res, next) => {
  logger_1.logger.info(`${req.method} ${req.path}`);
  next();
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', auth_1.authenticateToken, user_routes_1.default);
app.use('/api/projects', auth_1.authenticateToken, project_routes_1.default);
app.use('/api/tasks', auth_1.authenticateToken, task_routes_1.default);
app.use('/api/documents', auth_1.authenticateToken, document_routes_1.default);
app.use('/api/messages', auth_1.authenticateToken, message_routes_1.default);
app.use('/api/agents', auth_1.authenticateToken, agent_routes_1.default);
app.use('/api/campaigns', auth_1.authenticateToken, campaign_routes_1.default);
app.use('/api/metrics', auth_1.authenticateToken, metrics_routes_1.default);
app.use('/api/feedback', auth_1.authenticateToken, feedback_routes_1.default);
// Health check endpoint
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok' });
});
// Error handling middleware
app.use((err, req, res, next) => {
  logger_1.logger.error('Unhandled error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});
// Socket.io connection handler
io.on('connection', (socket) => {
  logger_1.logger.info(`Socket connected: ${socket.id}`);
  socket.on('disconnect', () => {
    logger_1.logger.info(`Socket disconnected: ${socket.id}`);
  });
});
