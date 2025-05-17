# NeonHub

A modern real-time collaboration platform for teams with AI-powered marketing features.

## Features

- 🔐 Secure authentication with JWT and OAuth
- 📊 Project management with Kanban boards
- 💬 Real-time messaging and notifications
- 📁 Document sharing and collaboration
- 👥 Team management and permissions
- 🤖 AI agents for marketing automation
- 📈 Trend analysis and content generation

## Tech Stack

- **Frontend**: React, Next.js, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io
- **Deployment**: Docker, Kubernetes, GitHub Actions

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js (v18+)
- npm

### First Run Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/neonhub.git
   cd neonhub
   ```

2. Copy example environment files:
   ```bash
   cp .env.example .env
   ```

3. Start the development environment with Docker:
   ```bash
   docker-compose up
   ```

4. The application will be available at:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Manual Development Setup

If you prefer to run the services directly on your machine:

1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Generate Prisma client and run migrations:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate:dev
   ```

3. Start the backend in development mode:
   ```bash
   npm run dev
   ```

4. In a new terminal, install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

5. Start the frontend in development mode:
   ```bash
   npm run dev
   ```

## Deployment

### Production Setup with Docker Compose

1. Copy the production environment example:
   ```bash
   cp .env.prod.example .env.prod
   ```

2. Edit `.env.prod` with your production settings:
   - Update database credentials
   - Set secure JWT secret
   - Add your OpenAI API key
   - Configure domain names

3. Build and start the production containers:
   ```bash
   docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
   ```

### Deployment to Cloud Providers

#### Railway

1. Install the Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login and link your project:
   ```bash
   railway login
   railway link
   ```

3. Deploy the application:
   ```bash
   railway up
   ```

#### Render

1. Connect your GitHub repository to Render.
2. Create a new Web Service for the backend:
   - Build command: `npm install && npm run prisma:generate && npm run build`
   - Start command: `npm run prisma:migrate:deploy && npm run start`
3. Create a new Web Service for the frontend:
   - Build command: `npm install && npm run build`
   - Start command: `npm run start`
4. Set up environment variables in the Render dashboard.

#### AWS ECS

1. Build and push your Docker images:
   ```bash
   docker-compose -f docker-compose.prod.yml build
   docker-compose -f docker-compose.prod.yml push
   ```

2. Configure AWS resources with Infrastructure as Code (Terraform/CloudFormation).
3. Update the ECS task definitions and services to use your Docker images.

### CI/CD Pipeline

The repository includes GitHub Actions workflows that:

1. Run linting and tests on pull requests
2. Build and push Docker images on merges to main
3. Deploy to your chosen cloud provider automatically

## Real-time Agent Execution Monitor

NeonHub implements a WebSocket-based real-time feedback system for AI agent runs using Socket.io. This feature enables:

- Live monitoring of AI agent execution
- Observation of agent logs as they occur
- Human-in-the-loop review of agent output
- Debugging during development or runtime errors

## Autonomous Agent Scheduler

NeonHub's agent system includes a persistent scheduler for autonomous execution with the following capabilities:

- **Recurring Execution**: Configure agents to run on an automatic schedule
- **Flexible Timing**: Schedule using either simple intervals or cron expressions
- **Persistent Scheduling**: Schedules survive server restarts
- **Missed Run Detection**: Automatically runs agents that were scheduled during downtime 
- **Error Recovery**: Built-in retry mechanism for failed agent runs
- **Execution History**: All runs are recorded in the database with full logs and metrics

## Launch Preparation

NeonHub includes a comprehensive launch preparation module that ensures the system is ready for immediate demonstration with realistic data and scheduled agent behavior:

### Preparation Features

- **Automated Setup**: Single command to prepare the entire system for launch
- **Data Validation**: Ensures seed data exists and is properly structured
- **Agent Scheduling**: Configures agents with realistic schedules
- **Sample Output Generation**: Creates demonstration output for immediate viewing
- **System Validation**: Comprehensive tests of all critical components
- **Environment Verification**: Confirms all required settings are in place

### Using Launch Preparation

1. Run the launch preparation script:
   ```bash
   cd backend
   npm run launch-prep
   ```

2. Validate the system (optional but recommended):
   ```bash
   npm run validate
   ```

3. Access the detailed launch documentation:
   ```bash
   open docs/LAUNCH_PREPARATION.md
   ```

### Demo Data

The launch preparation creates realistic data including:
- Pre-configured users with different roles
- Projects with sample tasks and documents
- Marketing campaigns with generated content
- Trend analysis with actionable insights
- Agents scheduled to run at realistic intervals
- Execution history with sample output

See `docs/LAUNCH_PREPARATION.md` for complete details on demo accounts and features.

## Environment Variables

### Backend Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| DATABASE_URL | PostgreSQL connection string | Yes | - |
| PORT | Backend server port | No | 5000 |
| NODE_ENV | Environment (development/production) | No | development |
| JWT_SECRET | Secret for JWT tokens | Yes | - |
| JWT_EXPIRE | JWT token expiration time | No | 24h |
| OPENAI_API_KEY | OpenAI API key for AI agents | Yes | - |
| CLIENT_URL | URL of the frontend client | Yes | http://localhost:3000 |
| CORS_ORIGIN | Allowed CORS origins | Yes | http://localhost:3000 |

### Frontend Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| NEXT_PUBLIC_API_URL | URL of the backend API | Yes | http://localhost:5000 |
| NEXT_PUBLIC_ENABLE_ANALYTICS | Enable analytics tracking | No | false |

## License

This project is licensed under the MIT License - see the LICENSE file for details. 