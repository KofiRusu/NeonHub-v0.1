import { Request, Response } from 'express';
/**
 * Get documents for a project
 * @route GET /api/documents?projectId=:projectId
 * @access Private
 */
export declare const getDocuments: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get single document
 * @route GET /api/documents/:id
 * @access Private
 */
export declare const getDocument: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Upload document
 * @route POST /api/documents
 * @access Private
 */
export declare const uploadDocument: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Download document
 * @route GET /api/documents/:id/download
 * @access Private
 */
export declare const downloadDocument: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete document
 * @route DELETE /api/documents/:id
 * @access Private
 */
export declare const deleteDocument: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
