const crypto = require('node:crypto');
const { blake2b } = require('@noble/hashes/blake2b');
const { secp256k1 } = require('@noble/curves/secp256k1');

// Sui serialises a signature as base64([scheme || signature || public key]).
// The scheme byte is part of the wire format, so the verifier never has to
// guess which curve produced the key.
const ED25519_FLAG = 0x00;
const SECP256K1_FLAG = 0x01;
const ED25519_SIGNATURE_LENGTH = 64;
const SECP256K1_SIGNATURE_LENGTH = 64;
const ED25519_PUBLIC_KEY_LENGTH = 32;
const SECP256K1_PUBLIC_KEY_LENGTH = 33;

// Sui signs  blake2b256([scope, version, appId] || message)  for personal
// messages. Scope 3 is PersonalMessage, version 0, application id 0.
const PERSONAL_MESSAGE_INTENT = Buffer.from([3, 0, 0]);
const SUI_ADDRESS_PATTERN = /^0x[0-9a-fA-F]{64}$/;

function normalizeSuiAddress(value) {
  if (typeof value !== 'string' || !SUI_ADDRESS_PATTERN.test(value.trim())) {
    throw new Error('Invalid Sui address');
  }
  return value.trim().toLowerCase();
}

function blake2b256(bytes) {
  return Buffer.from(blake2b(bytes, { dkLen: 32 }));
}

function deriveSuiAddress(publicKey, scheme) {
  const flag = scheme === 'secp256k1' ? SECP256K1_FLAG : ED25519_FLAG;
  return `0x${blake2b256(Buffer.concat([Buffer.from([flag]), publicKey])).toString('hex')}`;
}

function signInMessage(address, nonce, origin) {
  return `Sign in to Live Crypto Creator Portal\nOrigin: ${origin}\nSui Address: ${address}\nNonce: ${nonce}`;
}

function decodeSignature(signature) {
  if (typeof signature !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(signature)) return null;
  let bytes;
  try { bytes = Buffer.from(signature, 'base64'); } catch { return null; }
  if (!bytes.length) return null;
  const flag = bytes[0];
  if (flag === ED25519_FLAG) {
    if (bytes.length !== 1 + ED25519_SIGNATURE_LENGTH + ED25519_PUBLIC_KEY_LENGTH) return null;
    return {
      scheme: 'ed25519',
      signature: bytes.subarray(1, 1 + ED25519_SIGNATURE_LENGTH),
      publicKey: bytes.subarray(1 + ED25519_SIGNATURE_LENGTH)
    };
  }
  if (flag === SECP256K1_FLAG) {
    if (bytes.length !== 1 + SECP256K1_SIGNATURE_LENGTH + SECP256K1_PUBLIC_KEY_LENGTH) return null;
    return {
      scheme: 'secp256k1',
      signature: bytes.subarray(1, 1 + SECP256K1_SIGNATURE_LENGTH),
      publicKey: bytes.subarray(1 + SECP256K1_SIGNATURE_LENGTH)
    };
  }
  return null;
}

function verifyRawSignature({ scheme, signature, publicKey }, digest) {
  try {
    if (scheme === 'ed25519') {
      const key = crypto.createPublicKey({
        key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), publicKey]),
        format: 'der', type: 'spki'
      });
      return crypto.verify(null, digest, key, signature);
    }
    return secp256k1.verify(signature, digest, publicKey);
  } catch { return false; }
}

// Returns true only when the signature was produced by the key that owns the
// claimed address and the exact sign-in message (origin + nonce) was signed.
function verifySuiSignature({ address, nonce, message, signature }, origin) {
  if (typeof nonce !== 'string' || !/^[a-zA-Z0-9]{8,128}$/.test(nonce)) return false;
  if (typeof address !== 'string' || typeof message !== 'string') return false;
  let normalized;
  try { normalized = normalizeSuiAddress(address); } catch { return false; }
  if (message !== signInMessage(normalized, nonce, origin)) return false;
  const decoded = decodeSignature(signature);
  if (!decoded) return false;
  if (deriveSuiAddress(decoded.publicKey, decoded.scheme) !== normalized) return false;
  const digest = blake2b256(Buffer.concat([PERSONAL_MESSAGE_INTENT, Buffer.from(message, 'utf8')]));
  return verifyRawSignature(decoded, digest);
}

module.exports = {
  ED25519_FLAG,
  SECP256K1_FLAG,
  PERSONAL_MESSAGE_INTENT,
  blake2b256,
  decodeSignature,
  deriveSuiAddress,
  normalizeSuiAddress,
  signInMessage,
  verifySuiSignature
};
