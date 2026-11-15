import { NextResponse } from 'next/server';

// Fetch real-time forex/metals prices from free API
// Using Twelve Data free tier (800 calls/day)
const SYMBOLS = ['XAU/USD', 'XAG/USD', 'EUR/USD', 'GBP/USD', 'GBP/JPY', 'USD/JPY', 'AUD/JPY', 'GBP/AUD'];
const SYMBOL_MAP: Record<string, string> = {
  'XAU/USD': 'XAUUSD',
  'XAG/USD': 'XAGUSD',
  'EUR/USD': 'EURUSD',
  'GBP/USD': 'GBPUSD',
  'GBP/JPY': 'GBPJPY',
  'USD/JPY': 'USDJPY',
  'AUD/JPY': 'AUDJPY',
  'GBP/AUD': 'GBPAUD',
};

interface PriceData {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  timestamp: string;
}

// Cache to avoid hitting rate limits
let priceCache: { data: PriceData[]; timestamp: number } | null = null;
const CACHE_TTL = 60_000; // 1 minute cache

export async function GET() {
  // Return cached data if fresh
  if (priceCache && Date.now() - priceCache.timestamp < CACHE_TTL) {
    return NextResponse.json({
      prices: priceCache.data,
      cached: true,
      timestamp: new Date(priceCache.timestamp).toISOString()
    });
  }

  try {
    // Fetch from Twelve Data (free tier)
    const apiKey = process.env.TWELVE_DATA_API_KEY;

    if (!apiKey) {
      // Fallback: return mock data structure for UI to work
      return NextResponse.json({
        prices: [],
        error: 'Market data unavailable',
        timestamp: new Date().toISOString()
      });
    }

    const symbolsParam = SYMBOLS.join(',');
    const response = await fetch(
      `https://api.twelvedata.com/quote?symbol=${symbolsParam}&apikey=${apiKey}`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    const prices: PriceData[] = [];

    // Handle both single and multiple symbol responses
    for (const sym of SYMBOLS) {
      const quote = Array.isArray(data) ? data.find((d: { symbol: string }) => d.symbol === sym) : (data.symbol === sym ? data : data[sym]);
      if (quote && !quote.code) { // code exists on error responses
        prices.push({
          symbol: SYMBOL_MAP[sym] || sym.replace('/', ''),
          price: parseFloat(quote.close || quote.price || 0),
          change: parseFloat(quote.change || 0),
          changePct: parseFloat(quote.percent_change || 0),
          high: parseFloat(quote.high || quote.fifty_two_week?.high || 0),
          low: parseFloat(quote.low || quote.fifty_two_week?.low || 0),
          timestamp: quote.datetime || new Date().toISOString(),
        });
      }
    }

    // Update cache
    priceCache = { data: prices, timestamp: Date.now() };

    return NextResponse.json({
      prices,
      cached: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[MARKET]', error);

    // Return cached data even if stale, or empty
    if (priceCache) {
      return NextResponse.json({
        prices: priceCache.data,
        cached: true,
        stale: true,
        timestamp: new Date(priceCache.timestamp).toISOString()
      });
    }

    return NextResponse.json({
      prices: [],
      error: 'Failed to fetch market data',
      timestamp: new Date().toISOString()
    });
  }
}
