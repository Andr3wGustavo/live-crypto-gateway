const cron = require('node-cron');
const db = require('../db');
const { pubClient } = require('../redis');
const chainVerifier = require('./chainVerifier');
const logger = require('../utils/logger');

/**
 * Universal Multi-Chain Fallback Polling Service
 * Periodically scans for PENDING transactions and verifies them against the respective blockchains.
 * Runs every 2 minutes.
 */
function startPollingService() {
  logger.info('Universal Multi-Chain Polling Service initialized (interval: 2 mins)');

  cron.schedule('*/2 * * * *', async () => {
    logger.info('[Polling] Running on-chain transaction verification cycle...');

    try {
      // 1. Fetch pending transactions from DB
      const { rows: pendingTxs } = await db.query(
        `SELECT id, tx_hash, streamer_id, sender_address, amount, currency, timestamp 
         FROM Transactions 
         WHERE status = 'PENDING' 
         ORDER BY timestamp ASC 
         LIMIT 20`
      );

      if (pendingTxs.length === 0) {
        return;
      }

      logger.info(`[Polling] Found ${pendingTxs.length} pending transaction(s) to verify.`);

      for (const tx of pendingTxs) {
        try {
          // Fetch streamer's wallet address for recipient validation
          const walletRes = await db.query(
            'SELECT public_address FROM Wallets WHERE streamer_id = $1 AND (chain_id = $2 OR chain_id = $3)',
            [tx.streamer_id, tx.currency.toLowerCase(), tx.currency]
          );

          const expectedRecipient = walletRes.rows[0]?.public_address || null;

          // Verify transaction on-chain
          const verification = await chainVerifier.verifyTransaction({
            tx_hash: tx.tx_hash,
            chain: tx.currency,
            expected_recipient: expectedRecipient
          });

          if (verification.verified && verification.status === 'CONFIRMED') {
            // Update DB status to CONFIRMED
            await db.query(
              `UPDATE Transactions SET status = 'CONFIRMED' WHERE id = $1`,
              [tx.id]
            );

            // Fetch streamer alert configs
            const alertRes = await db.query(
              'SELECT media_url, audio_url FROM Alert_Configs WHERE streamer_id = $1',
              [tx.streamer_id]
            );
            const alertConfig = alertRes.rows[0] || {};

            // Publish alert to OBS overlay
            const channel = `streamer:${tx.streamer_id}:events`;
            const payload = JSON.stringify({
              event: 'DONATION',
              amount: verification.amount || parseFloat(tx.amount),
              currency: verification.currency || tx.currency,
              sender: tx.sender_address,
              media_url: alertConfig.media_url || null,
              audio_url: alertConfig.audio_url || null,
              tx_hash: tx.tx_hash,
              chain: verification.chain,
              timestamp: new Date().toISOString()
            });

            await pubClient.publish(channel, payload);
            logger.info(`[Polling] Transaction ${tx.tx_hash} confirmed on-chain and dispatched to OBS!`);
          } else if (verification.status === 'FAILED') {
            // Reverted on-chain
            await db.query(
              `UPDATE Transactions SET status = 'FAILED' WHERE id = $1`,
              [tx.id]
            );
            logger.warn(`[Polling] Transaction ${tx.tx_hash} marked as FAILED (reverted on-chain).`);
          }
        } catch (err) {
          logger.warn(`[Polling] Error verifying pending tx ${tx.tx_hash}:`, err.message);
        }
      }
    } catch (err) {
      logger.error('[Polling] Fatal error in polling service cycle:', err);
    }
  });
}

module.exports = { startPollingService };
