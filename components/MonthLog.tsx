'use client';
import { useState, useEffect } from 'react';

const WORKOUT_KEY  = 'grid_workout_week';
const STEPS_KEY    = 'grid_steps';
const HABIT_LOG_KEY = 'grid_habit_log';
const STEPS_GOAL   = 10000;

const ACTIVITIES = [
  { id: 'gym',   icon: '🏋️', color: '#FF453A', label: 'GYM'   },
  { id: 'run',   icon: '🏃', color: '#30D158', label: 'RUN'   },
  { id: 'yoga',  icon: '🧘', color: '#BF5AF2', label: 'YOGA'  },
  { id: 'swim',  icon: '🏊', color: '#64D2FF', label: 'SWIM'  },
  { id: 'cycle', icon: '🚴', color: '#FF9F0A', label: 'CYCLE' },
  { id: 'hike',  icon: '🥾', color: '#FF6B2B', label: 'HIKE'  },
  { id: 'rest',  icon: '😴', color: '#8E8E93', label: 'REST'  },
];

const DAY_HEADERS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

export interface HabitSnapshot { completed: number; total: number; }

function getCalendarDays(year: number, month: number): Date[] {
  const firstDay    = new Date(year, month, 1);
  const lastDay     = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // shift so Mon=0
  const endOffset   = lastDay.getDay() === 0 ? 0 : 7 - lastDay.getDay();
  const days: Date[] = [];
  for (let i = -startOffset; i < lastDay.getDate() + endOffset; i++) {
    days.push(new Date(year, month, 1 + i));
  }
  return days;
}

function dateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function MonthLog() {
  const today    = new Date();
  const todayStr = dateKey(today);

  const [year,     setYear]     = useState(today.getFullYear());
  const [month,    setMonth]    = useState(today.getMonth());
  const [workouts, setWorkouts] = useState<Record<string, string[]>>({});
  const [steps,    setSteps]    = useState<Record<string, number>>({});
  const [habitLog, setHabitLog] = useState<Record<string, HabitSnapshot>>({});
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    try {
      const w = localStorage.getItem(WORKOUT_KEY);
      if (w) setWorkouts(JSON.parse(w));
      const s = localStorage.getItem(STEPS_KEY);
      if (s) setSteps(JSON.parse(s));
      const h = localStorage.getItem(HABIT_LOG_KEY);
      if (h) setHabitLog(JSON.parse(h));
    } catch {}
  }, []);

  const canGoNext = !(year === today.getFullYear() && month === today.getMonth());

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (!canGoNext) return;
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const calDays     = getCalendarDays(year, month);
  const monthLabel  = new Date(year, month).toLocaleString('en-US', { month: 'long' }).toUpperCase();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthDays   = Array.from({ length: daysInMonth }, (_, i) => dateKey(new Date(year, month, i + 1)));

  // ── Monthly stats ────────────────────────────────────────────────
  const activeDays = monthDays.filter(d => (workouts[d] || []).some(a => a !== 'rest')).length;
  const restDays   = monthDays.filter(d => (workouts[d] || []).includes('rest') && !(workouts[d] || []).some(a => a !== 'rest')).length;
  const goalDays   = monthDays.filter(d => (steps[d] || 0) >= STEPS_GOAL).length;

  const actCounts: Record<string, number> = {};
  for (const d of monthDays) {
    for (const a of (workouts[d] || [])) {
      if (a !== 'rest') actCounts[a] = (actCounts[a] || 0) + 1;
    }
  }

  const loggedHabitDays = monthDays.filter(d => habitLog[d] && habitLog[d].total > 0);
  const avgHabitPct = loggedHabitDays.length > 0
    ? Math.round(loggedHabitDays.reduce((s, d) => s + habitLog[d].completed / habitLog[d].total, 0) / loggedHabitDays.length * 100)
    : null;

  const totalSteps = monthDays.reduce((s, d) => s + (steps[d] || 0), 0);

  // ── Helper: habit completion color ───────────────────────────────
  function habitColor(key: string): string | null {
    const hl = habitLog[key];
    if (!hl || hl.total === 0) return null;
    const pct = hl.completed / hl.total;
    if (pct >= 1)    return 'var(--ng-green)';
    if (pct >= 0.5)  return 'var(--ng-amber)';
    return '#FF453A';
  }

  return (
    <div>
      {/* ── Month nav ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <button onClick={prevMonth}
          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--ng-border)', background: 'transparent', color: 'var(--ng-text)', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ‹
        </button>
        <div style={{ textAlign: 'center' }}>
          <div className="font-orbitron font-bold" style={{ fontSize: 13, color: 'var(--ng-text)', letterSpacing: '3px' }}>{monthLabel}</div>
          <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '2px' }}>{year}</div>
        </div>
        <button onClick={nextMonth} disabled={!canGoNext}
          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--ng-border)', background: 'transparent', color: canGoNext ? 'var(--ng-text)' : 'var(--ng-dimmer)', fontSize: 16, cursor: canGoNext ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: canGoNext ? 1 : 0.3 }}>
          ›
        </button>
      </div>

      {/* ── Day headers ───────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 3 }}>
        {DAY_HEADERS.map((d, i) => (
          <div key={i} className="font-orbitron"
            style={{ textAlign: 'center', fontSize: 7, color: i >= 5 ? 'var(--ng-amber)' : 'var(--ng-dimmer)', letterSpacing: '1px', padding: '3px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* ── Calendar grid ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {calDays.map(d => {
          const k           = dateKey(d);
          const isThisMonth = d.getMonth() === month;
          const isToday     = k === todayStr;
          const isFuture    = k > todayStr;
          const dayActs     = workouts[k] || [];
          const daySteps    = steps[k] || 0;
          const hColor      = habitColor(k);
          const hl          = habitLog[k];
          const nonRest     = dayActs.filter(a => a !== 'rest');
          const isRest      = dayActs.includes('rest');
          const hasData     = dayActs.length > 0 || hColor || daySteps > 0;
          const isExpanded  = expanded === k;

          return (
            <button
              key={k}
              onClick={() => isThisMonth && !isFuture && hasData ? setExpanded(isExpanded ? null : k) : undefined}
              style={{
                position: 'relative',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 2, padding: '5px 2px 6px',
                background: isToday
                  ? 'rgba(48,209,88,0.08)'
                  : isExpanded ? 'rgba(255,184,0,0.06)' : 'var(--ng-surface)',
                border: `0.5px solid ${isToday ? 'var(--ng-green)' : isExpanded ? 'rgba(255,184,0,0.4)' : 'var(--ng-border)'}`,
                borderRadius: 8,
                opacity: isThisMonth ? (isFuture ? 0.25 : 1) : 0.1,
                cursor: isThisMonth && !isFuture && hasData ? 'pointer' : 'default',
                transition: 'all 0.15s',
                minHeight: 62,
              }}
            >
              {/* Date */}
              <span className="font-orbitron" style={{
                fontSize: 10, lineHeight: 1,
                color: isToday ? 'var(--ng-green)' : 'var(--ng-text)',
                fontWeight: isToday ? 700 : 400,
              }}>
                {d.getDate()}
              </span>

              {/* Habit ring dot */}
              {hColor && (
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: hColor, boxShadow: `0 0 4px ${hColor}` }} />
              )}

              {/* Workout icons — max 2 */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                {nonRest.slice(0, 2).map(a => {
                  const act = ACTIVITIES.find(x => x.id === a);
                  return act ? (
                    <span key={a} style={{ fontSize: 11, lineHeight: 1 }}>{act.icon}</span>
                  ) : null;
                })}
                {isRest && nonRest.length === 0 && (
                  <span style={{ fontSize: 11, lineHeight: 1 }}>😴</span>
                )}
              </div>

              {/* Step goal dot */}
              {daySteps >= STEPS_GOAL && (
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--ng-cyan)', boxShadow: '0 0 3px var(--ng-cyan)' }} />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Expanded day detail ───────────────────────────────── */}
      {expanded && (() => {
        const k = expanded;
        const dayActs  = workouts[k] || [];
        const daySteps = steps[k] || 0;
        const hl       = habitLog[k];
        const d        = new Date(k + 'T12:00:00');
        const nonRest  = dayActs.filter(a => a !== 'rest');
        return (
          <div style={{ marginTop: 10, padding: '14px', background: 'rgba(255,184,0,0.04)', border: '0.5px solid rgba(255,184,0,0.2)', borderRadius: 12 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <div className="font-orbitron font-bold" style={{ fontSize: 11, color: 'var(--ng-amber)', letterSpacing: '2px' }}>
                {d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
              </div>
              <button onClick={() => setExpanded(null)} style={{ background: 'none', border: 'none', color: 'var(--ng-muted)', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {hl && hl.total > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px' }}>HABITS</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 48, height: 4, background: 'var(--ng-border)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round(hl.completed / hl.total * 100)}%`, background: habitColor(k) || 'var(--ng-green)', borderRadius: 2 }} />
                    </div>
                    <span className="font-mono" style={{ fontSize: 10, color: habitColor(k) || 'var(--ng-green)' }}>{hl.completed}/{hl.total}</span>
                  </div>
                </div>
              )}
              {nonRest.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px' }}>TRAINING</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {nonRest.map(a => {
                      const act = ACTIVITIES.find(x => x.id === a);
                      return act ? (
                        <span key={a} className="font-orbitron" style={{ fontSize: 9, color: act.color, border: `1px solid ${act.color}44`, padding: '2px 7px', borderRadius: 4 }}>{act.icon} {act.label}</span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
              {dayActs.includes('rest') && nonRest.length === 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px' }}>TRAINING</span>
                  <span className="font-orbitron" style={{ fontSize: 9, color: '#8E8E93' }}>😴 REST DAY</span>
                </div>
              )}
              {daySteps > 0 && (
                <div className="flex items-center justify-between">
                  <span className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px' }}>STEPS</span>
                  <span className="font-mono" style={{ fontSize: 10, color: daySteps >= STEPS_GOAL ? 'var(--ng-cyan)' : 'var(--ng-text)' }}>
                    {daySteps.toLocaleString()} {daySteps >= STEPS_GOAL ? '✓' : `/ ${STEPS_GOAL.toLocaleString()}`}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Legend ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 14, padding: '10px 12px', background: 'var(--ng-surface)', border: '0.5px solid var(--ng-border)', borderRadius: 10 }}>
        <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
          {[
            { dot: 'var(--ng-green)',  label: 'All habits' },
            { dot: 'var(--ng-amber)',  label: 'Partial'    },
            { dot: '#FF453A',          label: 'Few habits' },
            { dot: 'var(--ng-cyan)',   label: '10k steps'  },
          ].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: l.dot }} />
              <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Monthly stats ─────────────────────────────────────── */}
      <div style={{ marginTop: 16, padding: '16px', background: 'var(--ng-surface)', border: '0.5px solid var(--ng-border)', borderRadius: 14 }}>
        <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-amber)', letterSpacing: '3px', marginBottom: 14 }}>MONTHLY SUMMARY</div>

        {/* Big numbers row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'ACTIVE', value: activeDays, color: 'var(--ng-green)', sub: 'days' },
            { label: 'REST',   value: restDays,   color: '#8E8E93',          sub: 'days' },
            { label: '10K ✓',  value: goalDays,   color: 'var(--ng-cyan)',   sub: 'days' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center', padding: '10px 6px', background: 'var(--ng-bg)', borderRadius: 10 }}>
              <div className="font-orbitron font-black" style={{ fontSize: 26, color: stat.color, lineHeight: 1, textShadow: `0 0 20px ${stat.color}44` }}>{stat.value}</div>
              <div className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-muted)', letterSpacing: '1px', marginTop: 4 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Activity breakdown */}
        {Object.keys(actCounts).length > 0 && (
          <>
            <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '2px', marginBottom: 8 }}>BY ACTIVITY</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {ACTIVITIES.filter(a => actCounts[a.id]).sort((a, b) => (actCounts[b.id] || 0) - (actCounts[a.id] || 0)).map(a => (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: `${a.color}12`, border: `0.5px solid ${a.color}44`, borderRadius: 20 }}>
                  <span style={{ fontSize: 12 }}>{a.icon}</span>
                  <span className="font-orbitron" style={{ fontSize: 9, color: a.color, letterSpacing: '1px' }}>×{actCounts[a.id]}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Habits + steps rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {avgHabitPct !== null && (
            <div className="flex items-center justify-between">
              <span className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px' }}>HABIT COMPLETION</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 80, height: 4, background: 'var(--ng-border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${avgHabitPct}%`, background: avgHabitPct >= 80 ? 'var(--ng-green)' : avgHabitPct >= 50 ? 'var(--ng-amber)' : '#FF453A', borderRadius: 2, transition: 'width 0.4s ease' }} />
                </div>
                <span className="font-orbitron font-bold" style={{ fontSize: 11, color: avgHabitPct >= 80 ? 'var(--ng-green)' : avgHabitPct >= 50 ? 'var(--ng-amber)' : '#FF453A' }}>{avgHabitPct}%</span>
              </div>
            </div>
          )}
          {totalSteps > 0 && (
            <div className="flex items-center justify-between">
              <span className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px' }}>TOTAL STEPS</span>
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--ng-cyan)' }}>{totalSteps.toLocaleString()}</span>
            </div>
          )}
          {loggedHabitDays.length === 0 && activeDays === 0 && goalDays === 0 && (
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-dimmer)', textAlign: 'center', padding: '8px 0' }}>
              No data logged for this month yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
