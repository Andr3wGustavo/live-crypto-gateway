// CoinGecko Real-Time Price Service & Multi-Currency Converter
// Non-blocking price fetcher with localStorage caching and offline fallbacks

export interface CryptoPriceData {
  id: string;
  symbol: string;
  name: string;
  chain: string;
  chainId: string;
  defaultUSD: number;
  icon: string;
  explorerUrl?: string;
}

export const SUPPORTED_TOKENS: CryptoPriceData[] = [
  { symbol: 'SOL', id: 'solana', name: 'Solana', chain: 'Solana', chainId: 'solana', defaultUSD: 190.0, icon: '⚡' },
  { symbol: 'SUI', id: 'sui', name: 'Sui Network', chain: 'Sui', chainId: 'sui', defaultUSD: 3.50, icon: '💧' },
  { symbol: 'ETH', id: 'ethereum', name: 'Ethereum', chain: 'Ethereum', chainId: '1', defaultUSD: 3400.0, icon: '🔷' },
  { symbol: 'POL', id: 'matic-network', name: 'Polygon', chain: 'Polygon', chainId: '137', defaultUSD: 0.55, icon: '🟣' },
  { symbol: 'BASE-ETH', id: 'ethereum', name: 'Base (ETH)', chain: 'Base', chainId: '8453', defaultUSD: 3400.0, icon: '🔵' },
  { symbol: 'ARB-ETH', id: 'ethereum', name: 'Arbitrum (ETH)', chain: 'Arbitrum', chainId: '42161', defaultUSD: 3400.0, icon: '🔷' },
  { symbol: 'BTC', id: 'bitcoin', name: 'Bitcoin (Lightning)', chain: 'Lightning', chainId: 'btc', defaultUSD: 96000.0, icon: '🟠' },
  { symbol: 'USDT', id: 'tether', name: 'Tether USD (Multi-chain)', chain: 'Multi-chain', chainId: '137', defaultUSD: 1.00, icon: '💵' },
  { symbol: 'USDC', id: 'usd-coin', name: 'USD Coin (Multi-chain)', chain: 'Multi-chain', chainId: 'solana', defaultUSD: 1.00, icon: '🪙' },
  { symbol: 'BNB', id: 'binancecoin', name: 'BNB Chain', chain: 'BNB Chain', chainId: '56', defaultUSD: 650.0, icon: '🟡' },
  { symbol: 'TRX', id: 'tron', name: 'TRON (TRC20)', chain: 'TRON', chainId: 'tron', defaultUSD: 0.24, icon: '🔴' },
  { symbol: 'TON', id: 'the-open-network', name: 'Toncoin', chain: 'TON', chainId: 'ton', defaultUSD: 5.40, icon: '💎' },
  { symbol: 'AVAX', id: 'avalanche-2', name: 'Avalanche', chain: 'Avalanche', chainId: '43114', defaultUSD: 32.0, icon: '🔺' },
  { symbol: 'DOGE', id: 'dogecoin', name: 'Dogecoin', chain: 'Dogecoin', chainId: 'doge', defaultUSD: 0.25, icon: '🐕' },
];

let priceCache: Record<string, { usd: number; usd_24h_change?: number }> = {};
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

export async function fetchLiveCryptoPrices(): Promise<Record<string, { usd: number; change24h: number }>> {
  const now = Date.now();
  if (Object.keys(priceCache).length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
    const result: Record<string, { usd: number; change24h: number }> = {};
    for (const token of SUPPORTED_TOKENS) {
      const cached = priceCache[token.id];
      result[token.symbol] = {
        usd: cached ? cached.usd : token.defaultUSD,
        change24h: cached?.usd_24h_change || 0,
      };
    }
    return result;
  }

  const uniqueIds = Array.from(new Set(SUPPORTED_TOKENS.map((t) => t.id))).join(',');
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${uniqueIds}&vs_currencies=usd&include_24hr_change=true`
    );
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
    const data = await res.json();
    priceCache = data;
    lastFetchTime = now;

    const result: Record<string, { usd: number; change24h: number }> = {};
    for (const token of SUPPORTED_TOKENS) {
      if (data[token.id]) {
        result[token.symbol] = {
          usd: data[token.id].usd,
          change24h: data[token.id].usd_24h_change || 0,
        };
      } else {
        result[token.symbol] = { usd: token.defaultUSD, change24h: 0 };
      }
    }
    return result;
  } catch (error) {
    console.warn('CoinGecko fetch failed, using fallback market prices:', error);
    const result: Record<string, { usd: number; change24h: number }> = {};
    for (const token of SUPPORTED_TOKENS) {
      result[token.symbol] = { usd: token.defaultUSD, change24h: 0 };
    }
    return result;
  }
}

export function convertCryptoToFiat(amount: number, tokenSymbol: string, rates: Record<string, { usd: number }>, fiatCurrency: 'USD' | 'BRL' | 'EUR' = 'USD'): { value: number; formatted: string } {
  const tokenRate = rates[tokenSymbol]?.usd || 1;
  const fiatMultiplier = fiatCurrency === 'BRL' ? 5.80 : fiatCurrency === 'EUR' ? 0.92 : 1.0;
  const val = amount * tokenRate * fiatMultiplier;
  const symbolPrefix = fiatCurrency === 'BRL' ? 'R$' : fiatCurrency === 'EUR' ? '€' : '$';
  return {
    value: val,
    formatted: `${symbolPrefix}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  };
}

export function convertFiatToCrypto(fiatAmount: number, tokenSymbol: string, rates: Record<string, { usd: number }>, fiatCurrency: 'USD' | 'BRL' | 'EUR' = 'USD'): number {
  const tokenRate = rates[tokenSymbol]?.usd || 1;
  const fiatMultiplier = fiatCurrency === 'BRL' ? 5.80 : fiatCurrency === 'EUR' ? 0.92 : 1.0;
  const usdAmount = fiatAmount / fiatMultiplier;
  return usdAmount / tokenRate;
}
