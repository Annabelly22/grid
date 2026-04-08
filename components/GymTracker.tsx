'use client';
import { useState, useEffect } from 'react';

const TRACKER_KEY = 'grid_workout_week';

interface Activity { id: string; label: string; icon: string; color: string; }

const ACTIVITIES: Activity[] = [
  { id: 'gym',   label: 'GYM',   icon: '🏋️', color: '#FF453A' },
  { id: 'run',   label: 'RUN',   icon: '🏃', color: '#30D158' },
  { id: 'yoga',  label: 'YOGA',  icon: '🧘', color: '#BF5AF2' },
  { id: 'swim',  label: 'SWIM',  icon: '🏊', color: '#64D2FF' },
  { id: 'cycle', label: 'CYCLE', icon: '🚴', color: '#FF9F0A' },
  { id: 'hike',  label: 'HIKE',  icon: '🥾', color: '#FF6B2B' },
  { id: 'fast',  label: 'FAST',  icon: '⚡', color: '#FF6B9D' },
  { id: 'rest',  label: 'REST',  icon: '😴', color: '#8E8E93' },
];

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

function getWeekDates(): Date[] {
  const today = new Date();
  const dow   = today.getDay();
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
      <div className="font-mono" style={{ fontSize: 13, color: sel ? sel.color : 'var(--ng-muted)', marginBottom: 16, minHeight: 20 }}>
        {sel
          ? `${sel.icon} ${sel.label} selected — tap a day to log it`
          : 'Select an activity, then tap a day to log it.'}
      </div>

      {/* Activity chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {ACTIVITIES.map(a => (
          <button key={a.id} onClick={() => setSelected(selected === a.id ? null : a.id)}
            className="font-mono"
            style={{
              padding: '8px 14px', fontSize: 13,
              border:  `1px solid ${selected === a.id ? a.color : 'var(--ng-border)'}`,
              color:   selected === a.id ? a.color : 'var(--ng-muted)',
              background: selected === a.id ? `${a.color}15` : 'var(--ng-surface)',
              borderRadius: 20, cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      {/* Week grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
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
                padding: '10px 4px', gap: 4,
                background: isToday ? 'rgba(48,209,88,0.08)' : 'var(--ng-surface)',
                border: `0.5px solid ${isToday ? 'var(--ng-green)' : (selected && !isFuture ? 'var(--ng-dimmer)' : 'var(--ng-border)')}`,
                borderRadius: 10,
                cursor: isFuture ? 'default' : 'pointer',
                opacity: isFuture ? 0.3 : 1,
                minHeight: 88,
                transition: 'border-color 0.15s',
              }}>
              <span className="font-mono" style={{ fontSize: 9, color: isToday ? 'var(--ng-green)' : 'var(--ng-muted)', fontWeight: 600 }}>
                {DAY_LABELS[i]}
              </span>
              <span className="font-mono" style={{ fontSize: 14, color: isToday ? 'var(--ng-green)' : 'var(--ng-text)', fontWeight: 700, lineHeight: 1.2 }}>
                {d.getDate()}
              </span>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, marginTop: 2 }}>
                {activities.length > 0 ? (
                  activities.map(actId => {
                    const act = ACTIVITIES.find(a => a.id === actId);
                    if (!act) return null;
                    return (
                      <div key={actId} title={act.label}
                        style={{ fontSize: 14, lineHeight: 1, opacity: selected === actId ? 0.5 : 1 }}>
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
        <div style={{ marginTop: 18 }}>
          <div className="font-mono" style={{ fontSize: 12, color: 'var(--ng-muted)', fontWeight: 600, marginBottom: 10 }}>THIS WEEK</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ACTIVITIES.map(a => {
              const count = week.filter(d => (log[dateKey(d)] || []).includes(a.id)).length;
              if (count === 0) return null;
              return (
                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: `${a.color}12`, border: `0.5px solid ${a.color}44`, borderRadius: 20 }}>
                  <span style={{ fontSize: 14 }}>{a.icon}</span>
                  <span className="font-mono" style={{ fontSize: 13, color: a.color, fontWeight: 600 }}>×{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
