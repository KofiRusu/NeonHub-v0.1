#!/usr/bin/env node

/**
 * This script analyzes the NeonHub codebase and generates architecture documentation
 * by scanning modules, dependencies, and relationships.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const REPO_ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(REPO_ROOT, 'docs');
const ARCHITECTURE_MD = path.join(OUTPUT_DIR, 'architecture.md');
const DEPLOYMENT_MD = path.join(OUTPUT_DIR, 'deploy.md');
const TODO_MD = path.join(OUTPUT_DIR, 'todo.md');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper functions
function listDirectories(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);
}

function countFiles(dir, extension) {
  let count = 0;
  
  function traverseDir(currentDir) {
    const files = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(currentDir, file.name);
      
      if (file.isDirectory()) {
        traverseDir(fullPath);
      } else if (file.isFile() && file.name.endsWith(extension)) {
        count++;
      }
    }
  }
  
  traverseDir(dir);
  return count;
}

function getDependencies(packageJsonPath) {
  if (!fs.existsSync(packageJsonPath)) {
    return { dependencies: {}, devDependencies: {} };
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return {
    dependencies: packageJson.dependencies || {},
    devDependencies: packageJson.devDependencies || {}
  };
}

// Generate Architecture Document
function generateArchitectureDoc() {
  console.log('Generating architecture documentation...');
  
  // Get repository info
  const gitBranch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
  const lastCommit = execSync('git log -1 --pretty=format:"%h - %s (%an, %ar)"').toString().trim();
  
  // Map the codebase structure
  const modules = {
    backend: {
      src: listDirectories(path.join(REPO_ROOT, 'backend/src')),
      fileCount: countFiles(path.join(REPO_ROOT, 'backend'), '.ts'),
      dependencies: getDependencies(path.join(REPO_ROOT, 'backend/package.json'))
    },
    frontend: {
      src: listDirectories(path.join(REPO_ROOT, 'frontend/src')),
      fileCount: countFiles(path.join(REPO_ROOT, 'frontend'), '.tsx'),
      dependencies: getDependencies(path.join(REPO_ROOT, 'frontend/package.json'))
    },
    services: listDirectories(path.join(REPO_ROOT, 'services'))
  };
  
  // Generate markdown content
  let content = `# NeonHub Architecture Documentation

> Generated on: ${new Date().toISOString()}  
> Branch: ${gitBranch}  
> Last commit: ${lastCommit}

## System Overview

NeonHub is an AI-powered marketing automation platform that uses intelligent agents to automate content creation, trend analysis, outreach, and optimization tasks.

## Architecture Diagram

\`\`\`mermaid
graph TD
    Client[Client Browser] --> FE[Frontend Next.js App]
    FE --> BFF[Backend Express API]
    BFF --> Postgres[(PostgreSQL)]
    BFF --> Redis[(Redis)]
    BFF <--> Agents[AI Agents]
    Agents --> Orchestrator[Agent Orchestrator]
    Orchestrator <--> Redis
    Agents <--> OpenAI[OpenAI API]
    
    subgraph Infrastructure
        Postgres
        Redis
    end
    
    subgraph Intelligence
        Agents
        Orchestrator
        OpenAI
    end
\`\`\`

## Core Components

### Backend Services

The backend is built with Node.js, Express, and TypeScript, with these primary modules:

${modules.backend.src.map(dir => `- **${dir}/**`).join('\n')}

**Key Dependencies:**
${Object.entries(modules.backend.dependencies.dependencies)
  .map(([name, version]) => `- ${name}: ${version}`)
  .filter(dep => !dep.includes('@types/'))
  .slice(0, 10)
  .join('\n')}

### Frontend Application

The frontend is built with Next.js, React, and TypeScript, with these primary sections:

${modules.frontend.src.map(dir => `- **${dir}/**`).join('\n')}

**Key Dependencies:**
${Object.entries(modules.frontend.dependencies.dependencies)
  .map(([name, version]) => `- ${name}: ${version}`)
  .filter(dep => !dep.includes('@types/'))
  .slice(0, 10)
  .join('\n')}

### Additional Services

${modules.services.map(service => `- **${service}/**`).join('\n')}

## Data Flow

1. Users interact with the Next.js frontend
2. Frontend makes API calls to the Express backend
3. Backend processes requests and interacts with the database
4. AI agents are scheduled and orchestrated to perform tasks
5. Results are stored in the database and returned to the frontend

## Deployment Architecture

The application is containerized using Docker and can be deployed:

1. Using docker-compose for development and testing
2. Using Kubernetes for production environments
3. CI/CD pipeline automates testing, building, and deployment

## Security Considerations

1. JWT-based authentication
2. Role-based access control
3. Input validation using Zod schemas
4. Environment-based configuration
5. Secrets management
`;

  fs.writeFileSync(ARCHITECTURE_MD, content);
  console.log(`Architecture documentation written to ${ARCHITECTURE_MD}`);
}

// Generate Deployment Document
function generateDeploymentDoc() {
  console.log('Generating deployment documentation...');
  
  const content = `# NeonHub Deployment Guide

> Generated on: ${new Date().toISOString()}

## Deployment Options

NeonHub supports multiple deployment options depending on your environment and requirements.

### Local Development

1. **Prerequisites**
   - Node.js 18+
   - PostgreSQL 14+
   - Redis 7+
   - Docker and Docker Compose (optional)

2. **Setup**
   \`\`\`bash
   # Clone the repository
   git clone https://github.com/your-org/neonhub.git
   cd neonhub
   
   # Install dependencies
   npm install
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env with your configuration
   
   # Set up the database
   npm run prisma:migrate:dev
   
   # Start the development server
   npm run dev
   \`\`\`

### Docker Deployment

1. **Using Docker Compose**
   \`\`\`bash
   # Build and start all services
   docker-compose up -d
   
   # View logs
   docker-compose logs -f
   
   # Stop services
   docker-compose down
   \`\`\`

2. **Production Docker Compose**
   \`\`\`bash
   # Use production configuration
   docker-compose -f docker-compose.prod.yml up -d
   \`\`\`

### Kubernetes Deployment

1. **Prerequisites**
   - Kubernetes cluster
   - Helm 3+
   - kubectl configured

2. **Deployment Steps**
   \`\`\`bash
   # Add Bitnami repository for dependencies
   helm repo add bitnami https://charts.bitnami.com/bitnami
   helm repo update
   
   # Install the NeonHub chart
   helm install neonhub ./charts/neonhub \
     --namespace neonhub \
     --create-namespace \
     --values ./charts/neonhub/values.yaml \
     --set secrets.jwtSecret=<your-jwt-secret> \
     --set secrets.openaiApiKey=<your-openai-key>
   \`\`\`

3. **Accessing the Application**
   - The application will be available at the ingress host configured in values.yaml
   - Default: http://app.neonhub.io (requires DNS configuration)

## CI/CD Pipeline

NeonHub uses GitHub Actions for continuous integration and deployment:

1. Every push to main branch triggers:
   - Code quality checks (lint, format)
   - Unit and integration tests
   - Build and containerization
   - Deployment to staging environment

2. Production deployments:
   - Triggered by release tags (v*)
   - Includes additional security scans
   - Deployed to production environment

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| DATABASE_URL | PostgreSQL connection string | Yes | - |
| REDIS_URL | Redis connection string | Yes | - |
| JWT_SECRET | Secret for JWT tokens | Yes | - |
| PORT | Backend port | No | 5000 |
| NODE_ENV | Environment | No | development |
| OPENAI_API_KEY | OpenAI API key | Yes | - |

## Monitoring & Maintenance

- Prometheus metrics available at /api/metrics
- Suggested Grafana dashboards in /kubernetes/monitoring
- Health check endpoints:
  - Backend: /api/health
  - Frontend: / (root path)
`;

  fs.writeFileSync(DEPLOYMENT_MD, content);
  console.log(`Deployment documentation written to ${DEPLOYMENT_MD}`);
}

// Generate TODO Document
function generateTodoDoc() {
  console.log('Generating TODO documentation...');
  
  // Get issues from git grep TODO, FIXME
  let todos = [];
  try {
    const todoOutput = execSync('git grep -n "TODO\\|FIXME" -- "*.ts" "*.tsx" "*.js"').toString();
    const todoLines = todoOutput.split('\n').filter(Boolean);
    
    todoLines.forEach(line => {
      const [file, rest] = line.split(':', 2);
      const lineNumber = rest.split(':', 1)[0];
      const content = line.substring(line.indexOf('TODO') || line.indexOf('FIXME'));
      
      todos.push({
        file,
        line: lineNumber,
        content: content.trim()
      });
    });
  } catch (e) {
    // No TODOs found or error in execution
    console.log('No TODOs found or error in grep');
  }
  
  // Get issues from tests (it.skip, describe.skip)
  let skippedTests = [];
  try {
    const skipOutput = execSync('git grep -n "it\\.skip\\|describe\\.skip" -- "*.test.ts" "*.test.tsx" "*.spec.ts" "*.spec.tsx"').toString();
    const skipLines = skipOutput.split('\n').filter(Boolean);
    
    skipLines.forEach(line => {
      const [file, rest] = line.split(':', 2);
      const lineNumber = rest.split(':', 1)[0];
      const content = line.substring(line.indexOf('.skip'));
      
      skippedTests.push({
        file,
        line: lineNumber,
        content: content.trim()
      });
    });
  } catch (e) {
    // No skipped tests found or error in execution
    console.log('No skipped tests found or error in grep');
  }
  
  const content = `# NeonHub TODO List

> Generated on: ${new Date().toISOString()}

This document tracks code improvements, technical debt, and required fixes across the codebase.

## Code TODOs

${todos.length > 0 ? 
  todos.map(todo => `- [ ] **${todo.file}:${todo.line}**: ${todo.content}`).join('\n') :
  'No TODOs found in codebase'}

## Skipped Tests

${skippedTests.length > 0 ?
  skippedTests.map(test => `- [ ] **${test.file}:${test.line}**: ${test.content}`).join('\n') :
  'No skipped tests found in codebase'}

## Improvement Areas

### Performance

- [ ] Implement caching for frequently accessed data
- [ ] Optimize database queries in campaign service
- [ ] Add pagination for list endpoints
- [ ] Implement code splitting in frontend

### Security

- [ ] Complete security audit
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Review authentication flows

### Testing

- [ ] Increase test coverage (current: TBD%)
- [ ] Add E2E tests for critical flows
- [ ] Implement visual regression testing

### DevOps

- [ ] Set up production monitoring
- [ ] Implement automated database backups
- [ ] Configure auto-scaling for production
- [ ] Set up alerting for critical services
`;

  fs.writeFileSync(TODO_MD, content);
  console.log(`TODO documentation written to ${TODO_MD}`);
}

// Run the generators
try {
  generateArchitectureDoc();
  generateDeploymentDoc();
  generateTodoDoc();
  
  console.log('Documentation generation complete!');
} catch (error) {
  console.error('Error generating documentation:', error);
  process.exit(1);
} 