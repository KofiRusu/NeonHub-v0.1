import { PrismaClient } from '@prisma/client';
import { AuthService } from './auth/AuthService';
import { CampaignService } from './campaigns/CampaignService';
import { MetricService } from './metrics/MetricService';

// Service instances cache
const serviceInstances: Record<string, any> = {};

/**
 * Get the authentication service
 * @param prisma PrismaClient instance
 * @returns AuthService instance
 */
export const getAuthService = (prisma: PrismaClient): AuthService => {
  if (!serviceInstances.auth) {
    serviceInstances.auth = new AuthService(prisma);
  }
  return serviceInstances.auth;
};

/**
 * Get the campaign service
 * @param prisma PrismaClient instance
 * @returns CampaignService instance
 */
export const getCampaignService = (prisma: PrismaClient): CampaignService => {
  if (!serviceInstances.campaign) {
    serviceInstances.campaign = new CampaignService(prisma);
  }
  return serviceInstances.campaign;
};

/**
 * Get the metric service
 * @param prisma PrismaClient instance
 * @returns MetricService instance
 */
export const getMetricService = (prisma: PrismaClient): MetricService => {
  if (!serviceInstances.metric) {
    serviceInstances.metric = new MetricService(prisma);
  }
  return serviceInstances.metric;
};

// Export all service types
export * from './auth/AuthService';
export * from './campaigns/CampaignService';
export * from './metrics/MetricService';
