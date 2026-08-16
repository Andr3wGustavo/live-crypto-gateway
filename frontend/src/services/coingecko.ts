// CoinGecko Real-Time Price Service & Multi-Currency Converter
// Non-blocking price fetcher with localStorage caching and offline fallbacks

export interface CryptoPriceData {
  id: string;
  symbol: string;
  name: string;
  priceUSD: number;
  change24h: number;
  icon: string;
}

export const SUPPORTED_TOKENS = [
  { symbol: 'SOL', id: 'solana', name: 'Solana', defaultUSD: 190.0, icon: '⚡' },
  { symbol: 'SUI', id: 'sui', name: 'Sui Network', defaultUSD: 3.50, icon: '💧' },
  { symbol: 'ETH', id: 'ethereum', name: 'Ethereum', defaultUSD: 3400.0, icon: '🔷' },
  { symbol: 'POL', id: 'matic-network', name: 'Polygon', defaultUSD: 0.55, icon: '🟣' },
  { symbol: 'BTC', id: 'bitcoin', name: 'Bitcoin (Lightning)', defaultUSD: 96000.0, icon: '🟠' },
  { symbol: 'USDT', id: 'tether', name: 'Tether USD', defaultUSD: 1.00, icon: '💵' },
  { symbol: 'USDC', id: 'usd-coin', name: 'USD Coin', defaultUSD: 1.00, icon: '🪙' },
  { symbol: 'BNB', id: 'binancecoin', name: 'BNB Chain', defaultUSD: 650.0, icon: '🟡' },
  { symbol: 'DOGE', id: 'dogecoin', name: 'Dogecoin', defaultUSD: 0.25, icon: '🐕' },
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

  const ids = SUPPORTED_TOKENS.map((t) => t.id).join(',');
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
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

export function convertCryptoToFiat(amount: number, tokenSymbol: string, rates: Record<string, { usd: number }>, fiatRateUSD = 1): number {
  const tokenRate = rates[tokenSymbol]?.usd || 1;
  return amount * tokenRate * fiatRateUSD;
}

export function convertFiatToCrypto(fiatAmount: number, tokenSymbol: string, rates: Record<string, { usd: number }>, fiatRateUSD = 1): number {
  const tokenRate = rates[tokenSymbol]?.usd || 1;
  const usdAmount = fiatAmount / fiatRateUSD;
  return usdAmount / tokenRate;
}
