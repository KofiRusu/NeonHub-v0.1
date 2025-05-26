import { Request, Response } from 'express';
/**
 * Get all feedback entries with filtering options
 * @route GET /api/feedback
 * @access Private
 */
export declare const getAllFeedback: (req: Request, res: Response) => Promise<void>;
/**
 * Get single feedback entry
 * @route GET /api/feedback/:id
 * @access Private
 */
export declare const getFeedback: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Create new feedback
 * @route POST /api/feedback
 * @access Private
 */
export declare const createFeedback: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update feedback
 * @route PUT /api/feedback/:id
 * @access Private
 */
export declare const updateFeedback: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete feedback
 * @route DELETE /api/feedback/:id
 * @access Private
 */
export declare const deleteFeedback: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get sentiment analysis summary
 * @route GET /api/feedback/sentiment-summary
 * @access Private
 */
export declare const getSentimentSummary: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
