#!/usr/bin/env bash
#
# test-orchestrator.sh
# Runs tests against the orchestrator to verify functionality

# Set default orchestrator URL
export ORCH_URL=${ORCH_URL:-"http://localhost:3030"}

# Check if orchestrator is running
echo "Checking if orchestrator is running..."
if ! curl -s "$ORCH_URL/health" > /dev/null; then
  echo "⚠️  WARNING: Orchestrator doesn't seem to be running at $ORCH_URL"
  echo "⚠️  Run ./start-orchestrator.sh first, or set ORCH_URL to the correct URL"
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Run the test script
echo "🧪 Running orchestrator tests..."
node AutoOpt/scripts/test-orchestrator.js

EXIT_CODE=$?
if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ All tests passed!"
else
  echo "❌ Tests failed with exit code $EXIT_CODE"
  exit $EXIT_CODE
fi 