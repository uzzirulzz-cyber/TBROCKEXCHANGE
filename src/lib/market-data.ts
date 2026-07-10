/**
 * BlockExchange market data + trading chart pattern math.
 *
 * This module is shared by client and server. It contains:
 *  - COINS: static catalog of 8 tradable cryptos
 *  - Candle type + price simulation (random-walk with mild momentum)
 *  - Pattern math: SMA, EMA, Bollinger Bands, support/resistance
 *
 * The "chart pattern" feature is the Bollinger Bands + EMA + support/resistance
 * overlay on the candlestick chart — these are the visual signals locked to
 * registered users. Guests see the raw candlesticks blurred behind a lock overlay.
 */

export interface Coin {
  symbol: string;       // BTC, ETH, ...
  name: string;         // Bitcoin
  pair: string;         // BTC/USDT
  basePrice: number;
  color: string;
  icon: string;         // emoji glyph
  precision: number;
}

export const COINS: Coin[] = [
  { symbol: "BTC", name: "Bitcoin", pair: "BTC/USDT", basePrice: 67420.55, color: "#f7931a", icon: "₿", precision: 2 },
  { symbol: "ETH", name: "Ethereum", pair: "ETH/USDT", basePrice: 3285.18, color: "#627eea", icon: "Ξ", precision: 2 },
  { symbol: "BNB", name: "Binance Coin", pair: "BNB/USDT", basePrice: 592.34, color: "#f3ba2f", icon: "B", precision: 2 },
  { symbol: "SOL", name: "Solana", pair: "SOL/USDT", basePrice: 168.92, color: "#9945ff", icon: "◎", precision: 2 },
  { symbol: "DOGE", name: "Dogecoin", pair: "DOGE/USDT", basePrice: 0.1623, color: "#c2a633", icon: "Ð", precision: 5 },
  { symbol: "XRP", name: "Ripple", pair: "XRP/USDT", basePrice: 0.5821, color: "#23292f", icon: "✕", precision: 5 },
  { symbol: "ADA", name: "Cardano", pair: "ADA/USDT", basePrice: 0.4523, color: "#0033ad", icon: "₳", precision: 5 },
  { symbol: "TRX", name: "TRON", pair: "TRX/USDT", basePrice: 0.1287, color: "#ff060a", icon: "T", precision: 5 },
  { symbol: "BTS", name: "BitShares", pair: "BTS/USDT", basePrice: 0.0234, color: "#00a8db", icon: "β", precision: 5 },
  { symbol: "BTG", name: "Bitcoin Gold", pair: "BTG/USDT", basePrice: 28.45, color: "#eba809", icon: "₲", precision: 2 },
];

