const { Pool } = require('pg');
const logger = require('../utils/logger');

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'livecrypto',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: process.env.POSTGRES_PORT || 5432,
  connectionTimeoutMillis: 1500,
});

pool.on('error', (err) => {
  // Silent background handling
});

// In-Memory Database Fallback for smooth local development without Docker
const memoryStore = {
  streamers: [
    { id: 1, public_address: '0x71c7656ec7ab88b098defb751b7401b5f6d8976f', obs_token: '789a-bcde-1234-fghi' }
  ],
  wallets: [
    { streamer_id: 1, chain_id: 'sui', public_address: '0x8f3c7e9a1b2d4f5c6e8a0b1d3f5e7c9a1b2d4f5c6e8a0b1d3f5e7c9a1b2d4f5c' },
    { streamer_id: 1, chain_id: 'solana', public_address: '8x3sK2vPz1Lm9NxQa7Rt5Wb4Ey2Cg1Vj6F3aQ' },
    { streamer_id: 1, chain_id: '137', public_address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' }
  ],
  alertConfigs: [
    {
      streamer_id: 1,
      min_amount: '0.00',
      active_theme: 'cyberpunk',
      goal_amount: '100.00',
      goal_current: '35.00',
      goal_title: 'Setup Novo',
      media_url: null,
      audio_url: null
    }
  ],
  transactions: [
    {
      tx_hash: 'sui_demo_tx_001',
      streamer_id: 1,
      sender_address: '0x8f3c...Slush',
      amount: '25.00',
      currency: 'SUI',
      status: 'CONFIRMED',
      timestamp: new Date().toISOString()
    }
  ]
};

let useMemoryDb = false;

async function query(text, params = []) {
  if (!useMemoryDb) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      if (err.code === 'ECONNREFUSED' || err.message.includes('timeout') || err.message.includes('Connection terminated')) {
        if (!useMemoryDb) {
          logger.warn('PostgreSQL database offline. Activated High-Performance In-Memory DB Engine.');
          useMemoryDb = true;
        }
      } else {
        throw err;
      }
    }
  }

  // Handle in-memory queries gracefully
  const queryLower = text.toLowerCase();

  // 1. SELECT from Streamers
  if (queryLower.includes('from streamers')) {
    if (queryLower.includes('where obs_token = $1')) {
      const match = memoryStore.streamers.filter(s => s.obs_token === params[0]);
      return { rows: match };
    }
    if (queryLower.includes('where id = $1')) {
      const match = memoryStore.streamers.filter(s => s.id === parseInt(params[0]));
      return { rows: match };
    }
    if (queryLower.includes('where public_address = $1')) {
      const match = memoryStore.streamers.filter(s => s.public_address.toLowerCase() === String(params[0]).toLowerCase());
      return { rows: match };
    }
    return { rows: memoryStore.streamers };
  }

  // 2. INSERT into Streamers
  if (queryLower.includes('insert into streamers')) {
    const newId = memoryStore.streamers.length + 1;
    const newStreamer = {
      id: newId,
      public_address: String(params[0]).toLowerCase(),
      obs_token: `obs-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    };
    memoryStore.streamers.push(newStreamer);
    return { rows: [newStreamer] };
  }

  // 3. Wallets queries
  if (queryLower.includes('from wallets')) {
    const streamerId = parseInt(params[0]) || 1;
    const match = memoryStore.wallets.filter(w => w.streamer_id === streamerId);
    return { rows: match };
  }

  if (queryLower.includes('insert into wallets')) {
    const streamerId = parseInt(params[0]) || 1;
    const chainId = String(params[1]);
    const addr = String(params[2]);

    const existingIdx = memoryStore.wallets.findIndex(w => w.streamer_id === streamerId && w.chain_id === chainId);
    if (existingIdx > -1) {
      memoryStore.wallets[existingIdx].public_address = addr;
    } else {
      memoryStore.wallets.push({ streamer_id: streamerId, chain_id: chainId, public_address: addr });
    }
    return { rows: [] };
  }

  // 4. Alert_Configs queries
  if (queryLower.includes('from alert_configs')) {
    const streamerId = parseInt(params[0]) || 1;
    let match = memoryStore.alertConfigs.find(a => a.streamer_id === streamerId);
    if (!match) {
      match = {
        streamer_id: streamerId,
        min_amount: '0.00',
        active_theme: 'cyberpunk',
        goal_amount: '100.00',
        goal_current: '0.00',
        goal_title: 'Meta de Doações'
      };
      memoryStore.alertConfigs.push(match);
    }
    return { rows: [match] };
  }

  if (queryLower.includes('insert into alert_configs') || queryLower.includes('update alert_configs')) {
    const streamerId = parseInt(params[0]) || 1;
    let cfg = memoryStore.alertConfigs.find(a => a.streamer_id === streamerId);
    if (!cfg) {
      cfg = { streamer_id: streamerId };
      memoryStore.alertConfigs.push(cfg);
    }
    if (params[1]) cfg.min_amount = params[1];
    if (params[2]) cfg.active_theme = params[2];
    if (params[3]) cfg.goal_amount = params[3];
    if (params[4]) cfg.goal_current = params[4];
    if (params[5]) cfg.goal_title = params[5];
    return { rows: [cfg] };
  }

  // 5. Transactions queries
  if (queryLower.includes('from transactions')) {
    return { rows: memoryStore.transactions };
  }

  if (queryLower.includes('insert into transactions')) {
    const newTx = {
      tx_hash: params[0] || `tx_${Date.now()}`,
      streamer_id: parseInt(params[1]) || 1,
      sender_address: params[2] || '0xDonor',
      amount: String(params[3] || '0'),
      currency: params[4] || 'SUI',
      status: 'CONFIRMED',
      timestamp: new Date().toISOString()
    };
    memoryStore.transactions.unshift(newTx);
    return { rows: [newTx] };
  }

  return { rows: [] };
}

module.exports = {
  query
};
