import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/routeAuth';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route GET /api/trends
 * @desc Get all trend signals for user's projects
 * @access Private
 */
router.get(
  '/',
  requireAuth(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user.id;

      // Get all projects for this user
      const userProjects = await prisma.project.findMany({
        where: {
          OR: [{ ownerId: userId }, { members: { some: { id: userId } } }],
        },
        select: { id: true },
      });

      const projectIds = userProjects.map((project) => project.id);

      // Optional filters
      const { impact, type, timeframe } = req.query;

      const whereClause: any = {
        agent: {
          project: {
            id: { in: projectIds },
          },
        },
      };

      if (impact) {
        whereClause.impact = impact;
      }

      if (type) {
        whereClause.signalType = type;
      }

      // Handle timeframe filtering
      if (timeframe) {
        const now = new Date();
        const date = new Date();

        switch (timeframe) {
          case 'day':
            date.setDate(now.getDate() - 1);
            break;
          case 'week':
            date.setDate(now.getDate() - 7);
            break;
          case 'month':
            date.setMonth(now.getMonth() - 1);
            break;
          case 'quarter':
            date.setMonth(now.getMonth() - 3);
            break;
          case 'year':
            date.setFullYear(now.getFullYear() - 1);
            break;
        }

        if (timeframe !== 'all') {
          whereClause.createdAt = { gte: date };
        }
      }

      const trends = await prisma.trendSignal.findMany({
        where: whereClause,
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              agentType: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.json(trends);
    } catch (error) {
      console.error('Error fetching trends:', error);
      return res.status(500).json({ message: 'Failed to fetch trends' });
    }
  }),
);

/**
 * @route POST /api/trends/predict
 * @desc Predict trend impact on campaigns
 * @access Private
 */
router.post(
  '/predict',
  requireAuth(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { trendSignalId, campaignId } = req.body;
      const userId = req.user.id;

      // Verify the trend signal exists
      const trendSignal = await prisma.trendSignal.findUnique({
        where: { id: trendSignalId },
        include: {
          agent: {
            select: {
              project: {
                select: {
                  id: true,
                  ownerId: true,
                  members: {
                    select: { id: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!trendSignal) {
        return res.status(404).json({ message: 'Trend signal not found' });
      }

      // Verify user has access to the project this trend belongs to
      const projectMembers = trendSignal.agent.project.members.map((m) => m.id);
      const hasAccess =
        trendSignal.agent.project.ownerId === userId ||
        projectMembers.includes(userId);

      if (!hasAccess) {
        return res
          .status(403)
          .json({ message: 'Not authorized to access this trend' });
      }

      // Verify the campaign exists
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: {
          id: true,
          name: true,
          campaignType: true,
          ownerId: true,
        },
      });

      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      // Verify user has access to the campaign
      if (campaign.ownerId !== userId) {
        return res
          .status(403)
          .json({ message: 'Not authorized to access this campaign' });
      }

      // Simulate trend prediction
      // In a real app, this would call an AI service or algorithm
      const impact = Math.random() * 100 - 50; // -50 to +50
      const recommendations = generateRecommendations(
        trendSignal,
        campaign,
        impact,
      );

      return res.json({
        trend: {
          id: trendSignal.id,
          title: trendSignal.title,
          description: trendSignal.description,
          signalType: trendSignal.signalType,
          impact: trendSignal.impact,
        },
        campaign: {
          id: campaign.id,
          name: campaign.name,
          type: campaign.campaignType,
        },
        prediction: {
          impact: impact > 0 ? 'POSITIVE' : impact < 0 ? 'NEGATIVE' : 'NEUTRAL',
          impactScore: Math.abs(impact),
          recommendations,
        },
      });
    } catch (error) {
      console.error('Error predicting trend impact:', error);
      return res
        .status(500)
        .json({ message: 'Failed to predict trend impact' });
    }
  }),
);

/**
 * Generate recommendations based on trend and campaign
 */
function generateRecommendations(
  trend: any,
  campaign: any,
  impact: number,
): string[] {
  const recommendations = [];

  if (impact > 30) {
    recommendations.push(
      `Significantly increase content around "${trend.title}"`,
    );
    recommendations.push(
      'Increase budget allocation to capitalize on this trend',
    );
  } else if (impact > 10) {
    recommendations.push(
      `Consider creating content related to "${trend.title}"`,
    );
    recommendations.push('Monitor this trend for further developments');
  } else if (impact < -30) {
    recommendations.push(`Avoid content related to "${trend.title}"`);
    recommendations.push('Consider shifting budget to more positive trends');
  } else if (impact < -10) {
    recommendations.push(
      `Be cautious with content related to "${trend.title}"`,
    );
  } else {
    recommendations.push('No significant action needed for this trend');
  }

  // Add campaign type specific recommendations
  switch (campaign.campaignType) {
    case 'SOCIAL_MEDIA':
      recommendations.push(
        impact > 0
          ? 'Consider boosting social posts related to this trend'
          : 'Avoid highlighting this trend in social content',
      );
      break;
    case 'CONTENT_MARKETING':
      recommendations.push(
        impact > 0
          ? 'Create in-depth content pieces exploring this trend'
          : 'Focus content on other trending topics',
      );
      break;
    case 'EMAIL':
      recommendations.push(
        impact > 0
          ? 'Include this trend in your next newsletter'
          : 'Avoid mentioning this trend in email communications',
      );
      break;
  }

  return recommendations;
}

export default router;
