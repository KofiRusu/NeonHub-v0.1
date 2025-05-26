# NeonHub Custom Agent Framework - TODO List

This document breaks down the next set of discrete, Git-friendly tasks to implement and enhance NeonHub's Custom Agent Framework and related infrastructure.

**Current Status**: ✅ Phase 1 Complete - 6 agents operational with 5-minute cadence  
**Next Phase**: 🚀 Enhanced microservice architecture with event-driven coordination

---

## 1. Scaffolding & Core Interfaces

### **Task 1.1**: Create `AgentInterface` TypeScript module ⏳ READY

**Location**: `packages/agents/src/interfaces/AgentInterface.ts`
**Priority**: HIGH
**Dependencies**: None

**Requirements**:

- Define `onEvent(event: DomainEvent): Promise<void>`
- Define `execute(payload: any): Promise<AgentReport>`
- Define `report(): Promise<ReportRecord>`
- Add comprehensive TypeScript types for agent communication
- Include error handling and validation interfaces

### **Task 1.2**: Scaffold Agent Orchestrator service ⏳ READY

**Location**: `services/orchestrator`
**Priority**: HIGH
**Dependencies**: Task 1.1

**Requirements**:

- Initialize Node.js + TypeScript project
- Add Kafka/Redis client library
- Implement event listener stub
- Integration with existing `scripts/agent-orchestrator.js`
- Maintain backward compatibility with current system

---

## 2. Agent Stubs & Registry

### **Task 2.1**: Implement `DebugAgent` stub service ⏳ READY

**Location**: `services/debug-agent`
**Priority**: MEDIUM
**Dependencies**: Task 1.1

**Requirements**:

- HTTP endpoint `/run` accepting error payload
- Log received payload with structured logging
- Return placeholder diagnostic report
- Integration with existing error handling system
- Docker containerization ready

### **Task 2.2**: Create Prisma model for `AgentRegistry` 📋 PLANNED

**Location**: `prisma/schema.prisma`
**Priority**: MEDIUM
**Dependencies**: None

**Requirements**:

- Fields: `id`, `name`, `endpoint`, `active`, `lastHeartbeat`
- Add migration scripts
- Seed data for current 6 operational agents
- Integration with existing database schema

### **Task 2.3**: Bootstrap Prisma client in Orchestrator 📋 PLANNED

**Priority**: MEDIUM
**Dependencies**: Task 2.2

**Requirements**:

- Fetch registry entries
- Health check monitoring
- Auto-registration capabilities
- Failover logic for agent unavailability

---

## 3. Event Integration

### **Task 3.1**: Extend existing tRPC procedures 📋 PLANNED

**Location**: `packages/api/src/events/publisher.ts`
**Priority**: HIGH
**Dependencies**: Task 1.2

**Requirements**:

- `onCampaignCreate`, `onUserSignup`, `onError` hooks
- Use event bus publisher
- Maintain existing API compatibility
- Add event schema validation

### **Task 3.2**: Write unit tests for event publishing 🧪 PLANNED

**Priority**: MEDIUM
**Dependencies**: Task 3.1

**Requirements**:

- Jest test suite
- Mock event bus
- Integration tests with existing CI/CD
- Coverage target: 90%

---

## 4. Infrastructure & Deployment

### **Task 4.1**: Dockerize Orchestrator and DebugAgent 🐳 PLANNED

**Priority**: HIGH
**Dependencies**: Task 2.1

**Requirements**:

- Add `Dockerfile` and `.dockerignore`
- Write `docker-compose.yml` for local testing
- Include Postgres, Redis/Kafka, orchestrator, debug-agent
- Multi-stage builds for optimization
- Health checks and monitoring

### **Task 4.2**: Create Helm chart for agent services ☸️ PLANNED

**Location**: `charts/agents`
**Priority**: LOW
**Dependencies**: Task 4.1

**Requirements**:

- Kubernetes deployment manifests
- ConfigMaps and Secrets management
- Service discovery configuration
- Horizontal Pod Autoscaler setup

---

## 5. CI/CD & Quality Gates

### **Task 5.1**: Update GitHub Actions workflows 🔄 READY

**Location**: `.github/workflows/ci.yml`
**Priority**: HIGH
**Dependencies**: Task 2.1

**Requirements**:

- Include agent services tests
- Steps: lint, type-check, Jest, build Docker images
- Integration with existing CI/CD pipeline
- Maintain current 5-minute agent execution

### **Task 5.2**: Add Playwright E2E tests 🎭 PLANNED

**Priority**: MEDIUM
**Dependencies**: Task 3.1

**Requirements**:

- Verify orchestrator–agent communication
- Mock event -> stub agent flow
- Integration with existing E2E test suite
- Nightly execution schedule

---

## 6. Monitoring & Autoscaling

### **Task 6.1**: Integrate Prometheus metrics 📊 PLANNED

**Location**: Orchestrator service
**Priority**: MEDIUM
**Dependencies**: Task 1.2

**Requirements**:

- Expose `/metrics` endpoint
- Instrument event handling counters and latencies
- Agent health and performance metrics
- Integration with existing monitoring

### **Task 6.2**: Create Grafana dashboard 📈 PLANNED

**Priority**: LOW
**Dependencies**: Task 6.1

**Requirements**:

- JSON template for NeonHub agents
- Real-time agent performance visualization
- Alert configuration for agent failures
- Integration with existing dashboards

---

## 7. Migration & Compatibility

### **Task 7.1**: Gradual Migration Strategy 🔄 CRITICAL

**Priority**: HIGH
**Dependencies**: Task 1.2

**Requirements**:

- Maintain current 6-agent system during transition
- Feature flags for new vs old orchestrator
- Rollback capabilities
- Zero-downtime migration plan

### **Task 7.2**: Performance Benchmarking 📊 PLANNED

**Priority**: MEDIUM
**Dependencies**: Task 7.1

**Requirements**:

- Compare current vs enhanced system performance
- Latency and throughput measurements
- Resource utilization analysis
- Optimization recommendations

---

## Implementation Priority Matrix

| Phase        | Tasks         | Timeline  | Dependencies   |
| ------------ | ------------- | --------- | -------------- |
| **Phase 2A** | 1.1, 1.2, 5.1 | Week 1-2  | Current system |
| **Phase 2B** | 2.1, 2.2, 3.1 | Week 3-4  | Phase 2A       |
| **Phase 2C** | 4.1, 5.2, 6.1 | Week 5-6  | Phase 2B       |
| **Phase 2D** | 2.3, 3.2, 7.1 | Week 7-8  | Phase 2C       |
| **Phase 2E** | 4.2, 6.2, 7.2 | Week 9-10 | Phase 2D       |

---

## Success Criteria

### **Phase 2 Goals**:

- ✅ Maintain current 5-minute agent execution
- ✅ Zero downtime during migration
- ✅ Enhanced event-driven architecture operational
- ✅ Microservice agents deployed and monitored
- ✅ 90%+ test coverage maintained
- ✅ Performance equal or better than current system

### **Quality Gates**:

- All existing functionality preserved
- New features backward compatible
- Comprehensive test coverage
- Documentation updated
- Security review completed

---

_Document generated on 2025-01-15_  
_Status: 📋 READY FOR IMPLEMENTATION_  
_Next Action: Begin Task 1.1 - AgentInterface TypeScript module_
