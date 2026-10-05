const express = require('express');
const db = require('../db');
const { pubClient } = require('../redis');
const { paymentConfig, publicConfig } = require('../services/paymentConfig');
const { normalizePayoutAddress } = require('../services/payoutAddress');

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
      alertConfig: alertsRes.rows[0] || null,
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
router.post('/config', async (req, res) => {
  const streamerId = req.user.id;
  const { min_amount, active_theme, goal_amount, goal_current, goal_title, media_url, audio_url } = req.body;

  const choices = { active_theme:['cyberpunk','matrix','fire','minimal'],position:['top-left','top-right','center','bottom-center','bottom-right'],sound_preset:['arcade_coin','cyber_chime','cash_register','laser_beam'],voice_profile:['cyber_announcer','anime_kawaii','scifi_robot','natural_host'] };
  for (const [field,allowed] of Object.entries(choices)) if (req.body[field] !== undefined && !allowed.includes(req.body[field])) return res.status(422).json({ error:`Invalid ${field}` });
  for (const field of ['min_amount','goal_amount','goal_current']) if (req.body[field] !== undefined && (!/^\d+(\.\d{1,8})?$/.test(String(req.body[field])) || Number(req.body[field]) > 999999999)) return res.status(422).json({ error:`Invalid ${field}` });
  if (goal_title !== undefined && (typeof goal_title !== 'string' || goal_title.length>255)) return res.status(422).json({ error:'Invalid goal title' });
  for (const value of [media_url,audio_url]) if (value != null && (typeof value !== 'string' || value.length>2048 || !/^https:\/\//.test(value))) return res.status(422).json({ error:'Media URLs must use HTTPS' });

  try {
    const { rows } = await db.query(
      `INSERT INTO Alert_Configs (streamer_id, min_amount, active_theme, goal_amount, goal_current, goal_title, media_url, audio_url, position, sound_preset, voice_profile, show_leaderboard)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (streamer_id)
       DO UPDATE SET 
         min_amount = COALESCE(EXCLUDED.min_amount, Alert_Configs.min_amount),
         active_theme = COALESCE(EXCLUDED.active_theme, Alert_Configs.active_theme),
         goal_amount = COALESCE(EXCLUDED.goal_amount, Alert_Configs.goal_amount),
         goal_current = COALESCE(EXCLUDED.goal_current, Alert_Configs.goal_current),
         goal_title = COALESCE(EXCLUDED.goal_title, Alert_Configs.goal_title),
         media_url = COALESCE(EXCLUDED.media_url, Alert_Configs.media_url),
          audio_url = COALESCE(EXCLUDED.audio_url, Alert_Configs.audio_url),
          position = EXCLUDED.position, sound_preset = EXCLUDED.sound_preset,
          voice_profile = EXCLUDED.voice_profile, show_leaderboard = EXCLUDED.show_leaderboard
       RETURNING min_amount, active_theme, goal_amount, goal_current, goal_title, media_url, audio_url, position, sound_preset, voice_profile, show_leaderboard`,
      [
        streamerId, 
        min_amount || '0.0', 
        active_theme || 'cyberpunk', 
        goal_amount || '0.0', 
        goal_current || '0.0', 
        goal_title || 'Donation Goal',
        media_url || null,
        audio_url || null,
        req.body.position || 'bottom-center', req.body.sound_preset || 'arcade_coin',
        req.body.voice_profile || 'cyber_announcer', req.body.show_leaderboard !== false
      ]
    );

    // Publish CONFIG_UPDATE to Redis Pub/Sub so OBS overlay updates instantly
    const channel = `streamer:${streamerId}:events`;
    const payload = JSON.stringify({
      event: 'CONFIG_UPDATE',
      theme: active_theme || 'cyberpunk',
      goal_amount: parseFloat(goal_amount || '0.0'),
      goal_current: parseFloat(goal_current || '0.0'),
      goal_title: goal_title || 'Donation Goal',
      media_url: rows[0].media_url,
      audio_url: rows[0].audio_url,
      position: req.body.position || 'bottom-center',
      sound_preset: req.body.sound_preset || 'arcade_coin',
      voice_profile: req.body.voice_profile || 'cyber_announcer',
      show_leaderboard: req.body.show_leaderboard !== undefined ? req.body.show_leaderboard : true
    });
    
    await pubClient.publish(channel, payload);

    res.json({ 
      success: true, 
      config: {
        ...rows[0],
        position: req.body.position || 'bottom-center',
        sound_preset: req.body.sound_preset || 'arcade_coin',
        voice_profile: req.body.voice_profile || 'cyber_announcer',
        show_leaderboard: req.body.show_leaderboard !== undefined ? req.body.show_leaderboard : true
      } 
    });
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

// GET /api/dashboard/analytics - Aggregate analytics metrics for creator
router.get('/analytics', async (req, res) => {
  const streamerId = req.user.id;
  try {
    const txRes = await db.query(
      'SELECT amount, currency, status, timestamp FROM Transactions WHERE streamer_id = $1',
      [streamerId]
    );

    const transactions = txRes.rows.filter(tx => tx.status === 'CONFIRMED');
    const totalTransactions = transactions.length;

    // Aggregate by currency
    const tokenBreakdown = {};



    transactions.forEach(tx => {
      const amt = parseFloat(tx.amount) || 0;
      const curr = (tx.currency || 'USDC').toUpperCase();
      tokenBreakdown[curr] = (tokenBreakdown[curr] || 0) + amt;

    });

    res.json({
      totalTransactions,
      estimatedTotalUSD: null,
      tokenBreakdown,
      recentCount: transactions.slice(0, 7).length
    });
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

