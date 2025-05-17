import { Router } from 'express';
import {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getCampaignMetrics
} from '../controllers/campaign.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route GET /api/campaigns
 * @desc Get all campaigns with filtering options
 * @access Private
 */
router.get('/', protect, getCampaigns);

/**
 * @route GET /api/campaigns/:id
 * @desc Get single campaign by ID
 * @access Private
 */
router.get('/:id', protect, getCampaign);

/**
 * @route POST /api/campaigns
 * @desc Create a new campaign
 * @access Private
 */
router.post('/', protect, createCampaign);

/**
 * @route PUT /api/campaigns/:id
 * @desc Update a campaign
 * @access Private
 */
router.put('/:id', protect, updateCampaign);

/**
 * @route DELETE /api/campaigns/:id
 * @desc Delete a campaign
 * @access Private
 */
router.delete('/:id', protect, deleteCampaign);

/**
 * @route GET /api/campaigns/:id/metrics
 * @desc Get metrics for a specific campaign
 * @access Private
 */
router.get('/:id/metrics', protect, getCampaignMetrics);

export default router; 