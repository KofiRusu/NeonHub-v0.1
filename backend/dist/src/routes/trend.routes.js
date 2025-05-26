"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const agents_1 = require("../agents");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Get all trends
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        // Support filtering
        const { signalType, impact, source } = req.query;
        const whereClause = {};
        if (signalType) {
            whereClause.signalType = signalType;
        }
        if (impact) {
            whereClause.impact = impact;
        }
        if (source) {
            whereClause.source = { contains: source };
        }
        const trends = await prisma.trendSignal.findMany({
            where: whereClause,
            orderBy: [{ createdAt: 'desc' }, { impact: 'desc' }],
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                        agentType: true,
                    },
                },
            },
        });
        return res.json(trends);
    }
    catch (error) {
        console.error('Error fetching trends:', error);
        return res.status(500).json({ message: 'Failed to fetch trends' });
    }
});
// Get trend by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const trend = await prisma.trendSignal.findUnique({
            where: { id },
            include: {
                agent: {
                    select: {
                        id: true,
                        name: true,
                        agentType: true,
                    },
                },
            },
        });
        if (!trend) {
            return res.status(404).json({ message: 'Trend not found' });
        }
        return res.json(trend);
    }
    catch (error) {
        console.error('Error fetching trend:', error);
        return res.status(500).json({ message: 'Failed to fetch trend' });
    }
});
// Run trend prediction analysis
router.post('/predict', async (req, res) => {
    try {
        const userId = req.user.id;
        const { keywords, sources, industries } = req.body;
        // Get agent manager
        const manager = (0, agents_1.getAgentManager)(prisma);
        // Find a TrendPredictor agent or create a temporary one
        let trendAgent = await prisma.aIAgent.findFirst({
            where: {
                agentType: 'TREND_ANALYZER',
                status: 'IDLE',
            },
        });
        if (!trendAgent) {
            // Create a temporary agent
            trendAgent = await prisma.aIAgent.create({
                data: {
                    name: 'Temporary Trend Predictor',
                    description: 'Created for trend analysis',
                    agentType: 'TREND_ANALYZER',
                    status: 'IDLE',
                    configuration: {
                        sources: sources || ['social_media', 'news', 'search_trends'],
                        industries: industries || ['marketing', 'technology'],
                        keywords: keywords || ['AI', 'automation', 'personalization'],
                    },
                    userId,
                },
            });
        }
        // Run the agent to predict trends
        const context = {
            keywords,
            sources,
            industries,
            userId,
        };
        const result = await manager.runAgent(trendAgent.id, context);
        // If successful, fetch the latest trends for this user
        if (result.success) {
            const latestTrends = await prisma.trendSignal.findMany({
                where: {
                    agentId: trendAgent.id,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 10,
            });
            return res.json({
                success: true,
                trends: latestTrends,
                message: 'Trend analysis completed successfully',
            });
        }
        else {
            return res.status(500).json({
                success: false,
                message: 'Failed to analyze trends',
                error: result.error,
            });
        }
    }
    catch (error) {
        console.error('Error running trend prediction:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to run trend prediction',
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
// Generate a trend report (for a specific trend or combined report)
router.post('/report', async (req, res) => {
    try {
        const { trendIds, title, format } = req.body;
        if (!trendIds || trendIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Trend IDs are required',
            });
        }
        // Fetch the requested trends
        const trends = await prisma.trendSignal.findMany({
            where: {
                id: { in: trendIds },
            },
        });
        if (trends.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No trends found with the provided IDs',
            });
        }
        // Generate a simple report structure
        const report = {
            title: title || `Trend Report - ${new Date().toLocaleDateString()}`,
            generatedAt: new Date(),
            trends: trends.map((trend) => ({
                id: trend.id,
                title: trend.title,
                description: trend.description,
                source: trend.source,
                signalType: trend.signalType,
                confidence: trend.confidence,
                impact: trend.impact,
                createdAt: trend.createdAt,
            })),
            summary: `This report covers ${trends.length} trends with an average confidence of ${((trends.reduce((sum, trend) => sum + trend.confidence, 0) /
                trends.length) *
                100).toFixed(1)}%.`,
            format: format || 'json',
        };
        return res.json({
            success: true,
            report,
        });
    }
    catch (error) {
        console.error('Error generating trend report:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate trend report',
        });
    }
});
exports.default = router;
//# sourceMappingURL=trend.routes.js.map