// Sui wallets (Slush, Sui Wallet, ...) use the Wallet Standard. There is no
// brand-specific global to read, so the application announces itself with
// `wallet-standard:app-ready` and every installed wallet answers with its
// registration callback. Keeping this small adapter avoids pulling a full SDK
// into the login bundle while still speaking the official protocol.
export type SuiAccount = {
  address: string;
  publicKey?: Uint8Array;
  chains: string[];
  features: string[];
};

type SuiConnectFeature = {
  connect: (input?: { silent?: boolean }) => Promise<{ accounts?: SuiAccount[] } | void>;
};

type SuiSignPersonalMessageFeature = {
  signPersonalMessage: (input: { account: SuiAccount; message: Uint8Array }) => Promise<{ signature: Uint8Array | string }>;
};

export type SuiWallet = {
  name: string;
  icon?: string;
  chains?: string[];
  accounts?: SuiAccount[];
  features: Record<string, SuiConnectFeature | SuiSignPersonalMessageFeature | undefined>;
};

type Register = (...wallets: SuiWallet[]) => void;
// Wallet Standard passes a register *api object*, not a bare function:
//   app-ready  -> detail = { register }  (wallets call detail.register(...))
//   register-wallet -> detail = (api) => void
// Matching the published shape is what makes real extensions (Slush included)
// hand over their wallets instead of silently ignoring the page.
type RegisterApi = { register: Register };
type RegisterApp = (api: RegisterApi) => void;

let wallets: SuiWallet[] = [];
let initialized = false;
const listeners = new Set<(wallets: SuiWallet[]) => void>();

function publish() {
  const visible = getSuiWallets();
  listeners.forEach(listener => listener(visible));
}

export function getSuiWallets(): SuiWallet[] {
  return wallets.filter(wallet =>
    wallet.chains?.some(chain => chain.startsWith('sui:')) ||
    Boolean(wallet.features?.['sui:signPersonalMessage'])
  );
}

export function initSuiWallets(): void {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  const register: Register = (...registered) => {
    let changed = false;
    for (const wallet of registered.flat()) {
      if (!wallet?.name || wallets.some(existing => existing === wallet)) continue;
      // Some extensions answer the app-ready event more than once. De-duplicate
      // by identity/name so the picker never shows the same wallet twice.
      if (wallets.some(existing => existing.name === wallet.name && existing.icon === wallet.icon)) continue;
      wallets = [...wallets, wallet];
      changed = true;
    }
    if (changed) publish();
  };
  const api: RegisterApi = Object.freeze({ register });
  window.addEventListener('wallet-standard:register-wallet', (event => {
    try { (event as CustomEvent<RegisterApp>).detail(api); } catch { /* A broken wallet must not break the page. */ }
  }) as EventListener);
  window.dispatchEvent(new CustomEvent<RegisterApi>('wallet-standard:app-ready', { detail: api }));
  publish();
}

export function subscribeSuiWallets(listener: (wallets: SuiWallet[]) => void): () => void {
  listeners.add(listener);
  listener(getSuiWallets());
  return () => { listeners.delete(listener); };
}

export async function connectSuiWallet(wallet: SuiWallet): Promise<SuiAccount> {
  const feature = wallet.features?.['standard:connect'] as SuiConnectFeature | undefined;
  if (!feature || typeof feature.connect !== 'function') throw new Error('This Sui wallet does not expose standard:connect.');
  const result = await feature.connect();
  const account = result?.accounts?.find(candidate => candidate.address) || wallet.accounts?.find(candidate => candidate.address);
  if (!account) throw new Error('No Sui account was returned by the wallet.');
  return account;
}

export async function signSuiPersonalMessage(wallet: SuiWallet, account: SuiAccount, message: string): Promise<string> {
  const feature = wallet.features?.['sui:signPersonalMessage'] as SuiSignPersonalMessageFeature | undefined;
  if (!feature || typeof feature.signPersonalMessage !== 'function') throw new Error('This Sui wallet cannot sign personal messages.');
  const result = await feature.signPersonalMessage({ account, message: new TextEncoder().encode(message) });
  if (!result?.signature) throw new Error('The Sui wallet returned no signature.');
  if (typeof result.signature === 'string') return result.signature;
  let binary = '';
  result.signature.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}
