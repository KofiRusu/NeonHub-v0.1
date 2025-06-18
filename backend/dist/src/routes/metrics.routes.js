'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = require('express');
const metric_controller_1 = require('../controllers/metric.controller');
const auth_middleware_1 = require('../middleware/auth.middleware');
const metrics_1 = require('../middleware/metrics');
const router = (0, express_1.Router)();
/**
 * @route GET /api/metrics
 * @desc Get all metrics with filtering options
 * @access Private
 */
router.get('/', auth_middleware_1.protect, metric_controller_1.getMetrics);
/**
 * @route GET /api/metrics/summary
 * @desc Get metrics summary with aggregations
 * @access Private
 */
router.get(
  '/summary',
  auth_middleware_1.protect,
  metric_controller_1.getMetricsSummary,
);
/**
 * @route GET /api/metrics/:id
 * @desc Get single metric by ID
 * @access Private
 */
router.get('/:id', auth_middleware_1.protect, metric_controller_1.getMetric);
/**
 * @route POST /api/metrics
 * @desc Create a new metric
 * @access Private
 */
router.post('/', auth_middleware_1.protect, metric_controller_1.createMetric);
/**
 * @route PUT /api/metrics/:id
 * @desc Update a metric
 * @access Private
 */
router.put('/:id', auth_middleware_1.protect, metric_controller_1.updateMetric);
/**
 * @route DELETE /api/metrics/:id
 * @desc Delete a metric
 * @access Private
 */
router.delete(
  '/:id',
  auth_middleware_1.protect,
  metric_controller_1.deleteMetric,
);
/**
 * @route   GET /api/metrics
 * @desc    Get Prometheus metrics
 * @access  Private (should be protected in production)
 */
router.get('/prometheus', metrics_1.metricsHandler);
exports.default = router;
