import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Rate limiter — in-memory, per IP ─────────────────────────────────────────
// Limits: 20 requests per minute, 100 requests per hour per IP
const rateLimitWindows = new Map<string, { minute: number[]; hour: number[] }>();

function isRateLimited(ip: string): { limited: boolean; reason?: string } {
  const now = Date.now();
  const minuteAgo = now - 60_000;
  const hourAgo = now - 3_600_000;

  let entry = rateLimitWindows.get(ip);
  if (!entry) {
    entry = { minute: [], hour: [] };
    rateLimitWindows.set(ip, entry);
  }

  // Evict old timestamps
  entry.minute = entry.minute.filter(t => t > minuteAgo);
  entry.hour   = entry.hour.filter(t => t > hourAgo);

  if (entry.minute.length >= 20)  return { limited: true, reason: 'Too many requests — slow down.' };
  if (entry.hour.length   >= 100) return { limited: true, reason: 'Hourly limit reached. Try again later.' };

  entry.minute.push(now);
  entry.hour.push(now);
  return { limited: false };
}

// Prune stale IPs every 10 minutes to prevent memory growth
setInterval(() => {
  const hourAgo = Date.now() - 3_600_000;
  for (const [ip, entry] of rateLimitWindows) {
    if (entry.hour.every(t => t < hourAgo)) rateLimitWindows.delete(ip);
  }
}, 600_000);

const CIPHER_SYSTEM = `You are GODWILL — the AI coach embedded in GRID, Annabel Otutu's life OS.

ANNABEL: 22F, based in Nigeria (WAT/UTC+1). 5'11" 175 lbs. Trains 4×/week strength. Fasts 16:8 (extends to 18:6–20:4 follicular). ICT/SMC trader. Entrepreneur: Root VI, CV Chameleon, BlueGum, reselling, Algorithm of Self podcast. Stoic philosophy. Cycle-phase aware.

HER TRADING STATS (from 75 trades analyzed):
— LONDON session: 87.5% WR, +$2,715 — HER EDGE
— NY session: 30.8% WR, -$313 — AVOID
— ASIAN session: 42.9% WR, -$193 — AVOID
— Best pairs: XAUUSD, GBPJPY, GBPAUD, AUDJPY (100% WR)
— Avoid: NZDUSD, XPDUSD, DXY (negative P&L)
— Losses came from: overleveraging, early exits, wrong session

ICT/SMC FRAMEWORK:
— Market structure: BOS (break of structure), CHoCH (change of character)
— Key levels: Order blocks, FVG (fair value gaps), liquidity pools
— Sessions: London (07:00-16:00 UTC), NY (12:00-21:00 UTC), Asian (00:00-09:00 UTC)
— Entry: Wait for structure shift + retracement to OB/FVG
— Confirmation: Lower timeframe CHoCH into direction of HTF bias

TRADING RESPONSE FORMAT (when market data provided):
<strong>BIAS:</strong> [BULLISH/BEARISH/NO TRADE] for [PAIR]<br>
<strong>WHY:</strong> [1-2 sentence structure read]<br>
<strong>KEY LEVELS:</strong><br>
• Entry zone: [price]<br>
• SL: [price] ([X] pips)<br>
• TP1: [price] (1:2 RR)<br>
<strong>WAIT FOR:</strong> [specific confirmation needed]<br>
<strong>SESSION:</strong> [LONDON recommended] — execute [time range WAT]

GENERAL KNOWLEDGE:
— Foundation stack: D3/K2, Omega-3, Magnesium Glycinate, Zinc, B-Complex, Creatine
— Fasting hunger: L-Glutamine stabilises glucose; peppermint/cinnamon tea
— Low energy: ask or infer cycle phase before prescribing

RESPONSE FORMAT — HTML only, no markdown:
— Keep it tight. 50-100 words ideal, 150 max.
— Start with the answer. No "Sure!" or "Great question!"
— Use <strong>labels</strong> sparingly for key terms only.
— Single <br> between related lines. No double breaks.
— Bullets: • item (plain text, no HTML list tags)
— For trading: give specific prices when data available.
— No <p>, <div>, <ul>, <li>, or block tags.
— Write like a text message from a smart friend, not a formal document.

TONE: Casual but sharp. Like texting a mentor who respects your time.`;

