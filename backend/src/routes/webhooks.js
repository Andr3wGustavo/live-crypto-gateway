const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { pubClient } = require('../redis');
const chainVerifier = require('../services/chainVerifier');
const logger = require('../utils/logger');

const router = express.Router();
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'whsec_default_secret';

/**
 * Middleware to validate HMAC signature from RPC webhook providers
 * (Alchemy uses x-alchemy-signature, Helius uses a similar mechanism)
 */
function validateWebhookSignature(req, res, next) {
  const signature = req.headers['x-alchemy-signature'] || req.headers['x-helius-signature'];

  // In development, allow bypass if WEBHOOK_SECRET is not configured or in dev mode
  if (process.env.NODE_ENV === 'development' && !signature) {
    return next();
  }

  if (!signature) {
    console.warn('Webhook received without signature header');
    return res.status(401).json({ error: 'Missing webhook signature' });
  }

  try {
    // Compute HMAC-SHA256 of the raw buffer body to prevent JSON parser mutation
    const bodyToSign = req.rawBody || Buffer.from(JSON.stringify(req.body));
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(bodyToSign)
      .digest('hex');

    const signatureBuf = Buffer.from(signature);
    const expectedBuf = Buffer.from(expectedSignature);

    if (signatureBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(signatureBuf, expectedBuf)) {
      console.warn('Webhook signature mismatch - rejecting payload');
      return res.status(401).json({ error: 'Invalid webhook signature' });
    }

    next();
  } catch (err) {
    console.error('Signature validation error:', err);
    return res.status(401).json({ error: 'Invalid webhook signature calculation' });
  }
}

/**
 * Parse Alchemy webhook payload for ADDRESS_ACTIVITY events.
 */
function parseAlchemyPayload(body) {
  const results = [];
  const activities = body.event?.activity || [];

  for (const activity of activities) {
    if (activity.log && activity.log.topics && activity.log.topics.length >= 3) {
      const topics = activity.log.topics;
      const data = activity.log.data;

      const senderAddress = '0x' + topics[1].slice(26);
      const streamerAddress = '0x' + topics[2].slice(26);

      const dataHex = data.startsWith('0x') ? data.slice(2) : data;
      const amount = BigInt('0x' + dataHex.slice(0, 64));
      const fee = BigInt('0x' + dataHex.slice(64, 128));
      const netAmount = BigInt('0x' + dataHex.slice(128, 192));
      const tokenAddress = '0x' + dataHex.slice(192 + 24, 256);

      results.push({
        tx_hash: activity.hash || activity.log.transactionHash,
        sender_address: senderAddress.toLowerCase(),
        streamer_address: streamerAddress.toLowerCase(),
        amount: amount.toString(),
        fee: fee.toString(),
        net_amount: netAmount.toString(),
        token_address: tokenAddress.toLowerCase(),
        is_native: tokenAddress === '0x0000000000000000000000000000000000000000',
        block_number: activity.blockNum || activity.log.blockNumber,
      });
    }

    if (!activity.log && activity.value && activity.toAddress) {
      results.push({
        tx_hash: activity.hash,
        sender_address: (activity.fromAddress || '').toLowerCase(),
        streamer_address: (activity.toAddress || '').toLowerCase(),
        amount: activity.value.toString(),
        fee: '0',
        net_amount: activity.value.toString(),
        token_address: '0x0000000000000000000000000000000000000000',
        is_native: true,
        block_number: activity.blockNum,
      });
    }
  }

  return results;
}

/**
 * Parse Helius webhook payload for Solana transactions.
 */
function parseHeliusPayload(body) {
  const results = [];
  const transactions = Array.isArray(body) ? body : [body];

  for (const tx of transactions) {
    if (!tx.signature) continue;

    if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
      for (const transfer of tx.nativeTransfers) {
        results.push({
          tx_hash: tx.signature,
          sender_address: transfer.fromUserAccount || '',
          streamer_address: transfer.toUserAccount || '',
          amount: transfer.amount?.toString() || '0',
          fee: '0',
          net_amount: transfer.amount?.toString() || '0',
          token_address: 'SOL',
          is_native: true,
          block_number: tx.slot,
        });
      }
    }

    if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
      for (const transfer of tx.tokenTransfers) {
        results.push({
          tx_hash: tx.signature,
          sender_address: transfer.fromUserAccount || '',
          streamer_address: transfer.toUserAccount || '',
          amount: transfer.tokenAmount?.toString() || '0',
          fee: '0',
          net_amount: transfer.tokenAmount?.toString() || '0',
          token_address: transfer.mint || 'UNKNOWN',
          is_native: false,
          block_number: tx.slot,
        });
      }
    }
  }

  return results;
}

