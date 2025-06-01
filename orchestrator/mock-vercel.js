#!/usr/bin/env node
/**
 * mock-vercel.js
 * A simple mock script that simulates a Vercel deployment for testing
 */

console.log("🚀 Starting mock Vercel deployment...");

// Simulate deployment steps
const steps = [
  "Analyzing source code",
  "Installing dependencies",
  "Building project",
  "Running tests",
  "Deploying to production",
  "Invalidating CDN cache",
  "Running post-deployment hooks"
];

// Delay between steps
const STEP_DELAY = 500; // milliseconds

// Execute steps with delays
let currentStep = 0;
const interval = setInterval(() => {
  if (currentStep < steps.length) {
    const step = steps[currentStep];
    const progress = Math.floor((currentStep / steps.length) * 100);
    console.log(`[${progress}%] ${step}...`);
    currentStep++;
  } else {
    clearInterval(interval);
    console.log("✅ Deployment complete! Site is live at https://neonhub-demo.vercel.app");
    process.exit(0);
  }
}, STEP_DELAY);

// Handle interruption
process.on("SIGINT", () => {
  console.log("\n❌ Deployment canceled.");
  process.exit(1);
}); 