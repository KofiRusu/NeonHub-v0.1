import { PrismaClient } from '@prisma/client';
import { AgentManager } from './manager/AgentManager';
import { AgentScheduler } from './scheduler/AgentScheduler';
import { AgentFactory, createAgentFactory, pluginRegistry } from './factory/AgentFactory';
import { BaseAgent, AgentEvent, AgentEventType } from './base/BaseAgent';
import './implementations';
/**
 * Get or create the agent manager instance
 * @param prisma Prisma client instance
 * @returns AgentManager instance
 */
export declare function getAgentManager(prisma: PrismaClient): AgentManager;
/**
 * Get or create the agent scheduler instance
 * @param prisma Prisma client instance
 * @param manager Optional agent manager instance
 * @returns AgentScheduler instance
 */
export declare function getAgentScheduler(prisma: PrismaClient, manager?: AgentManager): AgentScheduler;
/**
 * Get or create the agent factory instance
 * @param prisma Prisma client instance
 * @returns AgentFactory instance
 */
export declare function getAgentFactory(prisma: PrismaClient): AgentFactory;
/**
 * Initialize the agent system
 * @param prisma Prisma client instance
 * @returns Initialized agent system components
 */
export declare function initializeAgentSystem(prisma: PrismaClient): {
    manager: AgentManager;
    scheduler: AgentScheduler;
    factory: AgentFactory;
};
/**
 * Cleanup agent system resources
 */
export declare function cleanupAgentSystem(): void;
export { AgentManager, AgentScheduler, AgentFactory, BaseAgent, AgentEvent, AgentEventType, pluginRegistry, createAgentFactory, };
export * from './types';
export * from './base/BaseAgent';
export * from './factory/AgentFactory';
export * from './scheduler/AgentScheduler';
