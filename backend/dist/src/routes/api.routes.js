'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = require('express');
const auth_routes_1 = __importDefault(require('./auth.routes'));
const project_routes_1 = __importDefault(require('./project.routes'));
const task_routes_1 = __importDefault(require('./task.routes'));
const message_routes_1 = __importDefault(require('./message.routes'));
const document_routes_1 = __importDefault(require('./document.routes'));
const agent_routes_1 = __importDefault(require('./agent.routes'));
const agents_1 = __importDefault(require('./agents'));
const campaigns_routes_1 = __importDefault(require('./campaigns.routes'));
const metrics_routes_1 = __importDefault(require('./metrics.routes'));
const feedback_routes_1 = __importDefault(require('./feedback.routes'));
const content_routes_1 = __importDefault(require('./content.routes'));
const trend_routes_1 = __importDefault(require('./trend.routes'));
const auth_1 = require('../middleware/auth');
const router = (0, express_1.Router)();
// Public routes
router.use('/auth', auth_routes_1.default);
// Protected routes
router.use('/projects', auth_1.protect, project_routes_1.default);
router.use('/tasks', auth_1.protect, task_routes_1.default);
router.use('/messages', auth_1.protect, message_routes_1.default);
router.use('/documents', auth_1.protect, document_routes_1.default);
router.use('/agent', auth_1.protect, agent_routes_1.default);
router.use('/agents', auth_1.protect, agents_1.default);
router.use('/campaigns', auth_1.protect, campaigns_routes_1.default);
router.use('/metrics', auth_1.protect, metrics_routes_1.default);
router.use('/feedback', auth_1.protect, feedback_routes_1.default);
router.use('/content', auth_1.protect, content_routes_1.default);
router.use('/trends', auth_1.protect, trend_routes_1.default);
exports.default = router;
