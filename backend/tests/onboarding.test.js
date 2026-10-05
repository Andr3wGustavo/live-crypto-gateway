process.env.NODE_ENV = 'test';
process.env.DEV_MEMORY_MODE = 'true';
process.env.DONATIONS_ENABLED = 'false';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.EVM_CHAIN_ID = '84532';
process.env.SOLANA_CLUSTER = 'devnet';
process.env.EVM_ROUTER_ADDRESS = '0x3333333333333333333333333333333333333333';
process.env.SOLANA_TREASURY_ADDRESS = 'So11111111111111111111111111111111111111112';

const { test, before, after, mock } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { Pool } = require('pg');
const { once } = require('node:events');
const { Wallet, ZeroAddress, getAddress } = require('ethers');
const { SiweMessage } = require('siwe');
const { app } = require('../src/server');
const { signInMessage } = require('../src/services/solanaAuth');
const db = require('../src/db');

let server, base, evmSession, solSession;
let admin, pool;
const schema = `onboarding_${crypto.randomBytes(8).toString('hex')}`;
const evmWallet = Wallet.createRandom();
const solKeys = crypto.generateKeyPairSync('ed25519');
function base58(bytes) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let value = BigInt(`0x${bytes.toString('hex')}`), result = '';
  while (value) { result = alphabet[Number(value % 58n)] + result; value /= 58n; }
  for (const byte of bytes) { if (byte !== 0) break; result = '1' + result; }
  return result;
}
const solAddress = base58(solKeys.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32));
const post = (route, body, token) => fetch(`${base}${route}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify(body)
});
const dashboard = async session => {
  const response = await fetch(`${base}/api/dashboard`, { headers: { Authorization: `Bearer ${session.token}` } });
  assert.equal(response.status, 200);
  return response.json();
};
async function login(type) {
  const nonce = await (await fetch(`${base}/api/auth/nonce`)).text();
  let payload;
  if (type === 'solana') {
    const message = signInMessage(solAddress, nonce, process.env.FRONTEND_URL);
    payload = { type, publicKey: solAddress, nonce, message, signature: crypto.sign(null, Buffer.from(message), solKeys.privateKey).toString('hex') };
  } else {
    const message = new SiweMessage({ domain: 'localhost:3000', address: evmWallet.address, uri: process.env.FRONTEND_URL, version: '1', chainId: 1, nonce }).prepareMessage();
    payload = { message, signature: await evmWallet.signMessage(message) };
  }
  const response = await post('/api/auth/verify', payload);
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  return { ...await response.json(), cookie: cookie.split(';')[0] };
}
before(async () => {
  // When available, exercise the same HTTP journey against isolated real
  // PostgreSQL tables. Redis nonces stay isolated in this process's test store.
  if (process.env.TEST_DATABASE_URL) {
    admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    await admin.query(`CREATE SCHEMA ${schema}`);
    pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema},public` });
    await pool.query(fs.readFileSync(path.join(__dirname, '../../db/init.sql'), 'utf8'));
    await pool.query(fs.readFileSync(path.join(__dirname, '../../db/migrations/002_payment_intents.sql'), 'utf8'));
    mock.method(db, 'query', (sql, values) => pool.query(sql, values));
  }
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  base = `http://127.0.0.1:${server.address().port}`;
  evmSession = await login('evm');
  solSession = await login('solana');
});
after(async () => {
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
  if (pool) await pool.end();
  if (admin) { await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); await admin.end(); }
  mock.restoreAll();
  await db.close();
});

test('signed onboarding uses configured networks and exposes the same safe config as checkout', async () => {
  const evm = await dashboard(evmSession);
  const sol = await dashboard(solSession);
  const config = await (await fetch(`${base}/api/public/payment-config`)).json();
  assert.deepEqual(evm.paymentConfig, config);
  assert.deepEqual(config.networks.map(network => network.chainId), ['84532', 'solana-devnet']);
  assert.ok(config.networks.every(network => !network.enabled && !('rpc' in network)));
  assert.deepEqual(evm.wallets.map(wallet => wallet.chain_id), ['84532']);
  assert.equal(evm.wallets[0].public_address.toLowerCase(), evmWallet.address.toLowerCase());
  assert.equal(sol.wallets[0].chain_id, 'solana-devnet');
  assert.equal(sol.wallets[0].public_address, solAddress);
});

