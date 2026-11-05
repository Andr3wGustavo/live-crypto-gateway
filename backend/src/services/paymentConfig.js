const { isAddress, ZeroAddress } = require('ethers');

const NETWORKS = {
  '80002': { name: 'Polygon Amoy', currency: 'POL', rpc: 'https://rpc-amoy.polygon.technology', explorer: 'https://amoy.polygonscan.com/tx/', testnet: true },
  '84532': { name: 'Base Sepolia', currency: 'ETH', rpc: 'https://sepolia.base.org', explorer: 'https://sepolia.basescan.org/tx/', testnet: true },
  '137': { name: 'Polygon', currency: 'POL', rpc: 'https://polygon-rpc.com', explorer: 'https://polygonscan.com/tx/', testnet: false },
  '8453': { name: 'Base', currency: 'ETH', rpc: 'https://mainnet.base.org', explorer: 'https://basescan.org/tx/', testnet: false }
};

const SUI_NETWORKS = {
  mainnet: { chainId: 'sui', name: 'Sui', rpc: 'https://fullnode.mainnet.sui.io:443', testnet: false },
  testnet: { chainId: 'sui-testnet', name: 'Sui Testnet', rpc: 'https://fullnode.testnet.sui.io:443', testnet: true },
  devnet: { chainId: 'sui-devnet', name: 'Sui Devnet', rpc: 'https://fullnode.devnet.sui.io:443', testnet: true }
};

// Sui addresses are 32-byte values rendered as 0x + 64 hex characters. Payout
// destinations are always full-length key addresses, never short aliases such
// as 0x2 (the system object).
const SUI_ADDRESS = /^0x[0-9a-fA-F]{64}$/;

function isSuiAddress(value) {
  return typeof value === 'string' && SUI_ADDRESS.test(value.trim());
}

function paymentConfig() {
  const chainId = process.env.EVM_CHAIN_ID || '80002';
  const network = NETWORKS[chainId];
  if (!network) throw new Error('Unsupported EVM_CHAIN_ID');
  const router = process.env.EVM_ROUTER_ADDRESS || '';
  const evmTreasury = process.env.EVM_TREASURY_ADDRESS || '';
  const treasury = process.env.SOLANA_TREASURY_ADDRESS || '';
  const solanaChain = process.env.SOLANA_CLUSTER === 'mainnet-beta' ? 'solana' : 'solana-devnet';
  const suiNetworkKey = process.env.SUI_NETWORK || 'testnet';
  const suiNetwork = SUI_NETWORKS[suiNetworkKey];
  if (!suiNetwork) throw new Error('Unsupported SUI_NETWORK');
  const suiTreasury = process.env.SUI_TREASURY_ADDRESS || '';
  const suiPackageId = process.env.SUI_PACKAGE_ID || '';
  const feeBps = Number(process.env.PLATFORM_FEE_BPS || 200);
  const confirmations = Number(process.env.EVM_CONFIRMATIONS || 3);
  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 1000) throw new Error('Invalid PLATFORM_FEE_BPS');
  if (!Number.isInteger(confirmations) || confirmations < 1) throw new Error('Invalid EVM_CONFIRMATIONS');
  const enabled = process.env.DONATIONS_ENABLED === 'true' && process.env.DEV_MEMORY_MODE !== 'true';
  return {
    enabled, feeBps, confirmations,
    evm: { ...network, chainId, router, treasury: evmTreasury, rpc: process.env.EVM_RPC_URL || network.rpc, enabled: enabled && isAddress(router) && router !== ZeroAddress && isAddress(evmTreasury) && evmTreasury !== ZeroAddress },
    solana: { chainId: solanaChain, name: solanaChain === 'solana' ? 'Solana' : 'Solana Devnet', currency: 'SOL', treasury,
      genesisHash: solanaChain === 'solana' ? '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d' : 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG',
      rpc: process.env.SOLANA_RPC_URL || `https://api.${solanaChain === 'solana' ? 'mainnet-beta' : 'devnet'}.solana.com`,
      testnet: solanaChain !== 'solana', enabled: enabled && /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(treasury),
      explorer: 'https://explorer.solana.com/tx/' },
    // The Sui rail only turns on when both the treasury and the Move package
    // are configured. A payout address alone must never enable checkout.
    sui: { ...suiNetwork, currency: 'SUI', treasury: suiTreasury, packageId: suiPackageId,
      rpc: process.env.SUI_RPC_URL || suiNetwork.rpc,
      enabled: enabled && isSuiAddress(suiTreasury) && isSuiAddress(suiPackageId),
      explorer: `https://suiscan.xyz/${suiNetworkKey}/tx/` }
  };
}

function publicConfig() {
  const config = paymentConfig();
  const { rpc: evmRpc, ...evm } = config.evm;
  const { rpc: solRpc, ...solana } = config.solana;
  const { rpc: suiRpc, ...sui } = config.sui;
  // Never expose provider URLs, which can contain private API keys. A separate
  // optional public URL lets the browser use a dedicated RPC without leaking
  // the server-side credentials.
  const publicSolanaRpc = process.env.SOLANA_PUBLIC_RPC_URL || '';
  // A flagship deployment may expose a browser-safe Sui endpoint as well.
  const publicSuiRpc = process.env.SUI_PUBLIC_RPC_URL || '';
  return {
    enabled: config.enabled,
    feeBps: config.feeBps,
    capabilities: { evm: config.evm.enabled, solana: config.solana.enabled, sui: config.sui.enabled },
    networks: [
      evm,
      publicSolanaRpc ? { ...solana, rpcUrl: publicSolanaRpc } : solana,
      publicSuiRpc ? { ...sui, rpcUrl: publicSuiRpc } : sui
    ]
  };
}

module.exports = { isSuiAddress, paymentConfig, publicConfig };
