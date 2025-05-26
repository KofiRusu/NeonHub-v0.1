import { Request, Response } from 'express';
/**
 * Get all metrics with filtering options
 * @route GET /api/metrics
 * @access Private
 */
export declare const getMetrics: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get a single metric by ID
 * @route GET /api/metrics/:id
 * @access Private
 */
export declare const getMetric: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Create a new metric
 * @route POST /api/metrics
 * @access Private
 */
export declare const createMetric: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update a metric
 * @route PUT /api/metrics/:id
 * @access Private
 */
export declare const updateMetric: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete a metric
 * @route DELETE /api/metrics/:id
 * @access Private
 */
export declare const deleteMetric: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get metrics summary/aggregated data
 * @route GET /api/metrics/summary
 * @access Private
 */
export declare const getMetricsSummary: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
