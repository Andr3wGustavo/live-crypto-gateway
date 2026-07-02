"use client";

import { WagmiProvider, type Config } from 'wagmi';
import { mainnet, polygon, base, arbitrum, optimism, bsc, avalanche } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { SolanaAdapter } from '@reown/appkit-adapter-solana';

// 1. Get projectId at https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'YOUR_PROJECT_ID';

// 2. Define metadata
const metadata = {
  name: 'Live Crypto',
  description: 'Live Crypto — Non-Custodial Donation Gateway for Streamers',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://livecrypto.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

// 3. Define supported chains (EVM)
const chains = [mainnet, polygon, base, arbitrum, optimism, bsc, avalanche] as const;

// 4. Create Wagmi adapter (EVM)
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: chains,
});

// 5. Create Solana adapter
const solanaAdapter = new SolanaAdapter();

// 6. Create the AppKit modal (unified EVM + Solana)
createAppKit({
  adapters: [wagmiAdapter, solanaAdapter],
  networks: [mainnet, polygon, base, arbitrum, optimism, bsc, avalanche],
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
    '--w3m-color-mix': '#00ff00',
    '--w3m-color-mix-strength': 15,
    '--w3m-accent': '#00ff00',
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
