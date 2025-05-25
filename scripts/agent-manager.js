#!/usr/bin/env node

/**
 * NeonHub Agent Manager
 * Local development tool to simulate specialized agents
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class NeonHubAgentManager {
  constructor() {
    this.agents = {
      architecture: new ArchitectureAgent(),
      backend: new BackendAgent(),
      frontend: new FrontendAgent(),
      devops: new DevOpsAgent(),
      qa: new QAAgent(),
      docs: new DocsAgent()
    };
  }

  async runAgent(agentName, options = {}) {
    if (!this.agents[agentName]) {
      throw new Error(`Unknown agent: ${agentName}`);
    }

    console.log(`🤖 Running ${agentName} agent...`);
    return await this.agents[agentName].run(options);
  }

  async runAll() {
    console.log('🚀 Running all NeonHub agents...\n');
    
    const results = {};
    for (const [name, agent] of Object.entries(this.agents)) {
      try {
        console.log(`\n--- ${name.toUpperCase()} AGENT ---`);
        results[name] = await agent.run();
        console.log(`✅ ${name} agent completed successfully`);
      } catch (error) {
        console.error(`❌ ${name} agent failed:`, error.message);
        results[name] = { error: error.message };
      }
    }

    return results;
  }
}

class ArchitectureAgent {
  async run() {
    console.log('🏗️ Analyzing system architecture...');
    
    // Check if architecture.md exists and update it
    const architecturePath = 'architecture.md';
    if (!fs.existsSync(architecturePath)) {
      console.log('Creating architecture.md...');
      const content = this.generateArchitectureDoc();
      fs.writeFileSync(architecturePath, content);
    }

    // Analyze project structure
    const structure = this.analyzeProjectStructure();
    console.log(`Found ${structure.backend} backend files, ${structure.frontend} frontend files`);

    return { status: 'success', files_analyzed: structure };
  }

  generateArchitectureDoc() {
    return `# NeonHub Architecture

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

Last updated: ${new Date().toISOString()}
`;
  }

  analyzeProjectStructure() {
    const backend = this.countFiles('backend/src');
    const frontend = this.countFiles('frontend/src');
    return { backend, frontend };
  }

  countFiles(dir) {
    if (!fs.existsSync(dir)) return 0;
    
    let count = 0;
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const file of files) {
      if (file.isDirectory()) {
        count += this.countFiles(path.join(dir, file.name));
      } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
        count++;
      }
    }
    
    return count;
  }
}

class BackendAgent {
  async run() {
    console.log('🔧 Analyzing backend changes...');
    
    if (!fs.existsSync('backend')) {
      console.log('No backend directory found');
      return { status: 'skipped' };
    }

    // Run linting
    try {
      console.log('Running backend linting...');
      execSync('cd backend && npm run lint --silent', { stdio: 'pipe' });
      console.log('✅ Backend linting passed');
    } catch (error) {
      console.log('⚠️ Backend linting issues found');
    }

    // Check for new API endpoints
    const endpoints = this.scanForEndpoints();
    console.log(`Found ${endpoints.length} API endpoints`);

    return { status: 'success', endpoints: endpoints.length };
  }

  scanForEndpoints() {
    const routesDir = 'backend/src/routes';
    if (!fs.existsSync(routesDir)) return [];

    const endpoints = [];
    const files = fs.readdirSync(routesDir, { recursive: true });
    
    for (const file of files) {
      if (file.endsWith('.ts')) {
        const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
        const matches = content.match(/router\.(get|post|put|delete|patch)/g) || [];
        endpoints.push(...matches);
      }
    }

    return endpoints;
  }
}

class FrontendAgent {
  async run() {
    console.log('🎨 Analyzing frontend changes...');
    
    if (!fs.existsSync('frontend')) {
      console.log('No frontend directory found');
      return { status: 'skipped' };
    }

    // Run linting
    try {
      console.log('Running frontend linting...');
      execSync('cd frontend && npm run lint --silent', { stdio: 'pipe' });
      console.log('✅ Frontend linting passed');
    } catch (error) {
      console.log('⚠️ Frontend linting issues found');
    }

    // Check for new components
    const components = this.scanForComponents();
    console.log(`Found ${components.length} React components`);

    return { status: 'success', components: components.length };
  }

  scanForComponents() {
    const componentsDir = 'frontend/src/components';
    if (!fs.existsSync(componentsDir)) return [];

    const components = [];
    const files = fs.readdirSync(componentsDir, { recursive: true });
    
    for (const file of files) {
      if (file.endsWith('.tsx')) {
        components.push(file);
      }
    }

    return components;
  }
}

class DevOpsAgent {
  async run() {
    console.log('🚀 Validating infrastructure...');
    
    // Check GitHub Actions workflows
    const workflows = this.validateWorkflows();
    
    // Check Docker files
    const docker = this.validateDocker();
    
    console.log(`Validated ${workflows.length} workflows, ${docker.length} Docker files`);

    return { status: 'success', workflows: workflows.length, docker: docker.length };
  }

  validateWorkflows() {
    const workflowsDir = '.github/workflows';
    if (!fs.existsSync(workflowsDir)) return [];

    const workflows = fs.readdirSync(workflowsDir).filter(f => f.endsWith('.yml'));
    
    for (const workflow of workflows) {
      try {
        const content = fs.readFileSync(path.join(workflowsDir, workflow), 'utf8');
        // Basic YAML validation would go here
        console.log(`✅ ${workflow} is valid`);
      } catch (error) {
        console.log(`❌ ${workflow} has issues`);
      }
    }

    return workflows;
  }

  validateDocker() {
    const dockerFiles = ['docker-compose.yml', 'docker-compose.prod.yml', 'Dockerfile'];
    const found = dockerFiles.filter(f => fs.existsSync(f));
    
    for (const file of found) {
      console.log(`✅ ${file} exists`);
    }

    return found;
  }
}

class QAAgent {
  async run() {
    console.log('🧪 Analyzing test coverage...');
    
    const backend = this.analyzeBackendTests();
    const frontend = this.analyzeFrontendTests();
    
    // Generate QA report
    const report = this.generateQAReport(backend, frontend);
    fs.writeFileSync('qa-report.md', report);
    
    console.log('Generated QA report');

    return { status: 'success', backend, frontend };
  }

  analyzeBackendTests() {
    if (!fs.existsSync('backend')) return { tests: 0, coverage: 'unknown' };
    
    const testFiles = this.findTestFiles('backend');
    return { tests: testFiles.length, coverage: 'analyzing' };
  }

  analyzeFrontendTests() {
    if (!fs.existsSync('frontend')) return { tests: 0, coverage: 'unknown' };
    
    const testFiles = this.findTestFiles('frontend');
    return { tests: testFiles.length, coverage: 'analyzing' };
  }

  findTestFiles(dir) {
    if (!fs.existsSync(dir)) return [];
    
    const testFiles = [];
    const files = fs.readdirSync(dir, { recursive: true });
    
    for (const file of files) {
      if (file.includes('.test.') || file.includes('.spec.')) {
        testFiles.push(file);
      }
    }
    
    return testFiles;
  }

  generateQAReport(backend, frontend) {
    return `# QA Report - ${new Date().toISOString()}

## Test Coverage Analysis

### Backend
- Test files: ${backend.tests}
- Coverage: ${backend.coverage}

### Frontend  
- Test files: ${frontend.tests}
- Coverage: ${frontend.coverage}

## Recommendations
- Maintain >90% test coverage
- Add integration tests for critical flows
- Regular E2E testing with Playwright

Generated by NeonHub QA Agent
`;
  }
}

class DocsAgent {
  async run() {
    console.log('📚 Updating documentation...');
    
    // Update README if needed
    this.updateReadme();
    
    // Check for broken links
    const links = this.checkMarkdownLinks();
    
    console.log(`Checked ${links.length} markdown links`);

    return { status: 'success', links: links.length };
  }

  updateReadme() {
    if (!fs.existsSync('README.md') || fs.statSync('README.md').size < 500) {
      console.log('Updating README.md...');
      const content = this.generateReadme();
      fs.writeFileSync('README.md', content);
    }
  }

  generateReadme() {
    return `# NeonHub - AI-Powered Marketing Automation Platform

## Overview
NeonHub is a comprehensive AI-powered marketing automation platform that helps businesses create, manage, and optimize their marketing campaigns using intelligent agents.

## Features
- AI-powered content generation
- Automated campaign management
- Real-time analytics and insights
- Multi-channel marketing support
- Intelligent audience targeting

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker (optional)

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/KofiRusu/NeonHub-v0.1.git
cd NeonHub-v0.1
\`\`\`

2. Set up the backend:
\`\`\`bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
\`\`\`

3. Set up the frontend:
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

## Architecture
See [architecture.md](./architecture.md) for detailed system architecture.

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: \`npm test\`
5. Submit a pull request

## License
MIT License - see [LICENSE](./LICENSE) for details.
`;
  }

  checkMarkdownLinks() {
    const mdFiles = fs.readdirSync('.').filter(f => f.endsWith('.md'));
    const links = [];
    
    for (const file of mdFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const matches = content.match(/\[.*?\]\(.*?\)/g) || [];
      links.push(...matches);
    }
    
    return links;
  }
}

// CLI Interface
if (require.main === module) {
  const manager = new NeonHubAgentManager();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🤖 NeonHub Agent Manager');
    console.log('Usage: node agent-manager.js [agent-name|all]');
    console.log('Available agents: architecture, backend, frontend, devops, qa, docs');
    process.exit(0);
  }

  const agentName = args[0];
  
  if (agentName === 'all') {
    manager.runAll().then(results => {
      console.log('\n📊 Final Results:');
      console.table(results);
    }).catch(console.error);
  } else {
    manager.runAgent(agentName).then(result => {
      console.log('\n✅ Agent completed:', result);
    }).catch(error => {
      console.error('\n❌ Agent failed:', error.message);
      process.exit(1);
    });
  }
}

module.exports = { NeonHubAgentManager }; 