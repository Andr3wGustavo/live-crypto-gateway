const express = require('express');
const db = require('../db');
const { pubClient } = require('../redis');
const { paymentConfig, publicConfig } = require('../services/paymentConfig');
const { normalizePayoutAddress } = require('../services/payoutAddress');
const { fields: alertSettingFields, saveAlertSettings, notifyAlertSettings } = require('../services/alertSettings');
const { summarizeTransactions } = require('../services/analytics');

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
      `SELECT min_amount, media_url, audio_url, active_theme, goal_amount, goal_current, goal_title, position, sound_preset, voice_profile, show_leaderboard
       FROM Alert_Configs WHERE streamer_id = $1`,
      [streamerId]
    );
    
    res.json({
      streamer: streamerRes.rows[0],
      wallets: walletsRes.rows,
      // The preview adapter may include internal row properties. Keep the API
      // shape identical to PostgreSQL so GET -> edit -> POST is valid in both.
      alertConfig: alertsRes.rows[0] ? Object.fromEntries(alertSettingFields
        .filter(field => alertsRes.rows[0][field] !== undefined)
        .map(field => [field, alertsRes.rows[0][field]])) : null,
      paymentConfig: publicConfig()
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
    const config = paymentConfig();
    let address;
    try { address = normalizePayoutAddress(chain_id, public_address, config); }
    catch (error) { return res.status(422).json({ error: error.message }); }
    await db.query(
      `INSERT INTO Wallets (streamer_id, chain_id, public_address) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (streamer_id, chain_id) 
       DO UPDATE SET public_address = EXCLUDED.public_address`,
      [streamerId, chain_id, address]
    );
    res.json({ success: true, wallet: { chain_id, public_address: address } });
  } catch (error) {
    console.error('Wallet Update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update Alert Config, Theme, Media, Audio, and Goal
router.post('/config', async (req, res, next) => {
  try {
    const config = await saveAlertSettings(req.user.id, req.body);
    const realtime = await notifyAlertSettings(req.user.id, config);
    res.json({ success:true, config, realtime });
  } catch (error) {
    if (error.status === 422) return res.status(422).json({ error:error.message });
    next(error);
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

// GET /api/dashboard/analytics - Aggregate analytics metrics for creator
router.get('/analytics', async (req, res) => {
  const streamerId = req.user.id;
  try {
    const txRes = await db.query(
      'SELECT amount, currency, status, timestamp, chain_id FROM Transactions WHERE streamer_id = $1',
      [streamerId]
    );

    res.json(summarizeTransactions(txRes.rows));
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/dashboard/test-alert - Trigger an instant test donation alert to OBS overlay
router.get('/payments', async (req,res,next) => {
  if (db.isMemory) return res.json([]);
  try {
    const { rows } = await db.query(`SELECT id,chain_id,status,tx_hash,gross_amount,currency,attempts,last_error,created_at,expires_at,monitor_until
      FROM Payment_Intents WHERE streamer_id=$1 ORDER BY created_at DESC LIMIT 100`, [req.user.id]);
    res.json(rows);
  } catch (error) { next(error); }
});
router.post('/payments/:id/reconcile', async (req,res,next) => {
  if (db.isMemory) return res.status(503).json({ error:'Persistent storage required' });
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(req.params.id)) return res.status(422).json({ error:'Invalid intent ID' });
  try {
    const { rows } = await db.query(`UPDATE Payment_Intents SET next_attempt_at=NOW(),monitor_until=NOW()+INTERVAL '7 days'
      WHERE id=$1 AND streamer_id=$2 AND status <> 'CONFIRMED' RETURNING id,status`, [req.params.id,req.user.id]);
    if (!rows.length) return res.status(404).json({ error:'Pending intent not found' });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.post('/test-alert', async (req, res) => {
  const streamerId = req.user.id;
  const { amount = 0.5, currency = 'SOL', sender = '0xTest...Donor', message = '⚡ Testing Live Crypto OBS Overlay!' } = req.body;

  try {
    // Fetch streamer alert configs for custom audio/media
    const alertRes = await db.query(
      'SELECT media_url, audio_url FROM Alert_Configs WHERE streamer_id = $1',
      [streamerId]
    );

    const alertConfig = alertRes.rows[0] || {};
    const channel = `streamer:${streamerId}:events`;

    const payload = JSON.stringify({
      event: 'DONATION',
      amount: parseFloat(amount),
      currency: currency,
      sender: sender,
      message: message,
      media_url: alertConfig.media_url || null,
      audio_url: alertConfig.audio_url || null,
      is_test: true,
      timestamp: new Date().toISOString()
    });

    await pubClient.publish(channel, payload);
    console.log(`[Test Alert] Dispatched test alert to streamer ${streamerId} (${channel})`);

    res.json({ success: true, message: 'Test alert sent to OBS overlay!' });
  } catch (error) {
    console.error('Test alert dispatch error:', error);
    res.status(500).json({ error: 'Failed to dispatch test alert' });
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
    await pubClient.publish(`streamer:${streamerId}:events`, JSON.stringify({ event: 'TOKEN_ROTATED' }));
    res.json({ obs_token: rows[0].obs_token });
  } catch (error) {
    console.error('Token rotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Skip active alert immediately on connected OBS overlays
router.post('/skip-alert', async (req, res) => {
  const streamerId = req.user.id;
  try {
    const channel = `streamer:${streamerId}:events`;
    await pubClient.publish(channel, JSON.stringify({ event: 'ALERT_SKIP' }));
    res.json({ success: true, message: 'Alert skipped on OBS overlay' });
  } catch (error) {
    console.error('Skip alert error:', error);
    res.status(500).json({ error: 'Failed to skip alert' });
  }
});

// Toggle TTS mute on connected OBS overlays
router.post('/mute-tts', async (req, res) => {
  const streamerId = req.user.id;
  try {
    const channel = `streamer:${streamerId}:events`;
    await pubClient.publish(channel, JSON.stringify({ event: 'TTS_MUTE_TOGGLE' }));
    res.json({ success: true, message: 'Toggled TTS mute' });
  } catch (error) {
    console.error('Mute TTS error:', error);
    res.status(500).json({ error: 'Failed to toggle TTS' });
  }
});

module.exports = router;

