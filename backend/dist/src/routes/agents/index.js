'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = require('express');
const content_routes_1 = __importDefault(require('./content.routes'));
const trend_routes_1 = __importDefault(require('./trend.routes'));
const campaign_1 = __importDefault(require('./campaign'));
const auth_1 = require('../../middleware/auth');
const router = (0, express_1.Router)();
// Apply authentication middleware to all agent routes
router.use(auth_1.authenticateToken);
// Register agent routes
router.use('/content', content_routes_1.default);
router.use('/trend', trend_routes_1.default);
router.use('/campaign', campaign_1.default);
exports.default = router;
