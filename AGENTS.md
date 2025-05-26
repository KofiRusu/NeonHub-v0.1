# NeonHub Agent System

## Overview

The NeonHub Agent System is a comprehensive automation framework that maintains code quality, documentation, and system architecture through specialized AI agents. The system operates both in CI/CD pipelines and local development environments.

## Architecture

### Specialized Agents

#### 🏗️ **Architecture Agent**

- **Purpose**: Maintains system design and architectural consistency
- **Triggers**: Changes to architecture files, main branch pushes
- **Actions**: Updates architecture.md, validates component relationships, breaks down features
- **Files Monitored**: `architecture.md`, `IMPLEMENTATION_PLAN.md`, `PROJECT_OVERVIEW.md`

#### 🔧 **Backend Agent**

- **Purpose**: Ensures backend code quality and API consistency
- **Triggers**: Backend code changes, main branch pushes
- **Actions**: Lints code, runs tests, scaffolds missing routes, validates TypeScript
- **Files Monitored**: `backend/**/*.ts`, Prisma schemas, package.json

#### 🎨 **Frontend Agent**

- **Purpose**: Maintains UI/UX consistency and component quality
- **Triggers**: Frontend code changes, main branch pushes
- **Actions**: Lints React code, runs tests, scaffolds components, validates builds
- **Files Monitored**: `frontend/**/*.tsx`, components, package.json

#### 🚀 **DevOps Agent**

- **Purpose**: Ensures CI/CD pipeline health and infrastructure reliability
- **Triggers**: Workflow changes, Docker changes, hourly schedule
- **Actions**: Validates YAML, checks Docker configs, monitors security
- **Files Monitored**: `.github/workflows/`, `docker-compose*.yml`, Dockerfiles

#### 🧪 **QA Agent**

- **Purpose**: Maintains test coverage and prevents regressions
- **Triggers**: Code changes, test changes, main branch pushes
- **Actions**: Analyzes coverage, generates tests, runs E2E tests
- **Files Monitored**: Test files, source code for coverage analysis

#### 📚 **Docs Agent**

- **Purpose**: Keeps documentation synchronized with code
- **Triggers**: Documentation changes, API changes, main branch pushes
- **Actions**: Updates README, generates API docs, validates links
- **Files Monitored**: `**/*.md`, API routes, documentation files

## Usage

### GitHub Actions (Automated)

The agent system automatically runs on:

1. **Push to main**: All agents execute in sequence
2. **Pull requests**: Backend, Frontend, and QA agents run in parallel
3. **Scheduled**: DevOps, QA, and Docs agents run nightly at 2 AM UTC
4. **Manual trigger**: Run specific agents via GitHub Actions UI

#### Manual Trigger

```bash
# Via GitHub CLI
gh workflow run agent-orchestrator.yml -f agent_type=backend

# Via GitHub UI
# Go to Actions → NeonHub Agent Orchestrator → Run workflow
```

### Local Development

#### Prerequisites

```bash
# Ensure Node.js is installed
node --version  # Should be 18+

# Make script executable (if not already)
chmod +x scripts/agent-manager.js
```

#### Running Agents Locally

```bash
# Run all agents
node scripts/agent-manager.js all

# Run specific agent
node scripts/agent-manager.js architecture
node scripts/agent-manager.js backend
node scripts/agent-manager.js frontend
node scripts/agent-manager.js devops
node scripts/agent-manager.js qa
node scripts/agent-manager.js docs

# Get help
node scripts/agent-manager.js
```

#### Example Output

