-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('CONTENT_CREATOR', 'TREND_ANALYZER', 'OUTREACH_MANAGER', 'PERFORMANCE_OPTIMIZER', 'AUDIENCE_RESEARCHER', 'COPYWRITER', 'SOCIAL_MEDIA_MANAGER', 'EMAIL_MARKETER', 'SEO_SPECIALIST', 'CUSTOMER_SUPPORT');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('IDLE', 'RUNNING', 'ERROR', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CampaignType" AS ENUM ('SOCIAL_MEDIA', 'EMAIL', 'CONTENT_MARKETING', 'SEO', 'PPC', 'INFLUENCER', 'AFFILIATE', 'EVENT', 'PR', 'INTEGRATED');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('BLOG_POST', 'SOCIAL_POST', 'EMAIL', 'AD_COPY', 'LANDING_PAGE', 'VIDEO_SCRIPT', 'PRODUCT_DESCRIPTION', 'PRESS_RELEASE', 'NEWSLETTER', 'INFOGRAPHIC');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN', 'TIKTOK', 'YOUTUBE', 'WEBSITE', 'EMAIL', 'GOOGLE', 'PINTEREST');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OutreachType" AS ENUM ('COLD_EMAIL', 'SOCIAL_OUTREACH', 'FOLLOW_UP', 'DEMO_REQUEST', 'PARTNERSHIP', 'INFLUENCER_OUTREACH', 'CUSTOMER_REENGAGEMENT', 'LEAD_QUALIFICATION');

-- CreateEnum
CREATE TYPE "OutreachStatus" AS ENUM ('PENDING', 'SCHEDULED', 'SENT', 'RESPONDED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('EMAIL', 'LINKEDIN', 'TWITTER', 'PHONE', 'INSTAGRAM', 'FACEBOOK', 'IN_PERSON', 'OTHER');

-- CreateEnum
CREATE TYPE "SignalType" AS ENUM ('KEYWORD_TREND', 'TOPIC_EMERGENCE', 'SENTIMENT_SHIFT', 'COMPETITION_MOVE', 'INDUSTRY_NEWS', 'REGULATORY_CHANGE', 'VIRAL_CONTENT', 'MARKET_OPPORTUNITY');

-- CreateEnum
CREATE TYPE "TrendImpact" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "FeedbackChannel" AS ENUM ('IN_APP', 'EMAIL', 'SURVEY', 'SOCIAL_MEDIA', 'CUSTOMER_SUPPORT', 'REVIEW');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('VERY_NEGATIVE', 'NEGATIVE', 'NEUTRAL', 'POSITIVE', 'VERY_POSITIVE');

-- CreateEnum
CREATE TYPE "FeedbackSource" AS ENUM ('CONTENT', 'OUTREACH', 'CAMPAIGN', 'PLATFORM', 'AGENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "dueDate" TIMESTAMP(3),
    "projectId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "creatorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIAgent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "agentType" "AgentType" NOT NULL,
    "configuration" JSONB NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "nextRunAt" TIMESTAMP(3),
    "scheduleExpression" TEXT,
    "scheduleEnabled" BOOLEAN NOT NULL DEFAULT false,
    "status" "AgentStatus" NOT NULL DEFAULT 'IDLE',
    "projectId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentExecutionSession" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "success" BOOLEAN,
    "duration" INTEGER,
    "outputSummary" TEXT,
    "logs" JSONB,
    "context" JSONB,
    "metrics" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentExecutionSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "campaignType" "CampaignType" NOT NULL,
    "goals" JSONB NOT NULL,
    "targeting" JSONB NOT NULL,
    "budget" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "ownerId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedContent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "platform" "Platform",
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "metadata" JSONB,
    "agentId" TEXT NOT NULL,
    "campaignId" TEXT,
    "creatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GeneratedContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "outreachType" "OutreachType" NOT NULL,
    "status" "OutreachStatus" NOT NULL DEFAULT 'PENDING',
    "leadInfo" JSONB NOT NULL,
    "contactMethod" "ContactMethod" NOT NULL,
    "aiResponse" TEXT,
    "responseHandlerId" TEXT,
    "campaignId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutreachTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrendSignal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "signalType" "SignalType" NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "rawData" JSONB,
    "impact" "TrendImpact" NOT NULL DEFAULT 'MEDIUM',
    "agentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrendSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntegrationCredential" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "accountIdentifier" TEXT,
    "authToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenType" TEXT,
    "expiry" TIMESTAMP(3),
    "scopes" TEXT[],
    "metadata" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Metric" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT,
    "dimension" TEXT,
    "campaignId" TEXT,
    "projectId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "Metric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalizationProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "behaviorCluster" TEXT NOT NULL,
    "interestAffinity" JSONB NOT NULL,
    "engagementScore" DOUBLE PRECISION NOT NULL,
    "contentPreferences" JSONB NOT NULL,
    "activeHours" JSONB,
    "devicePreference" TEXT,
    "clickPatterns" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonalizationProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "channel" "FeedbackChannel" NOT NULL,
    "content" TEXT NOT NULL,
    "sentiment" "Sentiment" NOT NULL,
    "sourceType" "FeedbackSource" NOT NULL,
    "sourceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentId" TEXT,
    "outreachTaskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProjectMembers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_CampaignAgents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Project_ownerId_idx" ON "Project"("ownerId");

-- CreateIndex
CREATE INDEX "Task_projectId_idx" ON "Task"("projectId");

-- CreateIndex
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");

-- CreateIndex
CREATE INDEX "Task_creatorId_idx" ON "Task"("creatorId");

-- CreateIndex
CREATE INDEX "Message_projectId_idx" ON "Message"("projectId");

-- CreateIndex
CREATE INDEX "Message_userId_idx" ON "Message"("userId");

-- CreateIndex
CREATE INDEX "Document_projectId_idx" ON "Document"("projectId");

-- CreateIndex
CREATE INDEX "Document_userId_idx" ON "Document"("userId");

-- CreateIndex
CREATE INDEX "AIAgent_projectId_idx" ON "AIAgent"("projectId");

-- CreateIndex
CREATE INDEX "AIAgent_managerId_idx" ON "AIAgent"("managerId");

-- CreateIndex
CREATE INDEX "AIAgent_agentType_idx" ON "AIAgent"("agentType");

-- CreateIndex
CREATE INDEX "AIAgent_status_idx" ON "AIAgent"("status");

-- CreateIndex
CREATE INDEX "AIAgent_nextRunAt_idx" ON "AIAgent"("nextRunAt");

-- CreateIndex
CREATE INDEX "AgentExecutionSession_agentId_idx" ON "AgentExecutionSession"("agentId");

-- CreateIndex
CREATE INDEX "AgentExecutionSession_startedAt_idx" ON "AgentExecutionSession"("startedAt");

-- CreateIndex
CREATE INDEX "AgentExecutionSession_success_idx" ON "AgentExecutionSession"("success");

-- CreateIndex
CREATE INDEX "Campaign_ownerId_idx" ON "Campaign"("ownerId");

-- CreateIndex
CREATE INDEX "Campaign_projectId_idx" ON "Campaign"("projectId");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Campaign_campaignType_idx" ON "Campaign"("campaignType");

-- CreateIndex
CREATE INDEX "GeneratedContent_agentId_idx" ON "GeneratedContent"("agentId");

-- CreateIndex
CREATE INDEX "GeneratedContent_campaignId_idx" ON "GeneratedContent"("campaignId");

-- CreateIndex
CREATE INDEX "GeneratedContent_creatorId_idx" ON "GeneratedContent"("creatorId");

-- CreateIndex
CREATE INDEX "GeneratedContent_contentType_idx" ON "GeneratedContent"("contentType");

-- CreateIndex
CREATE INDEX "GeneratedContent_platform_idx" ON "GeneratedContent"("platform");

-- CreateIndex
CREATE INDEX "GeneratedContent_status_idx" ON "GeneratedContent"("status");

-- CreateIndex
CREATE INDEX "OutreachTask_campaignId_idx" ON "OutreachTask"("campaignId");

-- CreateIndex
CREATE INDEX "OutreachTask_outreachType_idx" ON "OutreachTask"("outreachType");

-- CreateIndex
CREATE INDEX "OutreachTask_status_idx" ON "OutreachTask"("status");

-- CreateIndex
CREATE INDEX "OutreachTask_responseHandlerId_idx" ON "OutreachTask"("responseHandlerId");

-- CreateIndex
CREATE INDEX "TrendSignal_agentId_idx" ON "TrendSignal"("agentId");

-- CreateIndex
CREATE INDEX "TrendSignal_signalType_idx" ON "TrendSignal"("signalType");

-- CreateIndex
CREATE INDEX "TrendSignal_impact_idx" ON "TrendSignal"("impact");

-- CreateIndex
CREATE INDEX "TrendSignal_createdAt_idx" ON "TrendSignal"("createdAt");

-- CreateIndex
CREATE INDEX "IntegrationCredential_userId_idx" ON "IntegrationCredential"("userId");

-- CreateIndex
CREATE INDEX "IntegrationCredential_platform_idx" ON "IntegrationCredential"("platform");

-- CreateIndex
CREATE INDEX "IntegrationCredential_expiry_idx" ON "IntegrationCredential"("expiry");

-- CreateIndex
CREATE UNIQUE INDEX "IntegrationCredential_userId_platform_accountIdentifier_key" ON "IntegrationCredential"("userId", "platform", "accountIdentifier");

-- CreateIndex
CREATE INDEX "Metric_campaignId_idx" ON "Metric"("campaignId");

-- CreateIndex
CREATE INDEX "Metric_projectId_idx" ON "Metric"("projectId");

-- CreateIndex
CREATE INDEX "Metric_source_idx" ON "Metric"("source");

-- CreateIndex
CREATE INDEX "Metric_name_idx" ON "Metric"("name");

-- CreateIndex
CREATE INDEX "Metric_timestamp_idx" ON "Metric"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalizationProfile_userId_key" ON "PersonalizationProfile"("userId");

-- CreateIndex
CREATE INDEX "PersonalizationProfile_userId_idx" ON "PersonalizationProfile"("userId");

-- CreateIndex
CREATE INDEX "PersonalizationProfile_behaviorCluster_idx" ON "PersonalizationProfile"("behaviorCluster");

-- CreateIndex
CREATE INDEX "PersonalizationProfile_engagementScore_idx" ON "PersonalizationProfile"("engagementScore");

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- CreateIndex
CREATE INDEX "Feedback_sentiment_idx" ON "Feedback"("sentiment");

-- CreateIndex
CREATE INDEX "Feedback_sourceType_idx" ON "Feedback"("sourceType");

-- CreateIndex
CREATE INDEX "Feedback_contentId_idx" ON "Feedback"("contentId");

-- CreateIndex
CREATE INDEX "Feedback_outreachTaskId_idx" ON "Feedback"("outreachTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectMembers_AB_unique" ON "_ProjectMembers"("A", "B");

-- CreateIndex
CREATE INDEX "_ProjectMembers_B_index" ON "_ProjectMembers"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_CampaignAgents_AB_unique" ON "_CampaignAgents"("A", "B");

-- CreateIndex
CREATE INDEX "_CampaignAgents_B_index" ON "_CampaignAgents"("B");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAgent" ADD CONSTRAINT "AIAgent_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIAgent" ADD CONSTRAINT "AIAgent_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentExecutionSession" ADD CONSTRAINT "AgentExecutionSession_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedContent" ADD CONSTRAINT "GeneratedContent_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedContent" ADD CONSTRAINT "GeneratedContent_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedContent" ADD CONSTRAINT "GeneratedContent_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachTask" ADD CONSTRAINT "OutreachTask_responseHandlerId_fkey" FOREIGN KEY ("responseHandlerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachTask" ADD CONSTRAINT "OutreachTask_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendSignal" ADD CONSTRAINT "TrendSignal_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "AIAgent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationCredential" ADD CONSTRAINT "IntegrationCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metric" ADD CONSTRAINT "Metric_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Metric" ADD CONSTRAINT "Metric_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalizationProfile" ADD CONSTRAINT "PersonalizationProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_contentId_fkey" FOREIGN KEY ("contentId") REFERENCES "GeneratedContent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_outreachTaskId_fkey" FOREIGN KEY ("outreachTaskId") REFERENCES "OutreachTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectMembers" ADD CONSTRAINT "_ProjectMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProjectMembers" ADD CONSTRAINT "_ProjectMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignAgents" ADD CONSTRAINT "_CampaignAgents_A_fkey" FOREIGN KEY ("A") REFERENCES "AIAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CampaignAgents" ADD CONSTRAINT "_CampaignAgents_B_fkey" FOREIGN KEY ("B") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
