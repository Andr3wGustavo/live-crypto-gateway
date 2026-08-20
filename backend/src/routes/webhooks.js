const express = require('express');
const crypto = require('crypto');
const db = require('../db');
const { pubClient } = require('../redis');

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
 * Alchemy sends decoded logs when monitoring a contract address.
 * We look for DonationRouted events from the LiveCryptoRouter contract.
 *
 * DonationRouted(address indexed sender, address indexed streamer, uint256 amount, uint256 fee, uint256 netAmount, address token)
 * Topic0: keccak256 of the event signature
 */
const DONATION_ROUTED_TOPIC = '0x' + crypto
  .createHash('sha256') // placeholder — in production use keccak256
  .update('DonationRouted(address,address,uint256,uint256,uint256,address)')
  .digest('hex');

function parseAlchemyPayload(body) {
  const results = [];

  // Alchemy ADDRESS_ACTIVITY webhook structure
  const activities = body.event?.activity || [];

  for (const activity of activities) {
    // For contract interaction logs
    if (activity.log && activity.log.topics && activity.log.topics.length >= 3) {
      const topics = activity.log.topics;
      const data = activity.log.data;

      // Decode indexed params from topics
      const senderAddress = '0x' + topics[1].slice(26); // address is right-padded in 32 bytes
      const streamerAddress = '0x' + topics[2].slice(26);

      // Decode non-indexed params from data (amount, fee, netAmount, token)
      // Each param is 32 bytes (64 hex chars)
      const dataHex = data.startsWith('0x') ? data.slice(2) : data;
      const amount = BigInt('0x' + dataHex.slice(0, 64));
      const fee = BigInt('0x' + dataHex.slice(64, 128));
      const netAmount = BigInt('0x' + dataHex.slice(128, 192));
      const tokenAddress = '0x' + dataHex.slice(192 + 24, 256); // address from last 20 bytes of 32-byte word

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

    // Fallback: simple native transfer (no log, just value transfer)
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
 * Helius Enhanced Transactions include token transfers and SOL transfers.
 */
function parseHeliusPayload(body) {
  const results = [];

  // Helius sends an array of enhanced transactions
  const transactions = Array.isArray(body) ? body : [body];

  for (const tx of transactions) {
    if (!tx.signature) continue;

    // Check for native SOL transfers
    if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
      for (const transfer of tx.nativeTransfers) {
        results.push({
          tx_hash: tx.signature,
          sender_address: transfer.fromUserAccount || '',
          streamer_address: transfer.toUserAccount || '',
          amount: transfer.amount?.toString() || '0', // in lamports
          fee: '0',
          net_amount: transfer.amount?.toString() || '0',
          token_address: 'SOL',
          is_native: true,
          block_number: tx.slot,
        });
      }
    }

    // Check for SPL token transfers
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
// Webhook endpoint for EVM (Alchemy)
// Protected by HMAC signature validation
// ──────────────────────────────────────────────
router.post('/crypto', validateWebhookSignature, async (req, res) => {
  try {
    const donations = parseAlchemyPayload(req.body);

    if (donations.length === 0) {
      return res.json({ success: true, message: 'No donation events found in payload' });
    }

    for (const donation of donations) {
      // Look up streamer by their wallet address
      const streamerResult = await db.query(
        `SELECT s.id FROM Streamers s
         INNER JOIN Wallets w ON w.streamer_id = s.id
         WHERE LOWER(w.public_address) = $1
         LIMIT 1`,
        [donation.streamer_address]
      );

      if (streamerResult.rows.length === 0) {
        console.warn(`No streamer found for address ${donation.streamer_address}`);
        continue;
      }

      const streamer_id = streamerResult.rows[0].id;

      // Determine currency
      const currency = donation.is_native ? 'NATIVE' : donation.token_address;

      // Insert into Transactions table with PENDING status
      // (will be confirmed after N block confirmations)
      await db.query(
        `INSERT INTO Transactions (tx_hash, streamer_id, sender_address, amount, currency, status)
         VALUES ($1, $2, $3, $4, $5, 'PENDING')
         ON CONFLICT (tx_hash) DO NOTHING`,
        [donation.tx_hash, streamer_id, donation.sender_address, donation.net_amount, currency]
      );

      // Publish to Redis channel for WebSocket dispatch (real-time OBS alert)
      const channel = `streamer:${streamer_id}:events`;
      const payload = JSON.stringify({
        event: "DONATION",
        amount: donation.net_amount,
        fee: donation.fee,
        currency: currency,
        sender: donation.sender_address,
        token: donation.token_address,
        tx_hash: donation.tx_hash,
        message: req.body.message || ""
      });

      await pubClient.publish(channel, payload);
      console.log(`Dispatched DONATION event for streamer ${streamer_id} | tx: ${donation.tx_hash}`);
    }

    res.json({ success: true, message: `Processed ${donations.length} donation(s)` });
  } catch (error) {
    console.error('Webhook error:', error);
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
      // Look up streamer by their Solana wallet address
      const streamerResult = await db.query(
        `SELECT s.id FROM Streamers s
         INNER JOIN Wallets w ON w.streamer_id = s.id
         WHERE LOWER(w.public_address) = LOWER($1)
         LIMIT 1`,
        [donation.streamer_address]
      );

      if (streamerResult.rows.length === 0) {
        console.warn(`No streamer found for Solana address ${donation.streamer_address}`);
        continue;
      }

      const streamer_id = streamerResult.rows[0].id;
      const currency = donation.is_native ? 'SOL' : donation.token_address;

      await db.query(
        `INSERT INTO Transactions (tx_hash, streamer_id, sender_address, amount, currency, status)
         VALUES ($1, $2, $3, $4, $5, 'PENDING')
         ON CONFLICT (tx_hash) DO NOTHING`,
        [donation.tx_hash, streamer_id, donation.sender_address, donation.net_amount, currency]
      );

      const channel = `streamer:${streamer_id}:events`;
      const payload = JSON.stringify({
        event: "DONATION",
        amount: donation.net_amount,
        currency: currency,
        sender: donation.sender_address,
        token: donation.token_address,
        tx_hash: donation.tx_hash,
        message: ""
      });

      await pubClient.publish(channel, payload);
      console.log(`Dispatched Solana DONATION event for streamer ${streamer_id} | tx: ${donation.tx_hash}`);
    }

    res.json({ success: true, message: `Processed ${donations.length} Solana donation(s)` });
  } catch (error) {
    console.error('Solana webhook error:', error);
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

    // Insert into Transactions table with CONFIRMED status
    await db.query(
      `INSERT INTO Transactions (tx_hash, streamer_id, sender_address, amount, currency, status)
       VALUES ($1, $2, $3, $4, $5, 'CONFIRMED')
       ON CONFLICT (tx_hash) DO NOTHING`,
      [tx_hash, streamer_id, senderName, amount.toString(), currency]
    );

    // Fetch streamer alert configs for custom audio/media
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
    console.log(`[Simulate] Dispatched simulated DONATION event for streamer ${streamer_id} | ${amount} ${currency}`);

    res.json({ success: true, message: 'Simulation processed and dispatched to OBS' });
  } catch (error) {
    console.error('Simulation webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ──────────────────────────────────────────────
// Legacy/fallback manual webhook (backward compatible)
// ──────────────────────────────────────────────
router.post('/manual', async (req, res) => {
  const { tx_hash, streamer_id, sender_address, amount, currency } = req.body;

  if (!tx_hash || !streamer_id || !sender_address || !amount || !currency) {
    return res.status(400).json({ error: 'Missing required payload fields' });
  }

  try {
    await db.query(
      `INSERT INTO Transactions (tx_hash, streamer_id, sender_address, amount, currency, status)
       VALUES ($1, $2, $3, $4, $5, 'CONFIRMED')
       ON CONFLICT (tx_hash) DO NOTHING`,
      [tx_hash, streamer_id, sender_address, amount, currency]
    );

    const channel = `streamer:${streamer_id}:events`;
    const payload = JSON.stringify({
      event: "DONATION",
      amount: parseFloat(amount),
      currency: currency,
      sender: sender_address,
      message: req.body.message || ""
    });

    await pubClient.publish(channel, payload);
    console.log(`Dispatched manual DONATION event for streamer ${streamer_id}`);

    res.json({ success: true, message: 'Manual webhook processed' });
  } catch (error) {
    console.error('Manual webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

