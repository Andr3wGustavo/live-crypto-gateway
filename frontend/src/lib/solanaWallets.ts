import type { PublicKey, Transaction } from '@solana/web3.js';

// Injected Solana providers share a mostly identical surface but are not
// registered through a single standard (Wallet Standard adoption is partial in
// the extensions people actually use). Detect each brand explicitly and fall
// back to the generic injection so a new wallet is never silently ignored.
export type SolanaProvider = {
  publicKey?: PublicKey | null;
  isPhantom?: boolean;
  isSolflare?: boolean;
  isBackpack?: boolean;
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<unknown>;
  signMessage: (message: Uint8Array, encoding?: string) => Promise<{ signature: Uint8Array }>;
  signAndSendTransaction: (transaction: Transaction) => Promise<{ signature: string }>;
};

export type SolanaWalletOption = { id: string; name: string; provider: SolanaProvider };

type SolanaWindow = {
  phantom?: { solana?: SolanaProvider };
  solflare?: SolanaProvider;
  backpack?: SolanaProvider;
  xnft?: { solana?: SolanaProvider };
  solana?: SolanaProvider;
};

export function detectSolanaWallets(): SolanaWalletOption[] {
  if (typeof window === 'undefined') return [];
  const injected = window as unknown as SolanaWindow;
  const candidates: SolanaWalletOption[] = [
    { id: 'phantom', name: 'Phantom', provider: injected.phantom?.solana as SolanaProvider },
    { id: 'solflare', name: 'Solflare', provider: injected.solflare as SolanaProvider },
    { id: 'backpack', name: 'Backpack', provider: (injected.backpack || injected.xnft?.solana) as SolanaProvider },
    { id: 'solana', name: 'Solana wallet', provider: injected.solana as SolanaProvider }
  ];
  const seen = new Set<SolanaProvider>();
  return candidates.filter(candidate => {
    const provider = candidate.provider;
    if (!provider || typeof provider.connect !== 'function' || seen.has(provider)) return false;
    seen.add(provider);
    if (candidate.id === 'solana') {
      if (provider.isPhantom) candidate.name = 'Phantom';
      else if (provider.isSolflare) candidate.name = 'Solflare';
      else if (provider.isBackpack) candidate.name = 'Backpack';
    }
    return true;
  });
}
