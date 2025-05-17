#!/bin/bash
set -e

echo "🚀 Starting NeonHub release process..."

# Check if .env file exists
if [ ! -f .env ]; then
  echo "⚠️  .env file not found! Please create it from .env.example"
  exit 1
fi

echo "🔨 Building containers..."
docker-compose build

echo "🗃️  Running database migrations..."
docker-compose run --rm neonhub-api npx prisma migrate deploy

echo "🚀 Starting services..."
docker-compose up -d

echo "✅ NeonHub backend successfully deployed!"
echo "📝 API is running at http://localhost:3001"
echo "📊 Database is running at localhost:5432" 