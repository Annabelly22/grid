'use client';
import { useState, useEffect, useRef } from 'react';

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(FAST_KEY);
    if (stored) setFastStart(Number(stored));
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

  const stopFast = () => {
    setFastStart(null);
    localStorage.removeItem(FAST_KEY);
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
      ) : (
        <button onClick={stopFast} className="w-full font-orbitron"
          style={{ padding: '12px', fontSize: 10, letterSpacing: '3px', color: 'var(--ng-red)', border: '1px solid var(--ng-red)', background: 'transparent', borderRadius: 2, cursor: 'pointer' }}>
          ■ END FAST
        </button>
      )}
    </div>
  );
}
