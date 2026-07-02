"use client";

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import { WagmiProvider } from 'wagmi'
import { mainnet, polygon, base } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'

// 1. Get projectId at https://cloud.walletconnect.com
// Use a placeholder for now as per the plan
const projectId = 'YOUR_PROJECT_ID' 

// 2. Create wagmiConfig
const metadata = {
  name: 'Live Crypto',
  description: 'Live Crypto Non-Custodial Donation Gateway',
  url: 'https://livecrypto.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const chains = [mainnet, polygon, base] as const
const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
})

// 3. Create modal
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: false,
})

// 4. Create QueryClient
const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
