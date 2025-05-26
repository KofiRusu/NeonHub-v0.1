# NeonHub Architecture

## System Overview
NeonHub is a comprehensive AI-powered marketing automation platform.

## Core Components

### Backend Services
- **API Gateway**: Express.js REST API
- **Agent Engine**: AI agent orchestration system  
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based auth system

### Frontend Application
- **Web App**: Next.js React application
- **UI Components**: shadcn/ui component library
- **State Management**: React Context + hooks

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Database**: PostgreSQL

## Data Flow
1. User interacts with Next.js frontend
2. Frontend calls Express.js API
3. API orchestrates AI agents
4. Agents process data and store results
5. Results returned to frontend for display

## Integration Points
- External AI APIs (OpenAI, etc.)
- Social media platforms
- Analytics services
- Email marketing platforms

Last updated: 2025-05-25T12:31:54.890Z
