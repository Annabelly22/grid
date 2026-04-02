'use client';
import { useState, useEffect } from 'react';

const TRACKER_KEY = 'grid_workout_week';

interface Activity { id: string; label: string; icon: string; color: string; }

const ACTIVITIES: Activity[] = [
  { id: 'gym',   label: 'GYM',   icon: '🏋️', color: '#FF4757' },
  { id: 'run',   label: 'RUN',   icon: '🏃', color: '#00FF41' },
  { id: 'yoga',  label: 'YOGA',  icon: '🧘', color: '#BF00FF' },
  { id: 'swim',  label: 'SWIM',  icon: '🏊', color: '#00D4FF' },
  { id: 'cycle', label: 'CYCLE', icon: '🚴', color: '#FFB800' },
  { id: 'hike',  label: 'HIKE',  icon: '🥾', color: '#FF8C00' },
  { id: 'rest',  label: 'REST',  icon: '😴', color: '#6A6A8A' },
];

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function getWeekDates(): Date[] {
  const today = new Date();
  const dow   = today.getDay(); // 0 = Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dow + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function dateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

export default function GymTracker() {
  const [week]     = useState<Date[]>(getWeekDates);
  const [log,      setLog]      = useState<Record<string, string[]>>({});
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TRACKER_KEY);
      if (raw) setLog(JSON.parse(raw));
    } catch {}
  }, []);

  const save = (next: Record<string, string[]>) => {
    setLog(next);
    localStorage.setItem(TRACKER_KEY, JSON.stringify(next));
  };

  const handleDayTap = (d: Date) => {
    if (!selected) return;
    const k    = dateKey(d);
    const curr = log[k] || [];
    const next = { ...log };
    if (curr.includes(selected)) {
      next[k] = curr.filter(a => a !== selected);
    } else {
      next[k] = [...curr, selected];
    }
    save(next);
  };

  const today = new Date().toISOString().split('T')[0];
  const sel   = ACTIVITIES.find(a => a.id === selected);

  return (
    <div>
      {/* Instruction */}
      <div className="font-mono" style={{ fontSize: 10, color: sel ? sel.color : 'var(--ng-muted)', marginBottom: 14, minHeight: 16 }}>
        {sel
          ? `◆ ${sel.icon} ${sel.label} selected — tap a day to log it`
          : 'Select an activity, then tap a day to log it.'}
      </div>

      {/* Activity chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {ACTIVITIES.map(a => (
          <button key={a.id} onClick={() => setSelected(selected === a.id ? null : a.id)}
            className="font-orbitron"
            style={{
              padding: '6px 10px', fontSize: 9, letterSpacing: '1px',
              border:  `1px solid ${selected === a.id ? a.color : 'var(--ng-border)'}`,
              color:   selected === a.id ? a.color : 'var(--ng-muted)',
              background: selected === a.id ? `${a.color}18` : 'transparent',
              borderRadius: 2, cursor: 'pointer',
              boxShadow: selected === a.id ? `0 0 8px ${a.color}44` : 'none',
              transition: 'all 0.15s',
            }}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      {/* Week grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {week.map((d, i) => {
          const k          = dateKey(d);
          const activities = log[k] || [];
          const isToday    = k === today;
          const isFuture   = k > today;

          return (
            <button key={k}
              onClick={() => !isFuture && handleDayTap(d)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '8px 3px', gap: 3,
                background: isToday ? 'rgba(0,255,65,0.06)' : 'var(--ng-surface)',
                border: `1px solid ${isToday ? 'var(--ng-green)' : (selected && !isFuture ? 'var(--ng-dimmer)' : 'var(--ng-border)')}`,
                borderRadius: 2,
                cursor: isFuture ? 'default' : 'pointer',
                opacity: isFuture ? 0.35 : 1,
                minHeight: 86,
                transition: 'border-color 0.15s',
              }}>
              <span className="font-orbitron" style={{ fontSize: 7, color: isToday ? 'var(--ng-green)' : 'var(--ng-muted)', letterSpacing: '0.5px' }}>
                {DAY_LABELS[i]}
              </span>
              <span className="font-orbitron" style={{ fontSize: 12, color: isToday ? 'var(--ng-green)' : 'var(--ng-text)', fontWeight: 700, lineHeight: 1.2 }}>
                {d.getDate()}
              </span>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, marginTop: 2 }}>
                {activities.length > 0 ? (
                  activities.map(actId => {
                    const act = ACTIVITIES.find(a => a.id === actId);
                    if (!act) return null;
                    const isSelectedAct = selected === actId;
                    return (
                      <div key={actId} title={act.label}
                        style={{ fontSize: 13, lineHeight: 1, opacity: isSelectedAct ? 0.6 : 1 }}>
                        {act.icon}
                      </div>
                    );
                  })
                ) : (
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--ng-border)' }} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Week summary */}
      {week.some(d => (log[dateKey(d)] || []).length > 0) && (
        <div style={{ marginTop: 16 }}>
          <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '2px', marginBottom: 8 }}>THIS WEEK</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {ACTIVITIES.map(a => {
              const count = week.filter(d => (log[dateKey(d)] || []).includes(a.id)).length;
              if (count === 0) return null;
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', background: `${a.color}11`, border: `1px solid ${a.color}33`, borderRadius: 2 }}>
                  <span style={{ fontSize: 12 }}>{a.icon}</span>
                  <span className="font-orbitron" style={{ fontSize: 9, color: a.color, letterSpacing: '1px' }}>×{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
