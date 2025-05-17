# NeonHub API Deployment Guide

This document provides instructions for deploying the NeonHub backend API using Docker.

## Prerequisites

- Docker and Docker Compose installed
- Git
- A copy of this repository
- Access to required API keys (OpenAI, etc.)

## Quick Start

1. Clone the repository
2. Copy `env.example` to `.env` and configure it
3. Run the release script:

```bash
chmod +x release.sh
./release.sh
```

This will build the containers, run migrations, and start the application.

## Manual Deployment Steps

### 1. Environment Configuration

Create a `.env` file from the example:

```bash
cp env.example .env
```

Edit the `.env` file to include your specific configuration:
- Database credentials
- JWT secret
- API keys
- Other environment-specific settings

### 2. Building the Application

Build the Docker images:

```bash
docker-compose build
```

### 3. Database Migrations

Apply database migrations:

```bash
docker-compose run --rm neonhub-api npx prisma migrate deploy
```

For development with named migrations:

```bash
chmod +x migrate.sh
./migrate.sh your_migration_name
```

### 4. Starting the Application

Start all services:

```bash
docker-compose up -d
```

Verify the containers are running:

```bash
docker-compose ps
```

## Container Management

### Viewing Logs

```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs neonhub-api

# Follow logs in real-time
docker-compose logs -f neonhub-api
```

### Stopping the Application

```bash
docker-compose down
```

To remove volumes (database data):

```bash
docker-compose down -v
```

### Restarting Services

```bash
docker-compose restart neonhub-api
```

## Troubleshooting

### Database Connection Issues

1. Check the database container is running:
   ```bash
   docker-compose ps neonhub-db
   ```

2. Verify the database URL in your `.env` file:
   ```
   DATABASE_URL="postgresql://neonhub:secret@neonhub-db:5432/neonhub?schema=public"
   ```

3. Try connecting to the database manually:
   ```bash
   docker-compose exec neonhub-db psql -U neonhub -d neonhub
   ```

### API Container Issues

1. Check the API logs:
   ```bash
   docker-compose logs neonhub-api
   ```

2. Enter the container for debugging:
   ```bash
   docker-compose exec neonhub-api sh
   ```

3. Verify environment variables inside the container:
   ```bash
   docker-compose exec neonhub-api env
   ```

## Cloud Deployment

### Preparing for Cloud Deployment

1. Build your image locally:
   ```bash
   docker build -t neonhub/backend:latest .
   ```

2. (Optional) Push to a container registry:
   ```bash
   docker push your-registry/neonhub/backend:latest
   ```

### Deployment Options

#### Railway

1. Connect your GitHub repository
2. Add environment variables from your `.env` file
3. Deploy the application

#### Fly.io

1. Install the Fly CLI
2. Create a `fly.toml` file
3. Deploy with:
   ```bash
   fly launch
   ```

#### Render

1. Create a new Web Service
2. Connect to your GitHub repository
3. Set build command: `docker build -t neonhub/backend .`
4. Set start command: `docker run neonhub/backend`

## Extending with Additional Services

To add new services:

1. Edit the `docker-compose.yml` file
2. Add your service under the `services` section
3. Connect it to the `neonhub-network` network
4. Rebuild and restart:
   ```bash
   docker-compose up -d --build
   ```

## Backup and Restore

### Database Backup

```bash
docker-compose exec neonhub-db pg_dump -U neonhub -d neonhub > backup.sql
```

### Database Restore

```bash
cat backup.sql | docker-compose exec -T neonhub-db psql -U neonhub -d neonhub
```

## Security Notes

- Never commit `.env` files with sensitive information
- Change default database credentials in production
- Use strong JWT secrets
- Implement proper network security in production environments 