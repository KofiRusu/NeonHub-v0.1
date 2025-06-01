# NeonHub Architecture Overview

This document provides a high-level architecture overview of NeonHub, including core modules, data flows, integrations, and the **fully operational Custom Agent Framework** for autonomous backend enhancement, debugging, and optimization.

**Status: ✅ MAXIMUM THROUGHPUT MODE ACTIVE**  
**Agent System: 6 agents optimized with 5-minute cadence**

---

## 1. Core Modules

### 1.1 AI Agents & Orchestrator ✅ OPERATIONAL

- **Agent Registry**: Central directory of 6 active agents (Architecture, Backend, Frontend, DevOps, QA, Docs)
- **Orchestrator**: Coordinates agent workflows via GitHub Actions and local execution
- **Auto-Commit System**: Enhanced with `auto:` prefix format and hook bypass
- **Self-Healing**: GitHub issue escalation on 2+ consecutive failures

### 1.2 Campaign Engine

- Campaign definition and scheduling services (tRPC endpoints)
- Execution engine for multi-channel dispatch

### 1.3 Data Models & Persistence

- PostgreSQL schema managed by Prisma
- Historical logs, metrics tables, and audit trails

### 1.4 API Layer

- Next.js + tRPC for frontend-backend communication
- Authentication & authorization middleware

### 1.5 Dashboard & Monitoring

- React + Tailwind dashboard
- Real-time metrics via WebSockets

### 1.6 External Integrations

- Ad Platforms (Facebook, Google Ads) via REST/GraphQL
- CRMs (Salesforce, HubSpot)
- Analytics (Google Analytics, Segment)

---

## 2. Event-Driven Data Flow

```
User -->|tRPC| API
API --> DB((PostgreSQL))
API -->|Publish| EventBus[GitHub Actions/Local]
EventBus --> CampaignEngine
EventBus --> AgentOrchestrator
AgentOrchestrator --> Agents
Agents -->|Auto-Commit| Git[Git Repository]
Agents -->|Insights| Dashboard
Agents -->|Actions| API
```

---

## 3. Custom Agent Framework Integration ✅ FULLY IMPLEMENTED

### 3.1 Goals ACHIEVED

- **✅ Autonomous Optimization**: 6 agents continuously monitor and optimize every 5 minutes
- **✅ Proactive Debugging**: Auto-lint fixes, type checking, and test generation
- **✅ System Health & Scaling**: CI/CD pipeline monitoring and infrastructure validation
- **✅ Data Quality Assurance**: Comprehensive testing and coverage validation

### 3.2 Active Agent Components

| Agent               | Responsibility                                                 | Trigger Cadence | Auto-Commit |
| ------------------- | -------------------------------------------------------------- | --------------- | ----------- |
| 🏗️ **Architecture** | System design consistency, documentation updates               | 5min + push     | ✅ Enabled  |
| 🔧 **Backend**      | API quality, TypeScript compliance, test coverage              | 5min + push     | ✅ Enabled  |
| 🎨 **Frontend**     | UI/UX consistency, React patterns, component tests             | 5min + push     | ✅ Enabled  |
| 🚀 **DevOps**       | CI/CD health, Docker configs, security scanning                | 5min + push     | ✅ Enabled  |
| 🧪 **QA**           | Test coverage (90% target), E2E testing, regression prevention | 5min + nightly  | ✅ Enabled  |
| 📚 **Docs**         | Documentation sync, markdown validation, API docs              | 5min + push     | ✅ Enabled  |

### 3.3 Integration Points OPERATIONAL

1. **✅ Event Hooks**: GitHub Actions workflows trigger on every push and 5-minute schedule
2. **✅ Orchestrator Service**: `scripts/agent-orchestrator.js` with enhanced auto-commit logic
3. **✅ Agent Deployment**: Integrated into CI/CD pipeline with comprehensive validation
4. **✅ Communication Protocol**: Direct file system access with git-based coordination
5. **✅ Results & Feedback Loop**: Auto-commits with descriptive messages and GitHub issue escalation

---

## 4. CI/CD & Automation ✅ OPTIMIZED

### 4.1 Enhanced Pipeline Features

- **Agent Validator**: Validates all 6 agents on every run
- **No Gating**: Unconditional execution for maximum responsiveness
- **Auto-Commit Integration**: Proper `auto:` format with hook bypass
- **Comprehensive Testing**: lint, type-check, test, coverage, E2E
- **5-Minute Schedule**: Continuous optimization and monitoring

### 4.2 Quality Gates

- **Backend**: TypeScript strict mode, 85% coverage threshold, auto-lint fixes
- **Frontend**: React pattern validation, component testing, build verification
- **DevOps**: YAML validation, Docker config checks, security scanning
- **QA**: 90% coverage target, nightly E2E testing, performance monitoring

---

## 5. Git Automation & Self-Healing ✅ ACTIVE

### 5.1 Auto-Commit System

- **Format**: `auto: ${AGENT_NAME} – ${CHANGE_SUMMARY}`
- **Hook Bypass**: `.husky/commit-msg` and `.husky/pre-commit` skip auto: commits
- **Commitlint**: Configured to allow `auto:` type and agent scopes
- **Loop Prevention**: Smart detection prevents infinite commit cycles

### 5.2 Failure Handling

- **2-Failure Threshold**: Agents pause after consecutive failures
- **GitHub Escalation**: Auto-creates detailed issues with error logs
- **Self-Healing**: Automatic retry with exponential backoff
- **Quality Monitoring**: Comprehensive validation on every commit

---

## 6. Performance Metrics ACHIEVED

### 6.1 Throughput Improvements

