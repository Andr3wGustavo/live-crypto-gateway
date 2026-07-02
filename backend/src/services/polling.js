const cron = require('node-cron');
const db = require('../db');
const { pubClient } = require('../redis');

/**
 * Fallback Polling Service
 * Periodically polls RPC endpoints for streamer wallets to catch
 * transactions that may have been missed due to dropped webhooks.
 * Runs every 2 minutes.
 */
function startPollingService() {
  console.log('Fallback Polling Service initialized (every 2 minutes)');

  cron.schedule('*/2 * * * *', async () => {
    console.log('[Polling] Running fallback transaction scan...');

    try {
      // Fetch all active streamer wallets
      const { rows: wallets } = await db.query(
        'SELECT w.streamer_id, w.chain_id, w.public_address FROM Wallets w'
      );

      if (wallets.length === 0) {
        console.log('[Polling] No wallets to poll');
        return;
      }

      for (const wallet of wallets) {
        try {
          await pollWalletTransactions(wallet);
        } catch (err) {
          console.error(`[Polling] Error polling wallet ${wallet.public_address}:`, err.message);
        }
      }

      console.log(`[Polling] Scan complete. Checked ${wallets.length} wallet(s).`);
    } catch (err) {
      console.error('[Polling] Fatal error in polling cycle:', err);
    }
  });
}

/**
 * Poll a single wallet address for recent transactions.
 * In production, this would query the RPC node or block explorer API
 * for recent incoming transactions and cross-reference with the DB.
 */
async function pollWalletTransactions(wallet) {
  // Mock: In production, use ethers.js to query recent blocks
  // const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  // const blockNumber = await provider.getBlockNumber();
  // Query recent blocks for transactions sent to wallet.public_address

  // For now, we check if there are any pending transactions in our DB
  // that might need status updates
  const { rows: pendingTxs } = await db.query(
    `SELECT tx_hash FROM Transactions 
     WHERE streamer_id = $1 AND status = 'PENDING'
     ORDER BY timestamp DESC LIMIT 10`,
    [wallet.streamer_id]
  );

  for (const tx of pendingTxs) {
    // Mock: In production, verify tx status on-chain
    // const receipt = await provider.getTransactionReceipt(tx.tx_hash);
    // if (receipt && receipt.status === 1 && receipt.blockNumber <= blockNumber - CONFIRMATIONS) {
    //   await db.query('UPDATE Transactions SET status = $1 WHERE tx_hash = $2', ['CONFIRMED', tx.tx_hash]);
    //   await pubClient.publish(channel, payload);
    // }

    console.log(`[Polling] Checked pending tx: ${tx.tx_hash} for streamer ${wallet.streamer_id}`);
  }
}

module.exports = { startPollingService };