```bash
$ node scripts/agent-manager.js all

🚀 Running all NeonHub agents...

--- ARCHITECTURE AGENT ---
🏗️ Analyzing system architecture...
Found 45 backend files, 23 frontend files
✅ architecture agent completed successfully

--- BACKEND AGENT ---
🔧 Analyzing backend changes...
✅ Backend linting passed
Found 28 API endpoints
✅ backend agent completed successfully

--- FRONTEND AGENT ---
🎨 Analyzing frontend changes...
✅ Frontend linting passed
Found 15 React components
✅ frontend agent completed successfully

--- DEVOPS AGENT ---
🚀 Validating infrastructure...
✅ ci.yml is valid
✅ agent-orchestrator.yml is valid
✅ docker-compose.yml exists
Validated 2 workflows, 1 Docker files
✅ devops agent completed successfully

--- QA AGENT ---
🧪 Analyzing test coverage...
Generated QA report
✅ qa agent completed successfully

--- DOCS AGENT ---
📚 Updating documentation...
Checked 5 markdown links
✅ docs agent completed successfully

📊 Final Results:
┌─────────────┬─────────────────────────────────────────────┐
│   (index)   │                   Values                    │
├─────────────┼─────────────────────────────────────────────┤
│ architecture│ { status: 'success', files_analyzed: {...} }│
│   backend   │   { status: 'success', endpoints: 28 }      │
│  frontend   │   { status: 'success', components: 15 }     │
│   devops    │ { status: 'success', workflows: 2, doc...} │
│     qa      │ { status: 'success', backend: {...}, fr...} │
│    docs     │     { status: 'success', links: 5 }         │
└─────────────┴─────────────────────────────────────────────┘
```

## Configuration

### Agent Configuration (`agent-config.json`)

The system behavior is controlled by `agent-config.json`:

```json
{
  "agents": {
    "backend": {
      "triggers": ["on_backend_change", "on_push_to_main"],
      "quality_gates": {
        "lint": "npm run lint",
        "test": "npm test",
        "type_check": "npx tsc --noEmit"
      }
    }
  },
  "global_settings": {
    "quality_standards": {
      "min_test_coverage": 90,
      "max_complexity": 10
    }
  }
}
```

### Customizing Agent Behavior

1. **Modify triggers**: Edit the `triggers` array for each agent
2. **Add quality gates**: Define new checks in `quality_gates`
3. **Change file monitoring**: Update `files_monitored` patterns
4. **Adjust commit prefixes**: Modify `commit_prefix` for consistent commit messages

## Integration with Development Workflow

### Pre-commit Hooks

```bash
# Add to .git/hooks/pre-commit
#!/bin/bash
node scripts/agent-manager.js backend
node scripts/agent-manager.js frontend
```

### VS Code Integration

Add to `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Run All Agents",
      "type": "shell",
      "command": "node scripts/agent-manager.js all",
      "group": "build"
    }
  ]
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "agents": "node scripts/agent-manager.js all",
    "agent:backend": "node scripts/agent-manager.js backend",
    "agent:frontend": "node scripts/agent-manager.js frontend"
  }
}
```

## Monitoring and Debugging

### GitHub Actions Logs

- Go to **Actions** tab in GitHub repository
- Click on **NeonHub Agent Orchestrator** workflow
- View individual job logs for detailed output

### Local Debugging

```bash
# Enable verbose output
DEBUG=1 node scripts/agent-manager.js backend

# Check agent status
cat AGENT_STATUS.md

# View QA report
cat qa-report.md
```

### Common Issues

#### Agent Fails to Run

1. Check Node.js version (requires 18+)
2. Ensure dependencies are installed (`npm ci`)
3. Verify file permissions on scripts

#### Linting Errors

1. Run `npm run lint -- --fix` to auto-fix
2. Check ESLint configuration
3. Review agent-specific quality gates

#### Test Failures

1. Run tests locally: `npm test`
2. Check test coverage: `npm test -- --coverage`
3. Review QA agent report for insights

## Best Practices

### For Developers

1. **Run agents locally** before pushing to catch issues early
2. **Review agent reports** to understand code quality trends
3. **Keep configuration updated** as project evolves
4. **Use conventional commits** to trigger appropriate agents

### For Maintainers

1. **Monitor agent execution** in GitHub Actions
2. **Update quality gates** as standards evolve
3. **Review and approve** agent-generated commits
4. **Customize triggers** based on team workflow

### For CI/CD

1. **Agents run automatically** on main branch pushes
2. **Parallel execution** for faster feedback on PRs
3. **Failure strategies** prevent broken builds
4. **Scheduled maintenance** keeps system healthy

## Future Enhancements

- **AI-powered code review** suggestions
- **Automated dependency updates** with testing
- **Performance monitoring** and optimization
- **Security vulnerability scanning** and patching
- **Integration with external tools** (Slack, Jira, etc.)

---

_The NeonHub Agent System continuously evolves to maintain the highest standards of code quality, documentation, and system reliability._
