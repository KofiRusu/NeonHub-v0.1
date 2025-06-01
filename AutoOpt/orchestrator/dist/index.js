"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
// Import configuration
const config = require('../config');
const LOG_DIR = path_1.default.resolve(__dirname, config.LOG_DIR);
const LOG_FILE = path_1.default.join(LOG_DIR, config.LOG_FILE);
const PORT = Number(process.env.PORT || config.PORT);
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || config.POLL_INTERVAL_MS);
// Debug output
console.log('Debug: Configuration loaded from config.js');
console.log(`Debug: PORT=${PORT}, config.PORT=${config.PORT}, process.env.PORT=${process.env.PORT}`);
console.log(`Debug: LOG_DIR=${LOG_DIR}`);
console.log(`Debug: LOG_FILE=${LOG_FILE}`);
// One-time deploy guard
let hasDeployed = false;
// Ensure log directory exists
if (!fs_1.default.existsSync(LOG_DIR)) {
    fs_1.default.mkdirSync(LOG_DIR, { recursive: true });
}
// Append a line to the log
function logEvent(source, type, message) {
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] [${source}] [${type}] ${message}\n`;
    fs_1.default.appendFileSync(LOG_FILE, entry);
    console.log(entry.trim());
}
// Read recent lines
function getRecentEvents(limit = 20) {
    if (!fs_1.default.existsSync(LOG_FILE))
        return [];
    const lines = fs_1.default.readFileSync(LOG_FILE, 'utf8').trim().split('\n');
    return lines.slice(-limit);
}
// Initialize Express app
const app = (0, express_1.default)();
app.use(body_parser_1.default.json());
// POST /events → log a new event
app.post('/events', (req, res) => {
    const { source, type, message } = req.body;
    if (!source || !type || !message) {
        return res.status(400).json({ error: 'Missing source, type, or message' });
    }
    logEvent(source, type, message);
    return res.status(201).json({ status: 'logged' });
});
// GET /events → return recent events
app.get('/events', (_req, res) => {
    return res.json({ events: getRecentEvents() });
});
// Health check endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'orchestrator',
        uptime: process.uptime(),
        hasDeployed: hasDeployed
    });
});
// Metrics endpoint for monitoring
app.get('/metrics', (_req, res) => {
    const events = getRecentEvents(50);
    const metrics = {
        total_events: events.length,
        project_events: events.filter(e => e.includes('[PROJECT]')).length,
        ci_events: events.filter(e => e.includes('[CI]')).length,
        orchestrator_events: events.filter(e => e.includes('[ORCHESTRATOR]')).length,
        ready_for_deployment: !hasDeployed &&
            events.some(l => config.PATTERNS.PROJECT_COMPLETE.test(l)) &&
            events.some(l => config.PATTERNS.CI_PASSED.test(l))
    };
    res.status(200).json(metrics);
});
// Background poll to detect 'all-clear'
setInterval(() => {
    logEvent('ORCHESTRATOR', 'SYSTEM', 'Polling for agent updates');
    const events = getRecentEvents(50);
    const projDone = events.some(l => config.PATTERNS.PROJECT_COMPLETE.test(l));
    const ciDone = events.some(l => config.PATTERNS.CI_PASSED.test(l));
    if (!projDone || !ciDone) {
        // Log any blockers
        const blockers = [];
        if (!projDone)
            blockers.push('Project not complete');
        if (!ciDone)
            blockers.push('CI checks not passed');
        logEvent('ORCHESTRATOR', 'CURSOR_UPDATE', `Blockers detected: ${blockers.join(', ')}`);
        return;
    }
    // Only deploy if both conditions are met and we haven't deployed yet
    if (projDone && ciDone && !hasDeployed) {
        logEvent('ORCHESTRATOR', 'DEPLOY_START', 'Both agents complete – running smoke tests and deployment');
        try {
            // Set the deploy flag first to prevent duplicate executions
            hasDeployed = true;
            // Execute the deployment command from config
            (0, child_process_1.execSync)(config.DEPLOY_COMMAND, { stdio: 'inherit' });
            // Log successful deployment
            logEvent('ORCHESTRATOR', 'DEPLOY_SUCCESS', 'Deployment completed successfully');
            // Perform cleanup operations after successful deployment
            logEvent('ORCHESTRATOR', 'CLEANUP', 'Archiving log file and cleaning up');
            // Archive the log file with timestamp
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            fs_1.default.copyFileSync(LOG_FILE, `${LOG_FILE}.${timestamp}.backup`);
        }
        catch (err) {
            // Log deployment failure
            logEvent('ORCHESTRATOR', 'DEPLOY_ERROR', err.message);
            // Reset deploy flag on error to allow retry
            hasDeployed = false;
        }
    }
}, POLL_INTERVAL_MS);
// Start server
const server = app.listen(PORT, () => {
    console.log(`Orchestrator listening on port ${PORT}`);
    logEvent('ORCHESTRATOR', 'START', `Started on port ${PORT}`);
});
