process.env.NODE_ENV = 'test';
process.env.DEV_MEMORY_MODE = 'true';
process.env.DONATIONS_ENABLED = 'false';
process.env.FRONTEND_URL = 'http://localhost:3000';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { once } = require('node:events');
const { Wallet } = require('ethers');
const { SiweMessage } = require('siwe');
const { app } = require('../src/server');
const { signInMessage } = require('../src/services/solanaAuth');
const { MemoryRedisStore } = require('../src/redis');
const { ChainVerifier, routerInterface } = require('../src/services/chainVerifier');
const db = require('../src/db');

let server, base;
before(async () => { server = app.listen(0, '127.0.0.1'); await once(server, 'listening'); base = `http://127.0.0.1:${server.address().port}`; });
after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await db.close(); });
const post = (route, body) => fetch(`${base}${route}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const nonce = async () => (await fetch(`${base}/api/auth/nonce`)).text();

test('real HTTP health identifies preview storage, never claims PostgreSQL connectivity', async () => {
  const res = await fetch(`${base}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'preview');
  assert.equal(data.services.database, 'memory-preview');
});
test('public profile route loads and does not leak OBS credentials', async () => {
  const response = await fetch(`${base}/api/public/streamer/1`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).obs_token, undefined);
  assert.equal((await fetch(`${base}/api/public/streamer/999999`)).status, 404);
});
test('memory wallet lookup cannot fall back to a different chain', async () => {
  const result = await db.query('SELECT public_address FROM Wallets WHERE streamer_id = $1 AND (chain_id = $2 OR chain_id = $3)', [1, 'unknown', 'unknown']);
  assert.equal(result.rows.length, 0);
});
test('simulation and manual endpoints cannot emit or record donations', async () => {
  for (const route of ['manual', 'simulate']) assert.equal((await post(`/api/webhooks/${route}`, { amount: 999, streamer_id: 1 })).status, 410);
});
test('preview checkout rejects even a simulated hash; provider payloads cannot credit the ledger', async () => {
  assert.equal((await post('/api/webhooks/verify', { tx_hash: '0x...simulated', streamer_id: 1, chain: '80002' })).status, 503);
  assert.equal((await post('/api/webhooks/crypto', { amount: 999 })).status, 503);
  assert.equal((await post('/api/webhooks/verify', { tx_hash: {}, chain: [], streamer_id: -1 })).status, 400);
});
test('paid TTS route exists before any profile request and defaults to local speech', async () => {
  const response = await post('/api/public/tts-synthesize', { text: 'Hello' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).mode, 'web_speech_fallback');
});
test('Solana login rejects unsigned account impersonation', async () => {
  assert.equal((await post('/api/auth/verify', { type: 'solana', publicKey: '11111111111111111111111111111111' })).status, 401);
});

function base58(bytes) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let value = BigInt(`0x${bytes.toString('hex')}`), result = '';
  while (value) { result = alphabet[Number(value % 58n)] + result; value /= 58n; }
  for (const byte of bytes) { if (byte !== 0) break; result = '1' + result; }
  return result;
}

test('real Ed25519 signature authenticates, preserves address case, rejects tampering and replay', async () => {
  const keys = crypto.generateKeyPairSync('ed25519');
  const publicKey = base58(keys.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32));
  const challenge = await nonce();
  const message = signInMessage(publicKey, challenge, process.env.FRONTEND_URL);
  const signature = crypto.sign(null, Buffer.from(message), keys.privateKey).toString('hex');
  const payload = { type: 'solana', publicKey, nonce: challenge, message, signature };
  assert.equal((await post('/api/auth/verify', { ...payload, message: `${message}!` })).status, 401);
  const success = await post('/api/auth/verify', payload);
  assert.equal(success.status, 200);
  assert.equal((await success.json()).user.public_address, publicKey);
  assert.equal((await post('/api/auth/verify', payload)).status, 401);
});
test('SIWE verifies a real signature, origin and a single-use nonce', async () => {
  const wallet = Wallet.createRandom();
  const message = new SiweMessage({ domain: 'localhost:3000', address: wallet.address, uri: process.env.FRONTEND_URL, version: '1', chainId: 1, nonce: await nonce() }).prepareMessage();
  const payload = { message, signature: await wallet.signMessage(message) };
  assert.equal((await post('/api/auth/verify', payload)).status, 200);
  assert.equal((await post('/api/auth/verify', payload)).status, 401);
});
test('nonce consumption is atomic under concurrency', async () => {
  const store = new MemoryRedisStore();
  await store.setEx('nonce', 60, 'valid');
  assert.deepEqual(await Promise.all([store.getDel('nonce'), store.getDel('nonce')]), ['valid', null]);
  await store.setEx('expired', -1, 'valid');
  assert.equal(await store.getDel('expired'), null);
});

