# NeonHub Orchestration System

This system coordinates between three agents to take NeonHub from its current state to a full launch within 18 hours.

## Components

1. **Orchestrator Service** - A Node.js service that monitors agent events and triggers deployments
   - Located in `services/orchestrator/`
   - Exposes HTTP endpoints for communication
   - Polls for completion signals

2. **Project Agent** - Audits the codebase and reports on feature implementation
   - Located in `scripts/project-agent.js`
   - Reports project status and completion

3. **CI Agent** - Runs tests, linting, and type checking
   - Located in `scripts/ci-agent.js`
   - Reports CI status and completion

## How It Works

1. The orchestrator service maintains a log file (`logs/coordination-events.log`) that all agents write to
2. Agents communicate by posting events to the orchestrator's HTTP API
3. The orchestrator polls the log file every minute to check for completion signals
4. When both the Project and CI agents report completion, the orchestrator triggers smoke tests and deployment
5. **One-time deployment guard** ensures deployment only happens once
6. After successful deployment, log files are archived with timestamps

## Configuration

The orchestrator can be configured using environment variables or the `config.js` file:

| Setting | Description | Default |
|---------|-------------|---------|
| `PORT` | HTTP server port | `3040` |
| `POLL_INTERVAL_MS` | Polling interval in milliseconds | `60000` (1 minute) |
| `DEPLOY_COMMAND` | Command to run for deployment | `npx vercel --prod` |
| `LOG_DIR` | Directory for log files | `../../logs` |
| `LOG_FILE` | Name of coordination log file | `coordination-events.log` |

### Configuration Methods

1. **Environment Variables**
   ```bash
   export PORT=3050
   export DEPLOY_COMMAND="custom-deploy-script.sh"
   ./start-simple-orchestrator.sh
   ```

2. **Edit `config.js`**
   ```js
   module.exports = {
     PORT: process.env.PORT || 3040,
     POLL_INTERVAL_MS: process.env.POLL_INTERVAL_MS || 60000,
     // ...other settings
   };
   ```

## Message Format

All messages follow this format:
```
[TIMESTAMP] [SOURCE] [TYPE] MESSAGE
```

For example:
```
[2025-05-26T23:55:40.267Z] [CI] [CI_UPDATE] All CI checks complete - Tests passed, Coverage: 94%, No linting errors
```

## How to Use

1. **Start the Orchestrator**

   ```bash
   npm ci && npm run build --prefix services/orchestrator
   ./start-simple-orchestrator.sh
   ```

2. **Run the Agents**

   ```bash
   node scripts/project-agent.js
   node scripts/ci-agent.js
   ```

3. **Monitor Progress**

   ```bash
   tail -f logs/coordination-events.log
   ```

## Docker Compose

The system can also be run using Docker Compose:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Redis instance
- Orchestrator service

## API Endpoints

- `GET /events` - Retrieve recent events
- `POST /events` - Add a new event
- `GET /health` - Check orchestrator health status and uptime
- `GET /metrics` - Get metrics about event counts and deployment readiness

### Examples

#### Get Health Status
```bash
curl http://localhost:3040/health
```
Response:
```json
{
  "status": "ok",
  "service": "orchestrator",
  "uptime": 120.5,
  "hasDeployed": false
}
```

#### Get Metrics
```bash
curl http://localhost:3040/metrics
```
Response:
```json
{
  "total_events": 11,
  "project_events": 3,
  "ci_events": 7,
  "orchestrator_events": 1,
  "ready_for_deployment": true
}
```

#### Post an Event
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"source":"CI","type":"CI_UPDATE","message":"All tests passed"}' \
  http://localhost:3040/events
```

## Completion Detection

The orchestrator automatically detects when all tasks are complete by looking for:
1. A project update containing "complete"
2. A CI update containing "passed"

When both are found, it triggers the deployment sequence **once**. After deployment:
1. The `hasDeployed` flag prevents additional deployments
2. The log file is archived with a timestamp
3. Status is available via the `/health` and `/metrics` endpoints

## Cleanup

After a successful deployment, the orchestrator:
1. Archives the log file with a timestamp
2. Logs the successful deployment
3. Continues running to provide status via HTTP endpoints

To shut down the orchestrator after deployment:
```bash
pkill -f "node services/orchestrator/dist/index.js"
``` 