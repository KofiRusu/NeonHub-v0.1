# Phase 1: Agent Scheduler Implementation - Pre-flight Context

## 1. Environment & Secrets Configuration

### Required Environment Variables
Create a `.env` file in the backend directory with these variables:

```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/neonhub?schema=public

# JWT & Security
JWT_SECRET=your-secure-jwt-secret-key
JWT_REFRESH_SECRET=your-secure-refresh-secret-key
SESSION_SECRET=your-secure-session-secret

# AI Services
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-api-key

# OAuth (Google)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=5000
NODE_ENV=development

# Frontend
CLIENT_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Agent Scheduler
SCHEDULER_CHECK_INTERVAL=60000  # 1 minute
SCHEDULER_MAX_CONCURRENT=5
SCHEDULER_MAX_RETRIES=3
SCHEDULER_BACKOFF_BASE=1000  # 1 second
SCHEDULER_BACKOFF_MAX=300000  # 5 minutes

# Monitoring (Optional)
SENTRY_DSN=https://your-sentry-dsn
PROMETHEUS_PORT=9090
LOG_LEVEL=info
```

### Docker Setup
```bash
# Start local services
docker-compose up -d postgres redis

# Or use the full stack
docker-compose up -d
```

### Database Setup
```bash
cd backend
npm run prisma:migrate:dev
npm run prisma:seed  # Optional: seed with test data
```

## 2. Scheduler Requirements & Specifications

### Core Requirements
1. **Cron Expression Support**: Standard cron syntax with 5 fields (minute, hour, day, month, weekday)
2. **Interval Support**: Simple interval scheduling (e.g., "every 30 minutes")
3. **Priority Queue**: Critical > High > Normal > Low priority execution
4. **Concurrency Control**: Maximum 5 agents running simultaneously (configurable)
5. **Retry Policy**: Exponential backoff with max 3 retries
6. **Failure Handling**: Email/Slack alerts on repeated failures (future enhancement)

### Agent Run Cadence Examples
```javascript
// Common scheduling patterns
const scheduleExamples = {
  // Content Creator - Daily at 9 AM
  contentCreator: "0 9 * * *",
  
  // Trend Analyzer - Every 6 hours
  trendAnalyzer: "0 */6 * * *",
  
  // Customer Support - Every 30 minutes during business hours
  customerSupport: "*/30 9-17 * * 1-5",
  
  // Performance Optimizer - Weekly on Sunday at 2 AM
  performanceOptimizer: "0 2 * * 0",
  
  // Email Marketer - Daily at 8 AM on weekdays
  emailMarketer: "0 8 * * 1-5",
};
```

### Scheduler States
- **IDLE**: No agents scheduled
- **RUNNING**: Processing scheduled agents
- **PAUSED**: Temporarily stopped (manual intervention)
- **ERROR**: Critical error occurred

## 3. Existing Code Interfaces

### BaseAgent Interface (Already Implemented)
```typescript
// backend/src/agents/base/BaseAgent.ts
export abstract class BaseAgent {
  protected prisma: PrismaClient;
  protected agentData: AIAgent;
  protected isRunning = false;
  protected shouldStop = false;
  
  async execute(config: any, options: ExecutionOptions = {}): Promise<any>;
  async stop(): Promise<void>;
  protected abstract executeImpl(config: any): Promise<any>;
  
  // Event logging
  protected logEvent(
    type: AgentEventType,
    message: string,
    data?: any,
    level: 'info' | 'warning' | 'error' = 'info'
  ): void;
}
```

### AgentScheduler (Partially Implemented)
```typescript
// backend/src/agents/scheduler/AgentScheduler.ts
export class AgentScheduler {
  constructor(
    prisma: PrismaClient,
    agentManager: AgentManager,
    options: SchedulerOptions = {}
  );
  
  async start(): Promise<void>;
  stop(): void;
  async scheduleAgent(
    agentId: string,
    cronExpression: string,
    priority: AgentPriority = AgentPriority.NORMAL,
    enabled = true
  ): Promise<void>;
  
  // Missing methods to implement:
  async updateSchedule(agentId: string, schedule: ScheduleUpdate): Promise<void>;
  async getScheduledAgents(): Promise<ScheduledAgentInfo[]>;
  async getExecutionHistory(agentId: string): Promise<ExecutionHistory[]>;
}
```

