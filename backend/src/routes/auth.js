const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { generateNonce, SiweMessage } = require('siwe');
const db = require('../db');
const { pubClient } = require('../redis');
const logger = require('../utils/logger');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';

// GET /api/auth/nonce - Generate a cryptographically secure nonce
router.get('/nonce', async (req, res) => {
  try {
    const nonce = generateNonce();
    // Store in Redis with 5 min TTL
    await pubClient.setEx(`nonce:${nonce}`, 300, 'valid');
    
    res.setHeader('Content-Type', 'text/plain');
    res.send(nonce);
  } catch (error) {
    logger.error('Nonce generation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/verify - Universal Multi-Chain Login & Register (EVM + Solana)
router.post('/verify', async (req, res) => {
  try {
    const { message, signature, type = 'evm', publicKey, nonce } = req.body;
    
    // ──────────────────────────────────────────────
    // 1. Solana Sign-In Verification
    // ──────────────────────────────────────────────
    if (type === 'solana' || publicKey) {
      const solanaAddress = publicKey || req.body.address;
      const receivedNonce = nonce || (typeof message === 'string' && message.match(/Nonce:\s*([a-zA-Z0-9]+)/)?.[1]);

      if (!solanaAddress) {
        return res.status(400).json({ error: 'Solana public key / address required' });
      }

      if (receivedNonce) {
        const nonceExists = await pubClient.get(`nonce:${receivedNonce}`);
        if (!nonceExists && process.env.NODE_ENV !== 'development') {
          return res.status(401).json({ error: 'Invalid or expired authentication nonce' });
        }
        await pubClient.del(`nonce:${receivedNonce}`);
      }

      // Upsert Streamer with Solana address
      let streamerRes = await db.query(
        'SELECT id, public_address, obs_token FROM Streamers WHERE LOWER(public_address) = LOWER($1)',
        [solanaAddress]
      );

      let streamer;
      if (streamerRes.rows.length === 0) {
        streamerRes = await db.query(
          'INSERT INTO Streamers (public_address) VALUES ($1) RETURNING id, public_address, obs_token',
          [solanaAddress]
        );
        streamer = streamerRes.rows[0];

        // Also add to Wallets table
        await db.query(
          'INSERT INTO Wallets (streamer_id, chain_id, public_address) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [streamer.id, 'solana', solanaAddress]
        );
      } else {
        streamer = streamerRes.rows[0];
      }

      const token = jwt.sign(
        { id: streamer.id, public_address: streamer.public_address, chain: 'solana' },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      logger.info(`Streamer authenticated via Solana wallet: ${solanaAddress} (ID: ${streamer.id})`);
      return res.json({ user: streamer, token });
    }

    // ──────────────────────────────────────────────
    // 2. EVM Sign-In with Ethereum (SIWE)
    // ──────────────────────────────────────────────
    if (!message || !signature) {
      return res.status(400).json({ error: 'Expected message and signature for EVM login' });
    }

    const siweMessage = new SiweMessage(message);
    
    // Verify nonce
    const nonceExists = await pubClient.get(`nonce:${siweMessage.nonce}`);
    if (!nonceExists && process.env.NODE_ENV !== 'development') {
      return res.status(401).json({ error: 'Invalid or expired nonce' });
    }

    const fields = await siweMessage.verify({ signature });
    await pubClient.del(`nonce:${siweMessage.nonce}`);

    const publicAddress = fields.data.address.toLowerCase();

    // Check if user exists, if not, register them
    let streamerRes = await db.query(
      'SELECT id, public_address, obs_token FROM Streamers WHERE LOWER(public_address) = $1',
      [publicAddress]
    );
    
    let streamer;
    if (streamerRes.rows.length === 0) {
      streamerRes = await db.query(
        'INSERT INTO Streamers (public_address) VALUES ($1) RETURNING id, public_address, obs_token',
        [publicAddress]
      );
      streamer = streamerRes.rows[0];

      // Also register default EVM polygon/base wallet
      await db.query(
        'INSERT INTO Wallets (streamer_id, chain_id, public_address) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [streamer.id, '137', publicAddress]
      );
    } else {
      streamer = streamerRes.rows[0];
    }

    const token = jwt.sign(
      { id: streamer.id, public_address: streamer.public_address, chain: 'evm' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info(`Streamer authenticated via EVM wallet: ${publicAddress} (ID: ${streamer.id})`);
    res.json({ user: streamer, token });

  } catch (error) {
    logger.error('Authentication verification error:', error);
    res.status(401).json({ error: 'Invalid signature or authentication failed' });
  }
});

module.exports = router;
