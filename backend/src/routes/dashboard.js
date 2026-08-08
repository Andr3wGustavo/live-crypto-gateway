const express = require('express');
const db = require('../db');
const { pubClient } = require('../redis');

const router = express.Router();
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Get Streamer Dashboard data (Wallets, Alerts, obs_token)
router.get('/', async (req, res) => {
  const streamerId = req.user.id;
  
  try {
    // Get Streamer info
    const streamerRes = await db.query('SELECT id, public_address, obs_token FROM Streamers WHERE id = $1', [streamerId]);
    
    // Get Wallets
    const walletsRes = await db.query('SELECT chain_id, public_address FROM Wallets WHERE streamer_id = $1', [streamerId]);
    
    // Get Alert Configs
    const alertsRes = await db.query(
      `SELECT min_amount, media_url, audio_url, active_theme, goal_amount, goal_current, goal_title 
       FROM Alert_Configs WHERE streamer_id = $1`,
      [streamerId]
    );
    
    res.json({
      streamer: streamerRes.rows[0],
      wallets: walletsRes.rows,
      alertConfig: alertsRes.rows[0] || null
    });
  } catch (error) {
    console.error('Dashboard Get error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Wallet
router.post('/wallet', async (req, res) => {
  const streamerId = req.user.id;
  const { chain_id, public_address } = req.body;
  
  try {
    await db.query(
      `INSERT INTO Wallets (streamer_id, chain_id, public_address) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (streamer_id, chain_id) 
       DO UPDATE SET public_address = EXCLUDED.public_address`,
      [streamerId, chain_id, public_address]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Wallet Update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Alert Config, Theme, and Goal
router.post('/config', async (req, res) => {
  const streamerId = req.user.id;
  const { min_amount, active_theme, goal_amount, goal_current, goal_title } = req.body;

  try {
    const { rows } = await db.query(
      `INSERT INTO Alert_Configs (streamer_id, min_amount, active_theme, goal_amount, goal_current, goal_title)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (streamer_id)
       DO UPDATE SET 
         min_amount = COALESCE(EXCLUDED.min_amount, Alert_Configs.min_amount),
         active_theme = COALESCE(EXCLUDED.active_theme, Alert_Configs.active_theme),
         goal_amount = COALESCE(EXCLUDED.goal_amount, Alert_Configs.goal_amount),
         goal_current = COALESCE(EXCLUDED.goal_current, Alert_Configs.goal_current),
         goal_title = COALESCE(EXCLUDED.goal_title, Alert_Configs.goal_title)
       RETURNING min_amount, active_theme, goal_amount, goal_current, goal_title`,
      [
        streamerId, 
        min_amount || '0.0', 
        active_theme || 'cyberpunk', 
        goal_amount || '0.0', 
        goal_current || '0.0', 
        goal_title || 'Donation Goal'
      ]
    );

    // Publish CONFIG_UPDATE to Redis Pub/Sub so OBS overlay updates instantly
    const channel = `streamer:${streamerId}:events`;
    const payload = JSON.stringify({
      event: 'CONFIG_UPDATE',
      theme: active_theme || 'cyberpunk',
      goal_amount: parseFloat(goal_amount || '0.0'),
      goal_current: parseFloat(goal_current || '0.0'),
      goal_title: goal_title || 'Donation Goal'
    });
    
    await pubClient.publish(channel, payload);

    res.json({ success: true, config: rows[0] });
  } catch (error) {
    console.error('Config update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent transactions
router.get('/transactions', async (req, res) => {
  const streamerId = req.user.id;
  try {
    const { rows } = await db.query(
      'SELECT tx_hash, sender_address, amount, currency, status, timestamp FROM Transactions WHERE streamer_id = $1 ORDER BY timestamp DESC LIMIT 50',
      [streamerId]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rotate OBS token - generates a new UUID and revokes the old one
router.post('/rotate-token', async (req, res) => {
  const streamerId = req.user.id;
  try {
    const { rows } = await db.query(
      'UPDATE Streamers SET obs_token = uuid_generate_v4() WHERE id = $1 RETURNING obs_token',
      [streamerId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Streamer not found' });
    }

    console.log(`OBS token rotated for streamer ${streamerId}`);
    res.json({ obs_token: rows[0].obs_token });
  } catch (error) {
    console.error('Token rotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
