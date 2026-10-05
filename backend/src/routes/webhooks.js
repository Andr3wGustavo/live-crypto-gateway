const express = require('express');
const { paymentConfig } = require('../services/paymentConfig');
const router = express.Router();

router.post('/verify', (req, res) => {
  const { tx_hash, chain, streamer_id } = req.body;
  if (typeof tx_hash !== 'string' || tx_hash.length > 100 || typeof chain !== 'string' || !Number.isSafeInteger(Number(streamer_id)) || Number(streamer_id) < 1) {
    return res.status(400).json({ error: 'Valid tx_hash, chain and streamer_id are required' });
  }
  if (!paymentConfig().enabled) return res.status(503).json({ error: 'Payments are disabled. Preview mode never accepts funds.' });
  // A public hash and caller-supplied creator ID do not prove attribution.
  return res.status(410).json({ error: 'Use /api/payments/intents. Direct hash settlement is retired.' });
});
router.post(['/manual', '/simulate'], (req,res) => res.status(410).json({ error: 'Use authenticated /api/dashboard/test-alert for previews.' }));
router.post(['/crypto', '/solana'], (req,res) => res.status(503).json({ error: 'Indexer ingestion is not enabled.' }));
module.exports = router;
