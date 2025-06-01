# NeonHub

[![🚀 Quality Pipeline](https://github.com/neonhub/neonhub/actions/workflows/ci.yml/badge.svg)](https://github.com/neonhub/neonhub/actions/workflows/ci.yml)
[![🌙 Nightly Checks](https://github.com/neonhub/neonhub/actions/workflows/nightly.yml/badge.svg)](https://github.com/neonhub/neonhub/actions/workflows/nightly.yml)
[![codecov](https://codecov.io/gh/neonhub/neonhub/branch/main/graph/badge.svg)](https://codecov.io/gh/neonhub/neonhub)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=neonhub_neonhub&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=neonhub_neonhub)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=neonhub_neonhub&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=neonhub_neonhub)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=neonhub_neonhub&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=neonhub_neonhub)

> **AI-Powered Marketing Automation Platform** with autonomous agent orchestration and comprehensive quality assurance.

## 🚀 Quality Pipeline

Our comprehensive quality pipeline ensures code excellence through:

- **🔍 Quality Gates**: ESLint, Prettier, TypeScript checks
- **🧪 Testing**: Unit, Integration, E2E with 80%+ coverage requirement
- **🔒 Security**: Snyk, OWASP, CodeQL scans
- **⚡ Performance**: Lighthouse CI with performance budgets
- **📊 Code Quality**: SonarCloud analysis and metrics
- **🌙 Nightly Checks**: Comprehensive testing across all browsers

## 🤖 Autonomous Development

NeonHub features an autonomous orchestration system that enables continuous overnight development:

- **Orchestrator**: Coordinates agents and triggers deployments when conditions are met
- **Project Agent**: Analyzes the codebase and reports project status
- **CI Agent**: Runs tests, linting, and ensures quality standards

To use the orchestration system:

```bash
# Start the orchestrator
./start-orchestrator.sh

# Run the agents
./start_agents.sh

# Monitor events
tail -f logs/coordination-events.log
```

For more details, see [ORCHESTRATOR_README.md](ORCHESTRATOR_README.md).

## 🕐 Agent Scheduler

NeonHub includes an advanced agent scheduling system with real-time monitoring and control:

### Features

- **⏰ Cron-based Scheduling**: Schedule agents using standard cron expressions
- **⏸️ Pause/Resume Control**: Pause and resume individual agent jobs without affecting others
- **📊 Real-time Monitoring**: Live WebSocket updates for agent execution status
- **🔄 Automatic Retry**: Exponential backoff retry strategy for failed executions
- **📈 Priority Queue**: Execute agents based on priority levels (LOW, NORMAL, HIGH, CRITICAL)
- **🎯 Concurrency Control**: Configurable maximum concurrent agent executions

### Quick Start

```bash
# Schedule an agent to run every 5 minutes
curl -X POST http://localhost:5000/api/agents/{agentId}/schedule \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"cronExpression": "*/5 * * * *", "priority": "HIGH"}'

# Pause a running job
curl -X PATCH http://localhost:5000/api/agents/{agentId}/schedule/{jobId}/pause \
  -H "Authorization: Bearer {token}"

# Resume a paused job
curl -X PATCH http://localhost:5000/api/agents/{agentId}/schedule/{jobId}/resume \
  -H "Authorization: Bearer {token}"
```

### Monitoring Dashboard

Access the scheduler monitoring dashboard at `/dashboard/agents/scheduler` to:
- View all scheduled agents and their status
- Monitor real-time execution progress
- Pause/resume jobs with admin privileges
- Track scheduler statistics and performance

For detailed API documentation, see [docs/AGENT_SCHEDULING_API.md](docs/AGENT_SCHEDULING_API.md).

## Setup

Install dependencies:

```