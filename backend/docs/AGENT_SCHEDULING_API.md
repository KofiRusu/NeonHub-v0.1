# Agent Scheduling API Documentation

## Overview

The Agent Scheduling API provides endpoints for managing automated agent execution schedules, monitoring active sessions, and controlling the scheduler system. Agents can be scheduled using cron expressions with configurable priority levels.

## Base URL

```
/api/agents
```

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### 1. Schedule Agent

Schedule an agent to run automatically based on a cron expression.

**Endpoint:** `POST /api/agents/:agentId/schedule`

**Parameters:**

- `agentId` (path parameter): The ID of the agent to schedule

**Request Body:**

```json
{
  "cronExpression": "0 */6 * * *",
  "priority": "HIGH",
  "enabled": true
}
```

**Fields:**

- `cronExpression` (string, required): Cron expression for scheduling (e.g., "0 _/6 _ \* \*" for every 6 hours)
- `priority` (string, optional): Priority level - "LOW", "NORMAL", "HIGH", "CRITICAL" (default: "NORMAL")
- `enabled` (boolean, optional): Whether the schedule is active (default: true)

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "agent-123",
    "name": "Content Creator Agent",
    "scheduleExpression": "0 */6 * * *",
    "scheduleEnabled": true,
    "nextRunAt": "2025-06-01T00:00:00Z"
  }
}
```

**Error Responses:**

- `404 Not Found`: Agent not found
- `400 Bad Request`: Invalid cron expression or validation error

**Example:**

```bash
curl -X POST http://localhost:5000/api/agents/agent-123/schedule \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "cronExpression": "0 9 * * MON-FRI",
    "priority": "HIGH",
    "enabled": true
  }'
```

### 2. Get Agent Schedule

Retrieve the current schedule information for an agent.

**Endpoint:** `GET /api/agents/:agentId/schedule`

**Parameters:**

- `agentId` (path parameter): The ID of the agent

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "agent-123",
    "name": "Content Creator Agent",
    "scheduleExpression": "0 */6 * * *",
    "scheduleEnabled": true,
    "nextRunAt": "2025-06-01T00:00:00Z",
    "lastRunAt": "2025-05-31T18:00:00Z",
    "status": "IDLE",
    "taskDetails": {
      "agentId": "agent-123",
      "nextRun": "2025-06-01T00:00:00Z",
      "lastRun": "2025-05-31T18:00:00Z",
      "runCount": 42,
      "isRunning": false
    }
  }
}
```

**Error Responses:**

- `404 Not Found`: Agent not found

### 3. Unschedule Agent

Remove an agent from the automated schedule.

**Endpoint:** `DELETE /api/agents/:agentId/schedule`

**Parameters:**

- `agentId` (path parameter): The ID of the agent to unschedule

**Response:**

```json
{
  "success": true,
  "message": "Agent unscheduled successfully"
}
```

**Error Responses:**

- `404 Not Found`: Agent not found

### 4. Get Scheduler Status

Get the current status and statistics of the scheduler system.

**Endpoint:** `GET /api/agents/:agentId/schedule/status`

**Response:**

```json
{
  "success": true,
  "data": {
    "totalScheduled": 15,
    "activeAgents": 3,
    "totalRuns": 1247,
    "successfulRuns": 1189,
    "failedRuns": 58,
    "queueLength": 2,
    "isRunning": true
  }
}
```

### 5. Get Active Sessions

Retrieve all currently active agent execution sessions.

**Endpoint:** `GET /api/agents/sessions`

**Response:**

```json
{
  "success": true,
  "sessions": [
    {
      "agentId": "agent-123",
      "sessionId": "session-456",
      "startTime": "2025-05-31T14:30:00Z",
      "status": "RUNNING",
      "progress": 75
    },
    {
      "agentId": "agent-789",
      "sessionId": "session-012",
      "startTime": "2025-05-31T14:25:00Z",
      "status": "RUNNING",
      "progress": 30
    }
  ],
  "count": 2
}
```

### 6. Get Global Scheduler Status

Get system-wide scheduler statistics and health status.

**Endpoint:** `GET /api/agents/scheduler/status`

**Response:**

```json
{
  "success": true,
  "status": "running",
  "stats": {
    "totalScheduled": 25,
    "activeAgents": 5,
    "totalRuns": 3456,
    "successfulRuns": 3201,
    "failedRuns": 255,
    "queueLength": 3,
    "isRunning": true
  }
}
```

### 7. Run Agent Immediately

Trigger an agent to run immediately, bypassing the schedule.

**Endpoint:** `POST /api/agents/:agentId/run`

