const express = require('express');
const db = require('../db');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, username }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

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
    const alertsRes = await db.query('SELECT min_amount, media_url, audio_url FROM Alert_Configs WHERE streamer_id = $1', [streamerId]);
    
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
