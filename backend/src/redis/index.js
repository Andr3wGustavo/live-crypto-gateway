const { createClient } = require('redis');
const EventEmitter = require('events');
const logger = require('../utils/logger');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// In-Memory Fallback Pub/Sub and Key-Value Store for zero-crash offline resiliency
class MemoryRedisStore extends EventEmitter {
  constructor() {
    super();
    this.store = new Map();
    this.subscriptions = new Map();
  }

  async connect() {
    return true;
  }

  async publish(channel, message) {
    this.emit(channel, message);
    return 1;
  }

  async subscribe(channel, listener) {
    this.on(channel, listener);
    return true;
  }

  async unsubscribe(channel) {
    this.removeAllListeners(channel);
    return true;
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expires && Date.now() > item.expires) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async setEx(key, seconds, value) {
    this.store.set(key, {
      value,
      expires: Date.now() + seconds * 1000
    });
    return 'OK';
  }

  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }

  duplicate() {
    return this;
  }
}

let pubClient = new MemoryRedisStore();
let subClient = pubClient;
let isRedisConnected = false;

async function connectRedis() {
  try {
    const realPubClient = createClient({ 
      url: redisUrl,
      socket: {
        connectTimeout: 2000,
        reconnectStrategy: (retries) => {
          if (retries > 3) return false; // stop retrying and use memory fallback
          return 500;
        }
      }
    });

    realPubClient.on('error', (err) => {
      // Suppress spam if offline
    });

    await realPubClient.connect();
    
    const realSubClient = realPubClient.duplicate();
    await realSubClient.connect();

    pubClient = realPubClient;
    subClient = realSubClient;
    isRedisConnected = true;
    logger.info('Connected to Redis server successfully on port 6379');
  } catch (err) {
    logger.warn('Redis server not reachable locally. Activated High-Performance In-Memory Pub/Sub Engine.');
    pubClient = new MemoryRedisStore();
    subClient = pubClient;
    isRedisConnected = false;
  }
}

module.exports = {
  get pubClient() { return pubClient; },
  get subClient() { return subClient; },
  get isRedisConnected() { return isRedisConnected; },
  connectRedis
};
