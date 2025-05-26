import { Router } from 'express';
import contentRoutes from './content.routes';
import trendRoutes from './trend.routes';
import campaignRoutes from './campaign';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

// Apply authentication middleware to all agent routes
router.use(authenticateToken);

// Register agent routes
router.use('/content', contentRoutes);
router.use('/trend', trendRoutes);
router.use('/campaign', campaignRoutes);

export default router;
