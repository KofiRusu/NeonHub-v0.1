import { PrismaClient, Campaign, CampaignType, CampaignStatus } from '@prisma/client';
import { CampaignService, CreateCampaignData, UpdateCampaignData } from '../../../services/campaigns/CampaignService';

// Mock Prisma
jest.mock('@prisma/client');

const mockPrisma = {
  campaign: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  metric: {
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

describe('CampaignService', () => {
  let campaignService: CampaignService;

  beforeEach(() => {
    campaignService = new CampaignService(mockPrisma);
    jest.clearAllMocks();
  });

  describe('getCampaigns', () => {
    it('should return campaigns for a user', async () => {
      const userId = 'user-123';
      const mockCampaigns = [
        { id: 'campaign-1', name: 'Campaign 1', ownerId: userId },
        { id: 'campaign-2', name: 'Campaign 2', ownerId: userId },
      ];

      (mockPrisma.campaign.findMany as jest.Mock).mockResolvedValueOnce(mockCampaigns);

      const result = await campaignService.getCampaigns(userId);

      expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
        include: undefined,
      });

      expect(result).toEqual(mockCampaigns);
    });

    it('should filter campaigns by project ID if provided', async () => {
      const userId = 'user-123';
      const projectId = 'project-456';
      const mockCampaigns = [{ id: 'campaign-1', name: 'Campaign 1', ownerId: userId, projectId }];

      (mockPrisma.campaign.findMany as jest.Mock).mockResolvedValueOnce(mockCampaigns);

      const result = await campaignService.getCampaigns(userId, projectId);

      expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith({
        where: { ownerId: userId, projectId },
        orderBy: { createdAt: 'desc' },
        include: undefined,
      });

      expect(result).toEqual(mockCampaigns);
    });

    it('should include related data when includeRelated is true', async () => {
      const userId = 'user-123';
      const mockCampaigns = [{ id: 'campaign-1', name: 'Campaign 1', ownerId: userId }];

      (mockPrisma.campaign.findMany as jest.Mock).mockResolvedValueOnce(mockCampaigns);

      const result = await campaignService.getCampaigns(userId, undefined, true);

      expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith({
        where: { ownerId: userId },
        orderBy: { createdAt: 'desc' },
        include: expect.objectContaining({
          generatedContents: expect.any(Object),
          outreachTasks: expect.any(Object),
          agents: expect.any(Object),
          _count: expect.any(Object),
        }),
      });

      expect(result).toEqual(mockCampaigns);
    });
  });

  describe('getCampaign', () => {
    it('should return a campaign by ID', async () => {
      const campaignId = 'campaign-123';
      const mockCampaign = { id: campaignId, name: 'Test Campaign' };

      (mockPrisma.campaign.findUnique as jest.Mock).mockResolvedValueOnce(mockCampaign);

      const result = await campaignService.getCampaign(campaignId);

      expect(mockPrisma.campaign.findUnique).toHaveBeenCalledWith({
        where: { id: campaignId },
        include: undefined,
      });

      expect(result).toEqual(mockCampaign);
    });

    it('should include related data when includeRelated is true', async () => {
      const campaignId = 'campaign-123';
      const mockCampaign = { id: campaignId, name: 'Test Campaign' };

      (mockPrisma.campaign.findUnique as jest.Mock).mockResolvedValueOnce(mockCampaign);

      const result = await campaignService.getCampaign(campaignId, true);

      expect(mockPrisma.campaign.findUnique).toHaveBeenCalledWith({
        where: { id: campaignId },
        include: expect.objectContaining({
          generatedContents: expect.any(Object),
          outreachTasks: expect.any(Object),
          metrics: expect.any(Object),
          agents: true,
        }),
      });

      expect(result).toEqual(mockCampaign);
    });

    it('should return null when campaign is not found', async () => {
      (mockPrisma.campaign.findUnique as jest.Mock).mockResolvedValueOnce(null);

      const result = await campaignService.getCampaign('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('createCampaign', () => {
    it('should create a new campaign', async () => {
      const campaignData: CreateCampaignData = {
        name: 'New Campaign',
        description: 'Test description',
        campaignType: 'CONTENT_MARKETING' as CampaignType,
        ownerId: 'user-123',
        projectId: 'project-456',
      };

      const mockCampaign = {
        id: 'campaign-123',
        ...campaignData,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.campaign.create as jest.Mock).mockResolvedValueOnce(mockCampaign);

      const result = await campaignService.createCampaign(campaignData);

      expect(mockPrisma.campaign.create).toHaveBeenCalledWith({
        data: {
          ...campaignData,
          status: 'DRAFT',
          agents: undefined,
        },
      });

      expect(result).toEqual(mockCampaign);
    });

    it('should connect agents if agentIds are provided', async () => {
      const campaignData: CreateCampaignData = {
        name: 'New Campaign',
        description: 'Test description',
        campaignType: 'CONTENT_MARKETING' as CampaignType,
        ownerId: 'user-123',
        projectId: 'project-456',
        agentIds: ['agent-1', 'agent-2'],
      };

      const mockCampaign = {
        id: 'campaign-123',
        ...campaignData,
        status: 'DRAFT',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.campaign.create as jest.Mock).mockResolvedValueOnce(mockCampaign);

      const result = await campaignService.createCampaign(campaignData);

      expect(mockPrisma.campaign.create).toHaveBeenCalledWith({
        data: {
          name: campaignData.name,
          description: campaignData.description,
          campaignType: campaignData.campaignType,
          ownerId: campaignData.ownerId,
          projectId: campaignData.projectId,
          status: 'DRAFT',
          agents: {
            connect: [
              { id: 'agent-1' },
              { id: 'agent-2' },
            ],
          },
        },
      });

      expect(result).toEqual(mockCampaign);
    });
  });

  describe('updateCampaign', () => {
    it('should update a campaign without agent changes', async () => {
      const campaignId = 'campaign-123';
      const updateData: UpdateCampaignData = {
        name: 'Updated Campaign',
        description: 'Updated description',
        status: 'ACTIVE' as CampaignStatus,
      };

      const mockCampaign = {
        id: campaignId,
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (mockPrisma.campaign.update as jest.Mock).mockResolvedValueOnce(mockCampaign);

      const result = await campaignService.updateCampaign(campaignId, updateData);

      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: campaignId },
        data: updateData,
      });

      expect(result).toEqual(mockCampaign);
    });

    it('should update a campaign with agent changes', async () => {
      const campaignId = 'campaign-123';
      const updateData: UpdateCampaignData = {
        name: 'Updated Campaign',
        agentIds: ['agent-2', 'agent-3'],
      };

      const mockExistingCampaign = {
        id: campaignId,
        name: 'Original Campaign',
        agents: [
          { id: 'agent-1' },
          { id: 'agent-2' },
        ],
      };

      const mockUpdatedCampaign = {
        id: campaignId,
        name: 'Updated Campaign',
        agents: [
          { id: 'agent-2' },
          { id: 'agent-3' },
        ],
      };

      (mockPrisma.campaign.findUnique as jest.Mock).mockResolvedValueOnce(mockExistingCampaign);
      (mockPrisma.campaign.update as jest.Mock).mockResolvedValueOnce(mockUpdatedCampaign);

      const result = await campaignService.updateCampaign(campaignId, updateData);

      expect(mockPrisma.campaign.findUnique).toHaveBeenCalledWith({
        where: { id: campaignId },
        include: { agents: true },
      });

      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: campaignId },
        data: {
          name: 'Updated Campaign',
          agents: {
            disconnect: [{ id: 'agent-1' }],
            connect: [{ id: 'agent-3' }],
          },
        },
      });

      expect(result).toEqual(mockUpdatedCampaign);
    });
  });

  describe('deleteCampaign', () => {
    it('should delete a campaign', async () => {
      const campaignId = 'campaign-123';
      const mockCampaign = { id: campaignId, name: 'Test Campaign' };

      (mockPrisma.campaign.delete as jest.Mock).mockResolvedValueOnce(mockCampaign);

      const result = await campaignService.deleteCampaign(campaignId);

      expect(mockPrisma.campaign.delete).toHaveBeenCalledWith({
        where: { id: campaignId },
      });

      expect(result).toEqual(mockCampaign);
    });
  });

  describe('scheduleCampaign', () => {
    it('should schedule a campaign with both start and end dates', async () => {
      const campaignId = 'campaign-123';
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const mockCampaign = { 
        id: campaignId, 
        name: 'Test Campaign',
        startDate,
        endDate,
        status: 'SCHEDULED' as CampaignStatus,
      };

      (mockPrisma.campaign.update as jest.Mock).mockResolvedValueOnce(mockCampaign);

      const result = await campaignService.scheduleCampaign(campaignId, startDate, endDate);

      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: campaignId },
        data: {
          startDate,
          endDate,
          status: 'SCHEDULED',
        },
      });

      expect(result).toEqual(mockCampaign);
    });

    it('should set status to ACTIVE if start date is in the past', async () => {
      const campaignId = 'campaign-123';
      const startDate = new Date(Date.now() - 86400000); // Yesterday
      const endDate = new Date(Date.now() + 86400000); // Tomorrow
      const mockCampaign = { 
        id: campaignId, 
        name: 'Test Campaign',
        startDate,
        endDate,
        status: 'ACTIVE' as CampaignStatus,
      };

      (mockPrisma.campaign.update as jest.Mock).mockResolvedValueOnce(mockCampaign);

      const result = await campaignService.scheduleCampaign(campaignId, startDate, endDate);

      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: campaignId },
        data: {
          startDate,
          endDate,
          status: 'ACTIVE',
        },
      });

      expect(result).toEqual(mockCampaign);
    });
  });
}); 