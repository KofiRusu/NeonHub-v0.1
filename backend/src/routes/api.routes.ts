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
import { protect } from '../middleware/auth';

const router = Router();

// Public routes
router.use('/auth', authRoutes);

// Protected routes
router.use('/projects', protect, projectRoutes);
router.use('/tasks', protect, taskRoutes);
router.use('/messages', protect, messageRoutes);
router.use('/documents', protect, documentRoutes);
router.use('/agent', protect, agentRoutes);
router.use('/agents', protect, agentsRoutes);
router.use('/campaigns', protect, campaignRoutes);
router.use('/metrics', protect, metricsRoutes);
router.use('/feedback', protect, feedbackRoutes);
router.use('/content', protect, contentRoutes);
router.use('/trends', protect, trendRoutes);

export default router;
