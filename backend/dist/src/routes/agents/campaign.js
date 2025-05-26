"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const agents_1 = require("../../agents");
const services_1 = require("../../../services");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
/**
 * Run an agent as part of a campaign
 * POST /api/agents/campaign/:agentId/run
 */
router.post('/:agentId/run', auth_1.authenticateToken, async (req, res) => {
    try {
        const { agentId } = req.params;
        const { campaignId, config = {}, tokenUsage } = req.body;
        if (!agentId) {
            return res.status(400).json({ error: 'Agent ID is required' });
        }
        // If campaignId is provided, verify it exists
        if (campaignId) {
            const campaign = await prisma.campaign.findUnique({
                where: { id: campaignId },
            });
            if (!campaign) {
                return res
                    .status(404)
                    .json({ error: `Campaign with ID ${campaignId} not found` });
            }
        }
        // Get agent
        const agent = await prisma.aIAgent.findUnique({
            where: { id: agentId },
        });
        if (!agent) {
            return res
                .status(404)
                .json({ error: `Agent with ID ${agentId} not found` });
        }
        // Check if agent is already running
        const agentManager = (0, agents_1.getAgentManager)(prisma);
        if (agentManager.isAgentRunning(agentId)) {
            return res.status(409).json({
                error: `Agent ${agentId} is already running`,
                status: 'already_running',
            });
        }
        // Start agent execution
        const result = await agentManager.startAgent(agentId, campaignId, {
            config,
            trackMetrics: true,
            tokenUsage,
        });
        // Return the execution result
        return res.status(200).json({
            status: 'success',
            data: result,
        });
    }
    catch (error) {
        console.error('Error executing agent in campaign:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
        });
    }
});
/**
 * Get agent campaign metrics
 * GET /api/agents/campaign/:agentId/metrics
 */
router.get('/:agentId/metrics', auth_1.authenticateToken, async (req, res) => {
    try {
        const { agentId } = req.params;
        const { campaignId } = req.query;
        if (!agentId) {
            return res.status(400).json({ error: 'Agent ID is required' });
        }
        // Get metrics service
        const metricService = (0, services_1.getMetricService)(prisma);
        // Get agent metrics
        const metrics = await metricService.getAgentMetrics(agentId);
        // Filter by campaign if specified
        const filteredMetrics = campaignId
            ? metrics.filter((metric) => metric.campaignId === campaignId)
            : metrics;
        // Return metrics
        return res.status(200).json({
            status: 'success',
            count: filteredMetrics.length,
            data: filteredMetrics,
        });
    }
    catch (error) {
        console.error('Error getting agent metrics:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
        });
    }
});
/**
 * Get campaigns linked to an agent
 * GET /api/agents/campaign/:agentId/campaigns
 */
router.get('/:agentId/campaigns', auth_1.authenticateToken, async (req, res) => {
    try {
        const { agentId } = req.params;
        if (!agentId) {
            return res.status(400).json({ error: 'Agent ID is required' });
        }
        // Get campaigns linked to this agent
        const campaigns = await prisma.campaign.findMany({
            where: {
                agents: {
                    some: {
                        id: agentId,
                    },
                },
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });
        // Return campaigns
        return res.status(200).json({
            status: 'success',
            count: campaigns.length,
            data: campaigns,
        });
    }
    catch (error) {
        console.error('Error getting agent campaigns:', error);
        return res.status(500).json({
            error: error instanceof Error ? error.message : 'Internal server error',
        });
    }
});
exports.default = router;
//# sourceMappingURL=campaign.js.map