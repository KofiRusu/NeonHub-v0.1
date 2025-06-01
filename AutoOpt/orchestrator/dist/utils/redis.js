"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.retrieveData = exports.storeData = exports.subscribeToChannel = exports.publishMessage = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const logger_1 = require("./logger");
// Initialize Redis client with configuration from environment variables
const redisClient = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});
// Handle Redis connection events
redisClient.on('connect', () => {
    logger_1.logger.info('Connected to Redis server');
});
redisClient.on('error', (error) => {
    logger_1.logger.error(`Redis connection error: ${error.message}`, { error });
});
redisClient.on('reconnecting', (timeToReconnect) => {
    logger_1.logger.warn(`Reconnecting to Redis in ${timeToReconnect}ms`);
});
/**
 * Publish a message to a Redis channel
 * @param channel Channel name
 * @param message Message to publish
 * @returns Number of clients that received the message
 */
const publishMessage = async (channel, message) => {
    try {
        const serializedMessage = typeof message === 'object'
            ? JSON.stringify(message)
            : String(message);
        return await redisClient.publish(channel, serializedMessage);
    }
    catch (error) {
        logger_1.logger.error(`Error publishing message to ${channel}`, { error });
        throw error;
    }
};
exports.publishMessage = publishMessage;
/**
 * Subscribe to a Redis channel
 * @param channel Channel name
 * @param callback Function to call when a message is received
 */
const subscribeToChannel = async (channel, callback) => {
    try {
        // Create a separate client for subscriptions
        const subscriber = redisClient.duplicate();
        await subscriber.subscribe(channel);
        subscriber.on('message', (receivedChannel, message) => {
            if (receivedChannel === channel) {
                try {
                    const parsedMessage = JSON.parse(message);
                    callback(parsedMessage);
                }
                catch (error) {
                    // If message is not valid JSON, pass it as a string
                    callback(message);
                }
            }
        });
        logger_1.logger.info(`Subscribed to Redis channel: ${channel}`);
    }
    catch (error) {
        logger_1.logger.error(`Error subscribing to channel ${channel}`, { error });
        throw error;
    }
};
exports.subscribeToChannel = subscribeToChannel;
/**
 * Store data in Redis with an optional expiration time
 * @param key Redis key
 * @param value Value to store
 * @param expiryInSeconds Optional expiration time in seconds
 */
const storeData = async (key, value, expiryInSeconds) => {
    try {
        const serializedValue = typeof value === 'object'
            ? JSON.stringify(value)
            : String(value);
        if (expiryInSeconds) {
            await redisClient.setex(key, expiryInSeconds, serializedValue);
        }
        else {
            await redisClient.set(key, serializedValue);
        }
    }
    catch (error) {
        logger_1.logger.error(`Error storing data for key ${key}`, { error });
        throw error;
    }
};
exports.storeData = storeData;
/**
 * Retrieve data from Redis
 * @param key Redis key
 * @returns Retrieved data or null if not found
 */
const retrieveData = async (key) => {
    try {
        const value = await redisClient.get(key);
        if (!value) {
            return null;
        }
        try {
            return JSON.parse(value);
        }
        catch {
            return value;
        }
    }
    catch (error) {
        logger_1.logger.error(`Error retrieving data for key ${key}`, { error });
        throw error;
    }
};
exports.retrieveData = retrieveData;
exports.default = redisClient;
