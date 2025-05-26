import { PrismaClient } from '@prisma/client';
import { AgentScheduler } from './agents/scheduler/AgentScheduler';
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import(".prisma/client").Prisma.RejectOnNotFound | import(".prisma/client").Prisma.RejectPerOperation | undefined, import("@prisma/client/runtime").DefaultArgs>;
declare const agentScheduler: AgentScheduler;
export { agentScheduler };
