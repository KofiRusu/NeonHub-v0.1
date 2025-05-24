#!/bin/bash

# Script to start and manage the background agent system
# Usage: ./start_agents.sh [start|stop|restart|status|run-agent <agent_id>]

# Load env variables
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | sed 's/\r$//' | awk '/=/ {print $1}' | xargs)
fi

# Check if Docker is available and running
docker_available() {
  if ! command -v docker &> /dev/null; then
    return 1
  fi
  if ! docker info &> /dev/null; then
    return 1
  fi
  return 0
}

# Start agent scheduler
start_agents() {
  echo "Starting background agent system..."
  
  if ! docker_available; then
    echo "Docker is not available or not running."
    echo "Starting agent scheduler directly with Node.js..."
    cd backend && node scripts/run_scheduler.js &
    echo "Agent scheduler started in the background. Use 'jobs' command to view and 'fg' to bring to foreground."
    cd ..
    return
  fi
  
  # Check if the network exists, create if not
  if ! docker network inspect neonhub_network >/dev/null 2>&1; then
    echo "Creating Docker network 'neonhub_network'..."
    docker network create neonhub_network
  fi
  
  # Start the agent scheduler container
  docker-compose -f docker-compose.agent.yml up -d
  echo "Agent scheduler started successfully."
}

# Stop agent scheduler
stop_agents() {
  echo "Stopping background agent system..."
  
  if ! docker_available; then
    echo "Docker is not available or not running."
    echo "Stopping any Node.js agent scheduler processes..."
    pkill -f "node scripts/run_scheduler.js" || echo "No scheduler processes found."
    return
  fi
  
  docker-compose -f docker-compose.agent.yml down
  echo "Agent scheduler stopped successfully."
}

# Check status of agent system
check_status() {
  echo "Checking status of background agent system..."
  
  if ! docker_available; then
    echo "Docker is not available or not running."
    echo "Checking for Node.js agent scheduler processes..."
    ps aux | grep "node scripts/run_scheduler.js" | grep -v grep || echo "No scheduler processes found."
    return
  fi
  
  docker-compose -f docker-compose.agent.yml ps
}

# Run a specific agent once
run_agent() {
  if [ -z "$1" ]; then
    echo "Error: Agent ID is required."
    echo "Usage: ./start_agents.sh run-agent <agent_id>"
    exit 1
  fi
  
  agent_id=$1
  echo "Running agent with ID: $agent_id"
  
  # Check if we have a valid OPENAI_API_KEY
  if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your_openai_api_key_here" ]; then
    echo "Error: OPENAI_API_KEY is not set or is set to default value."
    echo "Please update your .env file with a valid OpenAI API key:"
    echo "OPENAI_API_KEY=your_actual_key_here"
    exit 1
  fi
  
  # Run the agent using Docker or direct Node.js
  if docker_available; then
    # Run the agent in the backend container
    if [ -n "$(docker-compose ps -q backend 2>/dev/null)" ]; then
      echo "Using existing backend container..."
      docker-compose exec -e "OPENAI_API_KEY=$OPENAI_API_KEY" backend node scripts/test_agent.js $agent_id
    else
      echo "Backend container not running. Starting a temporary container..."
      docker-compose run --rm -e "OPENAI_API_KEY=$OPENAI_API_KEY" backend node scripts/test_agent.js $agent_id
    fi
  else
    echo "Docker is not available or not running. Using direct Node.js..."
    cd backend && node scripts/test_agent.js $agent_id
    cd ..
  fi
}

# First, check if setup script has been run
if [ ! -f setup_agents_env.sh ]; then
  echo "Error: setup_agents_env.sh not found. Please run this script from the project root directory."
  exit 1
fi

# If not already executable, make it so
if [ ! -x setup_agents_env.sh ]; then
  chmod +x setup_agents_env.sh
fi

# Execute the setup script if it hasn't been run yet
if [ ! -f backend/config/agent.config.js ]; then
  echo "Running initial setup..."
  ./setup_agents_env.sh
fi

# Process command line arguments
case "$1" in
  start)
    start_agents
    ;;
  stop)
    stop_agents
    ;;
  restart)
    stop_agents
    start_agents
    ;;
  status)
    check_status
    ;;
  run-agent)
    run_agent "$2"
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status|run-agent <agent_id>}"
    exit 1
    ;;
esac

exit 0 