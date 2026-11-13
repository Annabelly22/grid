'use client';
import { useState, useEffect, useRef } from 'react';
import { Storage, type FastRecord } from '../lib/storage';

const FAST_KEY = 'grid_fast_start';

interface Phase {
  label: string;
  sublabel: string;
  minH: number;
  maxH: number;
  color: string;
  description: string;
}

const PHASES: Phase[] = [
  { label: 'FED',        sublabel: 'Digestion active',    minH: 0,  maxH: 4,        color: '#6A6A8A', description: 'Body processing last meal. Insulin elevated. Normal metabolic state.' },
  { label: 'EARLY FAST', sublabel: 'Glycogen depleting',  minH: 4,  maxH: 8,        color: '#FFB800', description: 'Liver glycogen being drawn down. Transition to fat metabolism begins.' },
  { label: 'FAT BURN',   sublabel: 'Lipolysis begins',    minH: 8,  maxH: 12,       color: '#FF8C00', description: 'Glycogen nearly depleted. Fat oxidation increases. Energy stabilises.' },
  { label: 'KETOSIS',    sublabel: '16:8 zone',           minH: 12, maxH: 16,       color: '#FF6B2B', description: 'Ketones rising. Mental clarity window opens. Prime trading hours.' },
  { label: 'AUTOPHAGY',  sublabel: 'Peak cellular repair',minH: 16, maxH: 18,       color: '#FF4757', description: 'Deep cellular cleanup activated. Growth hormone spike. Prime recovery.' },
  { label: 'DEEP FAST',  sublabel: 'Metabolic reset',     minH: 18, maxH: 24,       color: '#BF00FF', description: 'Profound autophagy. Mitochondrial biogenesis. Systemic inflammation drops.' },
  { label: 'EXTENDED',   sublabel: 'Advanced territory',  minH: 24, maxH: Infinity, color: '#00D4FF', description: 'Extended therapeutic fast. Significant regeneration. Break mindfully with protein.' },
];

function getPhase(hours: number): Phase {
  return PHASES.find(p => hours >= p.minH && hours < p.maxH) ?? PHASES[PHASES.length - 1];
}

