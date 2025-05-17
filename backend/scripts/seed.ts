import { PrismaClient, AgentType, AgentStatus, CampaignType, CampaignStatus, ContentType, Platform, ContentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AgentScheduler } from '../src/agents/scheduler/AgentScheduler';
import { getAgentManager } from '../src/agents';

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Main function to seed the database
 */
async function seed() {
  console.log('🌱 Starting database seed...');
  
  try {
    // Clear existing data (optional - comment out in production)
    await clearExistingData();
    
    // Create users
    const users = await createUsers();
    
    // Create projects
    const projects = await createProjects(users);
    
    // Create AI agents
    const agents = await createAgents(projects, users);
    
    // Create campaigns
    const campaigns = await createCampaigns(projects, users, agents);
    
    // Create content
    const content = await createContent(agents, campaigns, users);
    
    // Create metrics
    await createMetrics(campaigns, projects);
    
    // Create trend signals
    await createTrendSignals(agents);
    
    // Schedule an agent to run hourly
    await scheduleAgentToRunHourly(agents[0].id);
    
    // Create execution sessions
    await createExecutionSessions(agents);
    
    console.log('✅ Seed completed successfully!');
    
    // Log sample login credentials
    console.log('\n🔑 Sample Login Credentials:');
    console.log('Admin: admin@neonhub.com / password123');
    console.log('User: user@neonhub.com / password123');
    
    // Final statistics
    console.log('\n📊 Seeded Data Statistics:');
    console.log(`👤 Users: ${users.length}`);
    console.log(`📁 Projects: ${projects.length}`);
    console.log(`🤖 Agents: ${agents.length}`);
    console.log(`📢 Campaigns: ${campaigns.length}`);
    console.log(`📝 Content Items: ${content.length}`);
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Clear existing data from the database
 */
async function clearExistingData() {
  console.log('🧹 Clearing existing data...');
  
  // Order matters due to foreign key constraints
  await prisma.agentExecutionSession.deleteMany({});
  await prisma.metric.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.trendSignal.deleteMany({});
  await prisma.generatedContent.deleteMany({});
  await prisma.outreachTask.deleteMany({});
  await prisma.personalizationProfile.deleteMany({});
  await prisma.integrationCredential.deleteMany({});
  await prisma.campaign.deleteMany({});
  await prisma.aIAgent.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});
  
  console.log('✅ Data cleared');
}

/**
 * Create sample users
 */