export interface Candle {
  time: number;      // epoch ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Deterministic-ish PRNG so initial candles look stable on hydrate. */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build N historical candles ending "now". Uses a seeded random-walk so the
 * initial render is consistent across SSR/CSR and looks like a real market.
 */
export function getInitialCandles(pair: string, count = 60, endTs = Date.now()): Candle[] {
  const coin = COINS.find((c) => c.pair === pair) ?? COINS[0];
  const rand = mulberry32(Math.floor(endTs / 60000) + pair.length * 17);
  const candles: Candle[] = [];
  // start price = basePrice * (0.9..1.1)
  let price = coin.basePrice * (0.92 + rand() * 0.16);
  const vol = coin.basePrice * 0.004; // per-candle volatility ~0.4%

  const interval = 60_000; // 1-minute candles
  for (let i = count - 1; i >= 0; i--) {
    const t = endTs - i * interval;
    const open = price;
    // momentum drift
    const drift = (rand() - 0.5) * vol * 2;
    const close = Math.max(open + drift, coin.basePrice * 0.5);
    const high = Math.max(open, close) + rand() * vol * 1.2;
    const low = Math.min(open, close) - rand() * vol * 1.2;
    const volume = Math.round(50 + rand() * 950);
    candles.push({ time: t, open, high, low, close, volume });
    price = close;
  }
  return candles;
}

/** Produce the next candle given the previous close. Used by live tick simulation. */
export function nextCandle(prev: Candle, coin: Coin, nowTs = Date.now()): Candle {
  const vol = coin.basePrice * 0.004;
  const drift = (Math.random() - 0.5) * vol * 2;
  const open = prev.close;
  const close = Math.max(open + drift, coin.basePrice * 0.5);
  const high = Math.max(open, close) + Math.random() * vol * 1.1;
  const low = Math.min(open, close) - Math.random() * vol * 1.1;
  const volume = Math.round(50 + Math.random() * 950);
  return { time: nowTs, open, high, low, close, volume };
}

/** Apply a small live tick to the in-progress candle's close (for sub-candle updates). */
export function tickCandle(c: Candle, coin: Coin): Candle {
  const vol = coin.basePrice * 0.0009;
  const delta = (Math.random() - 0.5) * vol * 2;
  const close = Math.max(c.close + delta, coin.basePrice * 0.5);
  return {
    ...c,
    close,
    high: Math.max(c.high, close),
    low: Math.min(c.low, close),
    volume: c.volume + Math.round(Math.random() * 25),
  };
}

/* ---------------- Pattern math (locked to registered users) ---------------- */

export interface PatternData {
  sma: (number | null)[];        // simple moving average
  ema: (number | null)[];        // exponential moving average
  upper: (number | null)[];      // bollinger upper
  lower: (number | null)[];      // bollinger lower
  mid: (number | null)[];        // bollinger mid (= SMA)
  support: number | null;        // recent swing low
  resistance: number | null;     // recent swing high
}

/**
 * Compute the BlockExchange "chart pattern" overlay:
 *  - 20-period SMA + EMA(12)
 *  - Bollinger Bands (20, 2σ)
 *  - Support (recent low) and Resistance (recent high)
 *
 * This overlay is what's gated behind registration. Non-registered users
 * see only the raw candles (blurred) + a "Login to reveal pattern" lock card.
 */
export function computePattern(candles: Candle[], period = 20): PatternData {
  const closes = candles.map((c) => c.close);
  const sma: (number | null)[] = [];
  const ema: (number | null)[] = [];
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  const mid: (number | null)[] = [];

  let emaPrev: number | null = null;
  const k = 2 / (period - 6); // EMA-12-ish

  for (let i = 0; i < closes.length; i++) {
    // SMA
    if (i >= period - 1) {
      const slice = closes.slice(i - period + 1, i + 1);
      const avg = slice.reduce((a, b) => a + b, 0) / period;
      sma.push(avg);
      mid.push(avg);
      // stddev
      const variance = slice.reduce((a, b) => a + (b - avg) ** 2, 0) / period;
      const sd = Math.sqrt(variance);
      upper.push(avg + 2 * sd);
      lower.push(avg - 2 * sd);
    } else {
      sma.push(null);
      mid.push(null);
      upper.push(null);
      lower.push(null);
    }
    // EMA
    if (emaPrev === null) {
      if (i >= 11) {
        const seedAvg = closes.slice(0, 12).reduce((a, b) => a + b, 0) / 12;
        emaPrev = seedAvg;
        ema.push(seedAvg);
      } else {
        ema.push(null);
      }
    } else if (closes[i] != null) {
      const v = closes[i] * k + emaPrev * (1 - k);
      emaPrev = v;
      ema.push(v);
    } else {
      ema.push(null);
    }
  }

  // Support / Resistance over last 30 candles
  const recent = candles.slice(-30);
  let support: number | null = null;
  let resistance: number | null = null;
  if (recent.length) {
    support = Math.min(...recent.map((c) => c.low));
    resistance = Math.max(...recent.map((c) => c.high));
  }

  return { sma, ema, upper, lower, mid, support, resistance };
}

/* ---------------- Trade option presets ---------------- */

export interface TradeOption {
  duration: 30 | 60 | 120;
  payoutRate: number; // 0.2 | 0.3 | 0.5
  label: string;
}

export const TRADE_OPTIONS: TradeOption[] = [
  { duration: 30, payoutRate: 0.2, label: "30s · 20% return" },
  { duration: 60, payoutRate: 0.3, label: "60s · 30% return" },
  { duration: 120, payoutRate: 0.5, label: "120s · 50% return" },
];

export const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500];

/** Format a price with the coin's precision. */
export function formatPrice(value: number, pair: string): string {
  const coin = COINS.find((c) => c.pair === pair);
  const p = coin?.precision ?? 2;
  return value.toLocaleString(undefined, { minimumFractionDigits: p, maximumFractionDigits: p });
}

/** Determine win/lose for a binary option trade. */
export function settleTrade(direction: "UP" | "DOWN", entry: number, exit: number): "WIN" | "LOSE" {
  if (direction === "UP") return exit > entry ? "WIN" : "LOSE";
  return exit < entry ? "WIN" : "LOSE";
}
