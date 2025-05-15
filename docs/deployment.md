# NeonHub Deployment Guide

This document provides instructions for deploying the NeonHub application in various environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Development Environment](#development-environment)
- [Production Deployment](#production-deployment)
  - [Docker Deployment](#docker-deployment)
  - [Kubernetes Deployment](#kubernetes-deployment)
- [Environment Variables](#environment-variables)
- [Database Migration](#database-migration)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying NeonHub, ensure you have the following:

- Node.js (v16+) and npm
- Docker and Docker Compose (for containerized deployment)
- Kubernetes cluster (for Kubernetes deployment)
- PostgreSQL database
- Git

## Development Environment

To set up the development environment:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/neonhub.git
   cd neonhub
   ```

2. Start the development environment using Docker Compose:
   ```bash
   docker-compose up -d
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs

## Production Deployment

### Docker Deployment

For production deployment using Docker:

1. Update the environment variables in `docker-compose.prod.yml` with production values.

2. Build and start the production containers:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. Set up a reverse proxy (Nginx, Apache, etc.) to handle SSL termination and route traffic to the containers.

### Kubernetes Deployment

For deploying on Kubernetes:

1. Ensure you have kubectl configured to access your cluster.

2. Apply the Kubernetes manifests:
   ```bash
   kubectl apply -f kubernetes/
   ```

3. Check the deployment status:
   ```bash
   kubectl get pods
   kubectl get services
   ```

4. Set up an Ingress controller or load balancer to expose the application.

## Environment Variables

The following environment variables need to be configured:

### Backend

- `NODE_ENV`: Environment (`development`, `test`, or `production`)
- `PORT`: Port the backend server runs on
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `JWT_EXPIRE`: JWT token expiration time
- `CLIENT_URL`: URL of the frontend client (for CORS)
- `STORAGE_TYPE`: File storage type (`local` or `s3`)
- `STORAGE_PATH`: Path for local file storage
- `AWS_ACCESS_KEY_ID`: AWS access key (if using S3)
- `AWS_SECRET_ACCESS_KEY`: AWS secret key (if using S3)
- `AWS_REGION`: AWS region (if using S3)
- `AWS_S3_BUCKET`: S3 bucket name (if using S3)

### Frontend

- `NEXT_PUBLIC_API_URL`: URL of the backend API
- `NEXT_PUBLIC_SOCKET_URL`: URL for WebSocket connection

## Database Migration

To run database migrations:

1. Access the backend container:
   ```bash
   docker exec -it neonhub-backend sh
   ```

2. Run Prisma migrations:
   ```bash
   npx prisma migrate deploy
   ```

## Troubleshooting

### Common Issues

1. **Connection refused to database**
   - Check if the database is running and accessible
   - Verify the DATABASE_URL environment variable is correct

2. **JWT token issues**
   - Ensure JWT_SECRET is set and consistent across deployments
   - Check token expiration time

3. **File upload errors**
   - Check storage configuration and permissions
   - Ensure the storage directory exists and is writable

### Logs

To check logs:

```bash
# Docker logs
docker logs neonhub-backend
docker logs neonhub-frontend

# Kubernetes logs
kubectl logs deployment/neonhub-backend
kubectl logs deployment/neonhub-frontend
``` 