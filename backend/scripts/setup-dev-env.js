#!/usr/bin/env node

/**
 * NeonHub Development Environment Setup
 * 
 * This script installs and configures development tools and helpers
 * to enhance the development workflow for the NeonHub project.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

// ANSI color codes for prettier output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
  }
};

function log(message, type = 'info') {
  const prefix = {
    info: `${colors.fg.blue}[INFO]${colors.reset}`,
    success: `${colors.fg.green}[SUCCESS]${colors.reset}`,
    warning: `${colors.fg.yellow}[WARNING]${colors.reset}`,
    error: `${colors.fg.red}[ERROR]${colors.reset}`,
  };
  
  console.log(`${prefix[type]} ${message}`);
}

function runCommand(command, options = {}) {
  const { silent = false } = options;
  try {
    log(`Running: ${colors.bright}${command}${colors.reset}`);
    const output = execSync(command, { 
      cwd: ROOT_DIR,
      stdio: silent ? 'pipe' : 'inherit' 
    });
    return { success: true, output: output ? output.toString() : '' };
  } catch (error) {
    log(`Failed to execute command: ${command}`, 'error');
    log(error.message, 'error');
    return { success: false, error };
  }
}

function installDevDependencies() {
  log('Installing development dependencies...', 'info');
  const dependencies = [
    'nodemon',
    'typescript-eslint',
    'ts-node',
    'eslint-plugin-prettier',
    'husky',
    'lint-staged',
    'concurrently',
    'cross-env',
    'dotenv-cli'
  ];
  
  const result = runCommand(`npm install --save-dev ${dependencies.join(' ')}`);
  if (result.success) {
    log('Development dependencies installed successfully', 'success');
  }
}

function installEssentialDependencies() {
  log('Installing essential production dependencies...', 'info');
  const dependencies = [
    '@anthropic-ai/sdk',
    'openai',
    'langchain',
    'axios',
    'express-rate-limit',
    'helmet',
    'joi',
    'socket.io',
    'uuid'
  ];
  
  const result = runCommand(`npm install --save ${dependencies.join(' ')}`);
  if (result.success) {
    log('Essential dependencies installed successfully', 'success');
  }
}

function setupHusky() {
  log('Setting up Husky for Git hooks...', 'info');
  
  // Initialize Husky
  runCommand('npx husky init');
  
  // Create .husky directory if it doesn't exist
  const huskyDir = path.join(ROOT_DIR, '.husky');
  if (!fs.existsSync(huskyDir)) {
    fs.mkdirSync(huskyDir, { recursive: true });
  }
  
  // Create _/ directory for husky.sh
  const huskyHelperDir = path.join(huskyDir, '_');
  if (!fs.existsSync(huskyHelperDir)) {
    fs.mkdirSync(huskyHelperDir, { recursive: true });
    fs.writeFileSync(path.join(huskyHelperDir, 'husky.sh'), `#!/bin/sh\n# This file is required for husky to work properly\n`);
    fs.chmodSync(path.join(huskyHelperDir, 'husky.sh'), '755');
  }
  
  // Add pre-commit hook
  const preCommitScript = 'npx lint-staged';
  const preCommitPath = path.join(huskyDir, 'pre-commit');
  fs.writeFileSync(preCommitPath, 
    `#!/bin/sh\n. "$(dirname "$0")/_/husky.sh"\n\n${preCommitScript}`);
  
  // Make pre-commit executable
  fs.chmodSync(preCommitPath, '755');
  
  // Configure lint-staged
  const lintStagedConfig = {
    '*.{ts,js}': ['eslint --fix', 'prettier --write'],
    '*.{json,md}': ['prettier --write']
  };
  
  fs.writeFileSync(
    path.join(ROOT_DIR, '.lintstagedrc'),
    JSON.stringify(lintStagedConfig, null, 2)
  );
  
  log('Husky setup completed', 'success');
}

function createNpmScripts() {
  log('Creating NPM scripts for enhanced workflow...', 'info');
  
  // Read existing package.json
  const packageJsonPath = path.join(ROOT_DIR, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add/update scripts
  const scripts = {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/src/server.js",
    "lint": "eslint . --ext .ts,.js",
    "lint:fix": "eslint . --ext .ts,.js --fix",
    "format": "prettier --write \"**/*.{ts,js,json,md}\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "typecheck": "tsc --noEmit",
    "start:debug": "node --inspect-brk dist/src/server.js",
    "dev:debug": "nodemon --inspect-brk --exec ts-node src/server.ts"
  };
  
  packageJson.scripts = { ...packageJson.scripts, ...scripts };
  
  // Save updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  log('NPM scripts created successfully', 'success');
}

