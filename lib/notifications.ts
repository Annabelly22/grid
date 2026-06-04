// GRID — Notification Scheduler
// Time-based daily reminders + cycling motivational quotes
// Runs via setTimeout when app is open / PWA is foregrounded.
// iPhone: requires iOS 16.4+, app added to Home Screen, and permission granted.

import type { Habit } from './gameStore';
import { Storage } from './storage';

// ── 100 Motivational Quotes — Mindset · Money · Discipline · Trading · Patience
const QUOTES: string[] = [
  // MINDSET
  "Your identity is the ceiling of your results. Upgrade who you believe you are first.",
  "The mind that is disciplined in chaos will dominate in calm.",
  "Most people wait to feel ready. Elite people act until they feel ready.",
  "You don't attract what you want. You attract what you are.",
  "Confidence is not 'I will succeed.' Confidence is 'I can handle whatever happens.'",
  "What you tolerate in yourself becomes your standard.",
  "The version of you that hesitates is the version that loses.",
  "Every thought you repeat becomes a belief. Every belief becomes a behaviour.",
  "Your nervous system doesn't know the difference between memory and present — reprogram both.",
  "Iron sharpens iron. Garbage in, garbage out. Guard your inputs ruthlessly.",
  "The conversation you have with yourself is the most consequential one of your life.",
  "You are not your circumstances. You are your response to them.",
  "Small shifts in identity compound into seismic shifts in outcomes.",
  "Fear is a signal, not a verdict. Use it as information, not instruction.",
  "No one thinks about you as much as you think about you. Stop performing. Start executing.",
  "Pressure is a privilege — only the ones in the arena feel it.",
  "The person who wins in ten years is building habits today that look insignificant right now.",
  "Self-awareness without self-discipline is just self-pity with better vocabulary.",
  "You are always one decision from a different trajectory. Make the right one now.",
  "The untrained mind is a liability. The trained mind is an asset that compounds forever.",

  // MONEY
  "Wealth is not about what you earn. It is about the gap between what you earn and what you keep.",
  "Money flows to those who understand it. Study the language before you speak it.",
  "Every dollar you spend is a trade. Make sure you got the better end of the deal.",
  "Rich people buy assets. Everyone else buys liabilities and calls them investments.",
  "Financial freedom is not a number. It is the point where time stops being for sale.",
  "The first million is the hardest because it is more about mindset than mathematics.",
  "Do not diversify until you have something worth diversifying.",
  "Scarcity thinking produces scarcity outcomes. Abundance is an operating system, not a feeling.",
  "Your net worth is a lagging indicator of your decisions from five years ago.",
  "The people building real wealth are boring on purpose. Spectacle is for entertainers.",
  "Pay yourself first is not advice. It is law.",
  "High income without financial intelligence is just a bigger hole to fill.",
  "The best investment on earth is in a business where you control the output.",
  "Broke is a temporary state. Poor is a mindset. Never confuse the two.",
  "Build a machine that makes money while you sleep, or you will spend your life selling hours.",
  "Leverage is the difference between a salary and a business. Choose accordingly.",
  "Every skill you master expands your earning ceiling permanently.",
  "The compound effect is real. Invest ten years ago. Then invest today.",
  "Your relationship with money mirrors your relationship with yourself.",
  "Delay gratification longer than everyone else and you will live better than everyone else.",

  // DISCIPLINE
  "Discipline is not self-punishment. It is self-respect made visible.",
  "Motivation gets you started. Discipline gets you everywhere else.",
  "What looks like talent is usually discipline disguised by time.",
  "The days you least want to show up are the days that matter most to your streak.",
  "You cannot negotiate with the compound effect. Do the reps or miss the result.",
  "Amateurs train until they get it right. Professionals train until they cannot get it wrong.",
  "Your future is built in the five minutes you don't feel like doing it.",
  "A routine you execute imperfectly beats a plan you never start.",
  "Discipline is the only force that cannot be stolen, hacked, or taken from you.",
  "Every act of discipline is a deposit. Every act of laziness is a withdrawal. Check your balance.",
  "The elite don't rely on feeling good. They built systems that don't require it.",
  "What you do in the dark shows up in the light.",
  "Hard choices now mean freedom later. Easy choices now mean struggle later.",
  "The body you want is built by the person you became on the days you didn't want to train.",
  "Consistency is not glamorous. That is exactly why it is rare.",
  "Structure is not a cage. It is the track that makes you fast.",
  "You will never feel like doing the most important thing. Do it anyway.",
  "One hour of focused work beats eight hours of distracted effort every single time.",
  "Discipline without direction is exhausting. Purpose without discipline is fantasy. You need both.",
  "Show up for your future self the way you wish someone had shown up for your past self.",

  // TRADING
  "The market will pay you handsomely for being right about things that are not obvious.",
  "Patience is the trader's most profitable skill. Most people refuse to develop it.",
  "Your edge means nothing without the discipline to execute it every single time.",
  "A loss is only a mistake if you didn't follow your rules. Losses within rules are tuition.",
  "The best trade is often the one you did not take.",
  "Structure first, then entry. Never the other way around.",
  "The market does not owe you a setup. Wait. The next one is coming.",
  "Size for survival, not for greed. You cannot trade from a blown account.",
  "FOMO is the tax you pay for not having a process.",
  "Professional traders lose on individual trades and win on systems. Retail traders do the opposite.",
  "Your emotions are the spread the market charges before execution.",
  "Log every trade. The pattern in your mistakes is where your edge lives.",
  "A great entry is good. Risk management is great. Discipline to hold both is everything.",
  "Markets are the ultimate patience test. The patient hand takes money from the impulsive one.",
  "One trade will not make you rich. One bad trade sequence can make you quit. Protect drawdown.",
  "Correlation between effort and outcome is low in trading and high in preparation.",
  "You are always in a trade: either managing a position or managing your psychology for the next one.",
  "The trade that looks too obvious usually is. Slow down when it feels easy.",
  "The market is a mirror. If you do not like what you see in your results, look inward first.",
  "Win rate is overrated. Risk-to-reward is underrated. Master the second, tolerate the first.",

  // PATIENCE
  "Patience is not passive waiting. It is active trust in the process you already built.",
  "The results you want are on the other side of the boredom you refuse to sit with.",
  "Urgency is the enemy of precision. Slow is smooth. Smooth is fast.",
  "Every master was once a beginner who refused to quit during the ugly middle.",
  "The market tests your patience because patience is the one thing it cannot fake out.",
  "Seasons change without being forced. So does the right setup. Stop chasing.",
  "Long-term thinking is a superpower because almost nobody practises it.",
  "The people who build the most are not the fastest. They are the most consistent over the longest window.",
  "What looks like an overnight success is a decade of compounding nobody documented.",
  "Trees grow in silence. So does real wealth, real skill, and real character.",
  "There is no shortcut to the version of you that can hold the outcome you want.",
  "The longer your time horizon, the fewer competitors you have. Think in years.",
  "Patience gives you information. Impatience burns it.",
  "Waiting for the right moment is not weakness — it is strategy executing.",
  "The fastest path to mastery is the consistent path, not the intense one.",
  "Most people abandon systems right before they compound. Stay.",
  "Boredom is the price of excellence. The ones who get there are comfortable paying it.",
  "A planted seed does not apologise for not being a tree yet. Neither should you.",
  "Stillness is not stagnation. The most powerful things grow quietly.",
  "Your patience is the evidence of your belief in your process. If the process is right, trust it.",
];

