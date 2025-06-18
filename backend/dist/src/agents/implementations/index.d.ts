import { PrismaClient, AIAgent } from '@prisma/client';
import { AgentType } from '@prisma/client';
import { BaseAgent } from '../base/BaseAgent';
export declare function registerAllAgentPlugins(): void;
export declare function getAgentImplementation(
  agentType: AgentType,
  prisma: PrismaClient,
  agentData: AIAgent,
): BaseAgent;
