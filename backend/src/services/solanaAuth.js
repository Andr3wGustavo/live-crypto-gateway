const crypto = require('node:crypto');
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function decodePublicKey(value) {
  if (typeof value !== 'string' || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) throw new Error('Invalid public key');
  let n = 0n;
  for (const char of value) n = n * 58n + BigInt(alphabet.indexOf(char));
  const bytes = [];
  while (n > 0n) { bytes.unshift(Number(n & 255n)); n >>= 8n; }
  for (const char of value) { if (char !== '1') break; bytes.unshift(0); }
  if (bytes.length !== 32) throw new Error('Invalid public key length');
  return Buffer.from(bytes);
}

function signInMessage(publicKey, nonce, origin) {
  return `Sign in to Live Crypto Creator Portal\nOrigin: ${origin}\nPublic Key: ${publicKey}\nNonce: ${nonce}`;
}

function verifySolanaSignature({ publicKey, nonce, message, signature }, origin) {
  if (typeof nonce !== 'string' || !/^[a-zA-Z0-9]{8,128}$/.test(nonce)) return false;
  if (message !== signInMessage(publicKey, nonce, origin) || typeof signature !== 'string' || !/^[a-fA-F0-9]{128}$/.test(signature)) return false;
  try {
    const key = crypto.createPublicKey({
      key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), decodePublicKey(publicKey)]),
      format: 'der', type: 'spki'
    });
    return crypto.verify(null, Buffer.from(message, 'utf8'), key, Buffer.from(signature, 'hex'));
  } catch { return false; }
}
module.exports = { decodePublicKey, signInMessage, verifySolanaSignature };
