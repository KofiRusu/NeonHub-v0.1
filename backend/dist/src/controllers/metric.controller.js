"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetricsSummary = exports.deleteMetric = exports.updateMetric = exports.createMetric = exports.getMetric = exports.getMetrics = void 0;
const index_1 = require("../index");
/**
 * Get all metrics with filtering options
 * @route GET /api/metrics
 * @access Private
 */
const getMetrics = async (req, res) => {
    try {
        const { projectId, campaignId, source, name, startDate, endDate } = req.query;
        const userId = req.user?.id;
        // Build where clause
        const where = {};
        // Filter by project
        if (projectId) {
            where.projectId = projectId;
            // Check if user has access to the project
            const project = await index_1.prisma.project.findFirst({
                where: {
                    id: projectId,
                    OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
                },
            });
            if (!project) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this project',
                });
            }
        }
        // Filter by campaign
        if (campaignId) {
            where.campaignId = campaignId;
            // Check if user has access to the campaign
            const campaign = await index_1.prisma.campaign.findFirst({
                where: {
                    id: campaignId,
                    OR: [
                        { ownerId: userId },
                        {
                            project: {
                                OR: [
                                    { ownerId: userId },
                                    { members: { some: { id: userId } } },
                                ],
                            },
                        },
                    ],
                },
            });
            if (!campaign) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this campaign',
                });
            }
        }
        // Filter by source
        if (source) {
            where.source = source;
        }
        // Filter by name
        if (name) {
            where.name = name;
        }
        // Filter by date range
        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) {
                where.timestamp.gte = new Date(startDate);
            }
            if (endDate) {
                where.timestamp.lte = new Date(endDate);
            }
        }
        // If no projectId or campaignId specified, limit to projects the user has access to
        if (!projectId && !campaignId) {
            where.OR = [
                {
                    project: {
                        OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
                    },
                },
                {
                    campaign: {
                        OR: [
                            { ownerId: userId },
                            {
                                project: {
                                    OR: [
                                        { ownerId: userId },
                                        { members: { some: { id: userId } } },
                                    ],
                                },
                            },
                        ],
                    },
                },
            ];
        }
        // Get metrics with filters
        const metrics = await index_1.prisma.metric.findMany({
            where,
            include: {
                campaign: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                timestamp: 'desc',
            },
        });
        res.status(200).json({
            success: true,
            count: metrics.length,
            data: metrics,
        });
    }
    catch (error) {
        console.error('Get metrics error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getMetrics = getMetrics;
/**
 * Get a single metric by ID
 * @route GET /api/metrics/:id
 * @access Private
 */
const getMetric = async (req, res) => {
    try {
        const metricId = req.params.id;
        const userId = req.user?.id;
        // Get metric with related data
        const metric = await index_1.prisma.metric.findUnique({
            where: { id: metricId },
            include: {
                campaign: {
                    select: {
                        id: true,
                        name: true,
                        ownerId: true,
                        project: {
                            select: {
                                id: true,
                                ownerId: true,
                                members: {
                                    select: {
                                        id: true,
                                    },
                                },
                            },
                        },
                    },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                        ownerId: true,
                        members: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
            },
        });
        if (!metric) {
            return res.status(404).json({
                success: false,
                message: 'Metric not found',
            });
        }
        // Check if user has access to the associated project or campaign
        let hasAccess = false;
        if (metric.project) {
            hasAccess =
                metric.project.ownerId === userId ||
                    metric.project.members.some((member) => member.id === userId);
        }
        if (!hasAccess && metric.campaign) {
            hasAccess =
                metric.campaign.ownerId === userId ||
                    metric.campaign.project.ownerId === userId ||
                    metric.campaign.project.members.some((member) => member.id === userId);
        }
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this metric',
            });
        }
        res.status(200).json({
            success: true,
            data: metric,
        });
    }
    catch (error) {
        console.error('Get metric error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getMetric = getMetric;
/**
 * Create a new metric
 * @route POST /api/metrics
 * @access Private
 */
const createMetric = async (req, res) => {
    try {
        const { name, source, value, unit, dimension, projectId, campaignId, metadata, } = req.body;
        const userId = req.user?.id;
        // Validate required fields
        if (!name || !source || value === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, source, and value',
            });
        }
        // Must have either projectId or campaignId
        if (!projectId && !campaignId) {
            return res.status(400).json({
                success: false,
                message: 'Please provide either projectId or campaignId',
            });
        }
        // Check access permissions
        if (projectId) {
            const project = await index_1.prisma.project.findFirst({
                where: {
                    id: projectId,
                    OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
                },
            });
            if (!project) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to create metrics for this project',
                });
            }
        }
        if (campaignId) {
            const campaign = await index_1.prisma.campaign.findFirst({
                where: {
                    id: campaignId,
                    OR: [
                        { ownerId: userId },
                        {
                            project: {
                                OR: [
                                    { ownerId: userId },
                                    { members: { some: { id: userId } } },
                                ],
                            },
                        },
                    ],
                },
            });
            if (!campaign) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to create metrics for this campaign',
                });
            }
        }
        // Create the metric
        const metric = await index_1.prisma.metric.create({
            data: {
                name,
                source,
                value,
                unit,
                dimension,
                projectId,
                campaignId,
                metadata: metadata || {},
                timestamp: new Date(),
            },
        });
        res.status(201).json({
            success: true,
            data: metric,
        });
    }
    catch (error) {
        console.error('Create metric error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.createMetric = createMetric;
/**
 * Update a metric
 * @route PUT /api/metrics/:id
 * @access Private
 */
const updateMetric = async (req, res) => {
    try {
        const { name, source, value, unit, dimension, metadata } = req.body;
        const metricId = req.params.id;
        const userId = req.user?.id;
        // Find the metric to check access rights
        const existingMetric = await index_1.prisma.metric.findUnique({
            where: { id: metricId },
            include: {
                project: {
                    select: {
                        ownerId: true,
                        members: {
                            select: {
                                id: true,
                            },
                        },
                    },
                },
                campaign: {
                    select: {
                        ownerId: true,
                        project: {
                            select: {
                                ownerId: true,
                                members: {
                                    select: {
                                        id: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!existingMetric) {
            return res.status(404).json({
                success: false,
                message: 'Metric not found',
            });
        }
        // Check if user has access to the associated project or campaign
        let hasAccess = false;
        if (existingMetric.project) {
            hasAccess =
                existingMetric.project.ownerId === userId ||
                    existingMetric.project.members.some((member) => member.id === userId);
        }
        if (!hasAccess && existingMetric.campaign) {
            hasAccess =
                existingMetric.campaign.ownerId === userId ||
                    existingMetric.campaign.project.ownerId === userId ||
                    existingMetric.campaign.project.members.some((member) => member.id === userId);
        }
        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this metric',
            });
        }
        // Update the metric
        const metric = await index_1.prisma.metric.update({
            where: { id: metricId },
            data: {
                name,
                source,
                value,
                unit,
                dimension,
                metadata,
            },
        });
        res.status(200).json({
            success: true,
            data: metric,
        });
    }
    catch (error) {
        console.error('Update metric error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.updateMetric = updateMetric;
/**
 * Delete a metric
 * @route DELETE /api/metrics/:id
 * @access Private
 */
const deleteMetric = async (req, res) => {
    try {
        const metricId = req.params.id;
        const userId = req.user?.id;
        // Find the metric to check access rights
        const metric = await index_1.prisma.metric.findUnique({
            where: { id: metricId },
            include: {
                project: {
                    select: {
                        ownerId: true,
                    },
                },
                campaign: {
                    select: {
                        ownerId: true,
                        project: {
                            select: {
                                ownerId: true,
                            },
                        },
                    },
                },
            },
        });
        if (!metric) {
            return res.status(404).json({
                success: false,
                message: 'Metric not found',
            });
        }
        // Check if user is owner of the project or campaign
        let isOwner = false;
        if (metric.project) {
            isOwner = metric.project.ownerId === userId;
        }
        if (!isOwner && metric.campaign) {
            isOwner =
                metric.campaign.ownerId === userId ||
                    metric.campaign.project.ownerId === userId;
        }
        if (!isOwner) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this metric',
            });
        }
        // Delete the metric
        await index_1.prisma.metric.delete({
            where: { id: metricId },
        });
        res.status(200).json({
            success: true,
            data: {},
        });
    }
    catch (error) {
        console.error('Delete metric error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.deleteMetric = deleteMetric;
/**
 * Get metrics summary/aggregated data
 * @route GET /api/metrics/summary
 * @access Private
 */
const getMetricsSummary = async (req, res) => {
    try {
        const { projectId, campaignId, groupBy = 'day', startDate, endDate, } = req.query;
        const userId = req.user?.id;
        // Build where clause
        const where = {};
        // Filter by project or campaign
        if (projectId) {
            where.projectId = projectId;
            // Check access
            const project = await index_1.prisma.project.findFirst({
                where: {
                    id: projectId,
                    OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
                },
            });
            if (!project) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this project',
                });
            }
        }
        else if (campaignId) {
            where.campaignId = campaignId;
            // Check access
            const campaign = await index_1.prisma.campaign.findFirst({
                where: {
                    id: campaignId,
                    OR: [
                        { ownerId: userId },
                        {
                            project: {
                                OR: [
                                    { ownerId: userId },
                                    { members: { some: { id: userId } } },
                                ],
                            },
                        },
                    ],
                },
            });
            if (!campaign) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to access this campaign',
                });
            }
        }
        else {
            // If neither projectId nor campaignId provided, limit to accessible projects
            where.OR = [
                {
                    project: {
                        OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
                    },
                },
                {
                    campaign: {
                        OR: [
                            { ownerId: userId },
                            {
                                project: {
                                    OR: [
                                        { ownerId: userId },
                                        { members: { some: { id: userId } } },
                                    ],
                                },
                            },
                        ],
                    },
                },
            ];
        }
        // Date range filter
        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate) {
                where.timestamp.gte = new Date(startDate);
            }
            if (endDate) {
                where.timestamp.lte = new Date(endDate);
            }
        }
        // Raw aggregation query using Prisma
        const metrics = await index_1.prisma.metric.findMany({
            where,
            orderBy: {
                timestamp: 'desc',
            },
        });
        // Process the results based on groupBy parameter
        const summary = processMetricsSummary(metrics, groupBy);
        res.status(200).json({
            success: true,
            data: summary,
        });
    }
    catch (error) {
        console.error('Get metrics summary error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};
exports.getMetricsSummary = getMetricsSummary;
/**
 * Process metrics data into a summary based on grouping
 */
function processMetricsSummary(metrics, groupBy) {
    const summary = {};
    metrics.forEach((metric) => {
        // Generate key based on groupBy
        let key;
        const date = new Date(metric.timestamp);
        switch (groupBy) {
            case 'hour':
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
                break;
            case 'day':
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                break;
            case 'week': {
                // Get the first day of the week (Sunday)
                const firstDayOfWeek = new Date(date);
                const dayOfWeek = date.getDay();
                firstDayOfWeek.setDate(date.getDate() - dayOfWeek);
                key = `${firstDayOfWeek.getFullYear()}-${String(firstDayOfWeek.getMonth() + 1).padStart(2, '0')}-${String(firstDayOfWeek.getDate()).padStart(2, '0')}`;
                break;
            }
            case 'month':
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                break;
            case 'source':
                key = metric.source;
                break;
            case 'name':
                key = metric.name;
                break;
            default:
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
        // Initialize or update summary entry
        if (!summary[key]) {
            summary[key] = {
                count: 0,
                sum: 0,
                avg: 0,
                min: metric.value,
                max: metric.value,
                metrics: [],
            };
        }
        // Update summary statistics
        summary[key].count += 1;
        summary[key].sum += metric.value;
        summary[key].avg = summary[key].sum / summary[key].count;
        summary[key].min = Math.min(summary[key].min, metric.value);
        summary[key].max = Math.max(summary[key].max, metric.value);
        summary[key].metrics.push({
            id: metric.id,
            name: metric.name,
            value: metric.value,
            timestamp: metric.timestamp,
        });
    });
    // Convert to array
    return Object.keys(summary).map((key) => ({
        key,
        ...summary[key],
    }));
}
//# sourceMappingURL=metric.controller.js.map