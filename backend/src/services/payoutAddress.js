const { getAddress, ZeroAddress } = require('ethers');
const { decodePublicKey } = require('./solanaAuth');

// Format/destination validation only; ownership and payment attribution are
// separate requirements and must not be inferred from a valid address.
function normalizePayoutAddress(chainId, address, config) {
  if (typeof address !== 'string') throw new Error('Informe um endereço de carteira válido.');
  const value = address.trim();
  if (chainId === config.evm.chainId) {
    let normalized;
    try { normalized = getAddress(value); }
    catch { throw new Error('Endereço EVM inválido ou checksum incorreto.'); }
    if (normalized === ZeroAddress || normalized.toLowerCase() === config.evm.router.toLowerCase()) {
      throw new Error('O destino não pode ser o endereço zero nem o contrato de doações.');
    }
    return normalized;
  }
  if (chainId === config.solana.chainId) {
    let bytes;
    try { bytes = decodePublicKey(value); }
    catch { throw new Error('Endereço Solana inválido: informe uma chave pública de 32 bytes.'); }
    if (bytes.every(byte => byte === 0) || value === config.solana.treasury) {
      throw new Error('O destino não pode ser o programa do sistema nem a tesouraria.');
    }
    return value; // Base58 is case-sensitive.
  }
  throw new Error('Rede não configurada para este ambiente.');
}

module.exports = { normalizePayoutAddress };
