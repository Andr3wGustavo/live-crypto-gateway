"use client";

import { createContext, useContext, useRef, useState, useEffect, type ReactNode } from 'react';
import { WagmiProvider, createConfig, http, injected, useConnect } from 'wagmi';
import { polygon, base, polygonAmoy, baseSepolia } from 'viem/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useI18n } from '@/i18n/Provider';

const config = createConfig({
  chains: [polygonAmoy, baseSepolia, polygon, base],
  connectors: [injected()], multiInjectedProviderDiscovery: true, ssr: true,
  transports: { [polygonAmoy.id]: http(), [baseSepolia.id]: http(), [polygon.id]: http(), [base.id]: http() },
});
const Picker = createContext<{ open: () => Promise<void> } | null>(null);
export function useWalletPicker() {
  const value = useContext(Picker);
  if (!value) throw new Error('Web3Provider is required');
  return value;
}
function WalletPicker({ children }: { children: ReactNode }) {
  const { messages: { login: l, common: c } } = useI18n();
  const { connectors, connectAsync, isPending } = useConnect();
  const dialog = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState('');
  const [available, setAvailable] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    void Promise.all(connectors.map(async connector => ({ id: connector.uid, provider: await connector.getProvider().catch(() => undefined) })))
      .then(values => { if (active) setAvailable(values.filter(value => value.provider).map(value => value.id)); });
    return () => { active = false; };
  }, [connectors]);
  return <Picker.Provider value={{ open: async () => { setError(''); dialog.current?.showModal(); } }}>
    {children}
    <dialog ref={dialog} className="wallet-dialog product-panel" aria-labelledby="wallet-dialog-title">
      <h2 id="wallet-dialog-title">{l.connect}</h2>
      <p className="field-hint">{l.extensionHint}</p>
      <div className="wallet-options">{connectors.filter(connector => available.includes(connector.uid)).map(connector => <button key={connector.uid} className="brand-button secondary full-width" disabled={isPending} onClick={async () => {
        try { await connectAsync({ connector }); dialog.current?.close(); }
        catch { setError(l.failure); }
      }}>{connector.name}</button>)}</div>
      {!available.length && <p className="notice">{l.noEvmWallet}</p>}
      {error && <p role="alert" className="error-notice">{error}</p>}
      <button className="brand-button secondary full-width" onClick={() => dialog.current?.close()}>{c.close}</button>
    </dialog>
  </Picker.Provider>;
}
export function Web3Provider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return <WagmiProvider config={config}><QueryClientProvider client={queryClient}><WalletPicker>{children}</WalletPicker></QueryClientProvider></WagmiProvider>;
}