export async function POST(request: NextRequest) {
  // Rate limiting — check IP before parsing body
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';
  const { limited, reason } = isRateLimited(ip);
  if (limited) {
    return NextResponse.json({ error: reason }, { status: 429 });
  }

  interface CipherProfile { codename: string; xp: number; longestStreak: number; missionsCompleted: number; }
  interface MarketPrice { symbol: string; price: number; change: number; changePct: number; high: number; low: number; }
  interface UserData {
    habits?: { completedToday: number; total: number; percentage: number; topStreaks: { name: string; streak: number; category: string }[]; notDoneToday: string[] };
    body?: { currentWeight?: number; goalWeight?: number; startWeight?: number; lbsLost?: number; journeyStartDate?: string };
    fasting?: { active: boolean; startedAt?: string; hoursIn?: number };
    sleep?: { date: string; quality: number; durationH: number };
    trading?: { total: number; wins: number; losses: number; totalPnl: number; winRate: number; rulesFollowed: number; lastTrade?: unknown };
  }
  interface RequestBody {
    message?: unknown;
    profile?: CipherProfile;
    history?: { role: 'user' | 'assistant'; content: string }[];
    marketData?: MarketPrice[];
    isTrading?: boolean;
    userData?: UserData;
  }

  let body: RequestBody;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { message, profile, history = [], marketData, isTrading, userData } = body;
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Message required' }, { status: 400 });
  }

  // Build context header from profile
  const profileContext = profile ? `\n[OPERATIVE: ${profile.codename} | XP: ${profile.xp} | STREAK: ${profile.longestStreak}d | MISSIONS: ${profile.missionsCompleted}]` : '';

  // Build user data context
  let userDataContext = '';
  if (userData) {
    userDataContext = '\n\n[YOUR LIVE DATA]';

    // Habits
    if (userData.habits) {
      const h = userData.habits;
      userDataContext += `\n• Habits today: ${h.completedToday}/${h.total} (${h.percentage}%)`;
      if (h.topStreaks.length > 0) {
        userDataContext += `\n• Top streaks: ${h.topStreaks.map(s => `${s.name} (${s.streak}d)`).join(', ')}`;
      }
      if (h.notDoneToday.length > 0) {
        userDataContext += `\n• Not done yet: ${h.notDoneToday.join(', ')}`;
      }
    }

    // Body/Weight
    if (userData.body && userData.body.currentWeight) {
      const b = userData.body;
      userDataContext += `\n• Weight: ${b.currentWeight} lbs`;
      if (b.goalWeight) userDataContext += ` → goal ${b.goalWeight} lbs`;
      if (b.lbsLost && b.lbsLost > 0) userDataContext += ` (${b.lbsLost.toFixed(1)} lbs lost)`;
    }

    // Fasting
    if (userData.fasting) {
      if (userData.fasting.active) {
        userDataContext += `\n• Fasting: ${userData.fasting.hoursIn}h into fast`;
      } else {
        userDataContext += `\n• Fasting: not currently fasting`;
      }
    }

    // Sleep
    if (userData.sleep) {
      userDataContext += `\n• Last sleep: ${userData.sleep.durationH}h, quality ${userData.sleep.quality}/5`;
    }

    // Trading (30 day)
    if (userData.trading && userData.trading.total > 0) {
      const t = userData.trading;
      userDataContext += `\n• Trading (30d): ${t.total} trades, ${t.winRate}% WR, $${t.totalPnl.toFixed(0)} P&L, ${t.rulesFollowed}/${t.total} rules followed`;
    }
  }

  // Build market context if trading-related
  let marketContext = '';
  if (isTrading && marketData && marketData.length > 0) {
    const now = new Date();
    const utcHour = now.getUTCHours();
    const watHour = (utcHour + 1) % 24;
    const session = utcHour >= 7 && utcHour < 16 ? 'LONDON' : utcHour >= 12 && utcHour < 21 ? 'NEW YORK' : 'ASIAN';

    marketContext = `\n\n[LIVE MARKET DATA — ${session} SESSION — ${watHour}:${String(now.getUTCMinutes()).padStart(2, '0')} WAT]\n`;
    marketData.forEach(p => {
      const direction = p.changePct > 0 ? '▲' : p.changePct < 0 ? '▼' : '—';
      marketContext += `${p.symbol}: ${p.price.toFixed(p.symbol.includes('JPY') ? 3 : 5)} ${direction} ${p.changePct > 0 ? '+' : ''}${p.changePct.toFixed(2)}% | H: ${p.high.toFixed(p.symbol.includes('JPY') ? 3 : 5)} L: ${p.low.toFixed(p.symbol.includes('JPY') ? 3 : 5)}\n`;
    });
    marketContext += `\n[Use these prices for specific entry/SL/TP levels. Recommend LONDON session trades only (08:00-17:00 WAT).]`;
  }

  try {
    const messages: Anthropic.MessageParam[] = [
      ...history.slice(-8).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 500,
      system: CIPHER_SYSTEM + profileContext + userDataContext + marketContext,
      messages,
    });

    const reply = response.content[0].type === 'text' ? response.content[0].text : 'GODWILL encountered an error.';
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('[CIPHER]', err);
    return NextResponse.json({ error: 'GODWILL offline — try again' }, { status: 500 });
  }
}
