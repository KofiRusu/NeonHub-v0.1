import { PrismaClient } from '@prisma/client';
import { AgentManager } from './manager/AgentManager';

// Singleton instance of the AgentManager
let agentManagerInstance: AgentManager | null = null;

/**
 * Get or create the singleton instance of the AgentManager
 * @param prisma PrismaClient instance
 * @returns The AgentManager instance
 */
export function getAgentManager(prisma: PrismaClient): AgentManager {
  if (!agentManagerInstance) {
    agentManagerInstance = new AgentManager(prisma);
  }
  return agentManagerInstance;
}

// Export other agent-related modules
export * from './base/BaseAgent';
export * from './implementations'; 