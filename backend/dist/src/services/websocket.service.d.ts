import { PrismaClient } from '@prisma/client';
export declare class WebSocketService {
    private io;
    private prisma;
    constructor(httpServer: any, prisma: PrismaClient);
    setupEventHandlers(): void;
    emitAgentStatusUpdate(agentId: string, status: any): void;
    emitAgentExecutionLog(agentId: string, log: any): void;
    emitCampaignUpdate(campaignId: string, update: any): void;
}
