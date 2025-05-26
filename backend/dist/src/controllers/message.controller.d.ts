import { Request, Response } from 'express';
import { Server } from 'socket.io';
export declare const setIo: (socketIo: Server) => void;
/**
 * Get messages for a project
 * @route GET /api/messages?projectId=:projectId
 * @access Private
 */
export declare const getMessages: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Create new message
 * @route POST /api/messages
 * @access Private
 */
export declare const createMessage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Delete message
 * @route DELETE /api/messages/:id
 * @access Private
 */
export declare const deleteMessage: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
