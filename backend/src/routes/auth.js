const express = require('express');
const jwt = require('jsonwebtoken');
const { generateNonce, SiweMessage } = require('siwe');
const db = require('../db');
const { pubClient } = require('../redis'); // using pubClient for general redis commands

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

// GET /api/auth/nonce - Generate a nonce for SIWE
router.get('/nonce', async (req, res) => {
  try {
    const nonce = generateNonce();
    // We can tie the nonce to the IP address or simply return it and expect the client to use it.
    // For a simple implementation without sessions, we store it in Redis with a 5 min expiration
    // Keyed by a random session id, or we just trust the SIWE verification if we store valid nonces
    
    // To make it robust, we will store valid nonces in a Redis Set or just as a key
    await pubClient.setEx(`nonce:${nonce}`, 300, 'valid'); // 5 minutes TTL
    
    res.setHeader('Content-Type', 'text/plain');
    res.send(nonce);
  } catch (error) {
    console.error('Nonce generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/verify - Verify SIWE signature and login/register
router.post('/verify', async (req, res) => {
  try {
    const { message, signature } = req.body;
    
    if (!message || !signature) {
      return res.status(400).json({ error: 'Expected message and signature' });
    }

    const siweMessage = new SiweMessage(message);
    
    // Verify the nonce exists in Redis
    const nonceExists = await pubClient.get(`nonce:${siweMessage.nonce}`);
    if (!nonceExists) {
      return res.status(401).json({ error: 'Invalid or expired nonce' });
    }

    // Verify the signature
    const fields = await siweMessage.verify({ signature });
    
    // Delete the nonce so it can't be reused
    await pubClient.del(`nonce:${siweMessage.nonce}`);

    const publicAddress = fields.data.address.toLowerCase();

    // Check if user exists, if not, register them
    let streamerRes = await db.query('SELECT id, public_address, obs_token FROM Streamers WHERE public_address = $1', [publicAddress]);
    
    let streamer;
    if (streamerRes.rows.length === 0) {
      // Register
      streamerRes = await db.query(
        'INSERT INTO Streamers (public_address) VALUES ($1) RETURNING id, public_address, obs_token',
        [publicAddress]
      );
    }
    
    streamer = streamerRes.rows[0];

    // Create JWT token
    const token = jwt.sign({ id: streamer.id, public_address: streamer.public_address }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ user: streamer, token });
  } catch (error) {
    console.error('SIWE Verification error:', error);
    res.status(401).json({ error: 'Invalid signature or authentication failed' });
  }
});

module.exports = router;
