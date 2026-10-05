const express = require('express');
const { generateNonce, SiweMessage } = require('siwe');
const db = require('../db');
const { pubClient } = require('../redis');
const logger = require('../utils/logger');
const { verifySolanaSignature } = require('../services/solanaAuth');
const { paymentConfig } = require('../services/paymentConfig');
const { createSession, revokeSession } = require('../services/sessions');

const router = express.Router();
router.get('/session', require('../middleware/auth'), (req,res) => res.json({ user: { id:req.user.id,public_address:req.user.public_address } }));
router.post('/logout', revokeSession);

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

      if (!verifySolanaSignature({ publicKey: solanaAddress, nonce: receivedNonce, message, signature }, process.env.FRONTEND_URL || 'http://localhost:3000')) {
        return res.status(401).json({ error: 'Invalid Solana signature or sign-in message' });
      }
      if (!await pubClient.getDel(`nonce:${receivedNonce}`)) {
        return res.status(401).json({ error: 'Invalid or expired authentication nonce' });
      }

      // Upsert Streamer with Solana address
      let streamerRes = await db.query(
        'SELECT id, public_address, obs_token FROM Streamers WHERE public_address = $1',
        [solanaAddress]
      );

      let streamer;
      if (streamerRes.rows.length === 0) {
        streamerRes = await db.query(
          'INSERT INTO Streamers (public_address) VALUES ($1) RETURNING id, public_address, obs_token',
          [solanaAddress]
        );
        streamer = streamerRes.rows[0];

      } else {
        streamer = streamerRes.rows[0];
      }

      // Returning accounts may predate the configured cluster. Preserve any
      // deliberately selected payout rather than overwriting it on login.
      await db.query(
        'INSERT INTO Wallets (streamer_id, chain_id, public_address) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [streamer.id, paymentConfig().solana.chainId, solanaAddress]
      );

      logger.info(`Streamer authenticated via Solana wallet: ${solanaAddress} (ID: ${streamer.id})`);
      return await createSession(res, streamer, 'solana');
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
    if (!nonceExists) {
      return res.status(401).json({ error: 'Invalid or expired nonce' });
    }

    const origin = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
    if (siweMessage.uri !== origin.origin) return res.status(401).json({ error: 'Invalid sign-in origin' });
    const fields = await siweMessage.verify({ signature, domain: origin.host, nonce: siweMessage.nonce });
    if (!fields.success || !await pubClient.getDel(`nonce:${siweMessage.nonce}`)) {
      return res.status(401).json({ error: 'Invalid or already used nonce' });
    }

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

    } else {
      streamer = streamerRes.rows[0];
    }

    await db.query(
      'INSERT INTO Wallets (streamer_id, chain_id, public_address) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [streamer.id, paymentConfig().evm.chainId, publicAddress]
    );

    logger.info(`Streamer authenticated via EVM wallet: ${publicAddress} (ID: ${streamer.id})`);
    return await createSession(res, streamer, 'evm');

  } catch (error) {
    logger.error('Authentication verification error:', error);
    res.status(401).json({ error: 'Invalid signature or authentication failed' });
  }
});

module.exports = router;
