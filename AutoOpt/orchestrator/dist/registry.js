"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivateAgent = exports.updateAgentHeartbeat = exports.registerAgent = exports.loadAgents = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("./utils/logger");
const prisma = new client_1.PrismaClient();
/**
 * Load all active agents from the registry
 * @returns List of active agents
 */
async function loadAgents() {
    try {
        logger_1.logger.info('Loading active agents from registry');
        return await prisma.agentRegistry.findMany({ where: { active: true } });
    }
    catch (error) {
        logger_1.logger.error('Failed to load agents from registry', { error });
        return [];
    }
}
exports.loadAgents = loadAgents;
/**
 * Register a new agent in the registry
 * @param name Agent name
 * @param endpoint Agent endpoint URL
 * @returns Created agent registry entry
 */
async function registerAgent(name, endpoint) {
    try {
        logger_1.logger.info(`Registering agent: ${name} at ${endpoint}`);
        return await prisma.agentRegistry.create({
            data: {
                name,
                endpoint,
                active: true
            }
        });
    }
    catch (error) {
        logger_1.logger.error(`Failed to register agent: ${name}`, { error });
        throw error;
    }
}
exports.registerAgent = registerAgent;
/**
 * Update agent heartbeat
 * @param id Agent ID
 * @returns Updated agent registry entry
 */
async function updateAgentHeartbeat(id) {
    try {
        return await prisma.agentRegistry.update({
            where: { id },
            data: {
                lastHeartbeat: new Date()
            }
        });
    }
    catch (error) {
        logger_1.logger.error(`Failed to update heartbeat for agent: ${id}`, { error });
        throw error;
    }
}
exports.updateAgentHeartbeat = updateAgentHeartbeat;
/**
 * Deactivate an agent
 * @param id Agent ID
 * @returns Updated agent registry entry
 */
async function deactivateAgent(id) {
    try {
        logger_1.logger.info(`Deactivating agent: ${id}`);
        return await prisma.agentRegistry.update({
            where: { id },
            data: {
                active: false
            }
        });
    }
    catch (error) {
        logger_1.logger.error(`Failed to deactivate agent: ${id}`, { error });
        throw error;
    }
}
exports.deactivateAgent = deactivateAgent;
