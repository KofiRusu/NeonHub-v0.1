# Domain-Specific Engineering Conversation System

This document explains how to set up and use the domain-specific engineering conversation system, which allows you to manage separate, specialized AI conversations for different software engineering domains.

## Overview

The system enables you to:

1. Create specialized agents for different engineering domains (frontend, backend, etc.)
2. Start conversations with these domain-specific agents
3. Export conversations to files (for sharing or using in ChatGPT)
4. Import conversations from files (to continue where you left off)

Each domain agent is fine-tuned to provide expert guidance in its specific engineering field.

## Quick Start

```bash
# 1. Set up your environment
./setup_agents_env.sh

# 2. Setup the database (creates initial schema and test user)
./manage_domain_chats.sh db-setup

# 3. Create domain-specific agents
./manage_domain_chats.sh setup

# 4. Start a conversation with a specific domain
./manage_domain_chats.sh start frontend
```

## Requirements

- Node.js (v14 or newer)
- OpenAI API key (set in `.env` file)
- PostgreSQL database (configured in `.env` file)

Docker is optional - all commands work with or without Docker!

## Available Domains

The system creates agents for these domains:

- **Frontend Development**: Frontend frameworks, UI/UX implementation, responsive design
- **Backend Development**: Server architecture, API design, database management
- **DevOps Engineering**: CI/CD pipelines, infrastructure as code, cloud services
- **Database Architecture**: Database design, optimization, migrations
- **Mobile Development**: Native and cross-platform mobile app development
- **Security Engineering**: Application security, secure coding, threat modeling
- **Machine Learning Engineering**: ML model development, deployment, MLOps

## Commands

```bash
# Initialize database
./manage_domain_chats.sh db-setup

# Create domain-specific agents
./manage_domain_chats.sh setup

# List all available domain agents
./manage_domain_chats.sh list

# Start a conversation by domain name
./manage_domain_chats.sh start frontend
./manage_domain_chats.sh start backend
./manage_domain_chats.sh start devops

# Start a conversation by agent ID
./manage_domain_chats.sh start 12345678-1234-1234-1234-123456789abc

# Export a conversation to a file
./manage_domain_chats.sh export 12345678-1234-1234-1234-123456789abc myconversation.json

# Import a conversation from a file
./manage_domain_chats.sh import 12345678-1234-1234-1234-123456789abc myconversation.json

# Show command examples
./manage_domain_chats.sh examples
```

## Using with ChatGPT

### Export to ChatGPT

1. Export your conversation: `./manage_domain_chats.sh export <agent_id> myconversation.json`
2. Open the JSON file and find the `conversationHistory` array
3. Copy the conversation messages to ChatGPT

### Import from ChatGPT

1. Copy the conversation from ChatGPT
2. Format it as a JSON file with a `conversationHistory` array
3. Import it: `./manage_domain_chats.sh import <agent_id> myconversation.json`

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Check your `.env` file for correct database configuration
2. Make sure PostgreSQL is running
3. Run the database setup: `./manage_domain_chats.sh db-setup`

### OpenAI API Issues

If you see API key errors:

1. Make sure your OpenAI API key is set in the `.env` file
2. Check that the API key is valid and has enough credits
3. Run `./setup_agents_env.sh` and update the key when prompted

### Command Not Found

If you get "command not found" errors:

1. Make sure you're in the project root directory
2. Make scripts executable: `chmod +x *.sh`
3. On Windows, use Git Bash or WSL to run the scripts

## Configuration

The system is configured through:

- `.env` file (environment variables)
- `backend/config/agent.config.js` (agent configuration)
- `backend/scripts/setup_domain_agents.js` (domain definitions)

## Architecture

- **Domain Agents**: Specialized AI agents with domain-specific knowledge
- **Conversation Sessions**: Stored in the database for continuity
- **Agent Manager**: Manages agent execution and communication
- **Utility Scripts**: Helper tools for database and agent operations

## Working without Docker

All commands work without Docker by using direct Node.js execution. The system automatically detects if Docker is available and falls back to Node.js if needed.

To install dependencies for direct Node.js usage:

```bash
cd backend
npm install
cd ..
```
