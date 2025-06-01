declare const redisClient: any;
/**
 * Publish a message to a Redis channel
 * @param channel Channel name
 * @param message Message to publish
 * @returns Number of clients that received the message
 */
export declare const publishMessage: (channel: string, message: any) => Promise<number>;
/**
 * Subscribe to a Redis channel
 * @param channel Channel name
 * @param callback Function to call when a message is received
 */
export declare const subscribeToChannel: (channel: string, callback: (message: any) => void) => Promise<void>;
/**
 * Store data in Redis with an optional expiration time
 * @param key Redis key
 * @param value Value to store
 * @param expiryInSeconds Optional expiration time in seconds
 */
export declare const storeData: (key: string, value: any, expiryInSeconds?: number) => Promise<void>;
/**
 * Retrieve data from Redis
 * @param key Redis key
 * @returns Retrieved data or null if not found
 */
export declare const retrieveData: (key: string) => Promise<any>;
export default redisClient;