function createDevTools() {
  log('Creating development helper tools...', 'info');
  
  // Create database seed script
  const seedDbScript = `#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');
  
  // Create test user if not exists
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      password: '$2b$10$RgFGfAnAKKLrRh4rRcDt7O9XBCUeRD1A6i2BReXxFqKrUgD9dMdIi', // password: 'password'
      role: 'USER'
    }
  });
  
  console.log('Created test user:', testUser.id);
  
  // Create test project
  const testProject = await prisma.project.upsert({
    where: { 
      ownerId_name: { 
        ownerId: testUser.id, 
        name: 'Test Project' 
      } 
    },
    update: {},
    create: {
      name: 'Test Project',
      description: 'A test project for development',
      ownerId: testUser.id
    }
  });
  
  console.log('Created test project:', testProject.id);
  
  // Create test agent
  const testAgent = await prisma.aIAgent.upsert({
    where: {
      name_managerId: {
        name: 'Test Content Creator',
        managerId: testUser.id
      }
    },
    update: {},
    create: {
      name: 'Test Content Creator',
      description: 'A test agent for development',
      agentType: 'CONTENT_CREATOR',
      status: 'IDLE',
      configuration: {
        tone: 'professional',
        length: { min: 200, max: 500 },
        topics: ['marketing', 'technology']
      },
      managerId: testUser.id,
      projectId: testProject.id
    }
  });
  
  console.log('Created test agent:', testAgent.id);
  
  console.log('✅ Seed completed successfully');
}

seed()
  .catch(e => {
    console.error('❌ Seed failed');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;
  
  fs.writeFileSync(path.join(ROOT_DIR, 'scripts', 'seed-db.js'), seedDbScript);
  fs.chmodSync(path.join(ROOT_DIR, 'scripts', 'seed-db.js'), '755');
  
  log('Development helper tools created', 'success');
}

function addVSCodeSettings() {
  log('Setting up VS Code configuration...', 'info');
  
  const vscodeDir = path.join(ROOT_DIR, '.vscode');
  if (!fs.existsSync(vscodeDir)) {
    fs.mkdirSync(vscodeDir);
  }
  
  // Create settings.json
  const settings = {
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": true
    },
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "typescript.tsdk": "node_modules/typescript/lib",
    "typescript.enablePromptUseWorkspaceTsdk": true,
    "eslint.validate": [
      "javascript",
      "typescript"
    ],
    "files.exclude": {
      "**/.git": true,
      "**/.DS_Store": true,
      "**/node_modules": true,
      "**/dist": true
    },
    "search.exclude": {
      "**/node_modules": true,
      "**/dist": true,
      "**/.prisma": true
    }
  };
  
  fs.writeFileSync(
    path.join(vscodeDir, 'settings.json'),
    JSON.stringify(settings, null, 2)
  );
  
  // Create launch.json for debugging
  const launch = {
    "version": "0.2.0",
    "configurations": [
      {
        "type": "node",
        "request": "launch",
        "name": "Debug Server",
        "skipFiles": ["<node_internals>/**"],
        "program": "${workspaceFolder}/src/server.ts",
        "outFiles": ["${workspaceFolder}/dist/**/*.js"],
        "preLaunchTask": "npm: build",
        "sourceMaps": true
      },
      {
        "type": "node",
        "request": "attach",
        "name": "Attach to Process",
        "port": 9229,
        "skipFiles": ["<node_internals>/**"],
        "sourceMaps": true
      }
    ]
  };
  
  fs.writeFileSync(
    path.join(vscodeDir, 'launch.json'),
    JSON.stringify(launch, null, 2)
  );
  
  log('VS Code configuration completed', 'success');
}

function setupAgentAssistant() {
  log('Setting up Agent Assistant for development workflow...', 'info');
  
  // Create agent config
  const devAgentConfig = {
    name: 'DevAssistant',
    description: 'Development assistant agent that helps with coding tasks',
    commands: [
      {
        name: 'analyze-code',
        description: 'Analyzes code for potential issues and provides recommendations',
        script: 'node scripts/dev-agent/analyze-code.js'
      },
      {
        name: 'generate-component',
        description: 'Generates a new component from a template',
        script: 'node scripts/dev-agent/generate-component.js'
      },
      {
        name: 'generate-api',
        description: 'Generates a new API endpoint from a template',
        script: 'node scripts/dev-agent/generate-api.js'
      },
      {
        name: 'setup-route',
        description: 'Sets up a new route with controller and service',
        script: 'node scripts/dev-agent/setup-route.js'
      }
    ]
  };
  
  // Create dev-agent directory
  const devAgentDir = path.join(ROOT_DIR, 'scripts', 'dev-agent');
  if (!fs.existsSync(devAgentDir)) {
    fs.mkdirSync(devAgentDir, { recursive: true });
  }
  
  // Write config file
  fs.writeFileSync(
    path.join(devAgentDir, 'config.json'),
    JSON.stringify(devAgentConfig, null, 2)
  );
  
  // Create the agent runner script
  const agentRunnerScript = `#!/usr/bin/env node

/**
 * Development Agent Runner
 * Helps with common development tasks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Load configuration
const config = require('./config.json');

// Set up readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Display welcome message
console.log('\\x1b[36m%s\\x1b[0m', \`
╔════════════════════════════════════╗
║        NeonHub Dev Assistant        ║
║   Your AI-powered coding partner    ║
╚════════════════════════════════════╝
\`);

console.log('\\x1b[33mAvailable commands:\\x1b[0m');
config.commands.forEach((cmd, index) => {
  console.log(\`  [\${index + 1}] \${cmd.name}: \${cmd.description}\`);
});
console.log('  [q] Quit');

function promptUser() {
  rl.question('\\nWhat would you like to do? ', (answer) => {
    if (answer.toLowerCase() === 'q') {
      console.log('\\x1b[36mGoodbye!\\x1b[0m');
      rl.close();
      return;
    }
    
    const cmdIndex = parseInt(answer) - 1;
    if (cmdIndex >= 0 && cmdIndex < config.commands.length) {
      const command = config.commands[cmdIndex];
      console.log(\`\\x1b[36mRunning: \${command.name}\\x1b[0m\`);
      
      try {
        execSync(command.script, { stdio: 'inherit' });
      } catch (error) {
        console.error(\`\\x1b[31mError executing command: \${error.message}\\x1b[0m\`);
      }
      
      promptUser();
    } else {
      console.log('\\x1b[31mInvalid option. Please try again.\\x1b[0m');
      promptUser();
    }
  });
}

promptUser();
`;
  
  fs.writeFileSync(path.join(devAgentDir, 'agent.js'), agentRunnerScript);
  fs.chmodSync(path.join(devAgentDir, 'agent.js'), '755');
  
  // Create placeholder scripts for each command
  devAgentConfig.commands.forEach(cmd => {
    const scriptName = cmd.name.split('-').join('_');
    const scriptContent = `#!/usr/bin/env node

/**
 * ${cmd.description}
 */

console.log('\\x1b[36mRunning ${cmd.name}...\\x1b[0m');

// TODO: Implement ${cmd.name} functionality

console.log('\\x1b[32mDone!\\x1b[0m');
`;
    
    fs.writeFileSync(path.join(devAgentDir, `${scriptName}.js`), scriptContent);
    fs.chmodSync(path.join(devAgentDir, `${scriptName}.js`), '755');
  });
  
  // Update package.json to add agent script
  const packageJsonPath = path.join(ROOT_DIR, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  packageJson.scripts = packageJson.scripts || {};
  packageJson.scripts['agent'] = 'node scripts/dev-agent/agent.js';
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  
  log('Development Agent Assistant setup completed', 'success');
}

// Run the setup functions
function main() {
  log(`${colors.bright}${colors.fg.cyan}NeonHub Development Environment Setup${colors.reset}`, 'info');
  log(`${colors.dim}Setting up development tools and helpers for better workflow${colors.reset}`, 'info');
  
  installDevDependencies();
  installEssentialDependencies();
  setupHusky();
  createNpmScripts();
  createDevTools();
  addVSCodeSettings();
  setupAgentAssistant();
  
  log(`${colors.bright}${colors.fg.green}Setup completed successfully!${colors.reset}`, 'success');
  log(`${colors.fg.yellow}Run the following commands to get started:${colors.reset}`, 'info');
  log(`- ${colors.bright}npm run dev${colors.reset}: Start the development server`);
  log(`- ${colors.bright}node scripts/seed-db.js${colors.reset}: Seed the database with test data`);
  log(`- ${colors.bright}npm run typecheck${colors.reset}: Run TypeScript type checking`);
  log(`- ${colors.bright}npm run agent${colors.reset}: Launch the development agent assistant`);
}

main(); 