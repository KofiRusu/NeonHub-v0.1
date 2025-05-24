-- AlterEnum
ALTER TYPE "AgentType" ADD VALUE 'ENGINEERING_CONVERSATION';

-- Create Conversations table for engineering conversations
CREATE TABLE "EngineeringConversation" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngineeringConversation_pkey" PRIMARY KEY ("id")
);

-- Add indices
CREATE INDEX "EngineeringConversation_agentId_idx" ON "EngineeringConversation"("agentId");
CREATE INDEX "EngineeringConversation_domain_idx" ON "EngineeringConversation"("domain");
CREATE INDEX "EngineeringConversation_status_idx" ON "EngineeringConversation"("status");

-- Add foreign key constraint
ALTER TABLE "EngineeringConversation" ADD CONSTRAINT "EngineeringConversation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE; 