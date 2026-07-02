const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// We need two separate clients: one for publishing events (e.g. from webhooks)
// and one for subscribing to events (e.g. for WebSocket sessions).
const pubClient = createClient({ url: redisUrl });
const subClient = pubClient.duplicate();

pubClient.on('error', (err) => console.error('Redis Pub Client Error', err));
subClient.on('error', (err) => console.error('Redis Sub Client Error', err));

async function connectRedis() {
  await pubClient.connect();
  await subClient.connect();
  console.log('Connected to Redis');
}

module.exports = {
  pubClient,
  subClient,
  connectRedis
};