- **Execution Frequency**: 12x improvement (5min vs 1hr)
- **Response Time**: Immediate fixes vs delayed batching
- **Failure Recovery**: 2-failure threshold with auto-escalation
- **Commit Efficiency**: Smart loop prevention with immediate commits

### 6.2 Reliability Enhancements

- **Self-Healing**: Auto-pause and retry on failures
- **Monitoring**: Comprehensive error logging and analysis
- **Escalation**: GitHub issue creation with detailed context
- **Quality Gates**: All agents have validation checks

---

## 7. System Status

**🚀 MAXIMUM THROUGHPUT MODE ACTIVE**

- **Agent Execution**: Every 5 minutes + on push
- **Auto-Commits**: Immediate with proper format
- **Self-Healing**: GitHub escalation active
- **Quality Gates**: All validation passing
- **CI/CD Pipeline**: Optimized and green
- **Git Automation**: Fully operational

---

## 8. Next Steps for Enhanced Agent Framework

### 8.1 Proposed Enhancements

1. **Event-Driven Architecture**: Implement Kafka/Redis Streams for real-time agent coordination
2. **Microservice Agents**: Containerize agents as independent services with gRPC communication
3. **Advanced Monitoring**: Add Prometheus metrics and Grafana dashboards for agent performance
4. **Machine Learning Integration**: Implement predictive optimization based on historical patterns

### 8.2 Implementation Roadmap

1. Break down into discrete tasks in `docs/todo.md`
2. Implement scaffolding for enhanced Agent Orchestrator with event bus
3. Define AgentInterface TypeScript types for microservice architecture
4. Extend tRPC procedures to emit domain events
5. Configure EventBus (Kafka or Redis) for real-time coordination
6. Build enhanced CI/CD workflows for containerized agent services

---

## 9. Agent Scheduler System ✅ ENHANCED

### 9.1 Scheduler Architecture

The Agent Scheduler provides automated execution of AI agents based on cron expressions with advanced control features:

```
                    ┌─────────────────┐
                    │   Frontend UI   │
                    │  (Monitoring)   │
                    └────────┬────────┘
                             │ WebSocket
                    ┌────────▼────────┐
                    │ WebSocket       │
                    │   Service       │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
    ┌────▼────┐      ┌──────▼──────┐     ┌─────▼─────┐
    │ Schedule│      │   Pause/    │     │ Real-time │
    │   API   │      │   Resume    │     │  Events   │
    └────┬────┘      └──────┬──────┘     └─────┬─────┘
         │                   │                   │
    ┌────▼───────────────────▼───────────────────▼────┐
    │              Agent Scheduler                     │
    │  - Cron Expression Parser                        │
    │  - Priority Queue Management                     │
    │  - Retry with Exponential Backoff               │
    │  - Pause/Resume State Management                │
    └──────────────────────┬──────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │    Agent    │
                    │   Manager   │
                    └─────────────┘
```

### 9.2 Key Features

#### Scheduling Capabilities
- **Cron-based Scheduling**: Standard cron expression support for flexible scheduling
- **Priority Levels**: LOW, NORMAL, HIGH, CRITICAL with queue-based execution
- **Concurrency Control**: Configurable max concurrent agents (default: 5)
- **Missed Job Handling**: Optional execution of jobs missed during downtime

#### Pause/Resume Functionality
- **Granular Control**: Pause/resume individual agent jobs without affecting others
- **State Persistence**: Paused state stored in database configuration
- **Running Job Protection**: Cannot pause agents while they're executing
- **Automatic Rescheduling**: Next run time recalculated on resume

#### Real-time Monitoring
- **WebSocket Events**: Live updates for all agent state changes
- **Progress Tracking**: Intermediate progress updates during execution
- **Scheduler Statistics**: Global view of running, queued, and paused jobs
- **Error Reporting**: Detailed error messages and retry status

### 9.3 Event Flow

1. **Scheduling Flow**:
   ```
   API Request → Validate Cron → Update Database → Add to Queue → Emit Event
   ```

2. **Execution Flow**:
   ```
   Check Queue → Verify Not Paused → Start Agent → Emit Progress → Complete/Retry
   ```

3. **Pause/Resume Flow**:
   ```
   Pause Request → Check Not Running → Update State → Emit Event → Remove from Queue
   Resume Request → Verify Paused → Update State → Recalculate Time → Add to Queue
   ```

### 9.4 WebSocket Events

| Event | Description | Payload |
|-------|-------------|---------|
| `agent:started` | Agent execution begins | `{agentId, jobId, status, timestamp}` |
| `agent:progress` | Progress update | `{agentId, progress, message, timestamp}` |
| `agent:completed` | Successful completion | `{agentId, duration, timestamp}` |
| `agent:failed` | Execution failed | `{agentId, error, timestamp}` |
| `agent:paused` | Job paused | `{agentId, jobId, status, timestamp}` |
| `agent:resumed` | Job resumed | `{agentId, jobId, status, timestamp}` |
| `scheduler:status` | Scheduler stats update | `{stats, timestamp}` |

### 9.5 Retry Strategy

- **Exponential Backoff**: 1s → 2s → 4s → ... (max 5 minutes)
- **Max Retries**: Configurable (default: 3)
- **Error State**: After max retries, agent marked as ERROR and removed from schedule
- **Manual Recovery**: Failed agents can be manually rescheduled

### 9.6 Frontend Integration

- **Agent Monitor Component**: Real-time status display with progress bars
- **Scheduler Overview Page**: Dashboard showing all scheduled agents
- **Pause/Resume Controls**: Admin-only controls for job management
- **WebSocket Subscriptions**: Automatic reconnection and event handling

---

_Last updated: 2025-01-15_  
_Status: ✅ FULLY OPERATIONAL - ALL SYSTEMS GREEN_  
_Generated by NeonHub Architecture Agent_
