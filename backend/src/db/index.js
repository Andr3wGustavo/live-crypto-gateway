const { Pool } = require('pg');
const logger = require('../utils/logger');
const { randomUUID } = require('crypto');

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'livecrypto',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: process.env.POSTGRES_PORT || 5432,
  connectionTimeoutMillis: 1500,
});

pool.on('error', () => {
  // Silent background handling
});

// In-Memory Database Fallback for smooth local development without Docker
const memoryStore = {
  streamers: [
    { id: 1, public_address: '0x71c7656ec7ab88b098defb751b7401b5f6d8976f', obs_token: '789a-bcde-1234-fghi' }
  ],
  wallets: [
    { streamer_id: 1, chain_id: 'solana', public_address: '8x3sK2vPz1Lm9NxQa7Rt5Wb4Ey2Cg1Vj6F3aQ' },
    { streamer_id: 1, chain_id: 'sui', public_address: '0x8f3c7e9a1b2d4f5c6e8a0b1d3f5e7c9a1b2d4f5c6e8a0b1d3f5e7c9a1b2d4f5c' },
    { streamer_id: 1, chain_id: '137', public_address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' },
    { streamer_id: 1, chain_id: '8453', public_address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' },
    { streamer_id: 1, chain_id: '1', public_address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' },
    { streamer_id: 1, chain_id: 'btc', public_address: 'lnurl1dp68gurn8ghj7ampd3kx2ar0veekzar0wd5xjtnrdakj7tnhv4kxctttdehhwm30d3h82unvwqhksetjv35kuee5' }
  ],
  alertConfigs: [
    {
      streamer_id: 1,
      min_amount: '0.00',
      active_theme: 'cyberpunk',
      goal_amount: '100.00',
      goal_current: '35.00',
      goal_title: 'Streamer Setup Goal',
      media_url: null,
      audio_url: null
    }
  ],
  transactions: [
    {
      id: 1,
      tx_hash: '0x8f2d...4a1c',
      streamer_id: 1,
      sender_address: 'alex.sol',
      amount: '25.0',
      currency: 'SOL',
      status: 'CONFIRMED',
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      tx_hash: '0x3e1b...99f0',
      streamer_id: 1,
      sender_address: 'satoshi.eth',
      amount: '0.15',
      currency: 'ETH',
      status: 'CONFIRMED',
      timestamp: new Date().toISOString()
    }
  ]
};

const useMemoryDb = process.env.DEV_MEMORY_MODE === 'true' && process.env.NODE_ENV !== 'production';

async function query(text, params = []) {
  if (!useMemoryDb) {
    return pool.query(text, params);
  }

  // Handle in-memory queries gracefully
  const queryLower = text.toLowerCase();
  if (queryLower.trim() === 'select 1') return { rows: [{ '?column?': 1 }] };

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
      const match = memoryStore.streamers.filter(s => s.public_address === String(params[0]));
      return { rows: match };
    }
    if (queryLower.includes('lower(public_address)')) {
      return { rows: memoryStore.streamers.filter(s => s.public_address.toLowerCase() === String(params[0]).toLowerCase()) };
    }
    if (queryLower.includes('inner join wallets')) {
      const walletAddr = String(params[0]).toLowerCase();
      const matchedWallet = memoryStore.wallets.find(w => w.public_address.toLowerCase() === walletAddr);
      if (matchedWallet) {
        return { rows: [{ id: matchedWallet.streamer_id }] };
      }
      return { rows: [] };
    }
    return { rows: memoryStore.streamers };
  }

  // 2. INSERT into Streamers
  if (queryLower.includes('insert into streamers')) {
    const newId = memoryStore.streamers.length + 1;
    const newStreamer = {
      id: newId,
      public_address: String(params[0]),
      obs_token: randomUUID()
    };
    memoryStore.streamers.push(newStreamer);
    return { rows: [newStreamer] };
  }

  // 3. Wallets queries
  if (queryLower.includes('from wallets')) {
    const streamerId = parseInt(params[0]) || 1;
    let match = memoryStore.wallets.filter(w => w.streamer_id === streamerId);
    if (params.length > 1) {
      const chainSearch = String(params[1]).toLowerCase();
      const filtered = match.filter(w => w.chain_id.toLowerCase() === chainSearch || w.chain_id === String(params[2] || ''));
      match = filtered;
    }
    return { rows: match };
  }

  if (queryLower.includes('insert into wallets')) {
    const streamerId = parseInt(params[0]) || 1;
    const chainId = String(params[1]);
    const addr = String(params[2]);

    const existingIdx = memoryStore.wallets.findIndex(w => w.streamer_id === streamerId && w.chain_id === chainId);
    if (existingIdx > -1) {
      if (queryLower.includes('do nothing')) return { rows: [], rowCount: 0 };
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
        goal_title: 'Donation Goal',
        media_url: null,
        audio_url: null
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
    if (params[6] !== undefined) cfg.media_url = params[6];
    if (params[7] !== undefined) cfg.audio_url = params[7];
    return { rows: [cfg] };
  }

  // 5. Transactions queries
  if (queryLower.includes('from transactions')) {
    if (queryLower.includes('where tx_hash = $1')) {
      const match = memoryStore.transactions.filter(t => t.tx_hash === params[0]);
      return { rows: match };
    }
    if (queryLower.includes('where status = \'pending\'')) {
      const match = memoryStore.transactions.filter(t => t.status === 'PENDING');
      return { rows: match };
    }
    if (queryLower.includes('where streamer_id = $1')) {
      const streamerId = parseInt(params[0]) || 1;
      const match = memoryStore.transactions.filter(t => t.streamer_id === streamerId);
      return { rows: match };
    }
    return { rows: memoryStore.transactions };
  }

  if (queryLower.includes('insert into transactions')) {
    const txHash = params[0] || `tx_${Date.now()}`;
    const streamerId = parseInt(params[1]) || 1;
    const sender = params[2] || 'Anonymous';
    const amount = String(params[3] || '0');
    const currency = params[4] || 'SOL';

    const existingIdx = memoryStore.transactions.findIndex(t => t.tx_hash === txHash);
    if (existingIdx > -1) {
      memoryStore.transactions[existingIdx].status = 'CONFIRMED';
      return { rows: [memoryStore.transactions[existingIdx]] };
    }

    const newTx = {
      id: memoryStore.transactions.length + 1,
      tx_hash: txHash,
      streamer_id: streamerId,
      sender_address: sender,
      amount: amount,
      currency: currency,
      status: 'CONFIRMED',
      timestamp: new Date().toISOString()
    };
    memoryStore.transactions.unshift(newTx);
    return { rows: [newTx] };
  }

  if (queryLower.includes('update transactions set status')) {
    const status = queryLower.includes("'confirmed'") ? 'CONFIRMED' : queryLower.includes("'failed'") ? 'FAILED' : 'PENDING';
    const txId = parseInt(params[0]);
    const target = memoryStore.transactions.find(t => t.id === txId);
    if (target) target.status = status;
    return { rows: target ? [target] : [] };
  }

  return { rows: [] };
}

module.exports = {
  query,
  isMemory: useMemoryDb,
  close: () => pool.end()
};