test('wallet API rejects invalid, cross-network and reserved destinations without changing saved payouts', async () => {
  const original = (await dashboard(evmSession)).wallets;
  for (const [chain_id, public_address] of [
    ['137', evmWallet.address], ['sui', evmWallet.address], ['84532', solAddress],
    ['84532', ZeroAddress], ['84532', process.env.EVM_ROUTER_ADDRESS],
    ['84532', '0x52908400098527886E0F7030069857D2E4169Ee7'], // invalid mixed-case checksum
    ['84532', { address: evmWallet.address }], ['solana-devnet', evmWallet.address],
    ['solana-devnet', '2'.repeat(32)], ['solana-devnet', '11111111111111111111111111111111'],
    ['solana-devnet', process.env.SOLANA_TREASURY_ADDRESS]
  ]) {
    const response = await post('/api/dashboard/wallet', { chain_id, public_address }, evmSession.token);
    assert.equal(response.status, 422, `${chain_id}: ${JSON.stringify(public_address)}`);
    assert.ok((await response.json()).error);
  }
  assert.deepEqual((await dashboard(evmSession)).wallets, original);
  assert.equal((await post('/api/dashboard/wallet', { chain_id: '84532', public_address: evmWallet.address })).status, 401);
});

test('canonical EVM destination survives reload and returning login without overwriting the creator choice', async () => {
  const address = Wallet.createRandom().address;
  const response = await post('/api/dashboard/wallet', { chain_id: '84532', public_address: ` ${address.toLowerCase()} ` }, evmSession.token);
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).wallet, { chain_id: '84532', public_address: getAddress(address) });
  const session = await login('evm');
  assert.equal(session.user.id, evmSession.user.id);
  assert.equal((await dashboard(session)).wallets.find(wallet => wallet.chain_id === '84532').public_address, address);
  const profile = await (await fetch(`${base}/api/public/streamer/${session.user.id}`)).json();
  assert.equal(profile.wallets.find(wallet => wallet.chain_id === '84532').public_address, address);
});

test('Solana payout keeps exact case and returning login preserves it', async () => {
  const keys = crypto.generateKeyPairSync('ed25519');
  const address = base58(keys.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32));
  const response = await post('/api/dashboard/wallet', { chain_id: 'solana-devnet', public_address: ` ${address} ` }, solSession.token);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).wallet.public_address, address);
  assert.equal((await dashboard(await login('solana'))).wallets[0].public_address, address);
});

test('returning accounts acquire a missing configured network without deleting older destinations', async t => {
  const original = process.env.EVM_CHAIN_ID;
  t.after(() => { process.env.EVM_CHAIN_ID = original; });
  process.env.EVM_CHAIN_ID = '80002';
  const data = await dashboard(await login('evm'));
  assert.deepEqual(data.wallets.map(wallet => wallet.chain_id).sort(), ['80002', '84532']);
  assert.equal(data.wallets.find(wallet => wallet.chain_id === '80002').public_address, evmWallet.address.toLowerCase());
  assert.equal(data.paymentConfig.networks[0].chainId, '80002');
});

test('registered wallets persist across PostgreSQL connections and rerunning the existing migration', {
  skip: !process.env.TEST_DATABASE_URL && 'Set TEST_DATABASE_URL to verify persistent onboarding'
}, async () => {
  const migration = fs.readFileSync(path.join(__dirname, '../../db/migrations/001_donation_outbox.sql'), 'utf8');
  await pool.query(migration);
  await pool.query(migration);
  const reconnected = new Pool({ connectionString: process.env.TEST_DATABASE_URL, options: `-c search_path=${schema},public` });
  try {
    const { rows } = await reconnected.query('SELECT chain_id, public_address FROM Wallets WHERE streamer_id = $1 ORDER BY chain_id', [evmSession.user.id]);
    assert.deepEqual(rows.map(wallet => wallet.chain_id), ['80002', '84532']);
    const profile = await (await fetch(`${base}/api/public/streamer/${evmSession.user.id}`)).json();
    assert.deepEqual(rows, profile.wallets.sort((a, b) => a.chain_id.localeCompare(b.chain_id)));
    assert.equal((await reconnected.query('SELECT count(*) FROM Streamers')).rows[0].count, '2');
  } finally { await reconnected.end(); }
});

test('cookie sessions reject foreign-origin mutations and logout revokes both cookie and test bearer', async () => {
  const session = await login('evm');
  const getSession = () => fetch(`${base}/api/auth/session`, { headers: { cookie:session.cookie } });
  assert.equal((await getSession()).status,200);
  const foreign = await fetch(`${base}/api/auth/logout`, { method:'POST',headers:{ cookie:session.cookie,origin:'https://untrusted.example' } });
  assert.equal(foreign.status,403);
  assert.equal((await getSession()).status,200);
  const logout = await fetch(`${base}/api/auth/logout`, { method:'POST',headers:{cookie:session.cookie,origin:process.env.FRONTEND_URL} });
  assert.equal(logout.status,200);
  assert.equal((await getSession()).status,401);
  assert.equal((await fetch(`${base}/api/dashboard`, { headers: { Authorization:`Bearer ${session.token}` } })).status,401);
});
