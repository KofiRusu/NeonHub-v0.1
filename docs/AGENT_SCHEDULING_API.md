# Agent Scheduling API Documentation

## Overview

The Agent Scheduling API provides endpoints to manage automated execution of AI agents based on cron expressions. It supports scheduling, pausing, resuming, and monitoring agent executions with real-time updates via WebSocket.

## Table of Contents

1. [REST API Endpoints](#rest-api-endpoints)
2. [WebSocket Events](#websocket-events)
3. [Data Models](#data-models)
4. [Examples](#examples)
5. [Error Handling](#error-handling)

## REST API Endpoints

### Schedule an Agent

Schedule an agent to run automatically based on a cron expression.

**Endpoint:** `POST /api/agents/:agentId/schedule`

**Authentication:** Required (Bearer token)

**Request Body:**
```json
{
  "cronExpression": "*/5 * * * *",
  "priority": "HIGH",
  "enabled": true
}
```

**Parameters:**
- `cronExpression` (string, required): Standard cron expression for scheduling
- `priority` (string, optional): Priority level - "LOW", "NORMAL", "HIGH", "CRITICAL" (default: "NORMAL")
- `enabled` (boolean, optional): Whether scheduling is enabled (default: true)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "agent-123",
    "name": "Content Creator Agent",
    "scheduleExpression": "*/5 * * * *",
    "scheduleEnabled": true,
    "nextRunAt": "2024-01-15T10:30:00Z"
  }
}
```

### Get Agent Schedule Information

Retrieve scheduling information for a specific agent.

**Endpoint:** `GET /api/agents/:agentId/schedule`

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "agent-123",
    "name": "Content Creator Agent",
    "scheduleExpression": "*/5 * * * *",
    "scheduleEnabled": true,
    "nextRunAt": "2024-01-15T10:30:00Z",
    "lastRunAt": "2024-01-15T10:25:00Z",
    "status": "IDLE",
    "taskDetails": {
      "agentId": "agent-123",
      "agentName": "Content Creator Agent",
      "priority": 3,
      "nextRunTime": "2024-01-15T10:30:00Z",
      "retryCount": 0,
      "lastError": null,
      "backoffUntil": null,
      "isRunning": false,
      "isPaused": false,
      "jobId": "agent-123"
    }
  }
}
```

### Unschedule an Agent

Remove an agent from the scheduler.

**Endpoint:** `DELETE /api/agents/:agentId/schedule`

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "message": "Agent unscheduled successfully"
}
```

### Pause a Scheduled Job

Pause a scheduled agent job to prevent it from running.

**Endpoint:** `PATCH /api/agents/:agentId/schedule/:jobId/pause`

**Authentication:** Required (Bearer token)

**Parameters:**
- `agentId`: The agent's unique identifier
- `jobId`: The job identifier (can be the same as agentId if not specified during scheduling)

**Response:**
```json
{
  "success": true,
  "message": "Job job-456 paused successfully",
  "data": {
    "agentId": "agent-123",
    "jobId": "job-456",
    "status": "paused"
  }
}
```

**Error Responses:**
- `404`: Agent not found or no scheduled task found
- `409`: Cannot pause agent while it is running

### Resume a Paused Job

Resume a previously paused agent job.

**Endpoint:** `PATCH /api/agents/:agentId/schedule/:jobId/resume`

**Authentication:** Required (Bearer token)

**Parameters:**
- `agentId`: The agent's unique identifier
- `jobId`: The job identifier

**Response:**
```json
{
  "success": true,
  "message": "Job job-456 resumed successfully",
  "data": {
    "agentId": "agent-123",
    "jobId": "job-456",
    "status": "resumed",
    "nextRunAt": "2024-01-15T10:35:00Z"
  }
}
```

**Error Responses:**
- `404`: Agent not found or no scheduled task found
- `400`: Job is not paused

### Get Scheduler Status

Get global scheduler statistics and status.

**Endpoint:** `GET /api/agents/schedule/status`

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "scheduledTasksCount": 15,
    "runningAgentsCount": 3,
    "queuedTasksCount": 12,
    "maxConcurrentAgents": 5,
    "pausedJobsCount": 2
  }
}
```

### Get Paused Jobs

Get a list of all currently paused jobs.

**Endpoint:** `GET /api/agents/schedule/paused`

**Authentication:** Required (Bearer token)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "agentId": "agent-123",
      "jobId": "job-456"
    },
    {
      "agentId": "agent-789",
      "jobId": "agent-789"
    }
  ]
}
```

## WebSocket Events

### Connection

Connect to the WebSocket server at the backend URL (e.g., `ws://localhost:5000`).

