import { Request, Response } from 'express';
/**
 * Get all campaigns for the current user
 * @route GET /api/campaigns
 * @access Private
 */
export declare const getCampaigns: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get a campaign by ID
 * @route GET /api/campaigns/:id
 * @access Private
 */
export declare const getCampaign: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Create a new campaign
 * @route POST /api/campaigns
 * @access Private
 */
export declare const createCampaign: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update a campaign
 * @route PUT /api/campaigns/:id
 * @access Private
 */
export declare const updateCampaign: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete a campaign
 * @route DELETE /api/campaigns/:id
 * @access Private
 */
export declare const deleteCampaign: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get campaign analytics
 * @route GET /api/campaigns/:id/analytics
 * @access Private
 */
export declare const getCampaignAnalytics: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Schedule a campaign
 * @route POST /api/campaigns/:id/schedule
 * @access Private
 */
export declare const scheduleCampaign: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