const sender = '0x1111111111111111111111111111111111111111';
const recipient = '0x2222222222222222222222222222222222222222';
const router = '0x3333333333333333333333333333333333333333';
const zero = '0x0000000000000000000000000000000000000000';
const hash = `0x${'a'.repeat(64)}`;
const config = { enabled: true, feeBps: 200, confirmations: 3,
  evm: { enabled: true, chainId: '80002', router, currency: 'POL', rpc: 'mock' },
  solana: { enabled: true, chainId: 'solana-devnet', treasury: '11111111111111111111111111111111', rpc: 'mock' } };
function fixture({ address = router, to = recipient, fee = 20000000000000000n, token = zero, status = 1, block = 98, chain = 80002n } = {}) {
  const event = routerInterface.encodeEventLog(routerInterface.getEvent('DonationRouted'), [sender, to, 1000000000000000000n, fee, 1000000000000000000n - fee, token, '']);
  return new ChainVerifier({ config: () => config, providerFactory: () => ({
    getNetwork: async () => ({ chainId: chain }), getBlockNumber: async () => 100,
    getTransactionReceipt: async () => ({ status, to: router, blockNumber: block, logs: [{ address, ...event }] })
  }) });
}
const verifyEvm = engine => engine.verifyTransaction({ tx_hash: hash, chain: '80002', expected_recipient: recipient });
test('EVM verifies configured router, network, confirmations, recipient and fee using exact decimals', async () => {
  const result = await verifyEvm(fixture());
  assert.equal(result.verified, true);
  assert.equal(result.amount, '0.98');
  assert.equal(result.fee, '0.02');
});
for (const [name, changes, expected] of [
  ['forged router event', { address: sender }, 'MISMATCH'],
  ['wrong recipient even for router event', { to: sender }, 'MISMATCH'],
  ['wrong platform fee', { fee: 0n }, 'MISMATCH'],
  ['unapproved token', { token: sender }, 'UNSUPPORTED'],
  ['reverted transaction', { status: 0 }, 'FAILED'],
  ['insufficient confirmations', { block: 100 }, 'PENDING'],
  ['wrong RPC network', { chain: 137n }, 'ERROR']
]) test(`EVM rejects ${name}`, async () => assert.equal((await verifyEvm(fixture(changes))).status, expected));
test('unknown chains never default to Polygon and invalid hashes never reach RPC', async () => {
  const engine = fixture();
  assert.equal((await engine.verifyTransaction({ tx_hash: hash, chain: 'doge', expected_recipient: recipient })).status, 'UNSUPPORTED');
  assert.equal((await engine.verifyTransaction({ tx_hash: 'simulated', chain: '80002', expected_recipient: recipient })).status, 'INVALID');
});

const solRecipient = 'So11111111111111111111111111111111111111112';
const solSender = 'Vote111111111111111111111111111111111111111';
const transfer = (destination, lamports) => ({ programId: '11111111111111111111111111111111', parsed: { type: 'transfer', info: { source: solSender, destination, lamports } } });
function solFixture(instructions, meta = { err: null }) {
  return new ChainVerifier({ config: () => config, rpc: { post: async () => ({ data: { result: {
    meta, slot: 123, transaction: { message: { accountKeys: [{ signer: true, pubkey: solSender }], instructions } }
  } } }) } });
}
const verifySol = engine => engine.verifyTransaction({ tx_hash: '2'.repeat(88), chain: 'solana-devnet', expected_recipient: solRecipient });
test('Solana chooses the recipient transfer after the treasury instruction and verifies split', async () => {
  const result = await verifySol(solFixture([transfer(config.solana.treasury, 20000000), transfer(solRecipient, 980000000)]));
  assert.equal(result.verified, true);
  assert.equal(result.amount, '0.98');
});
test('Solana rejects missing transfer, missing fee and failed execution', async () => {
  assert.equal((await verifySol(solFixture([]))).verified, false);
  assert.equal((await verifySol(solFixture([transfer(solRecipient, 1000000000)]))).verified, false);
  assert.equal((await verifySol(solFixture([], { err: { InstructionError: [0, 'error'] } }))).status, 'FAILED');
});
