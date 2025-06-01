/**
 * Load all active agents from the registry
 * @returns List of active agents
 */
export declare function loadAgents(): Promise<any>;
/**
 * Register a new agent in the registry
 * @param name Agent name
 * @param endpoint Agent endpoint URL
 * @returns Created agent registry entry
 */
export declare function registerAgent(name: string, endpoint: string): Promise<any>;
/**
 * Update agent heartbeat
 * @param id Agent ID
 * @returns Updated agent registry entry
 */
export declare function updateAgentHeartbeat(id: string): Promise<any>;
/**
 * Deactivate an agent
 * @param id Agent ID
 * @returns Updated agent registry entry
 */
export declare function deactivateAgent(id: string): Promise<any>;
