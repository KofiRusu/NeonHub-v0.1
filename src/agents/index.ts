// Base classes and types
export * from './base/AIAgent';
export * from './base/types';

// Agent implementations
export * from './implementations/ContentAgent';
export * from './implementations/OutreachAgent';
export * from './implementations/AdOptimizerAgent';
export * from './implementations/TrendPredictorAgent';

// Agent manager
export * from './manager/AgentManager';

// Singleton instance factory
import { PrismaClient } from '@prisma/client';
import { AgentManager } from './manager/AgentManager';

// Create singleton instance for the application
let managerInstance: AgentManager | null = null;

/**
 * Get the singleton instance of AgentManager
 * @param prisma Optional Prisma client instance (used on first call)
 * @returns The AgentManager instance
 */
export function getAgentManager(prisma?: PrismaClient): AgentManager {
  if (!managerInstance) {
    if (!prisma) {
      throw new Error(
        'PrismaClient must be provided on first call to getAgentManager',
      );
    }
    managerInstance = new AgentManager(prisma);
  }

  return managerInstance;
}

/**
 * Initialize the agent manager
 * @param prisma Prisma client instance
 * @returns The initialized AgentManager
 */
export async function initializeAgentManager(
  prisma: PrismaClient,
): Promise<AgentManager> {
  const manager = getAgentManager(prisma);
  await manager.initialize();
  return manager;
}

/**
 * Shutdown the agent manager and clean up resources
 */
export function shutdownAgentManager(): void {
  if (managerInstance) {
    managerInstance.shutdown();
    managerInstance = null;
  }
}
