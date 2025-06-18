'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.getSentimentSummary =
  exports.deleteFeedback =
  exports.updateFeedback =
  exports.createFeedback =
  exports.getFeedback =
  exports.getAllFeedback =
    void 0;
const index_1 = require('../index');
/**
 * Get all feedback entries with filtering options
 * @route GET /api/feedback
 * @access Private
 */
const getAllFeedback = async (req, res) => {
  try {
    const {
      userId,
      sourceType,
      sourceId,
      sentiment,
      channel,
      startDate,
      endDate,
    } = req.query;
    const currentUserId = req.user?.id;
    // Build where clause
    const where = {};
    // Filter by user
    if (userId) {
      where.userId = userId;
    }
    // Filter by source type
    if (sourceType) {
      where.sourceType = sourceType;
    }
    // Filter by source ID
    if (sourceId) {
      where.sourceId = sourceId;
    }
    // Filter by sentiment
    if (sentiment) {
      where.sentiment = sentiment;
    }
    // Filter by channel
    if (channel) {
      where.channel = channel;
    }
    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }
    // If user is not admin, only show feedback they're authorized to see
    if (!userId) {
      // TODO: Add admin check here if needed
      // Only show feedback for content/outreach that belongs to projects the user has access to
      where.OR = [
        { userId: currentUserId },
        {
          content_rel: {
            campaign: {
              project: {
                OR: [
                  { ownerId: currentUserId },
                  { members: { some: { id: currentUserId } } },
                ],
              },
            },
          },
        },
        {
          outreachTask: {
            campaign: {
              project: {
                OR: [
                  { ownerId: currentUserId },
                  { members: { some: { id: currentUserId } } },
                ],
              },
            },
          },
        },
      ];
    }
    // Get feedback with filters
    const feedback = await index_1.prisma.feedback.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        content_rel: {
          select: {
            id: true,
            title: true,
            contentType: true,
            campaignId: true,
          },
        },
        outreachTask: {
          select: {
            id: true,
            title: true,
            outreachType: true,
            campaignId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback,
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
exports.getAllFeedback = getAllFeedback;
/**
 * Get single feedback entry
 * @route GET /api/feedback/:id
 * @access Private
 */
const getFeedback = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const userId = req.user.id;
    // Get feedback with details
    const feedback = await index_1.prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        content_rel: {
          select: {
            id: true,
            title: true,
            contentType: true,
            campaignId: true,
            campaign: {
              select: {
                projectId: true,
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
        },
        outreachTask: {
          select: {
            id: true,
            title: true,
            outreachType: true,
            campaignId: true,
            campaign: {
              select: {
                projectId: true,
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
        },
      },
    });
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }
    // Check if user is authorized to view this feedback
    let hasAccess = feedback.userId === userId;
    // Check if user has access to the related project
    if (!hasAccess && feedback.content_rel) {
      const project = feedback.content_rel.campaign?.project;
      hasAccess =
        project?.ownerId === userId ||
        project?.members.some((member) => member.id === userId) ||
        false;
    }
    if (!hasAccess && feedback.outreachTask) {
      const project = feedback.outreachTask.campaign?.project;
      hasAccess =
        project?.ownerId === userId ||
        project?.members.some((member) => member.id === userId) ||
        false;
    }
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this feedback',
      });
    }
    res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
exports.getFeedback = getFeedback;
/**
 * Create new feedback
 * @route POST /api/feedback
 * @access Private
 */
const createFeedback = async (req, res) => {
  try {
    const {
      content,
      sentiment,
      sourceType,
      sourceId,
      channel,
      contentId,
      outreachTaskId,
    } = req.body;
    const userId = req.user.id;
    // Validate required fields
    if (!content || !sentiment || !sourceType || !sourceId || !channel) {
      return res.status(400).json({
        success: false,
        message:
          'Please provide content, sentiment, sourceType, sourceId, and channel',
      });
    }
    // Check that either contentId or outreachTaskId is provided for proper relations
    if (sourceType === 'CONTENT' && !contentId) {
      return res.status(400).json({
        success: false,
        message: 'contentId is required when sourceType is CONTENT',
      });
    }
    if (sourceType === 'OUTREACH' && !outreachTaskId) {
      return res.status(400).json({
        success: false,
        message: 'outreachTaskId is required when sourceType is OUTREACH',
      });
    }
    // Check access permissions based on source type
    if (sourceType === 'CONTENT' && contentId) {
      const content = await index_1.prisma.generatedContent.findUnique({
        where: { id: contentId },
        include: {
          campaign: {
            select: {
              projectId: true,
              project: {
                select: {
                  ownerId: true,
                  members: { select: { id: true } },
                },
              },
            },
          },
        },
      });
      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Content not found',
        });
      }
      // Users can always provide feedback on content they view
      // But we should verify the content actually exists
    }
    if (sourceType === 'OUTREACH' && outreachTaskId) {
      const outreachTask = await index_1.prisma.outreachTask.findUnique({
        where: { id: outreachTaskId },
        include: {
          campaign: {
            select: {
              projectId: true,
              project: {
                select: {
                  ownerId: true,
                  members: { select: { id: true } },
                },
              },
            },
          },
        },
      });
      if (!outreachTask) {
        return res.status(404).json({
          success: false,
          message: 'Outreach task not found',
        });
      }
      // Similar to content, anyone who receives an outreach can provide feedback
    }
    // Create feedback
    const feedback = await index_1.prisma.feedback.create({
      data: {
        content,
        sentiment: sentiment,
        sourceType: sourceType,
        sourceId,
        channel: channel,
        userId,
        contentId,
        outreachTaskId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    res.status(201).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
exports.createFeedback = createFeedback;
/**
 * Update feedback
 * @route PUT /api/feedback/:id
 * @access Private
 */
const updateFeedback = async (req, res) => {
  try {
    const { content, sentiment } = req.body;
    const feedbackId = req.params.id;
    const userId = req.user.id;
    // Find the feedback to check ownership
    const existingFeedback = await index_1.prisma.feedback.findUnique({
      where: { id: feedbackId },
    });
    if (!existingFeedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }
    // Only the user who created the feedback can modify it
    if (existingFeedback.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this feedback',
      });
    }
    // Update feedback
    const feedback = await index_1.prisma.feedback.update({
      where: { id: feedbackId },
      data: {
        content,
        sentiment: sentiment,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    res.status(200).json({
      success: true,
      data: feedback,
    });
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
exports.updateFeedback = updateFeedback;
/**
 * Delete feedback
 * @route DELETE /api/feedback/:id
 * @access Private
 */
const deleteFeedback = async (req, res) => {
  try {
    const feedbackId = req.params.id;
    const userId = req.user.id;
    // Find the feedback to check ownership
    const feedback = await index_1.prisma.feedback.findUnique({
      where: { id: feedbackId },
      include: {
        content_rel: {
          select: {
            campaign: {
              select: {
                project: {
                  select: {
                    ownerId: true,
                  },
                },
              },
            },
          },
        },
        outreachTask: {
          select: {
            campaign: {
              select: {
                project: {
                  select: {
                    ownerId: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found',
      });
    }
    // Check if user is the feedback creator or project owner
    const isCreator = feedback.userId === userId;
    let isProjectOwner = false;
    if (feedback.content_rel?.campaign?.project) {
      isProjectOwner = feedback.content_rel.campaign.project.ownerId === userId;
    } else if (feedback.outreachTask?.campaign?.project) {
      isProjectOwner =
        feedback.outreachTask.campaign.project.ownerId === userId;
    }
    if (!isCreator && !isProjectOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this feedback',
      });
    }
    // Delete feedback
    await index_1.prisma.feedback.delete({
      where: { id: feedbackId },
    });
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
exports.deleteFeedback = deleteFeedback;
/**
 * Get sentiment analysis summary
 * @route GET /api/feedback/sentiment-summary
 * @access Private
 */
const getSentimentSummary = async (req, res) => {
  try {
    const { sourceType, sourceId, projectId, campaignId, startDate, endDate } =
      req.query;
    const userId = req.user.id;
    // Build where clause
    const where = {};
    // Filter by source type
    if (sourceType) {
      where.sourceType = sourceType;
    }
    // Filter by source ID
    if (sourceId) {
      where.sourceId = sourceId;
    }
    // Filter by project
    if (projectId) {
      where.OR = [
        {
          content_rel: {
            campaign: {
              projectId: projectId,
            },
          },
        },
        {
          outreachTask: {
            campaign: {
              projectId: projectId,
            },
          },
        },
      ];
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
      where.OR = [
        {
          content_rel: {
            campaignId: campaignId,
          },
        },
        {
          outreachTask: {
            campaignId: campaignId,
          },
        },
      ];
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
    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }
    // If no specific filters, limit to projects the user has access to
    if (!sourceId && !projectId && !campaignId) {
      where.OR = [
        { userId },
        {
          content_rel: {
            campaign: {
              project: {
                OR: [
                  { ownerId: userId },
                  { members: { some: { id: userId } } },
                ],
              },
            },
          },
        },
        {
          outreachTask: {
            campaign: {
              project: {
                OR: [
                  { ownerId: userId },
                  { members: { some: { id: userId } } },
                ],
              },
            },
          },
        },
      ];
    }
    // Get feedback count by sentiment
    const sentimentCounts = await index_1.prisma.feedback.groupBy({
      by: ['sentiment'],
      where,
      _count: true,
      orderBy: {
        sentiment: 'asc',
      },
    });
    // Calculate sentiment score
    // Convert sentiment enum to numeric value and calculate weighted average
    const sentimentValues = {
      VERY_NEGATIVE: -2,
      NEGATIVE: -1,
      NEUTRAL: 0,
      POSITIVE: 1,
      VERY_POSITIVE: 2,
    };
    let totalFeedback = 0;
    let weightedSum = 0;
    sentimentCounts.forEach((count) => {
      const sentiment = count.sentiment;
      const value = sentimentValues[sentiment];
      const feedbackCount = count._count;
      totalFeedback += feedbackCount;
      weightedSum += value * feedbackCount;
    });
    const averageSentiment =
      totalFeedback > 0 ? weightedSum / totalFeedback : 0;
    // Get recent feedback for context
    const recentFeedback = await index_1.prisma.feedback.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        content: true,
        sentiment: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    // Format the summary
    const summary = {
      sentimentDistribution: sentimentCounts.map((count) => ({
        sentiment: count.sentiment,
        count: count._count,
      })),
      totalFeedback,
      averageSentiment,
      sentimentScore: averageSentiment.toFixed(2),
      recentFeedback,
    };
    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Get sentiment summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
exports.getSentimentSummary = getSentimentSummary;
