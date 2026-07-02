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

  if (!signature) {
    console.warn('Webhook received without signature header');
    return res.status(401).json({ error: 'Missing webhook signature' });
  }

  // Compute HMAC-SHA256 of the raw body
  const rawBody = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    console.warn('Webhook signature mismatch - rejecting payload');
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  next();
}

// Webhook endpoint for Router Smart Contract events
// Protected by HMAC signature validation
router.post('/crypto', validateWebhookSignature, async (req, res) => {
  const { tx_hash, streamer_id, sender_address, amount, currency } = req.body;

  if (!tx_hash || !streamer_id || !sender_address || !amount || !currency) {
    return res.status(400).json({ error: 'Missing required payload fields' });
  }

  try {
    // Insert into Transactions table
    await db.query(
      `INSERT INTO Transactions (tx_hash, streamer_id, sender_address, amount, currency, status)
       VALUES ($1, $2, $3, $4, $5, 'CONFIRMED')
       ON CONFLICT (tx_hash) DO NOTHING`,
      [tx_hash, streamer_id, sender_address, amount, currency]
    );

    // Publish to Redis channel for WebSocket dispatch
    const channel = `streamer:${streamer_id}:events`;
    const payload = JSON.stringify({
      event: "DONATION",
      amount: parseFloat(amount),
      currency: currency,
      sender: sender_address,
      message: req.body.message || ""
    });

    await pubClient.publish(channel, payload);
    console.log(`Dispatched DONATION event for streamer ${streamer_id}`);

    res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