function nextQuote(): string {
  const idx = Storage.getQuoteIdx();
  const quote = QUOTES[idx % QUOTES.length];
  Storage.setQuoteIdx((idx + 1) % QUOTES.length);
  return quote;
}

// ── Scheduler ─────────────────────────────────────────────────────────────────
export function scheduleGridNotifications(habits: Habit[]): void {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now   = new Date();
  const today = now.toISOString().split('T')[0];

  type Slot = {
    key: string; hour: number; minute: number;
    title: string; body: string | (() => string);
  };

  const slots: Slot[] = [
    // ── Stack reminders ──────────────────────────────────────────────────────
    {
      key: 'morning', hour: 8, minute: 0,
      title: '⬡ GRID — MORNING PROTOCOL',
      body: 'Take your foundation stack. Set your energy level. Build your streak today.',
    },
    {
      key: 'streak', hour: 18, minute: 0,
      title: '◈ GRID — STREAK PROTECTION',
      body: () => {
        const incomplete = habits.filter(h => !h.completedToday);
        if (incomplete.length === 0) return '✓ All habits done. Streak secured for today.';
        const names = incomplete.slice(0, 2).map(h => h.name).join(', ');
        return `${incomplete.length} habit${incomplete.length > 1 ? 's' : ''} remaining: ${names}${incomplete.length > 2 ? '…' : ''}`;
      },
    },
    {
      key: 'evening', hour: 21, minute: 0,
      title: '🌙 GRID — EVENING STACK',
      body: 'Magnesium Glycinate + Ashwagandha + L-Glutamine. Screens off in 30 min.',
    },
    // ── Motivational quotes (cycle through all 100) ──────────────────────────
    {
      key: 'quote_am', hour: 7, minute: 30,
      title: '⚡ GRID — MINDSET',
      body: () => nextQuote(),
    },
    {
      key: 'quote_pm', hour: 13, minute: 0,
      title: '⚡ GRID — MINDSET',
      body: () => nextQuote(),
    },
    {
      key: 'quote_eve', hour: 20, minute: 0,
      title: '⚡ GRID — MINDSET',
      body: () => nextQuote(),
    },
  ];

  for (const slot of slots) {
    if (Storage.getNotifDate(slot.key) === today) continue;

    const target = new Date(now);
    target.setHours(slot.hour, slot.minute, 0, 0);
    const delay = target.getTime() - now.getTime();
    if (delay < 0) continue;

    setTimeout(() => {
      const fireDate = new Date().toISOString().split('T')[0];
      if (Storage.getNotifDate(slot.key) === fireDate) return;
      Storage.setNotifDate(slot.key, fireDate);
      try {
        const body = typeof slot.body === 'function' ? slot.body() : slot.body;
        new Notification(slot.title, {
          body,
          icon:     '/icon.png',
          badge:    '/icon.png',
          tag:      `grid-${slot.key}`,
          renotify: true,
        } as NotificationOptions);
      } catch {}
    }, delay);
  }
}
