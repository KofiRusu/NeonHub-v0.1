# AutoOpt Orchestration

This directory contains the complete NeonHub autonomous orchestration system. You can run everything from here without touching other parts of the repository.

## Directory Structure

```
AutoOpt/
├─ orchestrator/
│  ├─ package.json        # Orchestrator service manifest
│  ├─ tsconfig.json       # TypeScript config for orchestrator
│  ├─ src/index.ts        # Orchestrator implementation
│  └─ mock-vercel.js      # (Optional) mock deploy script
├─ scripts/
│  ├─ project-agent.js    # Project status agent
│  └─ ci-agent.js         # CI test agent
├─ start-simple-orchestrator.sh  # Startup script
├─ docker-compose.yml     # (Optional) local Postgres/Redis setup
├─ config.js              # Runtime configuration (if used)
├─ .env                   # Environment overrides (optional)
└─ logs/                  # Coordination logs and outputs
```

## Prerequisites
- Node.js ≥ 18
- npm
- (Optional) Docker & Docker Compose, if you use docker-compose.yml for DB/Redis

## Setup & Build
1. Navigate into this folder:
```bash
cd AutoOpt
```

2. Install and build the orchestrator:
```bash
cd orchestrator
npm ci
npm run build
cd ..
```

3. Make all scripts executable:
```bash
chmod +x start-simple-orchestrator.sh scripts/*.js orchestrator/mock-vercel.js
```

## Configuration
- You can override defaults via .env in this folder or via direct exports:
```bash
DEPLOY_COMMAND="npx vercel --prod"
PORT=3030
POLL_INTERVAL=60000
```

- Or create config.js and load environment variables from it.

## Running the System
1. Launch the orchestrator:
```bash
./start-simple-orchestrator.sh
```

2. In separate terminals, start the agents:
```bash
node scripts/project-agent.js
node scripts/ci-agent.js
```

3. Monitor logs or API endpoints:
```bash
tail -f logs/coordination-events.log
curl http://localhost:3030/health
curl http://localhost:3030/metrics
```

## API Endpoints
- POST /events — Accepts JSON { source, type, message } to log an event.
- GET /events — Returns recent coordination events.
- GET /health — Service status, deployment flag.
- GET /metrics — Deployment and event metrics.

## Behavior
- Polls coordination log every POLL_INTERVAL ms.
- Detects when both [PROJECT] [PROJECT_UPDATE] complete and [CI] [CI_UPDATE] passed have occurred.
- Runs the one-time deploy command (DEPLOY_COMMAND) and sets hasDeployed flag.
- Archives logs or rotates as desired after deployment.

---

This self-contained module ensures you can orchestrate NeonHub end-to-end from a single folder. Simply start the orchestrator and agents to let the system run autonomously. 