async function createUsers() {
  console.log('👤 Creating users...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const users = [
    {
      name: 'Admin User',
      email: 'admin@neonhub.com',
      password: hashedPassword,
      role: 'ADMIN',
      avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=0D8ABC&color=fff',
    },
    {
      name: 'Regular User',
      email: 'user@neonhub.com',
      password: hashedPassword,
      role: 'USER',
      avatar: 'https://ui-avatars.com/api/?name=Regular+User&background=FF8066&color=fff',
    },
    {
      name: 'Marketing Manager',
      email: 'marketing@neonhub.com',
      password: hashedPassword,
      role: 'USER',
      avatar: 'https://ui-avatars.com/api/?name=Marketing+Manager&background=47A025&color=fff',
    },
    {
      name: 'Content Creator',
      email: 'content@neonhub.com',
      password: hashedPassword,
      role: 'USER',
      avatar: 'https://ui-avatars.com/api/?name=Content+Creator&background=9B5DE5&color=fff',
    },
  ];
  
  const createdUsers = [];
  for (const user of users) {
    createdUsers.push(await prisma.user.upsert({
      where: { email: user.email },
      update: user,
      create: user,
    }));
  }
  
  console.log(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
}

/**
 * Create sample projects
 */
async function createProjects(users: any[]) {
  console.log('📁 Creating projects...');
  
  const projects = [
    {
      name: 'Product Launch Campaign',
      description: 'Campaign for our new product launch in Q3',
      ownerId: users[0].id,
      members: {
        connect: users.map(user => ({ id: user.id })),
      },
    },
    {
      name: 'Brand Awareness Initiative',
      description: 'Ongoing brand awareness campaign across multiple channels',
      ownerId: users[2].id,
      members: {
        connect: [{ id: users[0].id }, { id: users[2].id }, { id: users[3].id }],
      },
    },
    {
      name: 'Content Marketing Strategy',
      description: 'Development of our content marketing strategy for the next year',
      ownerId: users[3].id,
      members: {
        connect: [{ id: users[1].id }, { id: users[3].id }],
      },
    },
  ];
  
  const createdProjects = [];
  for (const project of projects) {
    createdProjects.push(await prisma.project.create({
      data: project,
    }));
  }
  
  console.log(`✅ Created ${createdProjects.length} projects`);
  return createdProjects;
}

/**
 * Create sample AI agents
 */
async function createAgents(projects: any[], users: any[]) {
  console.log('🤖 Creating AI agents...');
  
  const agents = [
    {
      name: 'Content Creator Pro',
      description: 'Advanced AI agent for generating marketing content across multiple formats',
      agentType: AgentType.CONTENT_CREATOR,
      status: AgentStatus.IDLE,
      projectId: projects[0].id,
      managerId: users[0].id,
      configuration: {
        maxRetries: 3,
        autoRetry: true,
        retryDelay: 60000,
        topics: ['product launch', 'marketing', 'technology'],
        tone: 'professional',
        contentTypes: ['BLOG_POST', 'SOCIAL_POST', 'EMAIL'],
        platforms: ['LINKEDIN', 'TWITTER', 'EMAIL'],
        maxLength: 1000,
        includeHashtags: true,
      },
    },
    {
      name: 'Trend Analyzer',
      description: 'AI agent that analyzes market trends and provides actionable insights',
      agentType: AgentType.TREND_ANALYZER,
      status: AgentStatus.IDLE,
      projectId: projects[1].id,
      managerId: users[2].id,
      configuration: {
        maxRetries: 2,
        autoRetry: true,
        retryDelay: 120000,
        sources: ['social_media', 'news_articles', 'competitor_analysis'],
        keywordGroups: [
          { name: 'industry_terms', keywords: ['AI', 'machine learning', 'automation'] },
          { name: 'competitor_brands', keywords: ['BrandX', 'CompetitorY', 'MarketLeader'] },
        ],
        updateFrequency: 'daily',
        confidenceThreshold: 0.7,
      },
    },
    {
      name: 'Email Campaign Manager',
      description: 'AI agent specialized in managing email marketing campaigns',
      agentType: AgentType.EMAIL_MARKETER,
      status: AgentStatus.IDLE,
      projectId: projects[2].id,
      managerId: users[3].id,
      configuration: {
        maxRetries: 2,
        autoRetry: true,
        retryDelay: 60000,
        templates: {
          welcome: 'Welcome to our community! We're thrilled to have you join us.',
          promo: 'Limited time offer: {{offer_details}}',
          newsletter: 'Here's what's new this month: {{content}}',
        },
        personalization: true,
        subjectLineOptions: ['Check this out!', 'You don't want to miss this', 'Important update'],
        testPercentage: 10,
      },
    },
    {
      name: 'SEO Optimizer',
      description: 'AI agent that optimizes content for search engines',
      agentType: AgentType.SEO_SPECIALIST,
      status: AgentStatus.IDLE,
      projectId: projects[0].id,
      managerId: users[0].id,
      configuration: {
        maxRetries: 1,
        autoRetry: true,
        retryDelay: 300000,
        keywordDensityTarget: 2.5,
        primaryKeywords: ['digital marketing', 'AI marketing', 'content optimization'],
        secondaryKeywords: ['SEO tips', 'search ranking', 'organic traffic'],
        readabilityTarget: 'grade8',
        metaDescriptionLength: 155,
      },
    },
  ];
  
  const createdAgents = [];
  for (const agent of agents) {
    createdAgents.push(await prisma.aIAgent.create({
      data: agent,
    }));
  }
  
  console.log(`✅ Created ${createdAgents.length} agents`);
  return createdAgents;
}

/**
 * Create sample marketing campaigns
 */
async function createCampaigns(projects: any[], users: any[], agents: any[]) {
  console.log('📢 Creating marketing campaigns...');
  
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  const threeMonthsLater = new Date(today);
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
  
  const campaigns = [
    {
      name: 'Summer Product Launch',
      description: 'Launching our new summer product line with multi-channel campaign',
      status: CampaignStatus.ACTIVE,
      campaignType: CampaignType.INTEGRATED,
      goals: {
        awareness: { targetImpressions: 500000, targetReach: 200000 },
        conversion: { targetSales: 10000, targetRevenue: 500000 },
        engagement: { targetClicks: 50000, targetInteractions: 100000 },
      },
      targeting: {
        demographics: ['25-34', '35-44'],
        interests: ['technology', 'innovation', 'productivity'],
        locations: ['US', 'CA', 'UK', 'AU'],
      },
      budget: 75000,
      startDate: today,
      endDate: threeMonthsLater,
      ownerId: users[0].id,
      projectId: projects[0].id,
      agents: {
        connect: [{ id: agents[0].id }, { id: agents[3].id }],
      },
    },
    {
      name: 'Q3 Content Strategy',
      description: 'Content marketing initiative focused on thought leadership',
      status: CampaignStatus.SCHEDULED,
      campaignType: CampaignType.CONTENT_MARKETING,
      goals: {
        awareness: { targetImpressions: 200000, targetReach: 100000 },
        engagement: { targetReads: 50000, targetShares: 5000 },
        lead_generation: { targetLeads: 2000, targetMQLs: 500 },
      },
      targeting: {
        demographics: ['25-54'],
        interests: ['business', 'marketing', 'leadership'],
        job_titles: ['Manager', 'Director', 'VP', 'C-Suite'],
      },
      budget: 30000,
      startDate: nextMonth,
      endDate: threeMonthsLater,
      ownerId: users[3].id,
      projectId: projects[2].id,
      agents: {
        connect: [{ id: agents[0].id }, { id: agents[1].id }],
      },
    },
    {
      name: 'Social Media Awareness Campaign',
      description: 'Building brand awareness through targeted social media',
      status: CampaignStatus.ACTIVE,
      campaignType: CampaignType.SOCIAL_MEDIA,
      goals: {
        awareness: { targetFollowers: 10000, targetImpressions: 1000000 },
        engagement: { targetEngagementRate: 3.5, targetShares: 2000 },
      },
      targeting: {
        platforms: ['INSTAGRAM', 'TWITTER', 'LINKEDIN'],
        demographics: ['18-34'],
        interests: ['lifestyle', 'technology', 'social media'],
      },
      budget: 25000,
      startDate: today,
      endDate: nextMonth,
      ownerId: users[2].id,
      projectId: projects[1].id,
      agents: {
        connect: [{ id: agents[1].id }],
      },
    },
  ];
  
  const createdCampaigns = [];
  for (const campaign of campaigns) {
    createdCampaigns.push(await prisma.campaign.create({
      data: campaign,
    }));
  }
  
  console.log(`✅ Created ${createdCampaigns.length} campaigns`);
  return createdCampaigns;
}

/**
 * Create sample content
 */
async function createContent(agents: any[], campaigns: any[], users: any[]) {
  console.log('📝 Creating sample content...');
  
  const socialPost = `Excited to announce our summer product line! 🚀 \n\nOur team has been working tirelessly to create products that combine innovation with practicality. Stay tuned for the official launch next week! \n\n#ProductLaunch #Innovation #SummerCollection`;
  
  const blogPost = `# Revolutionizing the Industry: Our Summer Product Line\n\nIn today's rapidly evolving market, staying ahead requires constant innovation. Our team has spent the last year developing a product line that doesn't just meet current needs but anticipates future challenges.\n\n## Key Features\n\n- Seamless integration with existing workflows\n- AI-powered productivity enhancements\n- Sustainable materials and manufacturing\n- Customizable options for diverse user needs\n\nThe development process involved extensive user research, multiple prototype iterations, and rigorous testing. "We wanted to create something that genuinely improves how people work," says our Head of Product Development.\n\n## Market Impact\n\nAnalysts predict our new line will disrupt the current market leaders, with projected adoption rates exceeding industry averages by 35%.\n\nStay tuned for more details as we approach the official launch date!`;
  
  const emailTemplate = `Subject: Introducing Our Revolutionary Summer Product Line\n\nDear {{customer.firstName}},\n\nWe're thrilled to announce the upcoming launch of our summer product line, designed specifically to address the challenges you've shared with us.\n\nAs a valued customer, you'll get early access to:\n\n- Exclusive preview of all new products\n- Special pre-order pricing (25% off retail)\n- Complimentary personalized onboarding session\n\nMark your calendar for {{event.date}} when we'll be hosting a virtual launch event with live demos, Q&A with our product team, and special announcements.\n\nReserve your spot now: {{event.registrationLink}}\n\nWe can't wait to show you what we've been working on!\n\nBest regards,\n{{sender.name}}\n{{sender.title}}`;
  
  const content = [
    {
      title: 'Summer Product Launch Announcement',
      content: socialPost,
      contentType: ContentType.SOCIAL_POST,
      platform: Platform.LINKEDIN,
      status: ContentStatus.PUBLISHED,
      metadata: {
        publishDate: new Date().toISOString(),
        audience: 'professionals',
        hashtags: ['ProductLaunch', 'Innovation', 'SummerCollection'],
        engagement: {
          likes: 245,
          comments: 37,
          shares: 89,
        },
      },
      agentId: agents[0].id,
      campaignId: campaigns[0].id,
      creatorId: users[3].id,
    },
    {
      title: 'Revolutionizing the Industry: Our Summer Product Line',
      content: blogPost,
      contentType: ContentType.BLOG_POST,
      platform: Platform.WEBSITE,
      status: ContentStatus.PUBLISHED,
      metadata: {
        publishDate: new Date().toISOString(),
        wordCount: 276,
        readTime: '2 min',
        seoScore: 87,
        categories: ['Product News', 'Innovation'],
        featuredImage: 'summer_product_line_header.jpg',
      },
      agentId: agents[0].id,
      campaignId: campaigns[0].id,
      creatorId: users[3].id,
    },
    {
      title: 'Summer Product Line Launch Email',
      content: emailTemplate,
      contentType: ContentType.EMAIL,
      platform: Platform.EMAIL,
      status: ContentStatus.APPROVED,
      metadata: {
        scheduledDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
        audience: 'existing_customers',
        personalizationFields: ['customer.firstName', 'event.date', 'event.registrationLink', 'sender.name', 'sender.title'],
        testResults: {
          openRate: 28.4,
          clickRate: 12.7,
          conversionRate: 3.2,
        },
      },
      agentId: agents[2].id,
      campaignId: campaigns[0].id,
      creatorId: users[2].id,
    },
    {
      title: 'Market Trends in Our Industry - Q3 2023',
      content: 'This comprehensive analysis examines emerging trends in our industry for Q3 2023, with data-driven insights and actionable recommendations.',
      contentType: ContentType.BLOG_POST,
      platform: Platform.WEBSITE,
      status: ContentStatus.DRAFT,
      metadata: {
        outline: [
          { section: 'Introduction', wordCount: 150 },
          { section: 'Market Overview', wordCount: 300 },
          { section: 'Emerging Trends', wordCount: 500 },
          { section: 'Competitor Analysis', wordCount: 400 },
          { section: 'Actionable Insights', wordCount: 350 },
          { section: 'Conclusion', wordCount: 200 },
        ],
        targetKeywords: ['market trends', 'industry analysis', 'Q3 2023', 'competitive landscape'],
        estimatedReadTime: '8 min',
      },
      agentId: agents[1].id,
      campaignId: campaigns[1].id,
      creatorId: users[3].id,
    },
    {
      title: 'How Our New Product Solves Your Biggest Challenge',
      content: 'A concise yet compelling narrative about our new product and how it addresses the key pain points expressed by our target audience.',
      contentType: ContentType.AD_COPY,
      platform: Platform.FACEBOOK,
      status: ContentStatus.REVIEW,
      metadata: {
        variations: [
          { headline: 'Struggling with X? Our solution is here!', body: 'Discover how our new product solves the biggest challenges in your industry.' },
          { headline: 'Say goodbye to X forever', body: 'Our new product has revolutionized how professionals handle daily challenges.' },
          { headline: 'X made simple', body: 'See why industry leaders are switching to our innovative new solution.' },
        ],
        targetAudience: 'professionals aged 30-45',
        callToAction: 'Learn More',
      },
      agentId: agents[0].id,
      campaignId: campaigns[0].id,
      creatorId: users[2].id,
    },
  ];
  
  const createdContent = [];
  for (const item of content) {
    createdContent.push(await prisma.generatedContent.create({
      data: item,
    }));
  }
  
  console.log(`✅ Created ${createdContent.length} content items`);
  return createdContent;
}

/**
 * Create sample metrics
 */
async function createMetrics(campaigns: any[], projects: any[]) {
  console.log('📊 Creating metrics...');
  
  const metrics = [];
  
  // Campaign metrics
  for (const campaign of campaigns) {
    // Impressions
    metrics.push({
      name: 'impressions',
      source: 'analytics',
      value: Math.floor(Math.random() * 500000) + 50000,
      unit: 'count',
      campaignId: campaign.id,
      timestamp: new Date(),
    });
    
    // Click-through rate
    metrics.push({
      name: 'ctr',
      source: 'analytics',
      value: (Math.random() * 5 + 1) / 100, // 1-6%
      unit: 'percent',
      campaignId: campaign.id,
      timestamp: new Date(),
    });
    
    // Conversion rate
    metrics.push({
      name: 'conversion_rate',
      source: 'analytics',
      value: (Math.random() * 3 + 0.5) / 100, // 0.5-3.5%
      unit: 'percent',
      campaignId: campaign.id,
      timestamp: new Date(),
    });
    
    // Engagement rate
    metrics.push({
      name: 'engagement_rate',
      source: 'social_media',
      value: (Math.random() * 8 + 2) / 100, // 2-10%
      unit: 'percent',
      campaignId: campaign.id,
      timestamp: new Date(),
    });
  }
  
  // Project-wide metrics
  for (const project of projects) {
    // Total reach
    metrics.push({
      name: 'total_reach',
      source: 'analytics',
      value: Math.floor(Math.random() * 1000000) + 100000,
      unit: 'count',
      projectId: project.id,
      timestamp: new Date(),
    });
    
    // Average session duration
    metrics.push({
      name: 'avg_session_duration',
      source: 'analytics',
      value: Math.floor(Math.random() * 180) + 60, // 60-240 seconds
      unit: 'seconds',
      projectId: project.id,
      timestamp: new Date(),
    });
    
    // Return on ad spend
    metrics.push({
      name: 'roas',
      source: 'analytics',
      value: Math.random() * 4 + 2, // 2-6x
      unit: 'ratio',
      projectId: project.id,
      timestamp: new Date(),
    });
  }
  
  // Create all metrics in the database
  await prisma.metric.createMany({
    data: metrics,
  });
  
  console.log(`✅ Created ${metrics.length} metrics`);
}

/**
 * Create sample trend signals
 */
async function createTrendSignals(agents: any[]) {
  console.log('📈 Creating trend signals...');
  
  // Find the trend analyzer agent
  const trendAgent = agents.find(agent => agent.agentType === 'TREND_ANALYZER');
  
  if (!trendAgent) {
    console.warn('⚠️ No trend analyzer agent found, skipping trend signals');
    return;
  }
  
  const signals = [
    {
      title: 'Rising Interest in Sustainable Products',
      description: 'Analysis shows a 43% increase in search volume for terms related to sustainability and eco-friendly products in our industry over the past quarter.',
      source: 'search_trend_analysis',
      signalType: 'KEYWORD_TREND',
      confidence: 0.87,
      rawData: {
        keywords: ['sustainable', 'eco-friendly', 'green', 'environmental'],
        growthRate: 0.43,
        timespan: 'Q2 2023',
        competitorActivity: 'moderate',
      },
      impact: 'HIGH',
      agentId: trendAgent.id,
    },
    {
      title: 'Competitor X Launching New Product Line',
      description: 'Social listening detected strong signals that Competitor X is preparing to launch a new product line targeting our core demographic.',
      source: 'social_listening',
      signalType: 'COMPETITION_MOVE',
      confidence: 0.76,
      rawData: {
        competitor: 'Competitor X',
        expectedLaunchDate: 'Within 4-6 weeks',
        mentionVolume: 267,
        sentimentScore: 0.65,
      },
      impact: 'HIGH',
      agentId: trendAgent.id,
    },
    {
      title: 'Emerging Customer Pain Point',
      description: 'Customer feedback analysis reveals a growing frustration with current solutions' inability to integrate with popular workflow tools.',
      source: 'customer_feedback',
      signalType: 'SENTIMENT_SHIFT',
      confidence: 0.82,
      rawData: {
        painPoint: 'Integration with workflow tools',
        mentionFrequency: 'Increasing (38% growth)',
        sentimentShift: -0.24,
        customerSegments: ['enterprise', 'mid-market'],
      },
      impact: 'MEDIUM',
      agentId: trendAgent.id,
    },
    {
      title: 'Viral Content Opportunity: "Day in the Life"',
      description: 'Content showing "day in the life" of professionals using productivity tools is gaining significant traction across platforms.',
      source: 'content_analysis',
      signalType: 'VIRAL_CONTENT',
      confidence: 0.79,
      rawData: {
        contentFormat: 'Short-form video',
        platforms: ['TikTok', 'Instagram', 'LinkedIn'],
        engagementRate: '3.2x average',
        demographicAppeal: '25-45 professional',
      },
      impact: 'MEDIUM',
      agentId: trendAgent.id,
    },
    {
      title: 'Regulatory Changes Affecting Industry',
      description: 'New regulations related to data privacy are being considered that could impact how products in our category operate and market themselves.',
      source: 'regulatory_monitoring',
      signalType: 'REGULATORY_CHANGE',
      confidence: 0.91,
      rawData: {
        regulation: 'Enhanced Data Privacy Framework',
        status: 'Proposed',
        timeline: 'Expected implementation in 6-8 months',
        impact: 'Moderate to significant',
        affectedAreas: ['data collection', 'user consent', 'marketing practices'],
      },
      impact: 'CRITICAL',
      agentId: trendAgent.id,
    },
  ];
  
  // Create all trend signals in the database
  await prisma.trendSignal.createMany({
    data: signals,
  });
  
  console.log(`✅ Created ${signals.length} trend signals`);
}

/**
 * Schedule an agent to run hourly
 */
async function scheduleAgentToRunHourly(agentId: string) {
  console.log('⏰ Scheduling an agent to run hourly...');
  
  // Get the agent manager
  const agentManager = getAgentManager(prisma);
  
  // Create an agent scheduler
  const agentScheduler = new AgentScheduler(prisma, agentManager, {
    autoStart: false,
  });
  
  // Schedule the agent to run hourly using a cron expression
  await agentScheduler.scheduleAgent(
    agentId,
    '0 * * * *', // Run at the start of every hour
    true
  );
  
  console.log(`✅ Scheduled agent ${agentId} to run hourly`);
}

/**
 * Create sample execution sessions
 */
async function createExecutionSessions(agents: any[]) {
  console.log('📋 Creating agent execution sessions...');
  
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const sessions = [];
  
  // Create several execution sessions for each agent
  for (const agent of agents) {
    // Successful execution from yesterday
    sessions.push({
      agentId: agent.id,
      startedAt: new Date(yesterday.getTime() - 3600000),
      completedAt: new Date(yesterday.getTime() - 3580000),
      success: true,
      duration: 1200000, // 20 minutes
      outputSummary: 'Successfully generated content and analyzed market trends',
      logs: [
        { timestamp: new Date(yesterday.getTime() - 3600000), level: 'info', message: 'Agent execution started' },
        { timestamp: new Date(yesterday.getTime() - 3590000), level: 'info', message: 'Processing input data' },
        { timestamp: new Date(yesterday.getTime() - 3585000), level: 'info', message: 'Generating content' },
        { timestamp: new Date(yesterday.getTime() - 3582000), level: 'info', message: 'Applying style and formatting' },
        { timestamp: new Date(yesterday.getTime() - 3581000), level: 'info', message: 'Finalizing output' },
        { timestamp: new Date(yesterday.getTime() - 3580000), level: 'info', message: 'Execution completed successfully' },
      ],
      context: { mode: 'scheduled', priority: 'normal' },
      metrics: { processingTime: 1200, tokensGenerated: 2345, aiModelCalls: 8 },
    });
    
    // Failed execution from yesterday
    sessions.push({
      agentId: agent.id,
      startedAt: new Date(yesterday.getTime() - 2400000),
      completedAt: new Date(yesterday.getTime() - 2395000),
      success: false,
      duration: 5000, // 5 seconds
      errorMessage: 'Failed to connect to external API',
      logs: [
        { timestamp: new Date(yesterday.getTime() - 2400000), level: 'info', message: 'Agent execution started' },
        { timestamp: new Date(yesterday.getTime() - 2399000), level: 'info', message: 'Processing input data' },
        { timestamp: new Date(yesterday.getTime() - 2398000), level: 'warning', message: 'Slow response from external API' },
        { timestamp: new Date(yesterday.getTime() - 2397000), level: 'error', message: 'Connection timeout when calling external API' },
        { timestamp: new Date(yesterday.getTime() - 2396000), level: 'error', message: 'Failed to complete execution due to API error' },
        { timestamp: new Date(yesterday.getTime() - 2395000), level: 'info', message: 'Execution failed' },
      ],
      context: { mode: 'manual', priority: 'high' },
      metrics: { processingTime: 5000, errorCode: 'TIMEOUT_ERROR' },
    });
    
    // Successful execution from two days ago
    sessions.push({
      agentId: agent.id,
      startedAt: new Date(twoDaysAgo.getTime()),
      completedAt: new Date(twoDaysAgo.getTime() + 15000),
      success: true,
      duration: 15000, // 15 seconds
      outputSummary: 'Generated marketing content based on latest trends',
      logs: [
        { timestamp: new Date(twoDaysAgo.getTime()), level: 'info', message: 'Agent execution started' },
        { timestamp: new Date(twoDaysAgo.getTime() + 5000), level: 'info', message: 'Analyzing recent trend data' },
        { timestamp: new Date(twoDaysAgo.getTime() + 10000), level: 'info', message: 'Generating optimized content' },
        { timestamp: new Date(twoDaysAgo.getTime() + 15000), level: 'info', message: 'Execution completed successfully' },
      ],
      context: { mode: 'scheduled', priority: 'normal' },
      metrics: { processingTime: 15000, tokensGenerated: 1250, aiModelCalls: 3 },
    });
  }
  
  // Create all execution sessions in the database
  for (const session of sessions) {
    await prisma.agentExecutionSession.create({
      data: session,
    });
  }
  
  console.log(`✅ Created ${sessions.length} execution sessions`);
}

// Run the seed function
seed()
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 