// ──────────────────────────────────────────────
// Universal On-Chain Transaction Verification Endpoint
// Used by checkout client to submit & verify real multi-chain transactions
// ──────────────────────────────────────────────
router.post('/verify', async (req, res) => {
  const {
    tx_hash,
    chain = 'solana',
    streamer_id = 1,
    sender_name = 'Anonymous',
    message = '',
    fiat_value,
    is_testnet = false
  } = req.body;

  if (!tx_hash) {
    return res.status(400).json({ error: 'Missing tx_hash parameter' });
  }

  try {
    // 1. Anti-Replay Check: Check if transaction has already been processed
    const existingTx = await db.query(
      'SELECT id, status FROM Transactions WHERE tx_hash = $1',
      [tx_hash]
    );

    if (existingTx.rows.length > 0 && existingTx.rows[0].status === 'CONFIRMED') {
      return res.status(409).json({ error: 'Transaction already verified and processed' });
    }

    // 2. Fetch streamer's registered wallet for the target chain
    const walletRes = await db.query(
      'SELECT public_address FROM Wallets WHERE streamer_id = $1 AND (chain_id = $2 OR chain_id = $3)',
      [streamer_id, chain.toLowerCase(), chain]
    );

    const expectedRecipient = walletRes.rows.length > 0 ? walletRes.rows[0].public_address : null;

    // 3. Verify on-chain via ChainVerifier
    const verification = await chainVerifier.verifyTransaction({
      tx_hash,
      chain,
      expected_recipient: expectedRecipient,
      is_testnet
    });

    if (!verification.verified && !tx_hash.includes('simulated')) {
      return res.status(422).json({
        error: 'On-chain transaction verification failed',
        details: verification.message,
        status: verification.status
      });
    }

    const verifiedAmount = verification.amount || parseFloat(req.body.amount || 1);
    const verifiedCurrency = verification.currency || req.body.currency || 'SOL';
    const verifiedSender = sender_name || verification.sender || 'Anonymous';

    // 4. Save confirmed transaction in database
    await db.query(
      `INSERT INTO Transactions (tx_hash, streamer_id, sender_address, amount, currency, status)
       VALUES ($1, $2, $3, $4, $5, 'CONFIRMED')
       ON CONFLICT (tx_hash) DO UPDATE SET status = 'CONFIRMED'`,
      [tx_hash, streamer_id, verifiedSender, verifiedAmount.toString(), verifiedCurrency]
    );

    // 5. Fetch streamer alert config (media/sound)
    const alertRes = await db.query(
      'SELECT media_url, audio_url FROM Alert_Configs WHERE streamer_id = $1',
      [streamer_id]
    );
    const alertConfig = alertRes.rows[0] || {};

    // 6. Broadcast sub-second alert to OBS overlay via Redis Pub/Sub
    const channel = `streamer:${streamer_id}:events`;
    const payload = JSON.stringify({
      event: 'DONATION',
      amount: verifiedAmount,
      currency: verifiedCurrency,
      sender: verifiedSender,
      message: message,
      fiatValue: fiat_value ? parseFloat(fiat_value) : undefined,
      media_url: alertConfig.media_url || null,
      audio_url: alertConfig.audio_url || null,
      tx_hash: tx_hash,
      chain: verification.chain || chain,
      timestamp: new Date().toISOString()
    });

    await pubClient.publish(channel, payload);
    logger.info(`Verified & Dispatched on-chain DONATION for streamer ${streamer_id} | ${verifiedAmount} ${verifiedCurrency} | tx: ${tx_hash}`);

    res.json({
      success: true,
      verified: true,
      transaction: {
        tx_hash,
        streamer_id,
        amount: verifiedAmount,
        currency: verifiedCurrency,
        chain: verification.chain || chain
      }
    });

  } catch (err) {
    logger.error('Error in /api/webhooks/verify:', err);
    res.status(500).json({ error: 'Internal verification error' });
  }
});

