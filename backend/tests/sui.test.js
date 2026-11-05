process.env.NODE_ENV = 'test';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { secp256k1 } = require('@noble/curves/secp256k1');
const {
  PERSONAL_MESSAGE_INTENT,
  blake2b256,
  deriveSuiAddress,
  normalizeSuiAddress,
  signInMessage,
  verifySuiSignature
} = require('../src/services/suiAuth');
const { normalizePayoutAddress } = require('../src/services/payoutAddress');
const { paymentConfig, publicConfig } = require('../src/services/paymentConfig');

const origin = 'http://localhost:3000';
const nonce = 'abcdefgh12345678';

function digestFor(message) {
  return blake2b256(Buffer.concat([PERSONAL_MESSAGE_INTENT, Buffer.from(message, 'utf8')]));
}

function ed25519Fixture() {
  const keys = crypto.generateKeyPairSync('ed25519');
  const publicKey = keys.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32);
  const address = deriveSuiAddress(publicKey, 'ed25519');
  const sign = message => Buffer.concat([
    Buffer.from([0]),
    crypto.sign(null, digestFor(message), keys.privateKey),
    publicKey
  ]).toString('base64');
  return { address, publicKey, keys, sign };
}

function secp256k1Fixture() {
  const privateKey = secp256k1.utils.randomPrivateKey();
  const publicKey = secp256k1.getPublicKey(privateKey, true);
  const address = deriveSuiAddress(publicKey, 'secp256k1');
  const sign = message => Buffer.concat([
    Buffer.from([1]),
    secp256k1.sign(digestFor(message), privateKey).toCompactRawBytes(),
    publicKey
  ]).toString('base64');
  return { address, publicKey, privateKey, sign };
}

test('Sui address derivation and normalisation follow the 32-byte scheme', () => {
  const fixture = ed25519Fixture();
  assert.match(fixture.address, /^0x[0-9a-f]{64}$/);
  assert.equal(normalizeSuiAddress(` ${fixture.address.toUpperCase().replace('0X', '0x')} `), fixture.address);
  for (const invalid of ['0x2', '0x', fixture.address.slice(0, -2), `${fixture.address}00`, '0x' + 'z'.repeat(64), 42, null]) {
    assert.throws(() => normalizeSuiAddress(invalid), /Invalid Sui address/);
  }
  // The scheme byte changes the derived address for the same public key.
  assert.notEqual(deriveSuiAddress(fixture.publicKey, 'ed25519'), deriveSuiAddress(fixture.publicKey, 'secp256k1'));
});

test('Sui ed25519 sign-in verifies origin, address, nonce and exact message', () => {
  const fixture = ed25519Fixture();
  const message = signInMessage(fixture.address, nonce, origin);
  const signature = fixture.sign(message);
  assert.equal(verifySuiSignature({ address: fixture.address, nonce, message, signature }, origin), true);
  assert.equal(verifySuiSignature({ address: fixture.address.toUpperCase().replace('0X', '0x'), nonce, message, signature }, origin), true);
  assert.equal(verifySuiSignature({ address: fixture.address, nonce, message: `${message}!`, signature }, origin), false);
  assert.equal(verifySuiSignature({ address: fixture.address, nonce, message, signature }, 'http://evil.example'), false);
  assert.equal(verifySuiSignature({ address: fixture.address, nonce: 'other-nonce-123', message, signature }, origin), false);
});

test('Sui verifier rejects tampering, wrong keys and malformed signatures', () => {
  const fixture = ed25519Fixture();
  const message = signInMessage(fixture.address, nonce, origin);
  const bytes = Buffer.from(fixture.sign(message), 'base64');
  const tampered = Buffer.from(bytes);
  tampered[5] ^= 0xff;
  assert.equal(verifySuiSignature({ address: fixture.address, nonce, message, signature: tampered.toString('base64') }, origin), false);

  const attacker = ed25519Fixture();
  assert.equal(verifySuiSignature({ address: fixture.address, nonce, message, signature: attacker.sign(message) }, origin), false);

  for (const signature of [
    bytes.subarray(0, bytes.length - 1).toString('base64'),
    Buffer.from([7, ...bytes.subarray(1)]).toString('base64'),
    'not-base64!!',
    '',
    null
  ]) {
    assert.equal(verifySuiSignature({ address: fixture.address, nonce, message, signature }, origin), false);
  }
});

test('Sui secp256k1 signatures are verified with the compressed key', () => {
  const fixture = secp256k1Fixture();
  const message = signInMessage(fixture.address, nonce, origin);
  const signature = fixture.sign(message);
  assert.equal(verifySuiSignature({ address: fixture.address, nonce, message, signature }, origin), true);
  assert.equal(verifySuiSignature({ address: fixture.address, nonce, message: `${message}!`, signature }, origin), false);
});

test('Sui payout accepts canonical addresses and rejects reserved or malformed ones', () => {
  const treasury = '0x' + 'ab'.repeat(32);
  const config = {
    evm: { chainId: '80002', router: '0x3333333333333333333333333333333333333333' },
    solana: { chainId: 'solana-devnet', treasury: '' },
    sui: { chainId: 'sui-testnet', treasury }
  };
  const valid = '0x' + '12'.repeat(32);
  assert.equal(normalizePayoutAddress('sui-testnet', ` ${valid.toUpperCase().replace('0X', '0x')} `, config), valid);
  for (const invalid of ['0x' + '0'.repeat(64), treasury, '0x2', '0x' + '1'.repeat(63), `0x${'1'.repeat(65)}`, 12]) {
    assert.throws(() => normalizePayoutAddress('sui-testnet', invalid, config));
  }
  assert.throws(() => normalizePayoutAddress('sui', valid, config), /Rede não configurada/);
});

test('the Sui rail stays disabled until treasury and Move package exist', () => {
  const keys = ['SUI_NETWORK', 'SUI_TREASURY_ADDRESS', 'SUI_PACKAGE_ID', 'DONATIONS_ENABLED', 'DEV_MEMORY_MODE', 'SUI_PUBLIC_RPC_URL'];
  const original = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    delete process.env.SUI_NETWORK;
    delete process.env.SUI_TREASURY_ADDRESS;
    delete process.env.SUI_PACKAGE_ID;
    delete process.env.SUI_PUBLIC_RPC_URL;
    process.env.DONATIONS_ENABLED = 'true';
    process.env.DEV_MEMORY_MODE = 'false';
    let config = paymentConfig();
    assert.equal(config.sui.chainId, 'sui-testnet');
    assert.equal(config.sui.enabled, false);

    const treasury = '0x' + '11'.repeat(32);
    process.env.SUI_TREASURY_ADDRESS = treasury;
    config = paymentConfig();
    assert.equal(config.sui.enabled, false, 'a treasury alone must not enable checkout');

    process.env.SUI_PACKAGE_ID = '0x' + '22'.repeat(32);
    config = paymentConfig();
    assert.equal(config.sui.enabled, true);
    const publicSui = publicConfig().networks.find(network => network.chainId === 'sui-testnet');
    assert.equal(publicSui.enabled, true);
    assert.equal(publicSui.explorer, 'https://suiscan.xyz/testnet/tx/');
    assert.equal('rpc' in publicSui, false);
    assert.equal(publicConfig().capabilities.sui, true);

    process.env.SUI_NETWORK = 'mainnet';
    config = paymentConfig();
    assert.equal(config.sui.chainId, 'sui');
    assert.equal(config.sui.testnet, false);
    assert.equal(publicConfig().networks.at(-1).chainId, 'sui');
  } finally {
    for (const key of keys) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  }
});
