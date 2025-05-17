import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import taskRoutes from './task.routes';
import messageRoutes from './message.routes';
import documentRoutes from './document.routes';
import agentRoutes from './agent.routes';
import agentsRoutes from './agents';
import campaignRoutes from './campaigns.routes';
import metricsRoutes from './metrics.routes';
import feedbackRoutes from './feedback.routes';
import contentRoutes from './content.routes';
import trendRoutes from './trend.routes';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/projects', authenticate, projectRoutes);
router.use('/tasks', authenticate, taskRoutes);
router.use('/messages', authenticate, messageRoutes);
router.use('/documents', authenticate, documentRoutes);
router.use('/agent', authenticate, agentRoutes);
router.use('/agents', authenticate, agentsRoutes);
router.use('/campaigns', authenticate, campaignRoutes);
router.use('/metrics', authenticate, metricsRoutes);
router.use('/feedback', authenticate, feedbackRoutes);
router.use('/content', authenticate, contentRoutes);
router.use('/trends', authenticate, trendRoutes);

export default router; 