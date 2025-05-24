# NeonHub Background Agents Setup

This document explains how to set up and manage the background agents system in NeonHub.

## Overview

NeonHub uses a background agent system powered by a scheduler that can run AI agents at specified intervals. These agents can perform various automated tasks such as:

- Content creation
- Trend analysis
- Outreach management
- Performance optimization
- And more based on agent implementations

## Quick Start

To quickly set up and start the agent system:

```bash
# Run setup script
./setup_agents_env.sh

# Start the agent system
./start_agents.sh start
```

## Configuration

The agent system is configured through environment variables and a configuration file:

- `.env` - Contains basic environment variables
- `backend/config/agent.config.js` - Contains agent-specific configuration

Important environment variables:

- `AGENT_SCHEDULER_ENABLED`: Enable/disable the scheduler (true/false)
- `AGENT_SCHEDULER_INTERVAL`: How often to check for scheduled agents (in milliseconds)
- `AGENT_RUN_MISSED_ON_STARTUP`: Whether to run missed jobs on startup (true/false)
- `MAX_CONCURRENT_AGENTS`: Maximum number of agents that can run concurrently
- `OPENAI_API_KEY`: Your OpenAI API key for AI agents

## Managing Agents

### Start the Agent System

```bash
./start_agents.sh start
```

### Stop the Agent System

```bash
./start_agents.sh stop
```

### Check Status

```bash
./start_agents.sh status
```

### Run a Specific Agent Once

```bash
./start_agents.sh run-agent <agent_id>
```

## Docker Configuration

The agent system runs in Docker containers. The main components are:

- `docker-compose.agent.yml`: Configuration for the agent scheduler service
- `docker-compose.yml`: Main application configuration that the agent system integrates with

## Domain-Specific Engineering Conversations

NeonHub supports specialized engineering domain conversations, allowing you to maintain separate autonomous conversations for different software engineering domains.

### Setting Up Domain Agents

To set up agents for different software engineering domains, run:

```bash
./manage_domain_chats.sh setup
```

This will create specialized agents for domains such as:
- Frontend Development
- Backend Development
- DevOps Engineering
- Database Architecture
- Mobile Development
- Security Engineering
- Machine Learning Engineering

### Managing Domain Conversations

The `manage_domain_chats.sh` script provides the following commands:

```bash
# List all domain agents
./manage_domain_chats.sh list

# Start a conversation with a specific domain
./manage_domain_chats.sh start <agent_id or domain_name>
# Example: ./manage_domain_chats.sh start frontend
# Example: ./manage_domain_chats.sh start 12345678-1234-1234-1234-123456789abc

# Export a conversation to a file
./manage_domain_chats.sh export <agent_id> [filename]

# Import a conversation from a file
./manage_domain_chats.sh import <agent_id> <filename>
```

### Using with ChatGPT

You can copy the conversation outputs from a domain agent and paste them into ChatGPT or other LLM interfaces to continue the conversation there. Similarly, you can export conversations from ChatGPT and import them into your domain agents to maintain context across different interfaces.

## Scheduler

The agent scheduler checks for agents that need to be run based on their schedule expressions (cron format). You can configure an agent's schedule in the database:

- `scheduleEnabled`: Enable/disable scheduling for an agent
- `scheduleExpression`: Cron expression for when to run the agent
- `nextRunAt`: Next scheduled run time

## Agent Types

The system supports different types of agents:

- `CONTENT_CREATOR`: Creates marketing content
- `TREND_ANALYZER`: Analyzes market trends
- `OUTREACH_MANAGER`: Manages outreach campaigns
- `PERFORMANCE_OPTIMIZER`: Optimizes marketing performance
- `AUDIENCE_RESEARCHER`: Researches target audiences
- `COPYWRITER`: Writes marketing copy
- `SOCIAL_MEDIA_MANAGER`: Manages social media
- `EMAIL_MARKETER`: Manages email campaigns
- `SEO_SPECIALIST`: Optimizes for search engines
- `CUSTOMER_SUPPORT`: Handles customer support
- `ENGINEERING_CONVERSATION`: Domain-specific engineering conversation agent

## Troubleshooting

If you encounter issues:

1. Check the scheduler logs:
   ```bash
   docker-compose -f docker-compose.agent.yml logs
   ```

2. Verify that your database is running and accessible
3. Check that your OpenAI API key is valid
4. Make sure the agent has proper configuration in the database

## Development

For development, you can run the scheduler directly:

```bash
cd backend
node scripts/run_scheduler.js
```

Or test a specific agent:

```bash
cd backend
node scripts/test_agent.js <agent_id>
``` 