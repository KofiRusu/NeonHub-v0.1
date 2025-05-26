import { PrismaClient } from '@prisma/client';
import { AuthService } from './auth/AuthService';
import { CampaignService } from './campaigns/CampaignService';
import { MetricService } from './metrics/MetricService';
/**
 * Get the authentication service
 * @param prisma PrismaClient instance
 * @returns AuthService instance
 */
export declare const getAuthService: (prisma: PrismaClient) => AuthService;
/**
 * Get the campaign service
 * @param prisma PrismaClient instance
 * @returns CampaignService instance
 */
export declare const getCampaignService: (prisma: PrismaClient) => CampaignService;
/**
 * Get the metric service
 * @param prisma PrismaClient instance
 * @returns MetricService instance
 */
export declare const getMetricService: (prisma: PrismaClient) => MetricService;
export * from './auth/AuthService';
export * from './campaigns/CampaignService';
export * from './metrics/MetricService';
