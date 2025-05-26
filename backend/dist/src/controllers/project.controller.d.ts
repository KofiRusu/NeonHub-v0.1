import { Request, Response } from 'express';
/**
 * Get all projects
 * @route GET /api/projects
 * @access Private
 */
export declare const getProjects: (req: Request, res: Response) => Promise<void>;
/**
 * Get single project
 * @route GET /api/projects/:id
 * @access Private
 */
export declare const getProject: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Create new project
 * @route POST /api/projects
 * @access Private
 */
export declare const createProject: (req: Request, res: Response) => Promise<void>;
/**
 * Update project
 * @route PUT /api/projects/:id
 * @access Private
 */
export declare const updateProject: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete project
 * @route DELETE /api/projects/:id
 * @access Private
 */
export declare const deleteProject: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Add member to project
 * @route POST /api/projects/:id/members
 * @access Private
 */
export declare const addMember: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Remove member from project
 * @route DELETE /api/projects/:id/members/:userId
 * @access Private
 */
export declare const removeMember: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
