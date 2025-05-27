import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import http from 'http';
import { authenticateToken } from './middleware/auth';
import { logger } from './utils/logger';

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import documentRoutes from './routes/document.routes';
import messageRoutes from './routes/message.routes';
import agentRoutes from './routes/agent.routes';
import campaignRoutes from './routes/campaign.routes';
import metricRoutes from './routes/metrics.routes';
import feedbackRoutes from './routes/feedback.routes';

// Create Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Create Prisma client
export const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);
app.use('/api/documents', authenticateToken, documentRoutes);
app.use('/api/messages', authenticateToken, messageRoutes);
app.use('/api/agents', authenticateToken, agentRoutes);
app.use('/api/campaigns', authenticateToken, campaignRoutes);
app.use('/api/metrics', authenticateToken, metricRoutes);
app.use('/api/feedback', authenticateToken, feedbackRoutes);

// Health check endpoint
app.get('/health', (_, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  },
);

// Socket.io connection handler
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

export { app, server, io };
