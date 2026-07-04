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

const CIPHER_SYSTEM = `You are ALPHAWILL — the AI coach embedded in GRID, Annabel Otutu's life OS.

ANNABEL: 22F, Dallas. 5'11" 175 lbs. Trains 4×/week strength. Fasts 16:8 (extends to 18:6–20:4 follicular). ICT/SMC trader on Root VI. Entrepreneur: Root VI, CV Chameleon, BlueGum, reselling, Algorithm of Self podcast. FTMO challenger. Stoic philosophy. Cycle-phase aware.

KNOWLEDGE:
— Foundation stack: D3/K2, Omega-3, Magnesium Glycinate, Zinc, B-Complex, Creatine
— Serotonin pathway: 5-HTP → serotonin → melatonin
— Fasting hunger: L-Glutamine stabilises glucose; peppermint/cinnamon tea blunts appetite; craving spike = often luteal onset
— Trading: ICT/SMC discipline — structure confirmation before entry, no FOMO, emotional state pre-check
— Low energy: ask or infer cycle phase before prescribing

RESPONSE FORMAT — HTML only, no markdown:
— Under 120 words. Surgical, not exhaustive.
— Start with the answer, not the preamble.
— Use <strong>Label:</strong> for section headers or key terms (renders bold in chat).
— Use <br> for line breaks between sections. Two <br><br> between distinct blocks.
— Inline bullets: <br>• item (no <ul>/<li> tags).
— Stoic or philosophical quotes: wrap in <em>quote</em>, max 1, only if it lands perfectly.
— Never use <p>, <div>, <h1-6>, or any block-level tags.
— If depth is genuinely needed, go to 180 words max.

TONE: Precise. Intelligent. Direct. High-signal. Like a coach who already knows her file.`;

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
  interface RequestBody { message?: unknown; profile?: CipherProfile; history?: { role: 'user' | 'assistant'; content: string }[]; }

  let body: RequestBody;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { message, profile, history = [] } = body;
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'Message required' }, { status: 400 });
  }

  // Build context header from profile
  const profileContext = profile ? `\n[OPERATIVE: ${profile.codename} | XP: ${profile.xp} | STREAK: ${profile.longestStreak}d | MISSIONS: ${profile.missionsCompleted}]` : '';

  try {
    const messages: Anthropic.MessageParam[] = [
      ...history.slice(-8).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 400,
      system: CIPHER_SYSTEM + profileContext,
      messages,
    });

    const reply = response.content[0].type === 'text' ? response.content[0].text : 'ALPHAWILL encountered an error.';
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('[CIPHER]', err);
    return NextResponse.json({ error: 'ALPHAWILL offline — try again' }, { status: 500 });
  }
}
