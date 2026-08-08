const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/public/streamer/:id
// Public endpoint for retrieval of streamer donation wallets and config
router.get('/streamer/:id', async (req, res) => {
  const streamerId = req.params.id;

  try {
    // 1. Get main streamer record
    const streamerRes = await db.query(
      'SELECT id, public_address FROM Streamers WHERE id = $1',
      [streamerId]
    );

    if (streamerRes.rows.length === 0) {
      return res.status(404).json({ error: 'Streamer not found' });
    }

    const streamer = streamerRes.rows[0];

    // 2. Get registered payout wallets
    const walletsRes = await db.query(
      'SELECT chain_id, public_address FROM Wallets WHERE streamer_id = $1',
      [streamerId]
    );

    // 3. Get overlay configurations (alert, theme, goal configs)
    const alertConfigRes = await db.query(
      `SELECT min_amount, media_url, audio_url, active_theme, goal_amount, goal_current, goal_title 
       FROM Alert_Configs 
       WHERE streamer_id = $1`,
      [streamerId]
    );

    // Default configuration if not configured yet
    const alertConfig = alertConfigRes.rows[0] || {
      min_amount: '0.00000000',
      media_url: null,
      audio_url: null,
      active_theme: 'cyberpunk',
      goal_amount: '0.00000000',
      goal_current: '0.00000000',
      goal_title: 'Donation Goal'
    };

    res.json({
      public_address: streamer.public_address,
      wallets: walletsRes.rows,
      alertConfig: alertConfig
    });

  } catch (error) {
    console.error('Error fetching public streamer config:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
