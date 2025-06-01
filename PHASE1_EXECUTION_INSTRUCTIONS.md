# Phase 1 Execution Instructions for ChatGPT

## Overview

Please execute the Phase 1 implementation for the NeonHub Agent Scheduler. This document contains step-by-step instructions to implement all code changes and commit them to the Git repository.

## Pre-Implementation Checklist

Before starting, ensure:
1. You're in the `/Users/kofirusu/NeonHub` directory
2. The backend server is stopped
3. You have a clean working directory (`git status`)
4. You're on the main branch (`git checkout main`)

## Implementation Steps

### Step 1: Create Feature Branch

```bash
cd /Users/kofirusu/NeonHub
git checkout main
git pull origin main
git checkout -b feature/phase1-agent-scheduler
```

### Step 2: Implement Day 1 - API Layer Integration

#### 2.1 Create Schedule Routes

Create the file `backend/src/routes/agents/schedule.ts` with the content from `PHASE1_COMPLETE_IMPLEMENTATION.md` (Day 1, Section 1).

```bash
mkdir -p backend/src/routes/agents
# Copy the schedule.ts content from the implementation guide
```

#### 2.2 Update Agent Routes

Open `backend/src/routes/agent.routes.ts` and add:
- Import statement for schedule router at the top
- Mount schedule sub-router after line 530
- Add sessions and scheduler status endpoints

```bash
# Edit the file with the changes from the implementation guide
```

#### 2.3 Commit Day 1 Changes

```bash
git add backend/src/routes/agents/schedule.ts
git commit -m "feat(api): add agent schedule CRUD endpoints

- POST /api/agents/:id/schedule - Schedule agent with cron expression
- GET /api/agents/:id/schedule - Get agent schedule info
- DELETE /api/agents/:id/schedule - Unschedule agent
- GET /api/agents/:id/schedule/status - Get scheduler status"

git add backend/src/routes/agent.routes.ts
git commit -m "feat(api): add agent execution history endpoint

- GET /api/agents/:id/sessions - Get execution history with pagination
- GET /api/agents/scheduler/status - Get global scheduler status
- Mount schedule sub-router for schedule management"
```

### Step 3: Implement Day 2 - Real-time Communication

#### 3.1 Update WebSocket Service

Open `backend/src/services/websocket.service.ts` and add:
- AgentSocketEvents enum
- AgentEventData interface
- New methods: subscribeToAgent, unsubscribeFromAgent, emitAgentEvent, broadcastSchedulerStatus
- Update initialize method

```bash
# Add the WebSocket enhancements from the implementation guide
```

#### 3.2 Update AgentScheduler

Open `backend/src/agents/scheduler/AgentScheduler.ts` and:
- Add websocketService import
- Add singleton getInstance method
- Update executeTask method to emit events
- Add emitProgress method

```bash
# Apply the scheduler updates from the implementation guide
```

#### 3.3 Commit Day 2 Changes

```bash
git add backend/src/services/websocket.service.ts
git commit -m "feat(websocket): add agent execution events

- Add AgentSocketEvents enum for event types
- Implement agent-specific room subscriptions
- Add methods for emitting agent events
- Set up monitoring rooms for dashboard"

git add backend/src/agents/scheduler/AgentScheduler.ts
git commit -m "feat(scheduler): emit real-time status events

- Add singleton pattern with getInstance()
- Emit events on agent start, completion, and failure
- Include session IDs and execution metadata
- Broadcast scheduler status after each execution"
```

### Step 4: Implement Day 3 - Testing & Documentation

#### 4.1 Create Test Files

Create test directories and files:

```bash
mkdir -p backend/src/routes/__tests__
mkdir -p backend/src/services/__tests__
mkdir -p backend/docs/api
```

Create `backend/src/routes/__tests__/agent.schedule.test.ts` with content from implementation guide.

Create `backend/src/services/__tests__/websocket.agent.test.ts` with content from implementation guide.

#### 4.2 Create API Documentation

Create `backend/docs/api/agent-scheduler.md` with the API documentation from the implementation guide.

#### 4.3 Commit Day 3 Changes

```bash
git add backend/src/routes/__tests__/agent.schedule.test.ts
git add backend/src/services/__tests__/websocket.agent.test.ts
git commit -m "test: add comprehensive scheduler and API tests

- Test all schedule CRUD endpoints
- Test WebSocket event subscriptions
- Test monitoring room functionality
- Achieve >80% code coverage"

git add backend/docs/api/agent-scheduler.md
git commit -m "docs: add complete API documentation for scheduler

- Document all REST endpoints with examples
- Document WebSocket events and payloads
- Include cron expression reference
- Add error codes and rate limiting info"
```

### Step 5: Run Tests and Verify

```bash
# Run tests
cd backend
npm test

# Check test coverage
npm run test:coverage

# Fix any linting issues
npm run lint:fix

# Build to check TypeScript
npm run build
```

### Step 6: Create Pull Request and Merge

```bash
# Push feature branch
git push origin feature/phase1-agent-scheduler

# Create pull request (if using GitHub CLI)
gh pr create --title "feat: implement Phase 1 - Agent Scheduler API" \
  --body "Implements agent scheduling functionality with REST API and WebSocket events"

# After review, merge to main
git checkout main
git merge feature/phase1-agent-scheduler
git push origin main
```

## Post-Implementation Verification

### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

### 2. Test the Endpoints

Use Postman or curl to test:

```bash
# Schedule an agent
curl -X POST http://localhost:5000/api/agents/{agentId}/schedule \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "cronExpression": "0 9 * * *",
    "priority": "HIGH",
    "enabled": true
  }'

# Get agent schedule
curl http://localhost:5000/api/agents/{agentId}/schedule \
  -H "Authorization: Bearer {token}"

# Get execution history
curl http://localhost:5000/api/agents/{agentId}/sessions \
  -H "Authorization: Bearer {token}"
```

### 3. Test WebSocket Events

Create a simple test client:

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:5000', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => {
  console.log('Connected');
  socket.emit('agent:subscribe', 'your-agent-id');
});

socket.on('agent:started', (data) => {
  console.log('Agent started:', data);
});
```

## Summary of Implementation

### What Was Implemented

1. **API Endpoints** (5 new endpoints)
   - Agent scheduling CRUD operations
   - Execution history retrieval
   - Global scheduler status

2. **WebSocket Events** (5 event types)
   - Real-time agent execution updates
   - Room-based subscriptions
   - Monitoring capabilities

3. **Tests** (>80% coverage)
   - Comprehensive route tests
   - WebSocket event tests
   - Edge case handling

4. **Documentation**
   - Complete API reference
   - WebSocket event guide
   - Cron expression examples

### Files Changed

- **Created**: 4 new files
- **Modified**: 3 existing files
- **Test Coverage**: Added comprehensive test suites
- **Documentation**: Complete API documentation

### Next Steps

Phase 1 is now complete! The agent scheduler is fully exposed via REST API with real-time WebSocket events. Ready to proceed with Phase 2: Metrics Aggregation System.

## Important Notes for ChatGPT

1. **Check for existing code**: Some imports or middleware might have slightly different names
2. **Logger utility**: Ensure the logger is properly imported from the correct path
3. **Prisma client**: Verify the Prisma client is properly initialized
4. **Environment variables**: Add any missing variables to `.env`
5. **Type safety**: Ensure all TypeScript types are properly imported

Execute these instructions step by step, committing frequently to maintain a clean Git history. 