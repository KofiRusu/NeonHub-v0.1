# NeonHub Orchestration System

The NeonHub Orchestration System provides an autonomous development workflow that helps coordinate multiple agents and automate deployment when certain conditions are met.

## System Components

1. **Orchestrator**: A TypeScript Express server that:
   - Coordinates events via an API
   - Monitors agent progress
   - Triggers deployment when conditions are met
   - Provides health and metrics endpoints

2. **Agent Scripts**:
   - `project-agent.js`: Analyzes the codebase, reports features and project status
   - `ci-agent.js`: Runs (or simulates) CI checks such as linting, tests, and coverage

3. **Mock Deployment**: Simulates a Vercel deployment for testing purposes

## Getting Started

### Prerequisites

- Node.js 14+
- npm

### Quick Start

1. Start the orchestration system:
   ```bash
   ./start-orchestrator.sh
   ```

2. In separate terminals, run the agent scripts:
   ```bash
   # Run the project agent
   ORCH_URL=http://localhost:3030/events node AutoOpt/scripts/project-agent.js
   
   # Run the CI agent
   ORCH_URL=http://localhost:3030/events node AutoOpt/scripts/ci-agent.js
   ```

3. Monitor events:
   ```bash
   tail -f logs/coordination-events.log
   ```

## Configuration

The system can be configured using environment variables:

- `PORT`: Orchestrator server port (default: 3030)
- `POLL_INTERVAL_MS`: How often to check for deployment conditions (default: 60000ms)
- `LOG_DIR`: Directory for log files (default: "logs")
- `LOG_FILE`: Name of the events log file (default: "coordination-events.log")
- `DEPLOY_COMMAND`: Command to run when deployment is triggered (default: mock-vercel.js)

## API Endpoints

The orchestrator provides several HTTP endpoints:

- `POST /events`: Submit a new event
  ```bash
  curl -X POST -H 'Content-Type: application/json' \
       -d '{"source":"CI","type":"CI_UPDATE","message":"All tests passed"}' \
       http://localhost:3030/events
  ```

- `GET /events`: Retrieve recent events
  ```bash
  curl http://localhost:3030/events
  ```

- `GET /health`: Check orchestrator health
  ```bash
  curl http://localhost:3030/health
  ```

- `GET /metrics`: Get metrics about events and deployment status
  ```bash
  curl http://localhost:3030/metrics
  ```

## Deployment Conditions

The system will trigger deployment automatically when:

1. The project agent reports completion (`[PROJECT] [PROJECT_UPDATE].*complete`)
2. The CI agent reports successful tests (`[CI] [CI_UPDATE].*passed`)

## Event Log Format

Events in the coordination log follow this format:
```
[TIMESTAMP] [SOURCE] [TYPE] MESSAGE
```

Example:
```
[2023-06-15T12:34:56.789Z] [CI] [CI_UPDATE] All tests passed
```

## Extending the System

To add new agents:
1. Create a new script in the `AutoOpt/scripts/` directory
2. Use the provided axios-based API to send events to the orchestrator
3. Ensure your completion message matches the patterns in `config.js`

## Troubleshooting

- Check the orchestrator output log: `logs/orchestrator-output.log`
- Verify the coordination log: `logs/coordination-events.log`
- Ensure the orchestrator is running: `ps aux | grep node`
- Check API health: `curl http://localhost:3030/health` 