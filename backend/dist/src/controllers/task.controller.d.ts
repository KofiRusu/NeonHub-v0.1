import { Request, Response } from 'express';
/**
 * Get all tasks for a project
 * @route GET /api/tasks?projectId=:projectId
 * @access Private
 */
export declare const getTasks: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get single task
 * @route GET /api/tasks/:id
 * @access Private
 */
export declare const getTask: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Create new task
 * @route POST /api/tasks
 * @access Private
 */
export declare const createTask: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update task
 * @route PUT /api/tasks/:id
 * @access Private
 */
export declare const updateTask: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete task
 * @route DELETE /api/tasks/:id
 * @access Private
 */
export declare const deleteTask: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
