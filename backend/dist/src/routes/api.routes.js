"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const project_routes_1 = __importDefault(require("./project.routes"));
const task_routes_1 = __importDefault(require("./task.routes"));
const message_routes_1 = __importDefault(require("./message.routes"));
const document_routes_1 = __importDefault(require("./document.routes"));
const agent_routes_1 = __importDefault(require("./agent.routes"));
const agents_1 = __importDefault(require("./agents"));
const campaigns_routes_1 = __importDefault(require("./campaigns.routes"));
const metrics_routes_1 = __importDefault(require("./metrics.routes"));
const feedback_routes_1 = __importDefault(require("./feedback.routes"));
const content_routes_1 = __importDefault(require("./content.routes"));
const trend_routes_1 = __importDefault(require("./trend.routes"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.use('/auth', auth_routes_1.default);
// Protected routes
router.use('/projects', auth_1.authenticate, project_routes_1.default);
router.use('/tasks', auth_1.authenticate, task_routes_1.default);
router.use('/messages', auth_1.authenticate, message_routes_1.default);
router.use('/documents', auth_1.authenticate, document_routes_1.default);
router.use('/agent', auth_1.authenticate, agent_routes_1.default);
router.use('/agents', auth_1.authenticate, agents_1.default);
router.use('/campaigns', auth_1.authenticate, campaigns_routes_1.default);
router.use('/metrics', auth_1.authenticate, metrics_routes_1.default);
router.use('/feedback', auth_1.authenticate, feedback_routes_1.default);
router.use('/content', auth_1.authenticate, content_routes_1.default);
router.use('/trends', auth_1.authenticate, trend_routes_1.default);
exports.default = router;
//# sourceMappingURL=api.routes.js.map