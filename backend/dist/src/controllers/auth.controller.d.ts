import { Request, Response } from 'express';
/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
export declare const register: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Login a user
 * @route POST /api/auth/login
 * @access Public
 */
export declare const login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * OAuth authentication
 * @route POST /api/auth/oauth/:provider
 * @access Public
 */
export declare const oauthLogin: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Get current logged in user
 * @route GET /api/auth/me
 * @access Private
 */
export declare const getMe: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