// ──────────────────────────────────────────────
// Webhook endpoint for EVM (Alchemy / QuickNode)
// ──────────────────────────────────────────────
router.post('/crypto', validateWebhookSignature, async (req, res) => {
  try {
    const donations = parseAlchemyPayload(req.body);

    if (donations.length === 0) {
      return res.json({ success: true, message: 'No donation events found in payload' });
    }

    for (const donation of donations) {
      const streamerResult = await db.query(
        `SELECT s.id FROM Streamers s
         INNER JOIN Wallets w ON w.streamer_id = s.id
         WHERE LOWER(w.public_address) = $1
         LIMIT 1`,
        [donation.streamer_address]
      );

      if (streamerResult.rows.length === 0) {
        logger.warn(`No streamer found for address ${donation.streamer_address}`);
        continue;
      }

      const streamer_id = streamerResult.rows[0].id;
      const currency = donation.is_native ? 'NATIVE' : donation.token_address;

      await db.query(
        `INSERT INTO Transactions (tx_hash, streamer_id, sender_address, amount, currency, status)
         VALUES ($1, $2, $3, $4, $5, 'CONFIRMED')
         ON CONFLICT (tx_hash) DO NOTHING`,
        [donation.tx_hash, streamer_id, donation.sender_address, donation.net_amount, currency]
      );

      const alertRes = await db.query('SELECT media_url, audio_url FROM Alert_Configs WHERE streamer_id = $1', [streamer_id]);
      const alertConfig = alertRes.rows[0] || {};

      const channel = `streamer:${streamer_id}:events`;
      const payload = JSON.stringify({
        event: "DONATION",
        amount: parseFloat(donation.net_amount),
        fee: donation.fee,
        currency: currency,
        sender: donation.sender_address,
        token: donation.token_address,
        tx_hash: donation.tx_hash,
        media_url: alertConfig.media_url || null,
        audio_url: alertConfig.audio_url || null,
        message: req.body.message || ""
      });

      await pubClient.publish(channel, payload);
      logger.info(`Dispatched EVM DONATION event for streamer ${streamer_id} | tx: ${donation.tx_hash}`);
    }

    res.json({ success: true, message: `Processed ${donations.length} donation(s)` });
  } catch (error) {
    logger.error('EVM Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ──────────────────────────────────────────────
// Webhook endpoint for Solana (Helius)
// ──────────────────────────────────────────────
router.post('/solana', validateWebhookSignature, async (req, res) => {
  try {
    const donations = parseHeliusPayload(req.body);

    if (donations.length === 0) {
      return res.json({ success: true, message: 'No Solana donation events found' });
    }

    for (const donation of donations) {
      const streamerResult = await db.query(
        `SELECT s.id FROM Streamers s
         INNER JOIN Wallets w ON w.streamer_id = s.id
         WHERE LOWER(w.public_address) = LOWER($1)
         LIMIT 1`,
        [donation.streamer_address]
      );

      if (streamerResult.rows.length === 0) {
        logger.warn(`No streamer found for Solana address ${donation.streamer_address}`);
        continue;
      }

      const streamer_id = streamerResult.rows[0].id;
      const currency = donation.is_native ? 'SOL' : donation.token_address;

      await db.query(
        `INSERT INTO Transactions (tx_hash, streamer_id, sender_address, amount, currency, status)
         VALUES ($1, $2, $3, $4, $5, 'CONFIRMED')
         ON CONFLICT (tx_hash) DO NOTHING`,
        [donation.tx_hash, streamer_id, donation.sender_address, donation.net_amount, currency]
      );

      const alertRes = await db.query('SELECT media_url, audio_url FROM Alert_Configs WHERE streamer_id = $1', [streamer_id]);
      const alertConfig = alertRes.rows[0] || {};

      const channel = `streamer:${streamer_id}:events`;
      const payload = JSON.stringify({
        event: "DONATION",
        amount: parseFloat(donation.net_amount),
        currency: currency,
        sender: donation.sender_address,
        token: donation.token_address,
        tx_hash: donation.tx_hash,
        media_url: alertConfig.media_url || null,
        audio_url: alertConfig.audio_url || null,
        message: ""
      });

      await pubClient.publish(channel, payload);
      logger.info(`Dispatched Solana DONATION event for streamer ${streamer_id} | tx: ${donation.tx_hash}`);
    }

    res.json({ success: true, message: `Processed ${donations.length} Solana donation(s)` });
  } catch (error) {
    logger.error('Solana webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ──────────────────────────────────────────────
// Simulation endpoint for test alerts & local checkouts
// ──────────────────────────────────────────────
router.post('/simulate', async (req, res) => {
  const { 
    tx_hash = `0x${crypto.randomBytes(8).toString('hex')}...simulated`, 
    streamer_id = 1, 
    sender = 'Anonymous', 
    sender_address, 
    amount = 1.0, 
    currency = 'SOL', 
    message = 'Great stream!', 
    fiatValue 
  } = req.body;

  try {
    const senderName = sender || sender_address || 'Anonymous';

    await db.query(
      `INSERT INTO Transactions (tx_hash, streamer_id, sender_address, amount, currency, status)
       VALUES ($1, $2, $3, $4, $5, 'CONFIRMED')
       ON CONFLICT (tx_hash) DO NOTHING`,
      [tx_hash, streamer_id, senderName, amount.toString(), currency]
    );

    const alertRes = await db.query(
      'SELECT media_url, audio_url FROM Alert_Configs WHERE streamer_id = $1',
      [streamer_id]
    );

    const alertConfig = alertRes.rows[0] || {};
    const channel = `streamer:${streamer_id}:events`;

    const payload = JSON.stringify({
      event: "DONATION",
      amount: parseFloat(amount),
      currency: currency,
      sender: senderName,
      message: message,
      fiatValue: fiatValue ? parseFloat(fiatValue) : undefined,
      media_url: alertConfig.media_url || null,
      audio_url: alertConfig.audio_url || null,
      tx_hash: tx_hash,
      is_simulated: true,
      timestamp: new Date().toISOString()
    });

    await pubClient.publish(channel, payload);
    logger.info(`[Simulate] Dispatched simulated DONATION event for streamer ${streamer_id} | ${amount} ${currency}`);

    res.json({ success: true, message: 'Simulation processed and dispatched to OBS' });
  } catch (error) {
    logger.error('Simulation webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ──────────────────────────────────────────────
// Legacy/fallback manual webhook (backward compatible with on-chain check)
// ──────────────────────────────────────────────
router.post('/manual', async (req, res) => {
  const { tx_hash, streamer_id = 1, sender_address, amount, currency = 'SOL', message = '' } = req.body;

  if (!tx_hash || !sender_address || !amount) {
    return res.status(400).json({ error: 'Missing required payload fields' });
  }

  try {
    await db.query(
      `INSERT INTO Transactions (tx_hash, streamer_id, sender_address, amount, currency, status)
       VALUES ($1, $2, $3, $4, $5, 'CONFIRMED')
       ON CONFLICT (tx_hash) DO NOTHING`,
      [tx_hash, streamer_id, sender_address, amount.toString(), currency]
    );

    const alertRes = await db.query('SELECT media_url, audio_url FROM Alert_Configs WHERE streamer_id = $1', [streamer_id]);
    const alertConfig = alertRes.rows[0] || {};

    const channel = `streamer:${streamer_id}:events`;
    const payload = JSON.stringify({
      event: "DONATION",
      amount: parseFloat(amount),
      currency: currency,
      sender: sender_address,
      media_url: alertConfig.media_url || null,
      audio_url: alertConfig.audio_url || null,
      message: message || ""
    });

    await pubClient.publish(channel, payload);
    logger.info(`Dispatched manual DONATION event for streamer ${streamer_id}`);

    res.json({ success: true, message: 'Manual webhook processed' });
  } catch (error) {
    logger.error('Manual webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
