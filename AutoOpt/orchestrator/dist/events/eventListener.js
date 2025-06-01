"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEvent = exports.registerEventHandler = exports.initializeEventListener = void 0;
const redis_1 = require("../utils/redis");
const logger_1 = require("../utils/logger");
// Map of event handlers by event type
const eventHandlers = {};
/**
 * Initialize the event listener
 * @param redisChannel Redis channel to subscribe to
 */
const initializeEventListener = async (redisChannel) => {
    logger_1.logger.info(`Initializing event listener on channel: ${redisChannel}`);
    try {
        // Subscribe to the Redis channel
        await (0, redis_1.subscribeToChannel)(redisChannel, async (message) => {
            try {
                // Validate message format
                if (!message || typeof message !== 'object' || !message.type) {
                    logger_1.logger.warn('Received invalid event message format', { message });
                    return;
                }
                const event = message;
                logger_1.logger.info(`Received event: ${event.type}`, {
                    eventId: event.id,
                    eventType: event.type,
                    timestamp: event.timestamp,
                });
                // Handle the event
                await (0, exports.handleEvent)(event);
            }
            catch (error) {
                logger_1.logger.error('Error processing event', { error, message });
            }
        });
        logger_1.logger.info(`Event listener initialized successfully on channel: ${redisChannel}`);
    }
    catch (error) {
        logger_1.logger.error('Failed to initialize event listener', { error, channel: redisChannel });
        throw error;
    }
};
exports.initializeEventListener = initializeEventListener;
/**
 * Register a handler for a specific event type
 * @param eventType Type of event to handle
 * @param handler Function to handle the event
 */
const registerEventHandler = (eventType, handler) => {
    logger_1.logger.info(`Registering handler for event type: ${eventType}`);
    eventHandlers[eventType] = handler;
};
exports.registerEventHandler = registerEventHandler;
/**
 * Handle an incoming domain event
 * @param event Domain event to handle
 */
const handleEvent = async (event) => {
    const { type } = event;
    const handler = eventHandlers[type];
    if (!handler) {
        logger_1.logger.warn(`No handler registered for event type: ${type}`);
        return;
    }
    try {
        logger_1.logger.debug(`Processing event: ${type}`, { eventId: event.id });
        await handler(event);
        logger_1.logger.debug(`Successfully processed event: ${type}`, { eventId: event.id });
    }
    catch (error) {
        logger_1.logger.error(`Error handling event: ${type}`, { error, eventId: event.id });
        // In a production system, you might want to implement retry logic or dead letter queue here
    }
};
exports.handleEvent = handleEvent;
exports.default = {
    initializeEventListener: exports.initializeEventListener,
    registerEventHandler: exports.registerEventHandler,
    handleEvent: exports.handleEvent,
};
