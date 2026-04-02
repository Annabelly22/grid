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
  { text: "Make the best use of what is in your power, and take the rest as it happens.", author: "Epictetus" },
  { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus" },
  { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
  { text: "Dwell on the beauty of life. Watch the stars, and see yourself running with them.", author: "Marcus Aurelius" },
  { text: "Confine yourself to the present.", author: "Marcus Aurelius" },
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

  const topStreak     = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  const topStreakHabit = habits.find(h => h.streak === topStreak && h.streak > 0);

  const phase     = getCyclePhase(cycleStart);
  const dayOfCycle = getDayOfCycle(cycleStart);
  const phaseData = phase ? CYCLE_PHASES[phase] : null;

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
        {/* XP progress — thin line */}
        <div style={{ height: 2, background: 'var(--ng-border)', marginTop: 10, borderRadius: 1, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${lvl.progress}%`, background: 'linear-gradient(90deg, var(--ng-green), var(--ng-cyan))', transition: 'width 0.5s ease' }} />
        </div>
      </div>

      <div className="px-4 pt-4">

        {/* ── Daily quote ────────────────────────────────────── */}
        <div className="p-3 mb-4" style={{ background: 'var(--ng-surface)', borderLeft: '3px solid var(--ng-amber)', borderRadius: 2 }}>
          <div className="font-orbitron mb-1" style={{ fontSize: 8, color: 'var(--ng-amber)', letterSpacing: '2px' }}>{getGreeting()}</div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--ng-text)', lineHeight: 1.7, fontStyle: 'italic' }}>
            "{quote.text}"
          </div>
          <div className="font-orbitron mt-1" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>— {quote.author}</div>
        </div>

        {/* ── Streak hero ────────────────────────────────────── */}
        {topStreak > 0 ? (
          <div className="p-4 mb-4" style={{ background: 'rgba(255,184,0,0.05)', border: '1px solid rgba(255,184,0,0.2)', borderRadius: 2 }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-amber)', letterSpacing: '2px', marginBottom: 6 }}>BEST ACTIVE STREAK</div>
                {topStreakHabit && (
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>
                    {topStreakHabit.icon} {topStreakHabit.name}
                  </div>
                )}
                <div className="font-orbitron mt-2" style={{ fontSize: 8, color: 'var(--ng-amber)', letterSpacing: '1px' }}>
                  DON'T BREAK IT
                </div>
              </div>
              <div className="font-orbitron font-black" style={{ fontSize: 56, color: 'var(--ng-amber)', lineHeight: 1, textShadow: '0 0 28px rgba(255,184,0,0.45)' }}>
                {topStreak}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 mb-4" style={{ background: 'var(--ng-surface)', border: '1px solid var(--ng-border)', borderRadius: 2 }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '2px', marginBottom: 4 }}>NO ACTIVE STREAK</div>
                <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-dimmer)' }}>Complete a habit to start one</div>
              </div>
              <div className="font-orbitron font-black" style={{ fontSize: 56, color: 'var(--ng-border)', lineHeight: 1 }}>0</div>
            </div>
          </div>
        )}

        {/* ── ALL DONE celebration ───────────────────────────── */}
        {allDone && (
          <div className="p-4 mb-4 text-center" style={{ background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.25)', borderRadius: 2 }}>
            <div className="font-orbitron font-black" style={{ fontSize: 13, color: 'var(--ng-green)', letterSpacing: '3px', marginBottom: 6 }}>
              ◆ ALL PROTOCOLS COMPLETE
            </div>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>
              {total} habits logged · {lifeScore}% today
            </div>
          </div>
        )}

        {/* ── Today's protocol ──────────────────────────────── */}
        {total === 0 ? (
          <div className="mb-4 p-5 text-center" style={{ background: 'var(--ng-surface)', border: '1px dashed var(--ng-border)', borderRadius: 2 }}>
            <div className="font-orbitron mb-2" style={{ fontSize: 10, color: 'var(--ng-muted)', letterSpacing: '2px' }}>NO PROTOCOL YET</div>
            <div className="font-mono mb-4" style={{ fontSize: 11, color: 'var(--ng-dimmer)', lineHeight: 1.6 }}>
              Build your daily habit stack to start earning XP and streaks.
            </div>
            <button onClick={() => onNavigate('habits')} className="btn-green" style={{ fontSize: 9, padding: '8px 20px' }}>
              BUILD PROTOCOL →
            </button>
          </div>
        ) : !allDone && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '2px' }}>TODAY'S PROTOCOL</div>
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>{doneCount}/{total}</div>
            </div>
            <div style={{ height: 2, background: 'var(--ng-border)', marginBottom: 12, borderRadius: 1, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${lifeScore}%`, background: 'var(--ng-green)', transition: 'width 0.5s ease' }} />
            </div>

            {incomplete.map(h => {
              const color = CATEGORY_COLORS[h.category];
              return (
                <button key={h.id} onClick={() => onCompleteHabit(h.id)} className="w-full text-left mb-2"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
                    background: 'var(--ng-surface)', border: `1px solid var(--ng-border)`,
                    borderLeft: `3px solid ${color}`, borderRadius: 2, cursor: 'pointer',
                    transition: 'background 0.15s', minHeight: 54,
                  }}>
                  <div style={{ width: 22, height: 22, border: `2px solid ${color}55`, borderRadius: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{h.icon}</span>
                  <div className="flex-1">
                    <div className="font-mono" style={{ fontSize: 12, color: 'var(--ng-text)' }}>{h.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-orbitron" style={{ fontSize: 8, color, letterSpacing: '1px' }}>{h.category.toUpperCase()}</span>
                      <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-amber)', letterSpacing: '1px' }}>+{h.xpReward}xp</span>
                      {h.streak > 0 && <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-amber)' }}>🔥 {h.streak}d</span>}
                    </div>
                  </div>
                </button>
              );
            })}

            {doneCount > 0 && (
              <div className="mt-1 mb-3 p-2" style={{ background: 'rgba(0,255,65,0.04)', border: '1px solid rgba(0,255,65,0.12)', borderRadius: 2 }}>
                <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-green)', letterSpacing: '2px' }}>
                  ✓ LOGGED: {doneCount} habit{doneCount !== 1 ? 's' : ''}
                </div>
              </div>
            )}

            <button onClick={() => onNavigate('habits')} className="w-full font-orbitron"
              style={{ padding: '9px', fontSize: 9, letterSpacing: '2px', color: 'var(--ng-muted)', background: 'transparent', border: '1px solid var(--ng-border)', borderRadius: 2, cursor: 'pointer' }}>
              MANAGE HABITS →
            </button>
          </div>
        )}

        {/* ── Phase context strip ────────────────────────────── */}
        {phaseData && (
          <button onClick={() => onNavigate('body')} className="w-full text-left mb-4"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: phaseData.bg, border: `1px solid ${phaseData.color}44`, borderRadius: 2, cursor: 'pointer' }}>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 16 }}>{phaseData.icon}</span>
              <div>
                <div className="font-orbitron" style={{ fontSize: 9, color: phaseData.color, letterSpacing: '2px' }}>
                  {phaseData.label} PHASE · DAY {dayOfCycle}
                </div>
                <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>{phaseData.headline}</div>
              </div>
            </div>
            <span className="font-orbitron" style={{ fontSize: 8, color: phaseData.color, letterSpacing: '1px', flexShrink: 0 }}>VIEW →</span>
          </button>
        )}

      </div>
    </div>
  );
}
