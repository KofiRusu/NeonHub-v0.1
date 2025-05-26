import { test, expect } from '@playwright/test';

test.describe('NeonHub Complete Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test data or reset state before each test
    await page.goto('/');
  });

  test('should complete user registration and login workflow', async ({
    page,
  }) => {
    // Navigate to registration
    await page.click('[data-testid="register-link"]');
    await expect(page).toHaveURL('/auth/register');

    // Fill registration form
    await page.fill('[data-testid="name-input"]', 'Test User');
    await page.fill('[data-testid="email-input"]', 'test@neonhub.ai');
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!');
    await page.fill(
      '[data-testid="confirm-password-input"]',
      'SecurePassword123!',
    );

    // Submit registration
    await page.click('[data-testid="register-button"]');

    // Should redirect to dashboard after successful registration
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText(
      'Welcome, Test User',
    );
  });

  test('should complete agent creation and execution workflow', async ({
    page,
  }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@neonhub.ai');
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!');
    await page.click('[data-testid="login-button"]');

    // Wait for dashboard
    await expect(page).toHaveURL('/dashboard');

    // Navigate to agents
    await page.click('[href="/dashboard/agents"]');
    await expect(page).toHaveURL('/dashboard/agents');

    // Create new agent
    await page.click('[data-testid="create-agent-button"]');

    // Fill agent creation form
    await page.fill('[data-testid="agent-name-input"]', 'Test Content Agent');
    await page.fill(
      '[data-testid="agent-description-input"]',
      'A test agent for content generation',
    );
    await page.selectOption(
      '[data-testid="agent-type-select"]',
      'CONTENT_CREATOR',
    );

    // Configure agent settings
    await page.fill(
      '[data-testid="agent-config-topic"]',
      'AI Marketing Trends',
    );
    await page.selectOption(
      '[data-testid="agent-config-tone"]',
      'professional',
    );
    await page.selectOption('[data-testid="agent-config-length"]', 'medium');

    // Save agent
    await page.click('[data-testid="save-agent-button"]');

    // Verify agent was created
    await expect(page.locator('[data-testid="agent-list"]')).toContainText(
      'Test Content Agent',
    );

    // Run the agent
    await page.click('[data-testid="run-agent-button"]');

    // Verify real-time status updates
    await expect(page.locator('[data-testid="agent-status"]')).toContainText(
      'RUNNING',
      { timeout: 5000 },
    );

    // Wait for completion (with longer timeout for real execution)
    await expect(page.locator('[data-testid="agent-status"]')).toContainText(
      'COMPLETED',
      { timeout: 60000 },
    );

    // Verify execution logs are visible
    await expect(page.locator('[data-testid="execution-logs"]')).toBeVisible();
    await expect(page.locator('[data-testid="execution-logs"]')).toContainText(
      'Content generation completed',
    );
  });

  test('should complete campaign creation and management workflow', async ({
    page,
  }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@neonhub.ai');
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!');
    await page.click('[data-testid="login-button"]');

    // Navigate to campaigns
    await page.click('[href="/marketing/campaigns"]');
    await expect(page).toHaveURL('/marketing/campaigns');

    // Create new campaign
    await page.click('[data-testid="create-campaign-button"]');
    await expect(page).toHaveURL('/marketing/campaigns/create');

    // Fill campaign form
    await page.fill(
      '[data-testid="campaign-name"]',
      'AI Product Launch Campaign',
    );
    await page.fill(
      '[data-testid="campaign-description"]',
      'Comprehensive campaign for AI product launch',
    );
    await page.selectOption('[data-testid="campaign-type"]', 'INTEGRATED');
    await page.fill('[data-testid="campaign-budget"]', '50000');
    await page.fill(
      '[data-testid="target-audience"]',
      'Tech professionals and early adopters',
    );
    await page.fill(
      '[data-testid="campaign-goals"]',
      'Generate 1000 leads and increase brand awareness by 30%',
    );

    // Set campaign dates
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    await page.fill(
      '[data-testid="start-date"]',
      startDate.toISOString().split('T')[0],
    );
    await page.fill(
      '[data-testid="end-date"]',
      endDate.toISOString().split('T')[0],
    );

    // Save campaign
    await page.click('[data-testid="save-campaign-button"]');

    // Verify campaign was created
    await expect(page).toHaveURL('/marketing/campaigns');
    await expect(page.locator('[data-testid="campaign-list"]')).toContainText(
      'AI Product Launch Campaign',
    );

    // Open campaign details
    await page.click(
      '[data-testid="campaign-item"]:has-text("AI Product Launch Campaign")',
    );

    // Verify campaign details are displayed
    await expect(page.locator('[data-testid="campaign-status"]')).toContainText(
      'DRAFT',
    );
    await expect(page.locator('[data-testid="campaign-budget"]')).toContainText(
      '$50,000',
    );
  });

  test('should display real-time analytics and metrics', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@neonhub.ai');
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!');
    await page.click('[data-testid="login-button"]');

    // Navigate to analytics
    await page.click('[href="/dashboard/analytics"]');
    await expect(page).toHaveURL('/dashboard/analytics');

    // Verify analytics dashboard loads
    await expect(
      page.locator('[data-testid="analytics-dashboard"]'),
    ).toBeVisible();

    // Check for key metrics cards
    await expect(
      page.locator('[data-testid="metric-impressions"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="metric-conversions"]'),
    ).toBeVisible();
    await expect(page.locator('[data-testid="metric-spend"]')).toBeVisible();
    await expect(page.locator('[data-testid="metric-ctr"]')).toBeVisible();

    // Verify charts are rendered
    await expect(
      page.locator('[data-testid="performance-chart"]'),
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="agent-metrics-chart"]'),
    ).toBeVisible();

    // Test time range selector
    await page.selectOption('[data-testid="time-range-selector"]', '30d');

    // Wait for chart to update (charts should re-render with new data)
    await page.waitForTimeout(2000);

    // Test export functionality
    await page.click('[data-testid="export-data-button"]');

    // Verify download was triggered (file should start downloading)
    // Note: In a real test environment, you'd verify the file was downloaded
  });

  test('should handle real-time WebSocket updates', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@neonhub.ai');
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!');
    await page.click('[data-testid="login-button"]');

    // Navigate to agents dashboard
    await page.click('[href="/dashboard/agents"]');

    // Check WebSocket connection status
    await expect(
      page.locator('[data-testid="connection-status"]'),
    ).toContainText('● Live');

    // Start an agent to test real-time updates
    await page.click('[data-testid="run-agent-button"]');

    // Verify real-time status updates appear
    await expect(page.locator('[data-testid="agent-status"]')).toContainText(
      'RUNNING',
    );

    // Verify real-time logs appear
    await expect(page.locator('[data-testid="real-time-logs"]')).toBeVisible();

    // Check that logs are streaming (should see multiple log entries)
    await page.waitForTimeout(5000);
    const logEntries = await page.locator('[data-testid="log-entry"]').count();
    expect(logEntries).toBeGreaterThan(0);
  });

  test('should complete content generation workflow', async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@neonhub.ai');
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!');
    await page.click('[data-testid="login-button"]');

    // Navigate to content generation
    await page.click('[href="/marketing/content/generate"]');
    await expect(page).toHaveURL('/marketing/content/generate');

    // Fill content generation form
    await page.fill(
      '[data-testid="content-title"]',
      'The Future of AI in Marketing',
    );
    await page.selectOption('[data-testid="content-type"]', 'BLOG_POST');
    await page.selectOption('[data-testid="content-tone"]', 'professional');
    await page.selectOption('[data-testid="content-length"]', 'long');
    await page.fill(
      '[data-testid="target-audience"]',
      'Marketing professionals and business leaders',
    );
    await page.fill(
      '[data-testid="key-points"]',
      'AI automation, personalization, data-driven insights',
    );
    await page.fill(
      '[data-testid="keywords"]',
      'AI marketing, automation, personalization',
    );

    // Generate content
    await page.click('[data-testid="generate-content-button"]');

    // Wait for content generation
    await expect(
      page.locator('[data-testid="generating-indicator"]'),
    ).toBeVisible();
    await expect(page.locator('[data-testid="generated-content"]')).toBeVisible(
      { timeout: 30000 },
    );

    // Verify content was generated
    await expect(
      page.locator('[data-testid="generated-content"]'),
    ).not.toBeEmpty();
    await expect(
      page.locator('[data-testid="content-metadata"]'),
    ).toContainText('words');

    // Save content
    await page.click('[data-testid="save-content-button"]');

    // Verify content was saved
    await expect(
      page.locator('[data-testid="save-success-message"]'),
    ).toContainText('Content saved successfully');
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // Test with invalid login
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'invalid@email.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      'Invalid credentials',
    );

    // Test network error handling
    // Simulate network failure
    await page.route('**/api/agents', (route) => route.abort());

    // Login with correct credentials
    await page.fill('[data-testid="email-input"]', 'test@neonhub.ai');
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!');
    await page.click('[data-testid="login-button"]');

    // Navigate to agents (should show error state)
    await page.click('[href="/dashboard/agents"]');

    // Should show loading error
    await expect(page.locator('[data-testid="error-state"]')).toContainText(
      'Failed to load',
    );

    // Should have retry button
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should support responsive design on mobile', async ({
    page,
    browserName,
  }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Login
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', 'test@neonhub.ai');
    await page.fill('[data-testid="password-input"]', 'SecurePassword123!');
    await page.click('[data-testid="login-button"]');

    // Check mobile navigation
    await expect(
      page.locator('[data-testid="mobile-menu-button"]'),
    ).toBeVisible();
    await page.click('[data-testid="mobile-menu-button"]');

    // Verify mobile menu opens
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // Navigate to different sections
    await page.click('[data-testid="mobile-nav-agents"]');
    await expect(page).toHaveURL('/dashboard/agents');

    // Verify responsive layout
    await expect(page.locator('[data-testid="agent-grid"]')).toHaveCSS(
      'grid-template-columns',
      /1fr/,
    );
  });
});
