#!/bin/bash

# Script to manage domain-specific engineering conversations
# Usage: ./manage_domain_chats.sh [setup|list|start|export|import|db-setup]

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

# Extract UUID from text (compatible with both GNU and BSD grep)
extract_uuid() {
  echo "$1" | grep -o "[0-9a-f]\{8\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{12\}" | head -n 1
}

# Setup database
setup_database() {
  echo "Setting up the database..."
  
  # Run the environment setup if needed
  if [ ! -f setup_agents_env.sh ]; then
    echo "Error: setup_agents_env.sh not found. Please run this script from the project root directory."
    exit 1
  fi
  
  # Run the environment setup if needed
  if [ ! -f backend/config/agent.config.js ]; then
    echo "Running initial environment setup..."
    ./setup_agents_env.sh
  fi
  
  # Run the database setup script
  if docker_available; then
    if [ -n "$(docker-compose ps -q backend 2>/dev/null)" ]; then
      echo "Using existing backend container..."
      docker-compose exec backend node scripts/setup_database.js
    else
      echo "Backend container not running. Starting a temporary container..."
      docker-compose run --rm backend node scripts/setup_database.js
    fi
  else
    echo "Docker is not available or not running. Using direct Node.js..."
    cd backend && node scripts/setup_database.js
    cd ..
  fi
}

# Setup domain agents
setup_domains() {
  echo "Setting up domain-specific engineering conversation agents..."
  
  # First, make sure the environment is set up
  if [ ! -f setup_agents_env.sh ]; then
    echo "Error: setup_agents_env.sh not found. Please run this script from the project root directory."
    exit 1
  fi
  
  # Run the environment setup if needed
  if [ ! -f backend/config/agent.config.js ]; then
    echo "Running initial environment setup..."
    ./setup_agents_env.sh
  fi
  
  # Check if we have a valid OPENAI_API_KEY
  if [ -z "$OPENAI_API_KEY" ] || [ "$OPENAI_API_KEY" = "your_openai_api_key_here" ]; then
    echo "Error: OPENAI_API_KEY is not set or is set to default value."
    echo "Please update your .env file with a valid OpenAI API key:"
    echo "OPENAI_API_KEY=your_actual_key_here"
    exit 1
  fi
  
  # Run the database setup first
  setup_database
  
  # Try with Docker if available, otherwise fall back to direct Node.js
  if docker_available; then
    if [ -n "$(docker-compose ps -q backend 2>/dev/null)" ]; then
      echo "Using existing backend container..."
      docker-compose exec backend node scripts/setup_domain_agents.js
    else
      echo "Backend container not running. Starting a temporary container..."
      docker-compose run --rm -e "OPENAI_API_KEY=$OPENAI_API_KEY" backend node scripts/setup_domain_agents.js
    fi
  else
    echo "Docker is not available or not running. Using direct Node.js..."
    cd backend && node scripts/setup_domain_agents.js
    cd ..
  fi
}

# List all domain agents
list_domains() {
  echo "Listing all engineering domain agents..."
  
  # Use the agent_util.js script instead of Prisma CLI
  if docker_available; then
    if [ -n "$(docker-compose ps -q backend 2>/dev/null)" ]; then
      echo "Using existing backend container..."
      docker-compose exec backend node scripts/agent_util.js list ENGINEERING_CONVERSATION
    else
      echo "Backend container not running. Starting a temporary container..."
      docker-compose run --rm backend node scripts/agent_util.js list ENGINEERING_CONVERSATION
    fi
  else
    echo "Docker is not available or not running. Using direct Node.js..."
    cd backend && node scripts/agent_util.js list ENGINEERING_CONVERSATION
    cd ..
  fi
}

# Start a conversation with a specific domain agent
start_domain_chat() {
  if [ -z "$1" ]; then
    echo "Error: Agent ID or domain name is required."
    echo "Usage: ./manage_domain_chats.sh start <agent_id or domain_name>"
    list_domains
    exit 1
  fi
  
  identifier="$1"
  
  # If it looks like a UUID, use it as agent_id; otherwise use it as a domain name
  if [[ $identifier =~ ^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$ ]]; then
    agent_id="$identifier"
    echo "Starting chat with agent ID: $agent_id"
  else
    echo "Looking up agent with domain: $identifier"
    
    # Use the agent_util.js script to find agent by name
    if docker_available; then
      if [ -n "$(docker-compose ps -q backend 2>/dev/null)" ]; then
        RESULT=$(docker-compose exec backend node scripts/agent_util.js find "$identifier" ENGINEERING_CONVERSATION)
      else
        RESULT=$(docker-compose run --rm backend node scripts/agent_util.js find "$identifier" ENGINEERING_CONVERSATION)
      fi
    else
      echo "Docker is not available or not running. Using direct Node.js..."
      cd backend
      RESULT=$(node scripts/agent_util.js find "$identifier" ENGINEERING_CONVERSATION)
      cd ..
    fi
    
    # Extract the agent ID from the result
    agent_id=$(echo "$RESULT" | grep -o '"id": *"[0-9a-f]\{8\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{12\}"' | grep -o "[0-9a-f]\{8\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{4\}-[0-9a-f]\{12\}" | head -n 1)
    
    if [ -z "$agent_id" ]; then
      echo "Error: Could not find an agent matching '$identifier'"
      echo "Available agents:"
      list_domains
      exit 1
    fi
    
    echo "Found agent ID: $agent_id"
  fi
  
  # Start the chat with the agent
  if docker_available; then
    ./start_agents.sh run-agent "$agent_id"
  else
    echo "Docker is not available or not running. Using direct Node.js..."
    cd backend && node scripts/test_agent.js "$agent_id"
    cd ..
  fi
}

