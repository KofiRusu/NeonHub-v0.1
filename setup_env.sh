#!/bin/bash

# Create .env.dev file
cat > .env.dev << 'EOL'
# Backend
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=neonhub_dev
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/neonhub_dev?schema=public
POSTGRES_PORT=5434
BACKEND_PORT=5001

# JWT
JWT_SECRET=dev_jwt_secret
JWT_EXPIRE=24h

# OpenAI API
OPENAI_API_KEY=your_openai_api_key_here

# App Config
PORT=5001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
EOL

# Create .env.prod file
cat > .env.prod << 'EOL'
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=neonhub_prod
DATABASE_URL=postgresql://postgres:secure_password@postgres:5432/neonhub_prod?schema=public

# JWT
JWT_SECRET=your_secure_jwt_secret_key_for_production
JWT_EXPIRE=24h

# OpenAI API
OPENAI_API_KEY=your_openai_key

# App Config
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://your-frontend-url.com
CLIENT_URL=https://your-frontend-url.com
API_URL=https://api.your-frontend-url.com

# Deployment
TAG=latest
DOCKER_REGISTRY=
BACKEND_REPLICAS=2
FRONTEND_REPLICAS=2
EOL

echo "Environment files created successfully!" 