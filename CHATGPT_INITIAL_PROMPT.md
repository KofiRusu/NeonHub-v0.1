# Initial Prompt for ChatGPT Desktop App

Copy and paste this entire prompt to start the autonomous development session:

---

## 🚀 NeonHub Backend Development - Phase 1: Agent Scheduler

I need you to act as my autonomous backend engineering copilot for the NeonHub project. You'll be implementing the agent scheduler system to enable autonomous AI agent execution.

### Project Context

**NeonHub** is an AI-powered marketing collaboration platform with the following architecture:
- **Backend**: TypeScript, Express.js, Prisma ORM, PostgreSQL, Socket.io
- **AI Integration**: OpenAI GPT-4, Anthropic Claude
- **Current Status**: 60% complete (Auth, Campaigns, Content Generation done)
- **Your Focus**: Complete the Agent Scheduler (Phase 1 of 5)

### Current State Analysis

The agent system is 70% complete with:
- ✅ Base agent architecture (`BaseAgent` abstract class)
- ✅ Agent factory pattern with plugin system
- ✅ 10 specialized agent types defined
- ✅ Basic `AgentScheduler` class exists
- ❌ Missing: Schedule management API endpoints
- ❌ Missing: WebSocket real-time events
- ❌ Missing: Execution history tracking

### Your Phase 1 Objectives

1. **Complete the AgentScheduler Implementation**
   - The file exists at `backend/src/agents/scheduler/AgentScheduler.ts`
   - Add missing methods: `updateSchedule()`, `getScheduledAgents()`, `getExecutionHistory()`
   - Ensure proper error handling and retry logic

2. **Create Schedule Management Endpoints**
   - Update `backend/src/routes/agent.routes.ts` with:
     - POST `/api/agents/:id/schedule` - Create/update schedule
     - GET `/api/agents/:id/schedule` - Get agent schedule
     - DELETE `/api/agents/:id/schedule` - Remove schedule
     - GET `/api/agents/:id/sessions` - Get execution history

3. **Implement WebSocket Events**
   - Update `backend/src/services/websocket.service.ts`
   - Add agent execution events: started, completed, failed, progress
   - Emit scheduler status updates

4. **Create Comprehensive Tests**
   - Unit tests for AgentScheduler (>80% coverage)
   - Integration tests for new API endpoints
   - WebSocket event tests

### Technical Requirements

**Scheduling Patterns**:
```javascript
// Examples of cron expressions to support
"0 9 * * *"        // Daily at 9 AM
"0 */6 * * *"      // Every 6 hours
"*/30 9-17 * * 1-5" // Every 30 min during business hours
```

**Priority Levels**: CRITICAL (4) > HIGH (3) > NORMAL (2) > LOW (1)

**Concurrency**: Max 5 agents running simultaneously

**Retry Policy**: Exponential backoff, max 3 retries

### Success Criteria

Phase 1 is complete when:
1. Scheduler reliably executes agents based on cron schedules
2. API endpoints allow full CRUD operations on schedules
3. WebSocket broadcasts real-time agent status updates
4. Failed agents retry with exponential backoff
5. All tests pass with >80% coverage
6. No TypeScript or ESLint errors

### Development Guidelines

1. **Type Safety**: Use TypeScript strict mode, avoid `any` types
2. **Error Handling**: Implement try-catch with proper error messages
3. **Logging**: Use the existing logger utility for all operations
4. **Testing**: Write tests alongside implementation
5. **Documentation**: Add JSDoc comments for all public methods

### Getting Started

Please:
1. First, analyze the existing `AgentScheduler.ts` implementation
2. Review the database schema for `AIAgent` and `AgentExecutionSession` models
3. Present your implementation plan with file structure
4. Begin implementation incrementally with tests

**Important**: The scheduler already has basic functionality. Focus on enhancing it with the missing features rather than rewriting from scratch.

Are you ready to begin? Please start by examining the current AgentScheduler implementation and propose your approach for completing Phase 1.

---

## Additional Context Documents

After ChatGPT acknowledges, share these documents:
1. `CHATGPT_DEVELOPMENT_GUIDE.md` - Full development roadmap
2. `BACKEND_DEVELOPMENT_STATUS.md` - Detailed backend status
3. `PHASE1_PREFLIGHT_CONTEXT.md` - Phase 1 specific details

--- 