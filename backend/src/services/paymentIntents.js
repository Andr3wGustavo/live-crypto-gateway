const crypto = require('node:crypto');
const { ethers } = require('ethers');
const axios = require('axios');
const db = require('../db');
const { paymentConfig } = require('./paymentConfig');
const { normalizePayoutAddress } = require('./payoutAddress');
const { decodePublicKey } = require('./solanaAuth');
const { ChainVerifier, routerInterface } = require('./chainVerifier');
const { settleDonation } = require('./settlement');

const hashToken = value => crypto.createHash('sha256').update(value).digest('hex');
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
function fail(status, code) { const error = new Error(code); error.status = status; throw error; }
function base58(bytes) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let value = BigInt(`0x${bytes.toString('hex')}`), text = '';
  while (value) { text = alphabet[Number(value % 58n)] + text; value /= 58n; }
  for (const byte of bytes) { if (byte) break; text = '1' + text; }
  return text;
}
function provider(url) { const request = new ethers.FetchRequest(url); request.timeout = 10000; return new ethers.JsonRpcProvider(request); }
async function solRpc(url, method, params) {
  const { data } = await axios.post(url, { jsonrpc: '2.0', id: 1, method, params }, { timeout: 10000 });
  if (data.error) throw new Error('SOLANA_RPC_ERROR');
  return data.result;
}
function expose(row) {
  return { id: row.id, chain: row.chain_id, recipient: row.recipient_address, sender: row.sender_address,
    amount: String(row.gross_amount).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, ''), currency: row.currency,
    memo: row.memo, reference: row.reference_address, router: row.router_address, treasury: row.treasury_address,
    feeBps: row.fee_bps, status: row.status, hash: row.tx_hash, expiresAt: row.expires_at, error: row.last_error };
}
async function createIntent({ streamer_id, chain, sender, amount }) {
  const config = paymentConfig();
  if (db.isMemory || !config.enabled) fail(503, 'PAYMENTS_DISABLED');
  const rail = [config.evm, config.solana].find(rail => rail.chainId === chain && rail.enabled);
  if (!rail || !Number.isSafeInteger(Number(streamer_id)) || Number(streamer_id) < 1) fail(422, 'INVALID_CREATOR_OR_NETWORK');
  const evm = rail === config.evm;
  const decimals = evm ? 18 : 9;
  if (typeof amount !== 'string' || amount.length > 80 || !/^\d+(\.\d+)?$/.test(amount) || (amount.split('.')[1]?.length || 0) > decimals) fail(422, 'INVALID_AMOUNT');
  const raw = ethers.parseUnits(amount, decimals);
  if (raw <= 0n || raw >= 2n ** 256n || (!evm && raw > BigInt(Number.MAX_SAFE_INTEGER))) fail(422, 'INVALID_AMOUNT');
  try { sender = evm ? ethers.getAddress(sender) : (decodePublicKey(sender), sender); }
  catch { fail(422, 'INVALID_SENDER'); }
  const { rows } = await db.query('SELECT public_address FROM Wallets WHERE streamer_id=$1 AND chain_id=$2', [streamer_id, chain]);
  if (!rows.length) fail(422, 'MISSING_PAYOUT');
  let recipient;
  try { recipient = normalizePayoutAddress(chain, rows[0].public_address, config); }
  catch { fail(422, 'INVALID_PAYOUT'); }
  let block = null;
  if (evm) {
    const rpc = provider(rail.rpc);
    try {
      if ((await rpc.getNetwork()).chainId !== BigInt(chain)) fail(503, 'RPC_NETWORK_MISMATCH');
      const router = new ethers.Contract(rail.router, ['function feePercentage() view returns(uint256)', 'function paused() view returns(bool)', 'function platformTreasury() view returns(address)'], rpc);
      if (await router.paused() || Number(await router.feePercentage()) !== config.feeBps || (await router.platformTreasury()).toLowerCase() !== rail.treasury.toLowerCase()) fail(503, 'ROUTER_NOT_READY');
      block = await rpc.getBlockNumber();
    } finally { rpc.destroy(); }
  } else if (await solRpc(rail.rpc, 'getGenesisHash', []) !== rail.genesisHash) fail(503, 'RPC_NETWORK_MISMATCH');
  const id = crypto.randomUUID();
  const token = crypto.randomBytes(32).toString('hex');
  const reference = evm ? null : base58(crypto.randomBytes(32));
  const { rows: created } = await db.query(`INSERT INTO Payment_Intents
    (id,access_hash,streamer_id,chain_id,sender_address,recipient_address,gross_amount,currency,memo,reference_address,router_address,treasury_address,fee_bps,confirmations,scan_block)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
  [id,hashToken(token),streamer_id,chain,sender,recipient,ethers.formatUnits(raw, decimals),rail.currency,`lc:${id}`,reference,rail.router || null,rail.treasury || null,config.feeBps,config.confirmations,block]);
  return { ...expose(created[0]), accessToken: token };
}
async function getIntent(id, token) {
  if (!uuid(id) || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) fail(404, 'INTENT_NOT_FOUND');
  const { rows } = await db.query('SELECT * FROM Payment_Intents WHERE id=$1 AND access_hash=$2', [id, hashToken(token)]);
  if (!rows.length) fail(404, 'INTENT_NOT_FOUND');
  return rows[0];
}
async function submitHash(id, token, hash) {
  const intent = await getIntent(id, token);
  const valid = intent.chain_id.startsWith('solana') ? /^[1-9A-HJ-NP-Za-km-z]{80,90}$/ : /^0x[0-9a-fA-F]{64}$/;
  if (typeof hash !== 'string' || !valid.test(hash)) fail(422, 'INVALID_TRANSACTION_HASH');
  if (intent.status === 'CONFIRMED') return expose(intent);
  if (!intent.chain_id.startsWith('solana')) hash = hash.toLowerCase();
  const { rows } = await db.query(`UPDATE Payment_Intents SET tx_hash=$2,status='SUBMITTED',next_attempt_at=NOW(),monitor_until=GREATEST(monitor_until,NOW()+INTERVAL '1 day')
    WHERE id=$1 AND status <> 'CONFIRMED' RETURNING *`, [id, hash]);
  return expose(rows[0] || await getIntent(id, token));
}

async function reconcileIntent(intent, dependencies = {}) {
  const config = paymentConfig();
  const evm = !intent.chain_id.startsWith('solana');
  const rail = evm ? config.evm : config.solana;
  if (rail.chainId !== intent.chain_id) throw new Error('RESTORE_NETWORK_CONFIG');
  // Continue settlement when new payments are disabled. Configuration and
  // destination are snapshotted at creation; a wallet edit cannot redirect it.
  const snapshot = { ...config, enabled: true, feeBps: intent.fee_bps, confirmations: intent.confirmations,
    evm: { ...config.evm, enabled: true, router: intent.router_address || config.evm.router, treasury: evm ? intent.treasury_address : config.evm.treasury },
    solana: { ...config.solana, enabled: true, treasury: intent.treasury_address || config.solana.treasury } };
  const verifier = dependencies.verifier || new ChainVerifier({ config: () => snapshot });
  const verify = async (hash, discovered = false) => {
    const payment = await verifier.verifyTransaction({ tx_hash: hash, chain: intent.chain_id, expected_recipient: intent.recipient_address,
      expected_sender: intent.sender_address, expected_memo: intent.memo, expected_amount: intent.gross_amount, expected_reference: intent.reference_address });
    if (payment.verified) {
      const settled = await settleDonation(intent.streamer_id, payment, intent.id);
      if (!settled) {
        const { rows } = await db.query('SELECT status FROM Payment_Intents WHERE id=$1', [intent.id]);
        if (rows[0]?.status !== 'CONFIRMED') throw new Error('SETTLEMENT_CONFLICT');
      }
      return true;
    }
    if (discovered && ['ERROR','PENDING','DISABLED'].includes(payment.status)) throw new Error('VERIFICATION_RETRY');
    await db.query('UPDATE Payment_Intents SET last_error=$2 WHERE id=$1', [intent.id, payment.status]);
    return false;
  };
  if (intent.tx_hash && await verify(intent.tx_hash)) return;
  if (evm) {
    const rpc = dependencies.provider || provider(rail.rpc);
    try {
      if ((await rpc.getNetwork()).chainId !== BigInt(intent.chain_id)) throw new Error('RPC_NETWORK_MISMATCH');
      const last = await rpc.getBlockNumber() - intent.confirmations + 1;
      const from = Number(intent.scan_block);
      if (from > last) return;
      const to = Math.min(from + 499, last);
      const logs = await rpc.getLogs({ address: intent.router_address, fromBlock: from, toBlock: to,
        topics: [routerInterface.getEvent('DonationRouted').topicHash, ethers.zeroPadValue(intent.sender_address,32), ethers.zeroPadValue(intent.recipient_address,32)] });
      for (const log of logs) {
        const parsed = routerInterface.parseLog(log);
        if (parsed?.args.memo === intent.memo && await verify(log.transactionHash, true)) return;
      }
      await db.query('UPDATE Payment_Intents SET scan_block=$2 WHERE id=$1', [intent.id, to + 1]);
    } finally { if (!dependencies.provider) rpc.destroy(); }
  } else {
    const signatures = await solRpc(rail.rpc, 'getSignaturesForAddress', [intent.reference_address, { commitment: 'finalized', limit: 50, ...(intent.scan_before ? { before: intent.scan_before } : {}) }]);
    for (const row of signatures) if (!row.err && await verify(row.signature, true)) return;
    await db.query('UPDATE Payment_Intents SET scan_before=$2 WHERE id=$1', [intent.id, signatures.length === 50 ? signatures.at(-1).signature : null]);
  }
}

function startReconciliationWorker() {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const { rows } = await db.query(`UPDATE Payment_Intents SET locked_until=NOW()+INTERVAL '120 seconds',attempts=attempts+1
        WHERE id IN (SELECT id FROM Payment_Intents WHERE status <> 'CONFIRMED' AND monitor_until>NOW() AND next_attempt_at<=NOW()
          AND (locked_until IS NULL OR locked_until<NOW()) ORDER BY next_attempt_at LIMIT 5 FOR UPDATE SKIP LOCKED) RETURNING *`);
      await Promise.all(rows.map(async intent => {
        try { await reconcileIntent(intent); }
        catch { await db.query("UPDATE Payment_Intents SET last_error='RPC_RETRY' WHERE id=$1", [intent.id]); }
        finally {
          await db.query(`UPDATE Payment_Intents SET locked_until=NULL,next_attempt_at=NOW()+INTERVAL '15 seconds',
            status=CASE WHEN status='CREATED' AND expires_at<NOW() THEN 'EXPIRED' ELSE status END WHERE id=$1`, [intent.id]);
        }
      }));
    } catch (error) { console.error('[Reconciliation] Retry scheduled:', error.message); }
    finally { running = false; }
  };
  const timer = setInterval(tick, 3000); timer.unref();
  return () => clearInterval(timer);
}
module.exports = { createIntent, getIntent, submitHash, expose, reconcileIntent, startReconciliationWorker, hashToken };