**Parameters:**

- `agentId` (path parameter): The ID of the agent to run

**Request Body (optional):**

```json
{
  "context": {
    "customParam1": "value1",
    "customParam2": "value2"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Agent execution started",
  "agentId": "agent-123"
}
```

## WebSocket Events

The scheduling system emits real-time events via WebSocket for agent execution monitoring.

### Connection

Connect to the WebSocket server at:

```
ws://localhost:5000
```

### Event Types

#### 1. agent:started

Emitted when an agent begins execution.

```json
{
  "agentId": "agent-123",
  "sessionId": "session-456",
  "timestamp": "2025-05-31T14:30:00Z",
  "scheduledBy": "cron"
}
```

#### 2. agent:completed

Emitted when an agent successfully completes execution.

```json
{
  "agentId": "agent-123",
  "sessionId": "session-456",
  "timestamp": "2025-05-31T14:35:00Z",
  "duration": 300000,
  "result": {
    "success": true,
    "data": {}
  }
}
```

#### 3. agent:failed

Emitted when an agent execution fails.

```json
{
  "agentId": "agent-123",
  "sessionId": "session-456",
  "timestamp": "2025-05-31T14:32:00Z",
  "error": "Connection timeout",
  "retryCount": 1,
  "willRetry": true
}
```

#### 4. agent:progress

Emitted periodically to report agent execution progress.

```json
{
  "agentId": "agent-123",
  "sessionId": "session-456",
  "timestamp": "2025-05-31T14:32:00Z",
  "progress": 50,
  "message": "Processing data batch 5/10"
}
```

#### 5. agent:scheduled

Emitted when an agent's schedule is created or updated.

```json
{
  "agentId": "agent-123",
  "cronExpression": "0 */6 * * *",
  "nextRunAt": "2025-06-01T00:00:00Z",
  "enabled": true
}
```

### Example WebSocket Client

```javascript
const io = require('socket.io-client');
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-auth-token',
  },
});

// Listen for agent events
socket.on('agent:started', (data) => {
  console.log('Agent started:', data);
});

socket.on('agent:progress', (data) => {
  console.log(`Agent ${data.agentId} progress: ${data.progress}%`);
});

socket.on('agent:completed', (data) => {
  console.log('Agent completed:', data);
});

socket.on('agent:failed', (data) => {
  console.error('Agent failed:', data);
});
```

## Cron Expression Format

The scheduling system uses standard cron expression format:

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of the month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of the week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

### Common Examples:

- `*/5 * * * *` - Every 5 minutes
- `0 */6 * * *` - Every 6 hours
- `0 9 * * MON-FRI` - Every weekday at 9 AM
- `0 0 * * 0` - Every Sunday at midnight
- `0 0 1 * *` - First day of every month at midnight

## Priority Levels

Agents can be scheduled with different priority levels that affect execution order when multiple agents are ready to run:

- **CRITICAL**: Highest priority, executed first
- **HIGH**: High priority tasks
- **NORMAL**: Default priority level
- **LOW**: Low priority, executed when no higher priority tasks are pending

## Error Codes

| Code | Description                                            |
| ---- | ------------------------------------------------------ |
| 400  | Bad Request - Invalid parameters or cron expression    |
| 401  | Unauthorized - Missing or invalid authentication token |
| 404  | Not Found - Agent ID does not exist                    |
| 500  | Internal Server Error - Server-side error              |

## Rate Limiting

API endpoints are rate-limited to:

- 100 requests per minute per authenticated user
- 1000 requests per hour per authenticated user

## Best Practices

1. **Cron Expression Validation**: Always validate cron expressions before scheduling to avoid errors
2. **Priority Usage**: Use CRITICAL priority sparingly for truly time-sensitive agents
3. **Schedule Monitoring**: Regularly check scheduler status and failed runs
4. **Error Handling**: Implement proper error handling for WebSocket disconnections
5. **Context Data**: Keep context data minimal to avoid performance issues

## Environment Variables

The scheduler behavior can be configured via environment variables:

- `SCHEDULER_CHECK_INTERVAL`: How often to check for scheduled tasks (default: 60000ms)
- `SCHEDULER_MAX_CONCURRENT`: Maximum concurrent agent executions (default: 5)
- `SCHEDULER_MAX_RETRIES`: Maximum retry attempts for failed agents (default: 3)
- `SCHEDULER_BACKOFF_BASE`: Base delay for retry backoff (default: 1000ms)
- `SCHEDULER_BACKOFF_MAX`: Maximum backoff delay (default: 300000ms)
