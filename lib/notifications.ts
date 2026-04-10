// GRID — Notification Scheduler
// Time-based daily reminders + cycling motivational quotes
// Runs via setTimeout when app is open / PWA is foregrounded.
// iPhone: requires iOS 16.4+, app added to Home Screen, and permission granted.

import type { Habit } from './gameStore';
import { Storage } from './storage';

// ── 100 Motivational Quotes ───────────────────────────────────────────────────
const QUOTES: string[] = [
  "The top 1% don't find motivation. They build discipline that doesn't need it.",
  "Your body is your highest-performing asset. Treat it like one.",
  "Every habit you complete today is a vote for the person you're becoming.",
  "Success is not owned. It's rented — and rent is due every single day.",
  "The woman who wins is the one who shows up when no one is watching.",
  "Discipline is the bridge between your goals and your results.",
  "Markets don't care about your feelings. Your body doesn't care about your excuses.",
  "You are one decision away from a completely different life.",
  "The top 1% aren't smarter. They're more consistent.",
  "Protect your energy like it's your most valuable resource — because it is.",
  "A strong body builds a stronger mind. Never skip both.",
  "Your habits are your résumé. What does yours say?",
  "Ordinary people avoid discomfort. Extraordinary people seek it.",
  "The compound effect is real. Show up small every day.",
  "Your cycle is a superpower. Learn to use it.",
  "Revenue follows discipline. Discipline follows routine.",
  "Every missed rep is a vote for the old version of you.",
  "The top 1% don't negotiate with their alarm clock.",
  "Wealth is not built in bull markets. It's built in the preparation before them.",
  "You were not made to be average.",
  "Your supplements, your sleep, your mindset — non-negotiables.",
  "The market rewards those who think in decades, not days.",
  "Being elite means doing the boring things brilliantly.",
  "No one is coming to save you. And that's the most freeing thing you'll ever realize.",
  "Compound interest works on habits the same way it works on money.",
  "Your 6am is building your 6pm results.",
  "The greatest investment you can make is in yourself.",
  "Progress, not perfection. Every single day.",
  "She who controls her cortisol, controls her results.",
  "Most people overestimate a year and underestimate five. Play the long game.",
  "Rest is not weakness. Recovery is how champions are built.",
  "Your standards determine your outcomes. Raise them.",
  "The market is a device for transferring money from the impatient to the patient.",
  "Winning is a habit. So is losing. Choose deliberately.",
  "You cannot outrun a bad diet. You cannot out-discipline a bad mindset.",
  "Every great result was once just a great decision made consistently.",
  "The top 1% aren't lucky. They're prepared when luck arrives.",
  "Protect your mornings like a war general protects the objective.",
  "Your body keeps score. Make sure it's a score worth keeping.",
  "Execution is the only strategy that matters.",
  "The difference between where you are and where you want to be is your daily habits.",
  "Trade the market you have, not the market you want.",
  "Sovereignty begins with the self. Body, mind, and money — in that order.",
  "Consistency is the most underrated edge in business and in life.",
  "Every day you delay is a day you give to your competition.",
  "Your future self is watching. Make her proud.",
  "The supplement you skip, the session you miss — it all adds up.",
  "Discipline protects your dreams when motivation disappears.",
  "You don't need more time. You need more focus.",
  "The best traders in the world all share one trait: ruthless patience.",
  "Your mindset is the only variable you control in every situation.",
  "Small wins compounded become impossible to ignore.",
  "She builds differently. Not louder — deeper.",
  "The world rewards those who outwork, out-think, and out-recover their competition.",
  "Your journal is your edge. Write in it.",
  "A tired body produces a tired strategy. Sleep is performance.",
  "Be the woman who makes other women want to level up.",
  "Mastery is boredom executed at the highest level.",
  "Your goals don't care about your mood. Show up anyway.",
  "Risk management is not fear. It's intelligence.",
  "The top 1% have the same 24 hours. They guard them differently.",
  "Every system you build removes the need for willpower.",
  "Build in silence. Let your results make the noise.",
  "Hormones, habits, and hard work — master all three.",
  "You are not behind. You are exactly where your actions have brought you.",
  "Wealth without health is just an expensive funeral.",
  "The only trader you should compare yourself to is the one you were yesterday.",
  "If you wouldn't invest in a business you don't understand, don't trade it.",
  "Strength is built in the reps nobody sees.",
  "Your worth is not your net worth. But your net worth reflects your disciplines.",
  "Great trading is 80% emotional control and 20% technical skill.",
  "The woman who invests in her body, her knowledge, and her capital is unstoppable.",
  "Results require repetition. Stop looking for shortcuts.",
  "Self-mastery is the original wealth strategy.",
  "Your gut health determines your brain health. Feed both well.",
  "The market will test your resolve before it rewards your patience.",
  "Show up like you're already the person you're trying to become.",
  "Excellence is not an act. It's a habit formed in private.",
  "You are the product of your inputs. Curate them ruthlessly.",
  "High performance is not sustainable without high recovery.",
  "The top 1% are allergic to average. Make mediocrity uncomfortable.",
  "Every completed habit is a signal to your nervous system: I am this person.",
  "Clarity is the beginning of all power. Know exactly what you want.",
  "The edge is in the process, not the outcome.",
  "You don't rise to the level of your goals. You fall to the level of your systems.",
  "Do the work when you don't feel like it. That's when it counts most.",
  "Your biology is not your destiny. Your choices are.",
  "A structured day is a powerful day. Chaos is for amateurs.",
  "The best version of you is not found in comfort zones.",
  "Track everything. You can't improve what you don't measure.",
  "Think like the CEO of your own life. What would she do right now?",
  "Position sizing is life sizing. Know your risk before you enter.",
  "Every morning is a reset. Take it seriously.",
  "The woman who reads, rests, and trains intelligently needs no luck.",
  "Your internal dialogue creates your external results.",
  "Big goals require big preparation. Start today.",
  "The 1% don't hope for good days. They build good systems.",
  "Your luteal phase is power conserved. Your follicular phase is power expressed. Use both.",
  "The market rewards preparation and punishes improvisation. So does life.",
  "You were not built to blend in. Execute accordingly.",
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
