'use client';
import { useState, useEffect } from 'react';
import { GYM_DAYS, GymDay, GymExercise, getTodayGymDay } from '../lib/gymData';

const GYM_CHECK_KEY = 'grid_gym_checks';

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

function storageKey(dayId: string): string {
  return `${GYM_CHECK_KEY}_${dayId}_${todayKey()}`;
}

function loadChecks(dayId: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(storageKey(dayId));
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveChecks(dayId: string, checks: Record<string, boolean>) {
  localStorage.setItem(storageKey(dayId), JSON.stringify(checks));
}

// ─── Exercise row inside the detail panel ────────────────────────────────────
function ExerciseRow({ ex, checked, onToggle }: {
  ex: GymExercise;
  checked: boolean;
  onToggle: () => void;
}) {
  const hasDetail = ex.weight || ex.reps || ex.sets || ex.note;
  return (
    <button
      className="w-full text-left"
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: checked ? 'rgba(48,209,88,0.06)' : 'transparent',
        borderBottom: '1px solid var(--ng-border)',
        cursor: 'pointer', transition: 'background 0.15s',
      }}
    >
      {/* Checkbox */}
      <div style={{
        width: 20, height: 20, borderRadius: 4, flexShrink: 0,
        border: `1.5px solid ${checked ? 'var(--ng-green)' : 'var(--ng-border)'}`,
        background: checked ? 'var(--ng-green)' : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
      }}>
        {checked && <span style={{ color: '#000', fontSize: 11, fontWeight: 800, lineHeight: 1 }}>✓</span>}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span className="font-mono" style={{ fontSize: 12, color: checked ? 'var(--ng-muted)' : 'var(--ng-text)', textDecoration: checked ? 'line-through' : 'none' }}>
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
            <span className="font-orbitron" style={{ fontSize: 8, color: checked ? 'var(--ng-green)' : 'var(--ng-amber)', letterSpacing: '1px', marginLeft: 'auto', flexShrink: 0 }}>~{ex.kcal} kcal</span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Day detail panel (full-screen overlay) ───────────────────────────────────
function DayPanel({ day, onClose }: { day: GymDay; onClose: () => void }) {
  const hasAlt = !!day.alt;
  const [useAlt, setUseAlt] = useState(false);
  const activeSet = useAlt && day.alt ? day.alt.exercises : day.exercises;
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setChecks(loadChecks(day.id + (useAlt ? '_alt' : '')));
  }, [day.id, useAlt]);

  const toggle = (id: string) => {
    const next = { ...checks, [id]: !checks[id] };
    setChecks(next);
    saveChecks(day.id + (useAlt ? '_alt' : ''), next);
  };

  const doneCount = activeSet.filter(ex => checks[ex.id]).length;
  const total = activeSet.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const kcalDone  = activeSet.filter(ex => checks[ex.id]).reduce((sum, ex) => sum + (ex.kcal || 0), 0);
  const kcalTotal = activeSet.reduce((sum, ex) => sum + (ex.kcal || 0), 0);

  // Group exercises by section (for HIIT day)
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

        {/* Exercise list */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ background: 'var(--ng-surface)', borderRadius: 0 }}>
            {hasSections ? (
              sections.map(sec => (
                <div key={sec.label}>
                  <div style={{ padding: '10px 16px 6px', background: 'var(--ng-bg)', borderBottom: '1px solid var(--ng-border)' }}>
                    <span className="font-orbitron" style={{ fontSize: 9, color: day.color, letterSpacing: '2px' }}>◆ {sec.label}</span>
                  </div>
                  {sec.exercises.map((ex, i) => (
                    <ExerciseRow
                      key={ex.id}
                      ex={ex}
                      checked={!!checks[ex.id]}
                      onToggle={() => toggle(ex.id)}
                    />
                  ))}
                </div>
              ))
            ) : (
              activeSet.map(ex => (
                <ExerciseRow
                  key={ex.id}
                  ex={ex}
                  checked={!!checks[ex.id]}
                  onToggle={() => toggle(ex.id)}
                />
              ))
            )}
          </div>
          <div style={{ height: 32 }} />
        </div>
      </div>
    </div>
  );
}

// ─── Day tile ─────────────────────────────────────────────────────────────────
function DayTile({ day, isToday, onOpen }: { day: GymDay; isToday: boolean; onOpen: () => void }) {
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const primary = loadChecks(day.id);
    const alt = loadChecks(day.id + '_alt');
    setChecks({ ...primary, ...alt });
  }, [day.id]);

  const allExercises = [...day.exercises, ...(day.alt?.exercises || [])];
  const doneCount = allExercises.filter(ex => checks[ex.id]).length;
  const primaryDone = day.exercises.filter(ex => checks[ex.id]).length;
  const altDone = (day.alt?.exercises || []).filter(ex => checks[ex.id]).length;
  const anyDone = doneCount > 0;
  // If more alt exercises are checked, show alt progress; else show primary
  const displayDone = altDone > primaryDone ? altDone : primaryDone;
  const displayTotal = altDone > primaryDone ? (day.alt?.exercises.length || 0) : day.exercises.length;
  const pct = displayTotal > 0 ? Math.round((displayDone / displayTotal) * 100) : 0;

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
      {/* Today badge */}
      {isToday && (
        <span className="font-orbitron" style={{
          position: 'absolute', top: 8, right: 8,
          fontSize: 7, color: day.color, letterSpacing: '1px',
          background: `${day.color}20`, border: `1px solid ${day.color}44`,
          padding: '1px 5px', borderRadius: 4,
        }}>TODAY</span>
      )}

      {/* Icon + day label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>{day.icon}</span>
        <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>{day.label}</span>
      </div>

      {/* Focus */}
      <div className="font-orbitron font-bold" style={{ fontSize: 10, color: day.color, letterSpacing: '1px', lineHeight: 1.3, flex: 1 }}>{day.focus}</div>

      {/* Progress */}
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
      {/* Today's day callout */}
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

      {/* 2-column day tile grid */}
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

      {/* Detail panel */}
      {openDay && <DayPanel day={openDay} onClose={() => setOpenDay(null)} />}

      {/* Disclaimer */}
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
