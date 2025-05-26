"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetricService = exports.getCampaignService = exports.getAuthService = void 0;
const AuthService_1 = require("./auth/AuthService");
const CampaignService_1 = require("./campaigns/CampaignService");
const MetricService_1 = require("./metrics/MetricService");
// Service instances cache
const serviceInstances = {};
/**
 * Get the authentication service
 * @param prisma PrismaClient instance
 * @returns AuthService instance
 */
const getAuthService = (prisma) => {
    if (!serviceInstances.auth) {
        serviceInstances.auth = new AuthService_1.AuthService(prisma);
    }
    return serviceInstances.auth;
};
exports.getAuthService = getAuthService;
/**
 * Get the campaign service
 * @param prisma PrismaClient instance
 * @returns CampaignService instance
 */
const getCampaignService = (prisma) => {
    if (!serviceInstances.campaign) {
        serviceInstances.campaign = new CampaignService_1.CampaignService(prisma);
    }
    return serviceInstances.campaign;
};
exports.getCampaignService = getCampaignService;
/**
 * Get the metric service
 * @param prisma PrismaClient instance
 * @returns MetricService instance
 */
const getMetricService = (prisma) => {
    if (!serviceInstances.metric) {
        serviceInstances.metric = new MetricService_1.MetricService(prisma);
    }
    return serviceInstances.metric;
};
exports.getMetricService = getMetricService;
// Export all service types
__exportStar(require("./auth/AuthService"), exports);
__exportStar(require("./campaigns/CampaignService"), exports);
__exportStar(require("./metrics/MetricService"), exports);
//# sourceMappingURL=index.js.map