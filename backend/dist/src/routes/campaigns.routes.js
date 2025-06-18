'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = require('express');
const campaign_controller_1 = require('../controllers/campaign.controller');
const auth_middleware_1 = require('../middleware/auth.middleware');
const router = (0, express_1.Router)();
/**
 * @route GET /api/campaigns
 * @desc Get all campaigns for the current user
 * @access Private
 */
router.get('/', auth_middleware_1.protect, campaign_controller_1.getCampaigns);
/**
 * @route GET /api/campaigns/:id
 * @desc Get a campaign by ID
 * @access Private
 */
router.get(
  '/:id',
  auth_middleware_1.protect,
  campaign_controller_1.getCampaign,
);
/**
 * @route POST /api/campaigns
 * @desc Create a new campaign
 * @access Private
 */
router.post(
  '/',
  auth_middleware_1.protect,
  campaign_controller_1.createCampaign,
);
/**
 * @route PUT /api/campaigns/:id
 * @desc Update a campaign
 * @access Private
 */
router.put(
  '/:id',
  auth_middleware_1.protect,
  campaign_controller_1.updateCampaign,
);
/**
 * @route DELETE /api/campaigns/:id
 * @desc Delete a campaign
 * @access Private
 */
router.delete(
  '/:id',
  auth_middleware_1.protect,
  campaign_controller_1.deleteCampaign,
);
/**
 * @route GET /api/campaigns/:id/analytics
 * @desc Get campaign analytics
 * @access Private
 */
router.get(
  '/:id/analytics',
  auth_middleware_1.protect,
  campaign_controller_1.getCampaignAnalytics,
);
/**
 * @route POST /api/campaigns/:id/schedule
 * @desc Schedule a campaign
 * @access Private
 */
router.post(
  '/:id/schedule',
  auth_middleware_1.protect,
  campaign_controller_1.scheduleCampaign,
);
exports.default = router;
