import { PrismaClient } from '@prisma/client';
export declare const prisma: PrismaClient<
  import('.prisma/client').Prisma.PrismaClientOptions,
  never,
  | import('.prisma/client').Prisma.RejectOnNotFound
  | import('.prisma/client').Prisma.RejectPerOperation
  | undefined,
  import('@prisma/client/runtime').DefaultArgs
>;
export declare const getAgentScheduler: () => import('./agents').AgentScheduler;
