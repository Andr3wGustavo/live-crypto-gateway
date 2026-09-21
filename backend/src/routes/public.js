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
    res.status(503).json({ error: 'Unable to load creator profile' });
  }
});

router.get('/payment-config', (req, res) => {
  res.json(require('../services/paymentConfig').publicConfig());
});

// POST /api/public/tts-synthesize - High-fidelity AI speech synthesis using ElevenLabs API (with fallback)
router.post('/tts-synthesize', async (req, res) => {
  const { text, voice_id = '21m00Tcm4TlvDq8ikWAM' } = req.body;
  
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text string is required for TTS synthesis' });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  // Paid synthesis needs authenticated quotas before public access is enabled.
  if (!apiKey || process.env.PUBLIC_TTS_ENABLED !== 'true') {
    return res.json({ 
      success: false, 
      mode: 'web_speech_fallback', 
      message: 'ElevenLabs API key not configured. Using client Web Speech engine.' 
    });
  }

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: text.substring(0, 250),
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn('[ElevenLabs] API error:', response.status, errText);
      return res.status(502).json({ error: 'ElevenLabs API synthesis error', details: errText });
    }

    const audioBuffer = await response.arrayBuffer();
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.byteLength,
      'Cache-Control': 'public, max-age=3600'
    });
    return res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error('TTS synthesis server error:', error);
    res.status(500).json({ error: 'Internal TTS processing error' });
  }
});

module.exports = router;
