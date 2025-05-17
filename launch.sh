#!/bin/bash

# NeonHub Launch Script
# This script automates the preparation and launch of the NeonHub platform

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo -e "${BOLD}${BLUE}"
echo "███╗   ██╗███████╗ ██████╗ ███╗   ██╗██╗  ██╗██╗   ██╗██████╗ "
echo "████╗  ██║██╔════╝██╔═══██╗████╗  ██║██║  ██║██║   ██║██╔══██╗"
echo "██╔██╗ ██║█████╗  ██║   ██║██╔██╗ ██║███████║██║   ██║██████╔╝"
echo "██║╚██╗██║██╔══╝  ██║   ██║██║╚██╗██║██╔══██║██║   ██║██╔══██╗"
echo "██║ ╚████║███████╗╚██████╔╝██║ ╚████║██║  ██║╚██████╔╝██████╔╝"
echo "╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ "
echo -e "${NC}"
echo -e "${BOLD}Launch Preparation Script${NC}"
echo

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BOLD}Checking prerequisites...${NC}"

# Check Node.js
if ! command_exists node; then
  echo -e "${RED}Error: Node.js is not installed. Please install Node.js (v16+).${NC}"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
if [ "$NODE_MAJOR" -lt 16 ]; then
  echo -e "${YELLOW}Warning: Node.js version $NODE_VERSION detected. NeonHub works best with Node.js v16+.${NC}"
fi

# Check npm
if ! command_exists npm; then
  echo -e "${RED}Error: npm is not installed. Please install npm.${NC}"
  exit 1
fi

# Check if Docker is available (optional)
if command_exists docker; then
  DOCKER_AVAILABLE=true
  echo -e "${GREEN}✓ Docker is available${NC}"
else
  DOCKER_AVAILABLE=false
  echo -e "${YELLOW}Notice: Docker is not available. Will proceed with local setup.${NC}"
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    echo -e "${YELLOW}No .env file found. Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}Created .env file. Please edit it with your configuration.${NC}"
  else
    echo -e "${RED}Error: No .env or .env.example file found.${NC}"
    exit 1
  fi
fi

# Ask user whether to run with Docker or locally
if [ "$DOCKER_AVAILABLE" = true ]; then
  echo
  echo -e "${BOLD}Launch Options:${NC}"
  echo "1) Launch with Docker (recommended)"
  echo "2) Launch locally"
  echo "3) Run only launch preparation"
  read -p "Select an option (1-3): " LAUNCH_OPTION
  echo
else
  LAUNCH_OPTION=2
fi

# Function to run launch preparation
run_launch_prep() {
  echo -e "${BOLD}Running launch preparation...${NC}"
  cd backend
  
  # Check if dependencies are installed
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    npm install
  fi
  
  # Run launch preparation
  echo -e "${BLUE}Preparing system for launch...${NC}"
  npm run launch-prep
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Launch preparation completed successfully!${NC}"
  else
    echo -e "${RED}✗ Launch preparation failed. Check errors above.${NC}"
    exit 1
  fi
  
  # Run validation
  echo -e "${BLUE}Validating system...${NC}"
  npm run validate
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ System validation passed!${NC}"
  else
    echo -e "${YELLOW}⚠ System validation completed with warnings. See details above.${NC}"
  fi
  
  cd ..
}

# Main execution based on selected option
case $LAUNCH_OPTION in
  1)
    # Docker mode
    echo -e "${BOLD}Launching with Docker...${NC}"
    
    # Check if docker-compose exists
    if ! command_exists docker-compose; then
      echo -e "${RED}Error: docker-compose is not installed.${NC}"
      exit 1
    fi
    
    # Run launch preparation first
    run_launch_prep
    
    # Launch with Docker Compose
    echo -e "${BOLD}Starting services with Docker Compose...${NC}"
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✓ NeonHub is now running with Docker!${NC}"
      echo -e "${BOLD}Access the application at:${NC}"
      echo -e "- Frontend: ${BLUE}http://localhost:3000${NC}"
      echo -e "- Backend API: ${BLUE}http://localhost:5000${NC}"
    else
      echo -e "${RED}✗ Failed to start with Docker. See errors above.${NC}"
      exit 1
    fi
    ;;
    
  2)
    # Local mode
    echo -e "${BOLD}Launching locally...${NC}"
    
    # Run launch preparation
    run_launch_prep
    
    # Start backend
    echo -e "${BOLD}Starting backend service...${NC}"
    cd backend
    npm run dev & 
    BACKEND_PID=$!
    cd ..
    
    # Check if backend started
    sleep 5
    if ps -p $BACKEND_PID > /dev/null; then
      echo -e "${GREEN}✓ Backend service started (PID: $BACKEND_PID)${NC}"
    else
      echo -e "${RED}✗ Backend service failed to start${NC}"
      exit 1
    fi
    
    # Start frontend
    echo -e "${BOLD}Starting frontend service...${NC}"
    cd frontend
    # Check if dependencies are installed
    if [ ! -d "node_modules" ]; then
      echo -e "${YELLOW}Installing frontend dependencies...${NC}"
      npm install
    fi
    npm run dev &
    FRONTEND_PID=$!
    cd ..
    
    # Check if frontend started
    sleep 5
    if ps -p $FRONTEND_PID > /dev/null; then
      echo -e "${GREEN}✓ Frontend service started (PID: $FRONTEND_PID)${NC}"
    else
      echo -e "${RED}✗ Frontend service failed to start${NC}"
      exit 1
    fi
    
    echo
    echo -e "${GREEN}✓ NeonHub is now running locally!${NC}"
    echo -e "${BOLD}Access the application at:${NC}"
    echo -e "- Frontend: ${BLUE}http://localhost:3000${NC}"
    echo -e "- Backend API: ${BLUE}http://localhost:5000${NC}"
    echo
    echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
    
    # Wait for Ctrl+C and then clean up
    trap "kill $BACKEND_PID $FRONTEND_PID; echo -e '\n${GREEN}Services stopped${NC}'" INT
    wait
    ;;
    
  3)
    # Only run launch preparation
    run_launch_prep
    
    echo
    echo -e "${GREEN}✓ Launch preparation and validation completed.${NC}"
    echo -e "${BOLD}To start the application:${NC}"
    echo -e "- With Docker: ${BLUE}docker-compose up -d${NC}"
    echo -e "- Locally: Run ${BLUE}npm run dev${NC} in both backend and frontend directories"
    ;;
    
  *)
    echo -e "${RED}Invalid option selected. Exiting.${NC}"
    exit 1
    ;;
esac 