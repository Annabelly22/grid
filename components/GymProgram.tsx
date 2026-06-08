'use client';
import { useState, useEffect } from 'react';
import { GYM_DAYS, GymDay, GymExercise, getTodayGymDay } from '../lib/gymData';

const GYM_CHECK_KEY = 'grid_gym_checks';
const NUM_SETS = 4;

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function storageKey(dayId: string): string {
  return `${GYM_CHECK_KEY}_${dayId}_${todayKey()}`;
}

// Returns Record<string, number> where value = sets completed (0–4)
// Migrates old boolean values: true → 4, false → 0
function loadChecks(dayId: string): Record<string, number> {
  try {
    const raw = localStorage.getItem(storageKey(dayId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const result: Record<string, number> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === 'boolean') result[k] = v ? NUM_SETS : 0;
      else if (typeof v === 'number') result[k] = v;
    }
    return result;
  } catch { return {}; }
}

function saveChecks(dayId: string, checks: Record<string, number>) {
  localStorage.setItem(storageKey(dayId), JSON.stringify(checks));
}

// ─── Exercise row — 4 individual set checkboxes ───────────────────────────────
function ExerciseRow({ ex, setsCompleted, onSetToggle }: {
  ex: GymExercise;
  setsCompleted: number;
  onSetToggle: (setIndex: number) => void;
}) {
  const isFullyDone = setsCompleted >= NUM_SETS;

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '13px 16px',
        background: isFullyDone ? 'rgba(48,209,88,0.06)' : 'transparent',
        borderBottom: '1px solid var(--ng-border)',
      }}
    >
      {/* Exercise info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span className="font-mono" style={{
            fontSize: 12,
            color: isFullyDone ? 'var(--ng-muted)' : 'var(--ng-text)',
            textDecoration: isFullyDone ? 'line-through' : 'none',
          }}>
            {ex.name}
          </span>
          {ex.priority && (
            <span className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-amber)', border: '1px solid rgba(255,184,0,0.35)', padding: '1px 4px', letterSpacing: '1px', flexShrink: 0 }}>KEY</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap', alignItems: 'center' }}>
          {ex.weight && (
            <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-cyan)', letterSpacing: '1px' }}>{ex.weight}</span>
          )}
          {ex.reps && ex.sets && (
            <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>{ex.reps} × {ex.sets}</span>
          )}
          {ex.reps && !ex.sets && (
            <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>{ex.reps} reps</span>
          )}
          {ex.note && (
            <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>{ex.note}</span>
          )}
          {ex.kcal && (
            <span className="font-orbitron" style={{ fontSize: 8, color: isFullyDone ? 'var(--ng-green)' : 'var(--ng-amber)', letterSpacing: '1px', flexShrink: 0 }}>~{ex.kcal} kcal</span>
          )}
        </div>
      </div>

      {/* 4 set checkboxes */}
      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
        {Array.from({ length: NUM_SETS }, (_, i) => {
          const done = i < setsCompleted;
          return (
            <button
              key={i}
              onClick={() => onSetToggle(i)}
              style={{
                width: 26, height: 26,
                border: `1.5px solid ${done ? 'var(--ng-green)' : 'var(--ng-border)'}`,
                background: done ? 'var(--ng-green)' : 'transparent',
                borderRadius: 5,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >
              {done && <span style={{ color: '#000', fontSize: 11, fontWeight: 800, lineHeight: 1 }}>✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Day detail panel (bottom sheet) ─────────────────────────────────────────
function DayPanel({ day, onClose }: { day: GymDay; onClose: () => void }) {
  const hasAlt = !!day.alt;
  const [useAlt, setUseAlt] = useState(false);
  const activeSet = useAlt && day.alt ? day.alt.exercises : day.exercises;
  const [checks, setChecks] = useState<Record<string, number>>({});

  useEffect(() => {
    setChecks(loadChecks(day.id + (useAlt ? '_alt' : '')));
  }, [day.id, useAlt]);

  const toggleSet = (id: string, setIdx: number) => {
    const current = checks[id] || 0;
    // Tap a done set → uncheck it and everything above; tap an undone set → check up to it
    const next = { ...checks, [id]: setIdx + 1 <= current ? setIdx : setIdx + 1 };
    setChecks(next);
    saveChecks(day.id + (useAlt ? '_alt' : ''), next);
  };

  const doneCount  = activeSet.filter(ex => (checks[ex.id] || 0) >= NUM_SETS).length;
  const total      = activeSet.length;
  const pct        = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const kcalDone   = activeSet.filter(ex => (checks[ex.id] || 0) >= NUM_SETS).reduce((sum, ex) => sum + (ex.kcal || 0), 0);
  const kcalTotal  = activeSet.reduce((sum, ex) => sum + (ex.kcal || 0), 0);

  // Group exercises by section (HIIT day)
  const hasSections = activeSet.some(ex => ex.section);
  const sections: { label: string; exercises: GymExercise[] }[] = [];
  if (hasSections) {
    activeSet.forEach(ex => {
      const sec = ex.section || '';
      const existing = sections.find(s => s.label === sec);
      if (existing) existing.exercises.push(ex);
      else sections.push({ label: sec, exercises: [ex] });
    });
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', flexDirection: 'column',
      animation: 'fadeIn 0.15s ease',
    }}>
      {/* Backdrop tap to close */}
      <div style={{ flex: 1 }} onClick={onClose} />

      {/* Sheet */}
      <div style={{
        background: 'var(--ng-bg)',
        borderRadius: '20px 20px 0 0',
        border: `0.5px solid ${day.color}44`,
        borderTop: `3px solid ${day.color}`,
        maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
        animation: 'slideUpSheet 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Sheet header */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '0.5px solid var(--ng-border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>{day.icon}</span>
              <div>
                <div className="font-orbitron font-bold" style={{ fontSize: 14, color: day.color, letterSpacing: '2px' }}>{day.focus}</div>
                <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px' }}>{day.label}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {doneCount === total && total > 0 && (
                <span className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-green)', letterSpacing: '2px' }}>DONE ✓</span>
              )}
              <button onClick={onClose} style={{ fontSize: 20, color: 'var(--ng-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}>✕</button>
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 3, background: 'var(--ng-border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: day.color, transition: 'width 0.3s ease', borderRadius: 2 }} />
            </div>
            <span className="font-orbitron" style={{ fontSize: 9, color: day.color, letterSpacing: '1px', flexShrink: 0 }}>{doneCount}/{total}</span>
            {kcalTotal > 0 && (
              <span className="font-orbitron" style={{ fontSize: 9, color: kcalDone > 0 ? 'var(--ng-amber)' : 'var(--ng-dimmer)', letterSpacing: '1px', flexShrink: 0 }}>
                🔥 {kcalDone}/{kcalTotal} kcal
              </span>
            )}
          </div>

          {/* Variant toggle */}
          {hasAlt && (
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <button onClick={() => setUseAlt(false)} className="font-orbitron flex-1"
                style={{ padding: '6px', fontSize: 9, letterSpacing: '1px', border: `1px solid ${!useAlt ? day.color : 'var(--ng-border)'}`, color: !useAlt ? day.color : 'var(--ng-muted)', background: !useAlt ? `${day.color}15` : 'transparent', borderRadius: 8, cursor: 'pointer' }}>
                PRIMARY
              </button>
              <button onClick={() => setUseAlt(true)} className="font-orbitron flex-1"
                style={{ padding: '6px', fontSize: 9, letterSpacing: '1px', border: `1px solid ${useAlt ? day.color : 'var(--ng-border)'}`, color: useAlt ? day.color : 'var(--ng-muted)', background: useAlt ? `${day.color}15` : 'transparent', borderRadius: 8, cursor: 'pointer' }}>
                {day.alt!.label}
              </button>
            </div>
          )}
        </div>

        {/* Exercise list — scrollable, extra bottom padding so last item is never cut off */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ background: 'var(--ng-surface)' }}>
            {hasSections ? (
              sections.map(sec => (
                <div key={sec.label}>
                  <div style={{ padding: '10px 16px 6px', background: 'var(--ng-bg)', borderBottom: '1px solid var(--ng-border)' }}>
                    <span className="font-orbitron" style={{ fontSize: 9, color: day.color, letterSpacing: '2px' }}>◆ {sec.label}</span>
                  </div>
                  {sec.exercises.map(ex => (
                    <ExerciseRow
                      key={ex.id}
                      ex={ex}
                      setsCompleted={checks[ex.id] || 0}
                      onSetToggle={(setIdx) => toggleSet(ex.id, setIdx)}
                    />
                  ))}
                </div>
              ))
            ) : (
              activeSet.map(ex => (
                <ExerciseRow
                  key={ex.id}
                  ex={ex}
                  setsCompleted={checks[ex.id] || 0}
                  onSetToggle={(setIdx) => toggleSet(ex.id, setIdx)}
                />
              ))
            )}
          </div>
          {/* Bottom padding — keeps last exercise clear of mobile nav bar */}
          <div style={{ height: 120 }} />
        </div>
      </div>
    </div>
  );
}

// ─── Day tile ─────────────────────────────────────────────────────────────────
function DayTile({ day, isToday, onOpen }: { day: GymDay; isToday: boolean; onOpen: () => void }) {
  const [checks, setChecks] = useState<Record<string, number>>({});

  useEffect(() => {
    const primary = loadChecks(day.id);
    const alt     = loadChecks(day.id + '_alt');
    setChecks({ ...primary, ...alt });
  }, [day.id]);

  const primaryDone  = day.exercises.filter(ex => (checks[ex.id] || 0) >= NUM_SETS).length;
  const altDone      = (day.alt?.exercises || []).filter(ex => (checks[ex.id] || 0) >= NUM_SETS).length;
  const displayDone  = altDone > primaryDone ? altDone : primaryDone;
  const displayTotal = altDone > primaryDone ? (day.alt?.exercises.length || 0) : day.exercises.length;
  const anyDone      = displayDone > 0;
  const pct          = displayTotal > 0 ? Math.round((displayDone / displayTotal) * 100) : 0;

  return (
    <button
      onClick={onOpen}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column',
        padding: '14px 12px',
        background: isToday ? `${day.color}0f` : 'var(--ng-surface)',
        border: `0.5px solid ${isToday ? day.color + '55' : 'var(--ng-border)'}`,
        borderTop: `3px solid ${day.color}`,
        borderRadius: 12,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s',
        minHeight: 110,
        overflow: 'hidden',
      }}
    >
      {isToday && (
        <span className="font-orbitron" style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: 7, color: day.color, letterSpacing: '1px',
          background: `${day.color}20`, border: `1px solid ${day.color}44`,
          padding: '1px 5px', borderRadius: 4,
        }}>TODAY</span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>{day.icon}</span>
        <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>{day.label}</span>
      </div>

      <div className="font-orbitron font-bold" style={{ fontSize: 10, color: day.color, letterSpacing: '1px', lineHeight: 1.3, flex: 1 }}>{day.focus}</div>

      <div style={{ marginTop: 8 }}>
        {anyDone ? (
          <>
            <div style={{ height: 2, background: 'var(--ng-border)', borderRadius: 1, overflow: 'hidden', marginBottom: 4 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: day.color, borderRadius: 1 }} />
            </div>
            <span className="font-orbitron" style={{ fontSize: 7, color: day.color, letterSpacing: '1px' }}>{pct}%</span>
          </>
        ) : (
          <span className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-dimmer)', letterSpacing: '1px' }}>{day.exercises.length} EXERCISES</span>
        )}
      </div>
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function GymProgram() {
  const todayDay = getTodayGymDay();
  const [openDay, setOpenDay] = useState<GymDay | null>(null);

  return (
    <div>
      {todayDay && (
        <div style={{ marginBottom: 20, padding: '14px', background: `${todayDay.color}0c`, border: `0.5px solid ${todayDay.color}33`, borderLeft: `3px solid ${todayDay.color}`, borderRadius: 12 }}>
          <div className="font-orbitron" style={{ fontSize: 8, color: todayDay.color, letterSpacing: '3px', marginBottom: 4 }}>TODAY'S SESSION</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="font-orbitron font-bold" style={{ fontSize: 14, color: 'var(--ng-text)', letterSpacing: '1px' }}>
              {todayDay.icon} {todayDay.focus}
            </div>
            <button onClick={() => setOpenDay(todayDay)} className="font-orbitron"
              style={{ fontSize: 9, color: todayDay.color, border: `1px solid ${todayDay.color}44`, padding: '6px 14px', background: `${todayDay.color}15`, borderRadius: 8, cursor: 'pointer' }}>
              START →
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {GYM_DAYS.map(day => (
          <DayTile
            key={day.id}
            day={day}
            isToday={todayDay?.id === day.id}
            onOpen={() => setOpenDay(day)}
          />
        ))}
      </div>

      {openDay && <DayPanel day={openDay} onClose={() => setOpenDay(null)} />}

      <div style={{ marginTop: 20, padding: '12px', background: 'var(--ng-bg)', border: '0.5px solid var(--ng-border)', borderRadius: 10 }}>
        <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px', marginBottom: 4 }}>◈ PRIORITY KEY</div>
        <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-dimmer)', lineHeight: 1.6 }}>
          KEY badge marks your high-priority compound movements. Hit these first while fresh.
          Checks reset each day.
        </div>
      </div>
    </div>
  );
}