# Export conversation history to a file
export_conversation() {
  if [ -z "$1" ]; then
    echo "Error: Agent ID is required."
    echo "Usage: ./manage_domain_chats.sh export <agent_id> [filename]"
    exit 1
  fi
  
  agent_id="$1"
  default_filename="engineering_conversation_${agent_id}_$(date +%Y%m%d_%H%M%S).json"
  filename="${2:-$default_filename}"
  
  echo "Exporting conversation for agent ID: $agent_id to $filename"
  
  # Use the agent_util.js script to get the latest session
  if docker_available; then
    if [ -n "$(docker-compose ps -q backend 2>/dev/null)" ]; then
      docker-compose exec backend node scripts/agent_util.js session "$agent_id" > "$filename"
    else
      docker-compose run --rm backend node scripts/agent_util.js session "$agent_id" > "$filename"
    fi
  else
    echo "Docker is not available or not running. Using direct Node.js..."
    cd backend
    node scripts/agent_util.js session "$agent_id" > "../$filename"
    cd ..
  fi
  
  echo "Conversation exported to $filename"
}

# Import conversation history from a file
import_conversation() {
  if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Error: Agent ID and filename are required."
    echo "Usage: ./manage_domain_chats.sh import <agent_id> <filename>"
    exit 1
  fi
  
  agent_id="$1"
  filename="$2"
  
  if [ ! -f "$filename" ]; then
    echo "Error: File $filename not found."
    exit 1
  fi
  
  echo "Importing conversation from $filename to agent ID: $agent_id"
  
  # Create a JS import script
  cat > backend/scripts/temp_import.js << EOL
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const { createAgentSession } = require('./agent_util');

async function importConversation() {
  const prisma = new PrismaClient();
  try {
    const filePath = path.resolve(__dirname, '../../${filename}');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const sessionData = JSON.parse(fileData);
    
    // Extract the context from the session data
    const context = sessionData.context || sessionData;
    
    await createAgentSession('${agent_id}', context);
    
    console.log('Conversation imported successfully');
  } catch (error) {
    console.error('Error importing conversation:', error);
  } finally {
    await prisma.\$disconnect();
  }
}

importConversation();
EOL
  
  # Run the import script
  if docker_available; then
    if [ -n "$(docker-compose ps -q backend 2>/dev/null)" ]; then
      docker-compose exec backend node scripts/temp_import.js
    else
      docker-compose run --rm backend node scripts/temp_import.js
    fi
  else
    echo "Docker is not available or not running. Using direct Node.js..."
    cd backend && node scripts/temp_import.js
    cd ..
  fi
  
  # Clean up the temporary script
  rm backend/scripts/temp_import.js
}

# Show example commands
show_examples() {
  echo "Example commands:"
  echo ""
  echo "  Setup database first:"
  echo "  ./manage_domain_chats.sh db-setup"
  echo ""
  echo "  Setup all domain agents:"
  echo "  ./manage_domain_chats.sh setup"
  echo ""
  echo "  List all domain agents:"
  echo "  ./manage_domain_chats.sh list"
  echo ""
  echo "  Start a conversation by domain name:"
  echo "  ./manage_domain_chats.sh start frontend"
  echo "  ./manage_domain_chats.sh start backend"
  echo "  ./manage_domain_chats.sh start devops"
  echo ""
  echo "  Start a conversation by agent ID:"
  echo "  ./manage_domain_chats.sh start 12345678-1234-1234-1234-123456789abc"
  echo ""
  echo "  Export a conversation to a file:"
  echo "  ./manage_domain_chats.sh export 12345678-1234-1234-1234-123456789abc myconversation.json"
  echo ""
  echo "  Import a conversation from a file:"
  echo "  ./manage_domain_chats.sh import 12345678-1234-1234-1234-123456789abc myconversation.json"
}

# Process command line arguments
case "$1" in
  db-setup)
    setup_database
    ;;
  setup)
    setup_domains
    ;;
  list)
    list_domains
    ;;
  start)
    start_domain_chat "$2"
    ;;
  export)
    export_conversation "$2" "$3"
    ;;
  import)
    import_conversation "$2" "$3"
    ;;
  examples)
    show_examples
    ;;
  *)
    echo "Usage: $0 {db-setup|setup|list|start|export|import|examples}"
    echo ""
    echo "Commands:"
    echo "  db-setup            Initialize and setup the database"
    echo "  setup               Create domain-specific engineering conversation agents"
    echo "  list                List all available domain agents"
    echo "  start <id/domain>   Start a conversation with a specific agent (by ID or domain name)"
    echo "  export <id> [file]  Export conversation history to a file"
    echo "  import <id> <file>  Import conversation history from a file"
    echo "  examples            Show example commands"
    exit 1
    ;;
esac

exit 0 