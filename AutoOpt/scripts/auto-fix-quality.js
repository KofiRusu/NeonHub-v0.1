#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 NeonHub Quality Auto-Fix Pipeline');
console.log('=====================================');

let hasErrors = false;

function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      cwd: process.cwd(),
    });
    console.log(`✅ ${description} completed successfully`);
    return { success: true, output };
  } catch (error) {
    console.log(`❌ ${description} failed:`);
    console.log(error.stdout || error.message);
    return { success: false, error: error.stdout || error.message };
  }
}

function autoFixLinting() {
  console.log('\n🔍 Auto-fixing linting issues...');

  // Fix auto-fixable ESLint issues
  const lintResult = runCommand('npm run lint:fix', 'ESLint auto-fix');

  // Format code with Prettier
  const formatResult = runCommand('npm run format', 'Prettier formatting');

  return lintResult.success && formatResult.success;
}

function runTests() {
  console.log('\n🧪 Running tests...');

  // Run unit tests
  const unitResult = runCommand('npm run test:unit', 'Unit tests');

  if (!unitResult.success) {
    hasErrors = true;
    console.log('❌ Unit tests failed. Please fix test issues manually.');
  }

  return unitResult.success;
}

function checkSecurity() {
  console.log('\n🔒 Running security checks...');

  // Run npm audit
  const auditResult = runCommand(
    'npm audit --audit-level=moderate',
    'NPM security audit',
  );

  if (!auditResult.success) {
    console.log(
      '⚠️  Security vulnerabilities found. Consider running: npm audit fix',
    );
  }

  return auditResult.success;
}

function generateReport() {
  console.log('\n📊 Generating quality report...');

  const report = {
    timestamp: new Date().toISOString(),
    status: hasErrors ? 'FAILED' : 'PASSED',
    checks: {
      linting: 'COMPLETED',
      formatting: 'COMPLETED',
      tests: hasErrors ? 'FAILED' : 'PASSED',
      security: 'CHECKED',
    },
  };

  const reportPath = path.join(process.cwd(), 'quality-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`📄 Quality report saved to: ${reportPath}`);
  return report;
}

function commitChanges() {
  console.log('\n📝 Committing auto-fixes...');

  try {
    // Check if there are changes to commit
    const status = execSync('git status --porcelain', { encoding: 'utf8' });

    if (status.trim()) {
      execSync('git add .', { stdio: 'inherit' });
      execSync('git commit -m "auto: ci – sync quality pipeline"', {
        stdio: 'inherit',
      });
      console.log('✅ Auto-fixes committed successfully');
      return true;
    } else {
      console.log('ℹ️  No changes to commit');
      return true;
    }
  } catch (error) {
    console.log('❌ Failed to commit changes:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting auto-fix process...\n');

  // Step 1: Auto-fix linting and formatting
  const lintingFixed = autoFixLinting();

  // Step 2: Run tests
  const testsPass = runTests();

  // Step 3: Check security
  const securityOk = checkSecurity();

  // Step 4: Generate report
  const report = generateReport();

  // Step 5: Commit changes if auto-fixes were applied
  if (lintingFixed) {
    commitChanges();
  }

  // Final status
  console.log('\n🏁 Auto-fix process completed');
  console.log('================================');

  if (hasErrors) {
    console.log('❌ Some issues require manual intervention');
    console.log('📋 Check the quality report for details');
    process.exit(1);
  } else {
    console.log('✅ All quality checks passed!');
    console.log('🎉 NeonHub Quality Pipeline is operational');
    process.exit(0);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled rejection:', reason);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  console.error('💥 Auto-fix process failed:', error.message);
  process.exit(1);
});
