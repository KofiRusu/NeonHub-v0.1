import { DomainEvent } from '@neonhub/agents/src/interfaces/AgentInterface';
/**
 * Initialize the event listener
 * @param redisChannel Redis channel to subscribe to
 */
export declare const initializeEventListener: (redisChannel: string) => Promise<void>;
/**
 * Register a handler for a specific event type
 * @param eventType Type of event to handle
 * @param handler Function to handle the event
 */
export declare const registerEventHandler: (eventType: string, handler: (event: DomainEvent) => Promise<void>) => void;
/**
 * Handle an incoming domain event
 * @param event Domain event to handle
 */
export declare const handleEvent: (event: DomainEvent) => Promise<void>;
declare const _default: {
    initializeEventListener: (redisChannel: string) => Promise<void>;
    registerEventHandler: (eventType: string, handler: (event: DomainEvent) => Promise<void>) => void;
    handleEvent: (event: DomainEvent) => Promise<void>;
};
export default _default;
