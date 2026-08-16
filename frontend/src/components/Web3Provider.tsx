"use client";

import { WagmiProvider, type Config } from 'wagmi';
import { mainnet, polygon, base, arbitrum, optimism, bsc, avalanche } from 'viem/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { SolanaAdapter } from '@reown/appkit-adapter-solana';

// 1. Reown Cloud Project ID
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'b56e18d47c72ab683b10814fe9495694';

// 2. Define App Metadata
const metadata = {
  name: 'Live Crypto',
  description: 'Live Crypto — Non-Custodial Web3 Donation Gateway for Streamers',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://livecrypto.io',
  icons: ['/brand/logo-png.png'],
};

// 3. Define supported EVM chains
const networks = [mainnet, polygon, base, arbitrum, optimism, bsc, avalanche] as any;

// 4. Create Wagmi adapter (EVM)
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

// 5. Create Solana adapter
const solanaAdapter = new SolanaAdapter();

// 6. Create the AppKit modal (unified EVM + Solana)
createAppKit({
  adapters: [wagmiAdapter, solanaAdapter],
  networks,
  defaultNetwork: polygon,
  projectId,
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#00f2fe',
    '--w3m-color-mix-strength': 20,
    '--w3m-accent': '#00f2fe',
    '--w3m-border-radius-master': '16px',
  },
});

// 7. Create QueryClient
const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