### Required New Interfaces
```typescript
// Schedule Manager interface (to be created)
export interface IScheduleManager {
  createSchedule(agentId: string, schedule: ScheduleConfig): Promise<Schedule>;
  updateSchedule(scheduleId: string, updates: ScheduleUpdate): Promise<Schedule>;
  deleteSchedule(scheduleId: string): Promise<void>;
  getSchedule(scheduleId: string): Promise<Schedule | null>;
  getAgentSchedules(agentId: string): Promise<Schedule[]>;
  validateCronExpression(expression: string): boolean;
}

// WebSocket event types
export enum AgentSocketEvents {
  AGENT_STARTED = 'agent:started',
  AGENT_COMPLETED = 'agent:completed',
  AGENT_FAILED = 'agent:failed',
  AGENT_PROGRESS = 'agent:progress',
  SCHEDULER_STATUS = 'scheduler:status',
}
```

## 4. Repository & CI Configuration

### Branch Structure
```
main          - Production-ready code
develop       - Integration branch
feature/*     - Feature branches
hotfix/*      - Emergency fixes
```

### GitHub Actions Workflow
The CI pipeline (`/.github/workflows/ci.yml`) includes:
- Quality gates (ESLint, Prettier, TypeScript)
- Security scanning (npm audit, Snyk)
- Unit & integration tests
- Coverage check (≥80% required)
- E2E tests (Playwright)
- SonarCloud analysis

### Test Requirements for Phase 1
```typescript
// Required test files
backend/src/agents/scheduler/__tests__/AgentScheduler.test.ts
backend/src/agents/scheduler/__tests__/ScheduleManager.test.ts
backend/src/routes/__tests__/agent.schedule.test.ts
backend/src/services/__tests__/websocket.agent.test.ts
```

## 5. Success Criteria for Phase 1

### Functional Requirements
1. **Scheduler Lifecycle**
   - ✅ Scheduler starts and loads existing schedules from database
   - ✅ Scheduler checks for due agents every 60 seconds
   - ✅ Scheduler respects concurrency limits
   - ✅ Scheduler handles graceful shutdown

2. **Agent Execution**
   - ✅ Agents are selected based on `nextRunAt` and priority
   - ✅ Agent execution sessions are tracked in database
   - ✅ Failed agents are retried with exponential backoff
   - ✅ Successful execution updates `nextRunAt` based on schedule

3. **API Endpoints**
   - ✅ POST `/api/agents/:id/schedule` - Create/update schedule
   - ✅ GET `/api/agents/:id/schedule` - Get agent schedule
   - ✅ DELETE `/api/agents/:id/schedule` - Remove schedule
   - ✅ GET `/api/agents/:id/sessions` - Get execution history
   - ✅ GET `/api/scheduler/status` - Get scheduler status

4. **Real-time Updates**
   - ✅ WebSocket emits agent execution events
   - ✅ Frontend can subscribe to agent status updates
   - ✅ Progress tracking for long-running agents

### Non-functional Requirements
1. **Performance**
   - Scheduler check loop < 100ms
   - Agent selection query < 50ms
   - WebSocket latency < 100ms

2. **Reliability**
   - No missed schedules during normal operation
   - Graceful handling of database connection issues
   - Proper cleanup of orphaned executions

3. **Observability**
   - Structured logging for all scheduler operations
   - Metrics for execution count, duration, success rate
   - Error tracking with stack traces

### Definition of Done
- [ ] All code has TypeScript types (no `any` unless justified)
- [ ] Unit test coverage ≥ 80%
- [ ] Integration tests for all API endpoints
- [ ] No ESLint errors or warnings
- [ ] API documentation updated
- [ ] WebSocket events documented
- [ ] Manual testing completed
- [ ] Code reviewed and approved
- [ ] CI pipeline passes

## Quick Start Commands

```bash
# Setup
cd backend
npm install
npm run prisma:generate

# Development
npm run dev

# Testing
npm run test:watch   # Unit tests
npm run test:integration  # Integration tests
npm run test:coverage  # Coverage report

# Linting
npm run lint
npm run lint:fix

# Type checking
npm run build  # TypeScript compilation
```

## Additional Resources

- [Cron Expression Reference](https://crontab.guru/)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Socket.io Events Documentation](https://socket.io/docs/v4/emitting-events/)
- [Jest Testing Patterns](https://jestjs.io/docs/en/testing-patterns)

## Notes for ChatGPT

1. The `AgentScheduler` class already exists but needs enhancement
2. Focus on completing the missing schedule management endpoints
3. The WebSocket service exists but needs agent-specific events
4. Use the existing `AgentExecutionSession` model for tracking
5. Implement proper error boundaries and recovery mechanisms
6. Consider future scalability (Redis queue for distributed scheduling) 