#!/usr/bin/env bash
#
# start-simple-orchestrator.sh
# Spawns a simplified NeonHub orchestrator and logs all coordination events.

# Configuration - can be overridden with environment variables
export PORT=${PORT:-3030}
export POLL_INTERVAL_MS=${POLL_INTERVAL_MS:-60000} # 1 minute by default
export LOG_DIR=${LOG_DIR:-"logs"}
export LOG_FILE=${LOG_FILE:-"coordination-events.log"}

# Load environment variables from project's .env (if you use dotenv CLI), 
# or directly export DEPLOY_COMMAND here:
# If you have a .env at orchestrator/.env:
if [ -f orchestrator/.env ]; then
  export $(grep -v '^#' orchestrator/.env | xargs)
fi

# 1. Ensure logs directory exists
mkdir -p $LOG_DIR

# 2. Clear existing log (optional, comment out to preserve history)
> $LOG_DIR/$LOG_FILE

# 3. Add initial entries to the log
echo "[$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")] [SYSTEM] [INIT] Starting NeonHub orchestration" >> $LOG_DIR/$LOG_FILE
echo "[$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")] [CURSOR_REQUEST] [TASK] Audit codebase & report feature backlog" >> $LOG_DIR/$LOG_FILE
echo "[$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")] [CURSOR_REQUEST] [TASK] Run full CI suite (lint, tsc, tests, coverage) and return any errors" >> $LOG_DIR/$LOG_FILE

# 4. Kill any existing orchestrator processes
pkill -f "node orchestrator/dist/index.js" || true

# 5. Make sure dependencies are installed
cd orchestrator
npm install dotenv express body-parser
cd ..

# 6. Build the orchestrator
echo "🔨 Building orchestrator..."
npm run build --prefix orchestrator

# Explicitly override deploy command if needed:
CURRENT_DIR=$(pwd)
export DEPLOY_COMMAND="${DEPLOY_COMMAND:-node $CURRENT_DIR/orchestrator/mock-vercel.js}"

# 7. Launch the orchestrator in the background, piping all stdout/stderr to the output log
echo "🚀 Starting NeonHub orchestrator on port $PORT..."
nohup node orchestrator/dist/index.js \
  >> $LOG_DIR/orchestrator-output.log 2>&1 &

ORCH_PID=$!
echo "✅ Orchestrator running as PID $ORCH_PID"
echo "✅ Coordination events in $LOG_DIR/$LOG_FILE"
echo "✅ Orchestrator output in $LOG_DIR/orchestrator-output.log"

# 8. Reminder on manual tail
echo ""
echo "👉 To watch live events, open another terminal and run:"
echo "   tail -f $LOG_DIR/$LOG_FILE"
echo ""
echo "👉 To test the API, you can use curl:"
echo "   curl http://localhost:$PORT/events"
echo "   curl http://localhost:$PORT/health"
echo "   curl http://localhost:$PORT/metrics"
echo ""
echo "👉 To post events:"
echo "   curl -X POST -H 'Content-Type: application/json' -d '{\"source\":\"CI\",\"type\":\"CI_UPDATE\",\"message\":\"All tests passed\"}' http://localhost:$PORT/events" 