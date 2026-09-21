const { isAddress, ZeroAddress } = require('ethers');

const NETWORKS = {
  '80002': { name: 'Polygon Amoy', currency: 'POL', rpc: 'https://rpc-amoy.polygon.technology', explorer: 'https://amoy.polygonscan.com/tx/', testnet: true },
  '84532': { name: 'Base Sepolia', currency: 'ETH', rpc: 'https://sepolia.base.org', explorer: 'https://sepolia.basescan.org/tx/', testnet: true },
  '137': { name: 'Polygon', currency: 'POL', rpc: 'https://polygon-rpc.com', explorer: 'https://polygonscan.com/tx/', testnet: false },
  '8453': { name: 'Base', currency: 'ETH', rpc: 'https://mainnet.base.org', explorer: 'https://basescan.org/tx/', testnet: false }
};

function paymentConfig() {
  const chainId = process.env.EVM_CHAIN_ID || '80002';
  const network = NETWORKS[chainId];
  if (!network) throw new Error('Unsupported EVM_CHAIN_ID');
  const router = process.env.EVM_ROUTER_ADDRESS || '';
  const treasury = process.env.SOLANA_TREASURY_ADDRESS || '';
  const solanaChain = process.env.SOLANA_CLUSTER === 'mainnet-beta' ? 'solana' : 'solana-devnet';
  const feeBps = Number(process.env.PLATFORM_FEE_BPS || 200);
  const confirmations = Number(process.env.EVM_CONFIRMATIONS || 3);
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 1000) throw new Error('Invalid PLATFORM_FEE_BPS');
  if (!Number.isInteger(confirmations) || confirmations < 1) throw new Error('Invalid EVM_CONFIRMATIONS');
  const enabled = process.env.DONATIONS_ENABLED === 'true' && process.env.DEV_MEMORY_MODE !== 'true';
  return {
    enabled, feeBps, confirmations,
    evm: { ...network, chainId, router, rpc: process.env.EVM_RPC_URL || network.rpc, enabled: enabled && isAddress(router) && router !== ZeroAddress },
    solana: { chainId: solanaChain, name: solanaChain === 'solana' ? 'Solana' : 'Solana Devnet', currency: 'SOL', treasury,
      rpc: process.env.SOLANA_RPC_URL || `https://api.${solanaChain === 'solana' ? 'mainnet-beta' : 'devnet'}.solana.com`,
      testnet: solanaChain !== 'solana', enabled: enabled && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(treasury),
      explorer: 'https://explorer.solana.com/tx/' }
  };
}

function publicConfig() {
  const config = paymentConfig();
  const { rpc: evmRpc, ...evm } = config.evm;
  const { rpc: solRpc, ...solana } = config.solana;
  // Never expose provider URLs, which can contain private API keys.
  return { enabled: config.enabled, feeBps: config.feeBps, networks: [evm, solana] };
}

module.exports = { paymentConfig, publicConfig };
