const express = require('express');
const db = require('../db');
const verifier = require('../services/chainVerifier');
const { paymentConfig } = require('../services/paymentConfig');
const { settleDonation } = require('../services/settlement');

const router = express.Router();

router.post('/verify', async (req, res, next) => {
  try {
    const { tx_hash, chain, streamer_id } = req.body;
    const id = Number(streamer_id);
    if (typeof tx_hash !== 'string' || tx_hash.length > 100 || typeof chain !== 'string' || !Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ error: 'Valid tx_hash, chain and streamer_id are required' });
    }
    const config = paymentConfig();
    if (!config.enabled) return res.status(503).json({ error: 'Payments are disabled. Preview mode never accepts funds.' });
    if (![config.evm.chainId, config.solana.chainId].includes(chain)) return res.status(422).json({ error: 'Unsupported network' });
    const wallets = await db.query('SELECT public_address FROM Wallets WHERE streamer_id = $1 AND (chain_id = $2 OR chain_id = $3)', [id, chain, chain]);
    if (!wallets.rows.length) return res.status(422).json({ error: 'Creator has no registered wallet for this network' });
    const result = await verifier.verifyTransaction({ tx_hash, chain, expected_recipient: wallets.rows[0].public_address });
    if (!result.verified || result.status !== 'CONFIRMED') {
      return res.status(result.status === 'PENDING' ? 202 : result.status === 'ERROR' ? 503 : 422)
        .json({ verified: false, status: result.status, error: result.message });
    }
    const settled = await settleDonation(id, result);
    if (!settled) return res.status(409).json({ error: 'Transaction already recorded', verified: true, status: 'ALREADY_RECORDED' });
    return res.json({ verified: true, status: 'CONFIRMED', alert_status: 'QUEUED', transaction: result });
  } catch (error) { next(error); }
});

// Legacy public bypasses cannot credit a ledger or emit fake donation events.
router.post(['/manual', '/simulate'], (req, res) => res.status(410).json({ error: 'Removed. Use authenticated /api/dashboard/test-alert for previews.' }));

// Provider-specific authentication, network binding and reconciliation must be
// validated before these ingestion paths are enabled. They never settle payloads.
router.post(['/crypto', '/solana'], (req, res) => res.status(503).json({ error: 'Indexer ingestion is not enabled. Submit the transaction to /verify.' }));

module.exports = router;
