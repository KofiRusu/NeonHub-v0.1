import { Request, Response } from 'express';
/**
 * Get all users
 * @route GET /api/users
 * @access Private/Admin
 */
export declare const getUsers: (req: Request, res: Response) => Promise<void>;
/**
 * Get single user
 * @route GET /api/users/:id
 * @access Private/Admin
 */
export declare const getUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Update user
 * @route PUT /api/users/:id
 * @access Private
 */
export declare const updateUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete user
 * @route DELETE /api/users/:id
 * @access Private/Admin
 */
export declare const deleteUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
