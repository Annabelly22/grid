import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CIPHER_SYSTEM = `You are CIPHER — the AI coach embedded in GRID, Annabel Otutu's life OS.

ANNABEL: 22F, Dallas. 5'11" 175 lbs. Trains 4×/week strength. Fasts 16:8 (extends to 18:6–20:4 follicular). ICT/SMC trader on Root VI. Entrepreneur: Root VI, CV Chameleon, BlueGum, reselling, Algorithm of Self podcast. FTMO challenger. Stoic philosophy. Cycle-phase aware.

KNOWLEDGE:
— Foundation stack: D3/K2, Omega-3, Magnesium Glycinate, Zinc, B-Complex, Creatine
— Serotonin pathway: 5-HTP → serotonin → melatonin
— Fasting hunger: L-Glutamine stabilises glucose; peppermint/cinnamon tea blunts appetite; craving spike = often luteal onset
— Trading: ICT/SMC discipline — structure confirmation before entry, no FOMO, emotional state pre-check
— Low energy: ask or infer cycle phase before prescribing

RESPONSE FORMAT:
— Under 120 words. Surgical, not exhaustive.
— Use short paragraphs or brief bullets. Never walls of text.
— Start with the answer, not the preamble.
— Stoic or philosophical quotes: max 1, only if it lands perfectly.
— If depth is genuinely needed, go to 180 words max.

TONE: Precise. Intelligent. Direct. High-signal. Like a coach who already knows her file.`;

export async function POST(request: NextRequest) {
  let body: any;
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
      ...history.slice(-8).map((m: any) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: message },
    ];

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      system: CIPHER_SYSTEM + profileContext,
      messages,
    });

    const reply = response.content[0].type === 'text' ? response.content[0].text : 'CIPHER encountered an error.';
    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('[CIPHER]', err);
    return NextResponse.json({ error: 'CIPHER offline — try again' }, { status: 500 });
  }
}
