const { createClient } = require('redis');
const { EventEmitter } = require('events');

class MemoryRedisStore extends EventEmitter {
  constructor() { super(); this.store = new Map(); }
  async connect() {}
  async ping() { return 'PONG'; }
  async publish(channel, message) { this.emit(channel, message); return this.listenerCount(channel); }
  async subscribe(channel, listener) { this.on(channel, listener); }
  async unsubscribe(channel) { this.removeAllListeners(channel); }
  async get(key) {
    const item = this.store.get(key);
    if (!item || item.expires <= Date.now()) { this.store.delete(key); return null; }
    return item.value;
  }
  async getDel(key) {
    // No await between lookup and delete: same atomic semantics as Redis GETDEL.
    const item = this.store.get(key);
    this.store.delete(key);
    return item && item.expires > Date.now() ? item.value : null;
  }
  async setEx(key, seconds, value) { this.store.set(key, { value, expires: Date.now() + seconds * 1000 }); }
  async del(key) { return Number(this.store.delete(key)); }
}

const isMemory = process.env.DEV_MEMORY_MODE === 'true' && process.env.NODE_ENV !== 'production';
// Stable references: consumers must never retain the old fallback after connecting.
const pubClient = isMemory ? new MemoryRedisStore() : createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  disableOfflineQueue: true,
  socket: { connectTimeout: 3000, reconnectStrategy: retries => retries < 3 ? 500 : false }
});
const subClient = isMemory ? pubClient : pubClient.duplicate();
if (!isMemory) {
  pubClient.on('error', err => console.error('[Redis publisher]', err.message));
  subClient.on('error', err => console.error('[Redis subscriber]', err.message));
}
async function connectRedis() {
  await pubClient.connect();
  if (subClient !== pubClient) await subClient.connect();
}
async function closeRedis() {
  if (!isMemory) {
    if (subClient.isOpen) subClient.destroy();
    if (pubClient.isOpen) pubClient.destroy();
  }
}
module.exports = { pubClient, subClient, connectRedis, closeRedis, isMemory, MemoryRedisStore };
