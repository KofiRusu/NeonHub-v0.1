#!/bin/bash
set -e

echo "🗃️ Starting NeonHub database migration..."

# Check if .env file exists
if [ ! -f .env ]; then
  echo "⚠️  .env file not found! Please create it from .env.example"
  exit 1
fi

# Ensure containers are running
if ! docker-compose ps | grep -q neonhub-db; then
  echo "🔄 Starting database container..."
  docker-compose up -d neonhub-db
  
  # Wait for database to be ready
  echo "⏳ Waiting for database to be ready..."
  sleep 5
fi

# Run migration
echo "🔄 Running migrations..."
if [ "$1" == "" ]; then
  # Ask for migration name if not provided
  read -p "Enter migration name: " MIGRATION_NAME
  
  # Default to "migration" if still empty
  if [ "$MIGRATION_NAME" == "" ]; then
    MIGRATION_NAME="migration"
  fi
else
  MIGRATION_NAME=$1
fi

docker-compose run --rm neonhub-api npx prisma migrate dev --name "$MIGRATION_NAME"

echo "✅ Database migration completed!" 