```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Subscribing to Events

#### Subscribe to Agent Updates
```javascript
socket.emit('subscribe-agent-updates', agentId);
```

#### Subscribe to Scheduler Updates
```javascript
socket.emit('subscribe-scheduler-updates');
```

### Agent Execution Events

#### agent:started
Emitted when an agent execution begins.

```json
{
  "agentId": "agent-123",
  "jobId": "job-456",
  "status": "started",
  "timestamp": "2024-01-15T10:30:00.123Z"
}
```

#### agent:progress
Emitted during agent execution to report progress.

```json
{
  "agentId": "agent-123",
  "jobId": "job-456",
  "progress": 50,
  "message": "Processing content generation...",
  "currentStep": "2",
  "totalSteps": 4,
  "timestamp": "2024-01-15T10:30:15.456Z"
}
```

#### agent:completed
Emitted when an agent execution completes successfully.

```json
{
  "agentId": "agent-123",
  "jobId": "job-456",
  "status": "completed",
  "duration": 15234,
  "timestamp": "2024-01-15T10:30:30.789Z"
}
```

#### agent:failed
Emitted when an agent execution fails.

```json
{
  "agentId": "agent-123",
  "jobId": "job-456",
  "status": "failed",
  "error": "Failed to connect to AI service",
  "timestamp": "2024-01-15T10:30:20.123Z"
}
```

#### agent:paused
Emitted when an agent job is paused.

```json
{
  "agentId": "agent-123",
  "jobId": "job-456",
  "status": "paused",
  "timestamp": "2024-01-15T10:31:00.123Z"
}
```

#### agent:resumed
Emitted when an agent job is resumed.

```json
{
  "agentId": "agent-123",
  "jobId": "job-456",
  "status": "resumed",
  "timestamp": "2024-01-15T10:32:00.123Z"
}
```

#### scheduler:status
Emitted when scheduler status changes.

```json
{
  "stats": {
    "isRunning": true,
    "scheduledTasksCount": 15,
    "runningAgentsCount": 3,
    "queuedTasksCount": 12,
    "maxConcurrentAgents": 5,
    "pausedJobsCount": 2
  },
  "timestamp": "2024-01-15T10:30:00.123Z"
}
```

## Data Models

### Priority Levels

```typescript
enum AgentPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4
}
```

### Agent Status

```typescript
enum AgentStatus {
  IDLE = "IDLE",
  RUNNING = "RUNNING",
  ERROR = "ERROR",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED"
}
```

### Cron Expression Format

The scheduler uses standard cron expression format:

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

Common examples:
- `*/5 * * * *` - Every 5 minutes
- `0 */6 * * *` - Every 6 hours
- `0 9 * * 1-5` - Every weekday at 9 AM
- `0 0 * * 0` - Every Sunday at midnight

## Examples

### Complete Scheduling Flow

```javascript
// 1. Schedule an agent
const scheduleResponse = await fetch('/api/agents/agent-123/schedule', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token'
  },
  body: JSON.stringify({
    cronExpression: '0 */6 * * *', // Every 6 hours
    priority: 'HIGH',
    enabled: true
  })
});

// 2. Subscribe to real-time updates
socket.emit('subscribe-agent-updates', 'agent-123');

socket.on('agent:started', (data) => {
  console.log('Agent started:', data);
});

socket.on('agent:progress', (data) => {
  console.log(`Progress: ${data.progress}% - ${data.message}`);
});

socket.on('agent:completed', (data) => {
  console.log(`Completed in ${data.duration}ms`);
});

// 3. Pause if needed
const pauseResponse = await fetch('/api/agents/agent-123/schedule/agent-123/pause', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer your-token'
  }
});

// 4. Resume when ready
const resumeResponse = await fetch('/api/agents/agent-123/schedule/agent-123/resume', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer your-token'
  }
});
```

### Monitoring Multiple Agents

```javascript
// Get all scheduled agents
const agents = await fetch('/api/agents', {
  headers: { 'Authorization': 'Bearer your-token' }
}).then(res => res.json());

// Subscribe to scheduler updates
socket.emit('subscribe-scheduler-updates');

socket.on('scheduler:status', (data) => {
  console.log('Scheduler stats:', data.stats);
});

// Check individual agent schedules
for (const agent of agents.data) {
  const schedule = await fetch(`/api/agents/${agent.id}/schedule`, {
    headers: { 'Authorization': 'Bearer your-token' }
  }).then(res => res.json());
  
  if (schedule.data.scheduleEnabled) {
    console.log(`${agent.name} next runs at: ${schedule.data.nextRunAt}`);
  }
}
```

## Error Handling

### Common Error Codes

- `400 Bad Request`: Invalid cron expression or request format
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Agent or scheduled task not found
- `409 Conflict`: Operation conflicts with current state (e.g., pausing a running agent)
- `500 Internal Server Error`: Server-side error

### Error Response Format

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Retry Logic

The scheduler implements automatic retry with exponential backoff:

1. First retry: 1 second delay
2. Second retry: 2 seconds delay
3. Third retry: 4 seconds delay
4. Maximum retries: 3 (configurable)
5. Maximum backoff delay: 5 minutes

After maximum retries are exhausted, the agent status is set to ERROR and removed from the schedule. 