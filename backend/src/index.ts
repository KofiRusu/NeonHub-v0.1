import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import path from 'path';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import messageRoutes from './routes/message.routes';
import documentRoutes from './routes/document.routes';

// Middleware
import { errorHandler } from './middleware/error.middleware';

// Controllers
import { setIo } from './controllers/message.controller';

// Socket.io configuration
import { configureAgentSocket, setSocketIO } from './socket/agentOutput';

// Agent scheduler
import { AgentScheduler } from './agents/scheduler/AgentScheduler';
import { getAgentManager } from './agents';

// Initialize environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Prisma client
export const prisma = new PrismaClient();

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Pass Socket.io instance to message controller
setIo(io);

// Configure agent socket and store the instance globally
const agentIo = configureAgentSocket(httpServer, prisma);
setSocketIO(agentIo);

// Initialize agent scheduler
const agentManager = getAgentManager(prisma);
const agentScheduler = new AgentScheduler(prisma, agentManager, {
  runMissedOnStartup: true,
  autoStart: true,
  checkInterval: 30000 // Check every 30 seconds
});

// Export agent scheduler for use in routes
export { agentScheduler };

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/documents', documentRoutes);

// Health check route
app.get('/health', (req, res) => {
  // Check database connection
  prisma.$queryRaw`SELECT 1`
    .then(() => {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date(),
        uptime: process.uptime(),
        databaseConnected: true
      });
    })
    .catch(err => {
      console.error('Health check database error:', err);
      res.status(500).json({
        status: 'error',
        timestamp: new Date(),
        uptime: process.uptime(),
        databaseConnected: false,
        error: 'Database connection failed'
      });
    });
});

// Error handling middleware
app.use(errorHandler);

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a room (project)
  socket.on('join-project', (projectId: string) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined project ${projectId}`);
  });

  // Leave a room (project)
  socket.on('leave-project', (projectId: string) => {
    socket.leave(projectId);
    console.log(`User ${socket.id} left project ${projectId}`);
  });

  // User typing indicator
  socket.on('typing', ({ projectId, user }: { projectId: string; user: { id: string; name: string } }) => {
    socket.to(projectId).emit('user-typing', user);
  });

  // User stopped typing
  socket.on('stop-typing', (projectId: string) => {
    socket.to(projectId).emit('user-stopped-typing');
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  httpServer.close(() => process.exit(1));
});

// Clean up Prisma on exit
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
}); 