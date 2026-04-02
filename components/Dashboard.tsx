'use client';
import { useState, useEffect } from 'react';
import { UserProfile, Habit, getLevel, CATEGORY_COLORS } from '../lib/gameStore';
import GridLogo from './GridLogo';
import { getCyclePhase, getDayOfCycle, CYCLE_PHASES } from '../lib/supplementData';

type Tab = 'dashboard' | 'habits' | 'missions' | 'body' | 'coach' | 'profile';

interface Props {
  profile: UserProfile;
  habits: Habit[];
  onNavigate: (tab: Tab) => void;
  onCompleteHabit: (id: string) => void;
}

const STOIC_QUOTES = [
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "It is not death that a man should fear, but he should fear never beginning to live.", author: "Marcus Aurelius" },
  { text: "Dwell on the beauty of life. Watch the stars, and see yourself running with them.", author: "Marcus Aurelius" },
  { text: "Confine yourself to the present.", author: "Marcus Aurelius" },
  { text: "The first and greatest victory is to conquer yourself.", author: "Plato" },
  { text: "Make the best use of what is in your power, and take the rest as it happens.", author: "Epictetus" },
  { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
  { text: "Seek not the good in external things; seek it in yourself.", author: "Epictetus" },
  { text: "We suffer more in imagination than in reality.", author: "Seneca" },
  { text: "Luck is what happens when preparation meets opportunity.", author: "Seneca" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "Hard choices, easy life. Easy choices, hard life.", author: "Jerzy Gregorek" },
  { text: "Discipline equals freedom.", author: "Jocko Willink" },
  { text: "You are what you do, not what you say you'll do.", author: "Carl Jung" },
  { text: "If you know the enemy and know yourself, you need not fear the result of a hundred battles.", author: "Sun Tzu" },
  { text: "The cave you fear to enter holds the treasure you seek.", author: "Joseph Campbell" },
  { text: "Between stimulus and response there is a space. In that space is our power to choose.", author: "Viktor Frankl" },
  { text: "Do not pray for an easy life; pray for the strength to endure a difficult one.", author: "Bruce Lee" },
  { text: "I fear not the man who has practiced 10,000 kicks once, but the man who has practiced one kick 10,000 times.", author: "Bruce Lee" },
  { text: "Everything is hard before it is easy.", author: "Goethe" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  { text: "The quality of your life is determined by the quality of your decisions.", author: "Naval Ravikant" },
  { text: "Suffer the pain of discipline or the pain of regret.", author: "Jim Rohn" },
  { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "To improve is to change; to be perfect is to change often.", author: "Winston Churchill" },
  { text: "Become who you are.", author: "Friedrich Nietzsche" },
  { text: "The only way out is through.", author: "Robert Frost" },
  { text: "Rest at the end, not in the middle.", author: "Kobe Bryant" },
];

function getDailyQuote() {
  return STOIC_QUOTES[new Date().getDate() % STOIC_QUOTES.length];
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'LATE NIGHT OPS';
  if (h < 12) return 'MORNING BRIEF';
  if (h < 17) return 'AFTERNOON SITREP';
  return 'EVENING DEBRIEF';
}

export default function Dashboard({ profile, habits, onNavigate, onCompleteHabit }: Props) {
  const [cycleStart, setCycleStart] = useState<string | null>(null);

  useEffect(() => {
    const sc = localStorage.getItem('grid_cycle_start');
    if (sc) setCycleStart(sc);
  }, []);

  const lvl        = getLevel(profile.xp);
  const quote      = getDailyQuote();
  const incomplete = habits.filter(h => !h.completedToday);
  const doneCount  = habits.filter(h => h.completedToday).length;
  const total      = habits.length;
  const lifeScore  = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const allDone    = total > 0 && doneCount === total;

  const topStreak      = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  const topStreakHabit = habits.find(h => h.streak === topStreak && h.streak > 0);

  const phase      = getCyclePhase(cycleStart);
  const dayOfCycle = getDayOfCycle(cycleStart);
  const phaseData  = phase ? CYCLE_PHASES[phase] : null;

  return (
    <div className="content-area" style={{ paddingBottom: 80 }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--ng-border)' }}>
        <div className="flex items-center justify-between">
          <GridLogo variant="lockup" size={36} />
          <div className="text-right">
            <div className="font-orbitron font-bold" style={{ fontSize: 11, color: 'var(--ng-amber)', letterSpacing: '2px' }}>
              {profile.codename}
            </div>
            <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px' }}>
              {lvl.title} · LV{lvl.level} · {profile.xp.toLocaleString()} XP
            </div>
          </div>
        </div>
        <div style={{ height: 2, background: 'var(--ng-border)', marginTop: 10, borderRadius: 1, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${lvl.progress}%`, background: 'linear-gradient(90deg, var(--ng-green), var(--ng-cyan))', transition: 'width 0.5s ease' }} />
        </div>
      </div>

      <div className="px-4">

        {/* ── Daily quote — atmospheric, no box ──────────────── */}
        <div style={{ padding: '28px 4px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, color: 'rgba(255,184,0,0.12)', fontFamily: 'Georgia, serif', lineHeight: 0.7, userSelect: 'none', marginBottom: 10 }}>"</div>
          <div className="font-mono" style={{ fontSize: 13, color: 'rgba(232,232,240,0.8)', lineHeight: 1.9, fontStyle: 'italic' }}>
            {quote.text}
          </div>
          <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-amber)', letterSpacing: '3px', marginTop: 14 }}>
            {quote.author}
          </div>
          <div className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-dimmer)', letterSpacing: '2px', marginTop: 4 }}>
            {getGreeting()}
          </div>
        </div>

        {/* ── Thin divider ───────────────────────────────────── */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--ng-border), transparent)', marginBottom: 24 }} />

        {/* ── Streak hero — ambient, no hard border ──────────── */}
        {topStreak > 0 ? (
          <div style={{ padding: '20px 16px 24px', marginBottom: 24, background: 'linear-gradient(135deg, rgba(255,184,0,0.07) 0%, rgba(255,184,0,0.02) 100%)', borderRadius: 3 }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-amber)', letterSpacing: '3px', marginBottom: 8, opacity: 0.8 }}>ACTIVE STREAK</div>
                {topStreakHabit && (
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', marginBottom: 10 }}>
                    {topStreakHabit.icon} {topStreakHabit.name}
                  </div>
                )}
                <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-amber)', letterSpacing: '2px', opacity: 0.7 }}>
                  DON'T BREAK IT
                </div>
              </div>
              <div className="font-orbitron font-black" style={{ fontSize: 64, color: 'var(--ng-amber)', lineHeight: 1, textShadow: '0 0 40px rgba(255,184,0,0.35)' }}>
                {topStreak}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: '20px 16px 24px', marginBottom: 24, background: 'rgba(255,255,255,0.02)', borderRadius: 3 }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '3px', marginBottom: 6 }}>NO ACTIVE STREAK</div>
                <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-dimmer)' }}>Complete a habit to start one</div>
              </div>
              <div className="font-orbitron font-black" style={{ fontSize: 64, color: 'rgba(42,42,58,0.8)', lineHeight: 1 }}>0</div>
            </div>
          </div>
        )}

        {/* ── ALL DONE celebration ───────────────────────────── */}
        {allDone && (
          <div style={{ padding: '28px 0', textAlign: 'center', marginBottom: 20 }}>
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--ng-green), transparent)', marginBottom: 20 }} />
            <div className="font-orbitron font-black" style={{ fontSize: 12, color: 'var(--ng-green)', letterSpacing: '4px', marginBottom: 8 }}>
              ALL PROTOCOLS COMPLETE
            </div>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>
              {total} habits · {lifeScore}% today
            </div>
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--ng-green), transparent)', marginTop: 20 }} />
          </div>
        )}

        {/* ── Today's protocol — grouped container ──────────── */}
        {total === 0 ? (
          <div style={{ padding: '40px 0', textAlign: 'center' }}>
            <div className="font-orbitron" style={{ fontSize: 10, color: 'var(--ng-muted)', letterSpacing: '2px', marginBottom: 12 }}>NO PROTOCOL YET</div>
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--ng-dimmer)', lineHeight: 1.7, marginBottom: 20 }}>
              Build your daily habit stack<br />to start earning XP and streaks.
            </div>
            <button onClick={() => onNavigate('habits')} className="btn-green" style={{ fontSize: 9, padding: '8px 24px' }}>
              BUILD PROTOCOL →
            </button>
          </div>
        ) : !allDone && (
          <div style={{ marginBottom: 24 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '3px' }}>TODAY'S PROTOCOL</div>
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>{doneCount}/{total}</div>
            </div>

            {/* Progress bar */}
            <div style={{ height: 2, background: 'var(--ng-border)', marginBottom: 12, borderRadius: 1, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${lifeScore}%`, background: 'var(--ng-green)', transition: 'width 0.5s ease' }} />
            </div>

            {/* Grouped habit list — single container, dividers between items */}
            <div style={{ background: 'var(--ng-surface)', border: '1px solid var(--ng-border)', borderRadius: 3, overflow: 'hidden' }}>
              {incomplete.map((h, i) => {
                const color = CATEGORY_COLORS[h.category];
                return (
                  <button key={h.id} onClick={() => onCompleteHabit(h.id)}
                    className="w-full text-left"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '14px 16px',
                      background: 'transparent',
                      borderBottom: i < incomplete.length - 1 ? '1px solid var(--ng-border)' : 'none',
                      borderLeft: `3px solid ${color}`,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      minHeight: 56,
                    }}>
                    <div style={{ width: 20, height: 20, border: `1.5px solid ${color}44`, borderRadius: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{h.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div className="font-mono" style={{ fontSize: 12, color: 'var(--ng-text)' }}>{h.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                        <span className="font-orbitron" style={{ fontSize: 8, color, letterSpacing: '1px' }}>{h.category.toUpperCase()}</span>
                        <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-amber)', letterSpacing: '1px' }}>+{h.xpReward}xp</span>
                        {h.streak > 0 && <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-amber)' }}>🔥 {h.streak}d</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {doneCount > 0 && (
              <div style={{ marginTop: 8, padding: '7px 12px', background: 'rgba(0,255,65,0.04)' }}>
                <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-green)', letterSpacing: '2px' }}>
                  ✓ LOGGED: {doneCount} habit{doneCount !== 1 ? 's' : ''}
                </span>
              </div>
            )}

            <button onClick={() => onNavigate('habits')} className="w-full font-orbitron"
              style={{ marginTop: 8, padding: '9px', fontSize: 8, letterSpacing: '2px', color: 'var(--ng-dimmer)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              MANAGE HABITS →
            </button>
          </div>
        )}

        {/* ── Phase context strip ────────────────────────────── */}
        {phaseData && (
          <button onClick={() => onNavigate('body')} className="w-full text-left"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: phaseData.bg, borderRadius: 3, cursor: 'pointer', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>{phaseData.icon}</span>
              <div>
                <div className="font-orbitron" style={{ fontSize: 9, color: phaseData.color, letterSpacing: '2px' }}>
                  {phaseData.label} PHASE · DAY {dayOfCycle}
                </div>
                <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', marginTop: 2 }}>{phaseData.headline}</div>
              </div>
            </div>
            <span className="font-orbitron" style={{ fontSize: 8, color: phaseData.color, letterSpacing: '1px', flexShrink: 0 }}>VIEW →</span>
          </button>
        )}

      </div>
    </div>
  );
}
