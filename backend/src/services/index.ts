import { PrismaClient } from '@prisma/client';
import { AuthService } from './auth/AuthService';

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

// Export all service types
export * from './auth/AuthService'; 