export default function FastingTimer() {
  const [fastStart, setFastStart] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [history, setHistory] = useState<FastRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Editing states
  const [editingStart, setEditingStart] = useState(false);
  const [editStartDate, setEditStartDate] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [showEndAdjust, setShowEndAdjust] = useState(false);
  const [endAdjustTime, setEndAdjustTime] = useState('');
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editHistoryStartDate, setEditHistoryStartDate] = useState('');
  const [editHistoryStartTime, setEditHistoryStartTime] = useState('');
  const [editHistoryEndDate, setEditHistoryEndDate] = useState('');
  const [editHistoryEndTime, setEditHistoryEndTime] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem(FAST_KEY);
    if (stored) setFastStart(Number(stored));
    setHistory(Storage.getFastHistory());
  }, []);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (fastStart) {
      intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fastStart]);

  const startFast = () => {
    const t = Date.now();
    setFastStart(t);
    setNow(t);
    localStorage.setItem(FAST_KEY, String(t));
  };

  // Open edit start time modal
  const openEditStart = () => {
    if (!fastStart) return;
    const d = new Date(fastStart);
    setEditStartDate(d.toISOString().split('T')[0]);
    setEditStartTime(d.toTimeString().slice(0, 5));
    setEditingStart(true);
  };

  // Save edited start time
  const saveEditStart = () => {
    const newStart = new Date(`${editStartDate}T${editStartTime}`).getTime();
    if (isNaN(newStart) || newStart > Date.now()) {
      alert('Invalid start time. Must be in the past.');
      return;
    }
    setFastStart(newStart);
    localStorage.setItem(FAST_KEY, String(newStart));
    setEditingStart(false);
  };

  // Open end fast with adjustment
  const openEndAdjust = () => {
    const d = new Date();
    setEndAdjustTime(d.toTimeString().slice(0, 5));
    setShowEndAdjust(true);
  };

  const stopFast = (customEndTime?: number) => {
    if (fastStart) {
      const end = customEndTime ?? Date.now();
      const durH = (end - fastStart) / 3_600_000;
      if (durH >= 0.1) {
        const record: FastRecord = {
          id: `f_${fastStart}`,
          startTime: fastStart,
          endTime: end,
          durationH: Math.round(durH * 10) / 10,
          phaseReached: getPhase(durH).label,
        };
        const updated = [record, ...Storage.getFastHistory()].slice(0, 20);
        Storage.setFastHistory(updated);
        setHistory(updated);
      }
    }
    setFastStart(null);
    localStorage.removeItem(FAST_KEY);
    setShowEndAdjust(false);
  };

  // Save end fast with custom time
  const saveEndAdjust = () => {
    const today = new Date().toISOString().split('T')[0];
    const endTime = new Date(`${today}T${endAdjustTime}`).getTime();
    if (isNaN(endTime)) {
      stopFast();
      return;
    }
    // If time is in the future, use yesterday's date
    let finalEnd = endTime;
    if (endTime > Date.now()) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      finalEnd = new Date(`${yesterday}T${endAdjustTime}`).getTime();
    }
    if (fastStart && finalEnd < fastStart) {
      alert('End time must be after start time.');
      return;
    }
    stopFast(finalEnd);
  };

  // Edit history entry
  const openEditHistory = (record: FastRecord) => {
    const start = new Date(record.startTime);
    const end = new Date(record.endTime);
    setEditingHistoryId(record.id);
    setEditHistoryStartDate(start.toISOString().split('T')[0]);
    setEditHistoryStartTime(start.toTimeString().slice(0, 5));
    setEditHistoryEndDate(end.toISOString().split('T')[0]);
    setEditHistoryEndTime(end.toTimeString().slice(0, 5));
  };

  const saveEditHistory = () => {
    if (!editingHistoryId) return;
    const newStart = new Date(`${editHistoryStartDate}T${editHistoryStartTime}`).getTime();
    const newEnd = new Date(`${editHistoryEndDate}T${editHistoryEndTime}`).getTime();
    if (isNaN(newStart) || isNaN(newEnd) || newEnd <= newStart) {
      alert('Invalid times. End must be after start.');
      return;
    }
    const durH = (newEnd - newStart) / 3_600_000;
    const updated = history.map(r =>
      r.id === editingHistoryId
        ? { ...r, startTime: newStart, endTime: newEnd, durationH: Math.round(durH * 10) / 10, phaseReached: getPhase(durH).label }
        : r
    );
    Storage.setFastHistory(updated);
    setHistory(updated);
    setEditingHistoryId(null);
  };

  const deleteHistoryEntry = (id: string) => {
    if (!confirm('Delete this fast record?')) return;
    const updated = history.filter(r => r.id !== id);
    Storage.setFastHistory(updated);
    setHistory(updated);
  };

  const elapsedMs = fastStart ? now - fastStart : 0;
  const elapsedH  = elapsedMs / 3600000;
  const phase     = getPhase(elapsedH);

  const R = 78;
  const CX = 100, CY = 100;
  const CIRC = 2 * Math.PI * R;
  const progress = Math.min(elapsedH / 24, 1);
  const dash = CIRC * progress;

  const totalSec = Math.floor(elapsedMs / 1000);
  const hours    = Math.floor(totalSec / 3600);
  const minutes  = Math.floor((totalSec % 3600) / 60);
  const seconds  = totalSec % 60;

  // Tick marks at each phase boundary
  const TICKS = [4, 8, 12, 16, 18].map(h => {
    const angle = (h / 24) * 2 * Math.PI - Math.PI / 2;
    const ir = R - 6, or = R + 6;
    return {
      x1: CX + ir * Math.cos(angle), y1: CY + ir * Math.sin(angle),
      x2: CX + or * Math.cos(angle), y2: CY + or * Math.sin(angle),
    };
  });

  return (
    <div>
      {/* Circle */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <svg width={200} height={200} viewBox="0 0 200 200">
          {/* Track */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--ng-border)" strokeWidth={7} />

          {/* Progress arc — starts from top */}
          {fastStart && (
            <circle cx={CX} cy={CY} r={R} fill="none"
              stroke={phase.color} strokeWidth={7}
              strokeDasharray={`${dash} ${CIRC - dash}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${CX} ${CY})`}
              style={{
                transition: 'stroke-dasharray 1s ease, stroke 0.5s ease',
                filter: `drop-shadow(0 0 5px ${phase.color}99)`,
              }}
            />
          )}

          {/* Phase boundary ticks */}
          {TICKS.map((t, i) => (
            <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke="var(--ng-border)" strokeWidth={1.5} />
          ))}

          {/* Center text */}
          {fastStart ? (
            <>
              <text x={CX} y={CY - 14} textAnchor="middle" fill={phase.color}
                fontFamily="'Orbitron', sans-serif" fontWeight="900" fontSize={22}>
                {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}
              </text>
              <text x={CX} y={CY + 4} textAnchor="middle" fill={phase.color}
                fontFamily="'Orbitron', sans-serif" fontSize={13} fontWeight="700">
                :{String(seconds).padStart(2, '0')}
              </text>
              <text x={CX} y={CY + 18} textAnchor="middle" fill={phase.color}
                fontFamily="'Orbitron', sans-serif" fontSize={8} letterSpacing={2}>
                {phase.label}
              </text>
              <text x={CX} y={CY + 30} textAnchor="middle" fill="var(--ng-muted)"
                fontFamily="'JetBrains Mono', monospace" fontSize={8}>
                {phase.sublabel}
              </text>
            </>
          ) : (
            <>
              <text x={CX} y={CY + 2} textAnchor="middle" fill="var(--ng-muted)"
                fontFamily="'Orbitron', sans-serif" fontSize={9} letterSpacing={2}>
                NOT FASTING
              </text>
              <text x={CX} y={CY + 16} textAnchor="middle" fill="var(--ng-dimmer)"
                fontFamily="'JetBrains Mono', monospace" fontSize={9}>
                tap start below
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Active phase info */}
      {fastStart && (
        <div style={{ padding: '12px 14px', marginBottom: 16, background: `${phase.color}10`, border: `1px solid ${phase.color}33`, borderLeft: `3px solid ${phase.color}`, borderRadius: 2 }}>
          <div className="font-orbitron" style={{ fontSize: 9, color: phase.color, letterSpacing: '2px', marginBottom: 4 }}>
            {phase.label} — {phase.sublabel}
          </div>
          <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-text)', lineHeight: 1.6 }}>
            {phase.description}
          </div>
          {/* Start time display with edit */}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${phase.color}33`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>
              Started: {new Date(fastStart).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })}
            </div>
            <button
              onClick={openEditStart}
              style={{
                padding: '4px 8px',
                fontSize: 9,
                background: 'transparent',
                color: 'var(--ng-muted)',
                border: '1px solid var(--ng-border)',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              ✏️ ADJUST
            </button>
          </div>
        </div>
      )}

      {/* Edit start time modal */}
      {editingStart && (
        <div style={{
          padding: '14px',
          marginBottom: 16,
          background: 'var(--ng-surface)',
          border: '1px solid var(--ng-cyan)',
          borderRadius: 8,
        }}>
          <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-cyan)', letterSpacing: '2px', marginBottom: 12 }}>
            ✏️ ADJUST START TIME
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div className="font-mono" style={{ fontSize: 8, color: 'var(--ng-muted)', marginBottom: 4 }}>DATE</div>
              <input
                type="date"
                value={editStartDate}
                onChange={e => setEditStartDate(e.target.value)}
                className="ng-input"
                style={{ width: '100%', fontSize: 12, padding: '8px' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="font-mono" style={{ fontSize: 8, color: 'var(--ng-muted)', marginBottom: 4 }}>TIME</div>
              <input
                type="time"
                value={editStartTime}
                onChange={e => setEditStartTime(e.target.value)}
                className="ng-input"
                style={{ width: '100%', fontSize: 12, padding: '8px' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveEditStart} className="font-orbitron" style={{ flex: 1, padding: '10px', fontSize: 10, background: 'var(--ng-green)', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              SAVE
            </button>
            <button onClick={() => setEditingStart(false)} style={{ padding: '10px 14px', fontSize: 10, background: 'transparent', color: 'var(--ng-muted)', border: '1px solid var(--ng-border)', borderRadius: 6, cursor: 'pointer' }}>
              CANCEL
            </button>
          </div>
        </div>
      )}

      {/* Phase timeline */}
      <div style={{ marginBottom: 20 }}>
        <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '2px', marginBottom: 8 }}>FASTING PHASES</div>
        {PHASES.slice(0, 6).map(p => {
          const isActive = !!fastStart && elapsedH >= p.minH && elapsedH < p.maxH;
          const isPast   = !!fastStart && elapsedH >= p.maxH;
          return (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5, opacity: fastStart ? (isActive || isPast ? 1 : 0.35) : 0.6 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: (isPast || isActive) ? p.color : 'var(--ng-border)', boxShadow: isActive ? `0 0 6px ${p.color}` : 'none' }} />
              <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px', width: 36, flexShrink: 0 }}>{p.minH}–{Math.min(p.maxH, 24)}h</span>
              <span className="font-orbitron" style={{ fontSize: 9, color: isActive ? p.color : isPast ? 'var(--ng-muted)' : 'var(--ng-dimmer)', letterSpacing: '1px', flex: 1 }}>{p.label}</span>
              {isPast && <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-green)' }}>✓</span>}
              {isActive && <span className="font-orbitron" style={{ fontSize: 7, color: p.color, border: `1px solid ${p.color}`, padding: '1px 5px', letterSpacing: '1px' }}>NOW</span>}
            </div>
          );
        })}
      </div>

      {/* Controls */}
      {!fastStart ? (
        <button onClick={startFast} className="btn-green-solid w-full" style={{ letterSpacing: '3px' }}>
          START FAST
        </button>
      ) : showEndAdjust ? (
        <div style={{
          padding: '14px',
          background: 'var(--ng-surface)',
          border: '1px solid var(--ng-red)',
          borderRadius: 8,
        }}>
          <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-red)', letterSpacing: '2px', marginBottom: 12 }}>
            ■ END FAST — ADJUST TIME
          </div>
          <div style={{ marginBottom: 12 }}>
            <div className="font-mono" style={{ fontSize: 8, color: 'var(--ng-muted)', marginBottom: 4 }}>END TIME (today)</div>
            <input
              type="time"
              value={endAdjustTime}
              onChange={e => setEndAdjustTime(e.target.value)}
              className="ng-input"
              style={{ width: '100%', fontSize: 14, padding: '10px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveEndAdjust} className="font-orbitron" style={{ flex: 1, padding: '10px', fontSize: 10, background: 'var(--ng-red)', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
              END NOW
            </button>
            <button onClick={() => setShowEndAdjust(false)} style={{ padding: '10px 14px', fontSize: 10, background: 'transparent', color: 'var(--ng-muted)', border: '1px solid var(--ng-border)', borderRadius: 6, cursor: 'pointer' }}>
              CANCEL
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => stopFast()} className="font-orbitron" style={{ flex: 1, padding: '12px', fontSize: 10, letterSpacing: '2px', color: 'var(--ng-red)', border: '1px solid var(--ng-red)', background: 'transparent', borderRadius: 6, cursor: 'pointer' }}>
            ■ END NOW
          </button>
          <button onClick={openEndAdjust} style={{ padding: '12px 16px', fontSize: 10, background: 'transparent', color: 'var(--ng-muted)', border: '1px solid var(--ng-border)', borderRadius: 6, cursor: 'pointer' }}>
            ✏️
          </button>
        </div>
      )}

      {/* Fasting history */}
      {history.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <button
            onClick={() => setShowHistory(v => !v)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 8px' }}>
            <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '2px' }}>FASTING HISTORY — {history.length}</span>
            <span style={{ fontSize: 10, color: 'var(--ng-muted)' }}>{showHistory ? '▲' : '▼'}</span>
          </button>
          {showHistory && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {history.slice(0, 10).map(r => {
                const startDate = new Date(r.startTime);
                const endDate = new Date(r.endTime);
                const dateStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const startTimeStr = startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                const endTimeStr = endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
                const phaseColor = PHASES.find(p => p.label === r.phaseReached)?.color || 'var(--ng-muted)';
                const isEditing = editingHistoryId === r.id;

                if (isEditing) {
                  return (
                    <div key={r.id} style={{ padding: '12px', background: 'var(--ng-bg)', border: '1px solid var(--ng-cyan)', borderRadius: 8 }}>
                      <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-cyan)', letterSpacing: '2px', marginBottom: 10 }}>
                        ✏️ EDIT FAST RECORD
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                        <div>
                          <div className="font-mono" style={{ fontSize: 8, color: 'var(--ng-muted)', marginBottom: 4 }}>START DATE</div>
                          <input type="date" value={editHistoryStartDate} onChange={e => setEditHistoryStartDate(e.target.value)} className="ng-input" style={{ width: '100%', fontSize: 11, padding: '6px' }} />
                        </div>
                        <div>
                          <div className="font-mono" style={{ fontSize: 8, color: 'var(--ng-muted)', marginBottom: 4 }}>START TIME</div>
                          <input type="time" value={editHistoryStartTime} onChange={e => setEditHistoryStartTime(e.target.value)} className="ng-input" style={{ width: '100%', fontSize: 11, padding: '6px' }} />
                        </div>
                        <div>
                          <div className="font-mono" style={{ fontSize: 8, color: 'var(--ng-muted)', marginBottom: 4 }}>END DATE</div>
                          <input type="date" value={editHistoryEndDate} onChange={e => setEditHistoryEndDate(e.target.value)} className="ng-input" style={{ width: '100%', fontSize: 11, padding: '6px' }} />
                        </div>
                        <div>
                          <div className="font-mono" style={{ fontSize: 8, color: 'var(--ng-muted)', marginBottom: 4 }}>END TIME</div>
                          <input type="time" value={editHistoryEndTime} onChange={e => setEditHistoryEndTime(e.target.value)} className="ng-input" style={{ width: '100%', fontSize: 11, padding: '6px' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={saveEditHistory} className="font-orbitron" style={{ flex: 1, padding: '8px', fontSize: 9, background: 'var(--ng-green)', color: '#000', border: 'none', borderRadius: 6, cursor: 'pointer' }}>SAVE</button>
                        <button onClick={() => setEditingHistoryId(null)} style={{ padding: '8px 12px', fontSize: 9, background: 'transparent', color: 'var(--ng-muted)', border: '1px solid var(--ng-border)', borderRadius: 6, cursor: 'pointer' }}>CANCEL</button>
                        <button onClick={() => { deleteHistoryEntry(r.id); setEditingHistoryId(null); }} style={{ padding: '8px 12px', fontSize: 9, background: 'transparent', color: 'var(--ng-red)', border: '1px solid var(--ng-red)', borderRadius: 6, cursor: 'pointer' }}>DELETE</button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--ng-surface)', border: '0.5px solid var(--ng-border)', borderLeft: `3px solid ${phaseColor}`, borderRadius: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-text)' }}>{dateStr} · {startTimeStr} → {endTimeStr}</div>
                      <div className="font-orbitron" style={{ fontSize: 8, color: phaseColor, letterSpacing: '1px', marginTop: 2 }}>{r.phaseReached}</div>
                    </div>
                    <div className="font-orbitron font-bold" style={{ fontSize: 14, color: phaseColor }}>{r.durationH}h</div>
                    <button
                      onClick={() => openEditHistory(r)}
                      style={{
                        padding: '4px 6px',
                        fontSize: 9,
                        background: 'transparent',
                        color: 'var(--ng-muted)',
                        border: '1px solid var(--ng-border)',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                    >
                      ✏️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
