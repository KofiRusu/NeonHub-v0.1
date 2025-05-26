# Agent Campaign Linking and Metrics Tracking

This document describes the implementation of connecting agent executions with campaigns and logging metrics for agent runs in the NeonHub AI Marketing Platform.

## Overview

The system now provides:

1. Automatic linking between AI agents and marketing campaigns
2. Comprehensive metrics tracking for agent executions
3. Token usage tracking for AI model interactions
4. API endpoints to access campaign-linked agent data

## Core Components

### Services

- **CampaignService**: Handles campaign operations like creating, updating, and linking campaigns to agents
- **MetricService**: Manages metric logging and retrieval for agent executions

### Agent Execution Flow

1. When an agent is executed, it creates an execution session
2. The agent is linked to a campaign (existing or newly created)
3. Execution metrics are tracked (duration, token usage, success rate)
4. Results include campaign and metrics information

## Usage

### Running an Agent with Campaign Tracking

```typescript
import { getAgentManager } from '../src/agents';

const agentManager = getAgentManager(prisma);

// Run with existing campaign
const result = await agentManager.startAgent(
  agentId, // Agent ID
  campaignId, // Optional campaign ID
  {
    config: {
      // Agent-specific configuration
      topic: 'How AI is transforming marketing',
      contentType: 'BLOG_POST',
    },
    trackMetrics: true,
    tokenUsage: {
      // Optional token usage tracking
      input: 350,
      output: 2200,
      total: 2550,
      model: 'gpt-4',
    },
  },
);

// Access campaign info from result
console.log(`Campaign ID: ${result.campaignId}`);
```

### API Endpoints

The system includes several API endpoints for working with campaign-linked agents:

#### Run an Agent as Part of a Campaign

```
POST /api/agents/campaign/:agentId/run
```

Request body:

```json
{
  "campaignId": "optional-campaign-id",
  "config": {
    "topic": "Content topic",
    "contentType": "BLOG_POST"
  },
  "tokenUsage": {
    "input": 350,
    "output": 2200,
    "total": 2550
  }
}
```

#### Get Agent Campaign Metrics

```
GET /api/agents/campaign/:agentId/metrics
```

#### Get Campaigns Linked to an Agent

```
GET /api/agents/campaign/:agentId/campaigns
```

## Test Scripts

Two scripts are provided to verify the functionality:

1. `backend/scripts/test-agent-campaign-link.ts` - Basic test of campaign linking
2. `backend/scripts/run-agent-with-campaign.ts` - Complete example of running an agent with campaign tracking

Run the scripts with:

```
npx ts-node backend/scripts/run-agent-with-campaign.ts
```

## Implementation Details

### Campaign Creation Logic

When an agent is executed without a specific campaignId:

1. The system looks for an active/scheduled campaign already associated with the agent
2. If found, it uses that campaign
3. If not found, it creates a new campaign based on the agent type

### Metric Types

The system tracks the following metrics:

- **AGENT_EXECUTION_TIME**: Duration of agent execution in milliseconds
- **TOKEN_USAGE**: Number of tokens used by AI models
- **AGENT_SUCCESS_RATE**: Binary success/failure (1.0 or 0.0)
- **CONTENT_PRODUCTION**: Amount of content produced (when applicable)
- **TREND_DETECTION**: Number of trends detected (when applicable)
- **CAMPAIGN_PERFORMANCE**: Overall campaign performance metrics
