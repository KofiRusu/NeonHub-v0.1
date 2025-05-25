import { PrismaClient } from '@prisma/client';
import { AgentManager } from './manager/AgentManager';
import { AgentScheduler } from './scheduler/AgentScheduler';
import { AgentFactory, createAgentFactory, pluginRegistry } from './factory/AgentFactory';
import { BaseAgent, AgentEvent, AgentEventType } from './base/BaseAgent';

// Import and register all plugins
import './implementations';

// Singleton instances
let agentManager: AgentManager | null = null;
let agentScheduler: AgentScheduler | null = null;
let agentFactory: AgentFactory | null = null;

/**
 * Get or create the agent manager instance
 * @param prisma Prisma client instance
 * @returns AgentManager instance
 */
export function getAgentManager(prisma: PrismaClient): AgentManager {
  if (!agentManager) {
    agentManager = new AgentManager(prisma);
  }
  return agentManager;
}

/**
 * Get or create the agent scheduler instance
 * @param prisma Prisma client instance
 * @param manager Optional agent manager instance
 * @returns AgentScheduler instance
 */
export function getAgentScheduler(prisma: PrismaClient, manager?: AgentManager): AgentScheduler {
  if (!agentScheduler) {
    const agentMgr = manager || getAgentManager(prisma);
    agentScheduler = new AgentScheduler(prisma, agentMgr, {
      checkInterval: 60000, // 1 minute
      maxConcurrentAgents: 5,
      maxRetries: 3,
      baseBackoffDelay: 1000,
      maxBackoffDelay: 300000, // 5 minutes
      autoStart: true,
      runMissedOnStartup: true
    });
  }
  return agentScheduler;
}

/**
 * Get or create the agent factory instance
 * @param prisma Prisma client instance
 * @returns AgentFactory instance
 */
export function getAgentFactory(prisma: PrismaClient): AgentFactory {
  if (!agentFactory) {
    agentFactory = createAgentFactory(prisma);
  }
  return agentFactory;
}

/**
 * Initialize the agent system
 * @param prisma Prisma client instance
 * @returns Initialized agent system components
 */
export function initializeAgentSystem(prisma: PrismaClient): {
  manager: AgentManager;
  scheduler: AgentScheduler;
  factory: AgentFactory;
} {
  const manager = getAgentManager(prisma);
  const scheduler = getAgentScheduler(prisma, manager);
  const factory = getAgentFactory(prisma);

  console.log('Agent system initialized successfully');
  console.log(`Available agent types: ${factory.getAvailableAgentTypes().length}`);
  console.log(`Scheduler running: ${scheduler.isSchedulerRunning()}`);

  return { manager, scheduler, factory };
}

/**
 * Cleanup agent system resources
 */
export function cleanupAgentSystem(): void {
  if (agentScheduler) {
    agentScheduler.stop();
  }
  
  agentManager = null;
  agentScheduler = null;
  agentFactory = null;
  
  console.log('Agent system cleaned up');
}

// Export all components
export {
  AgentManager,
  AgentScheduler,
  AgentFactory,
  BaseAgent,
  AgentEvent,
  AgentEventType,
  pluginRegistry,
  createAgentFactory
};

// Export types
export * from './types';
export * from './base/BaseAgent';
export * from './factory/AgentFactory';
export * from './scheduler/AgentScheduler'; 