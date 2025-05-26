import { Router } from 'express';
import {
  getMetrics,
  getMetric,
  createMetric,
  updateMetric,
  deleteMetric,
  getMetricsSummary,
} from '../controllers/metric.controller';
import { protect } from '../middleware/auth.middleware';
import { metricsHandler } from '../middleware/metrics';

const router = Router();

/**
 * @route GET /api/metrics
 * @desc Get all metrics with filtering options
 * @access Private
 */
router.get('/', protect, getMetrics);

/**
 * @route GET /api/metrics/summary
 * @desc Get metrics summary with aggregations
 * @access Private
 */
router.get('/summary', protect, getMetricsSummary);

/**
 * @route GET /api/metrics/:id
 * @desc Get single metric by ID
 * @access Private
 */
router.get('/:id', protect, getMetric);

/**
 * @route POST /api/metrics
 * @desc Create a new metric
 * @access Private
 */
router.post('/', protect, createMetric);

/**
 * @route PUT /api/metrics/:id
 * @desc Update a metric
 * @access Private
 */
router.put('/:id', protect, updateMetric);

/**
 * @route DELETE /api/metrics/:id
 * @desc Delete a metric
 * @access Private
 */
router.delete('/:id', protect, deleteMetric);

/**
 * @route   GET /api/metrics
 * @desc    Get Prometheus metrics
 * @access  Private (should be protected in production)
 */
router.get('/prometheus', metricsHandler);

export default router;
