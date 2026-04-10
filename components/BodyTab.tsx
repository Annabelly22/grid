'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CyclePhase, EnergyLevel, TeaCategory,
  CYCLE_PHASES, SUPPLEMENTS, TEAS, MOVEMENTS,
  getCyclePhase, getDayOfCycle,
  getSupplementsForContext, getMovementsForContext,
  CATEGORY_META, TIMING_META, Supplement, SUPPLEMENT_CONFLICTS,
} from '../lib/supplementData';
import { Storage } from '../lib/storage';
import { useGridContext } from '../contexts/GridContext';
import FastingTimer from './FastingTimer';
import GymTracker   from './GymTracker';
import GymProgram   from './GymProgram';
import MonthLog     from './MonthLog';

const STEPS_GOAL = 10000;
type SubTab = 'stack' | 'cycle' | 'fast' | 'log' | 'tea' | 'move' | 'gym' | 'cart' | 'metab';

interface MetabSupp {
  rank: number; name: string; dose: string; timing: string;
  benefit: string; priority: 'critical' | 'high' | 'medium';
  color: string; note?: string;
}

const METAB_SUPPS: MetabSupp[] = [
  { rank: 1,  name: 'L-Carnitine',              dose: '1,000–2,000mg',  timing: 'Pre-workout / with carbs',  benefit: 'Shuttles fatty acids into mitochondria for fuel. Highest impact for fat oxidation during exercise.',  priority: 'critical', color: '#FF6B35' },
  { rank: 2,  name: 'Green Tea Extract (EGCG)', dose: '400–500mg EGCG', timing: 'Morning, before training',   benefit: 'Increases metabolic rate 3–4%. Inhibits fat storage enzyme COMT. Stack with caffeine for synergy.',   priority: 'critical', color: '#30D158' },
  { rank: 3,  name: 'Chromium Picolinate',      dose: '200–400mcg',     timing: 'With largest meal',          benefit: 'Enhances insulin sensitivity. Reduces sugar cravings. Essential for glucose metabolism.',            priority: 'high',     color: '#00D4FF' },
  { rank: 4,  name: 'Alpha-Lipoic Acid (ALA)',  dose: '300–600mg',      timing: 'Before meals',               benefit: 'Universal antioxidant. Improves insulin signalling. Activates AMPK (fat burning switch).',         priority: 'high',     color: '#BF5AF2' },
  { rank: 5,  name: 'Berberine',                dose: '500mg × 3/day',  timing: 'Before each meal',           benefit: 'Activates AMPK as effectively as metformin. Lowers fasting glucose and insulin resistance.',       priority: 'high',     color: '#FFD60A' },
  { rank: 6,  name: 'CoQ10',                    dose: '100–200mg',      timing: 'With fat-containing meal',   benefit: 'Mitochondrial energy production. Prevents exercise fatigue. Essential with any statin use.',         priority: 'high',     color: '#FF9500' },
  { rank: 7,  name: 'Magnesium Glycinate',      dose: '300–400mg',      timing: 'Evening',                    benefit: 'Cofactor in 300+ enzymatic reactions including glucose metabolism. Deficiency blocks fat loss.',    priority: 'high',     color: '#32ADE6' },
  { rank: 8,  name: 'Myo-Inositol',             dose: '2–4g',           timing: 'Morning or before bed',      benefit: 'Regulates insulin and FSH. Critical for PCOS/hormonal weight gain. Improves ovarian function.',     priority: 'high',     color: '#FF375F' },
  { rank: 9,  name: 'Iodine (Kelp)',            dose: '150–300mcg',     timing: 'Morning with food',          benefit: 'Required for thyroid hormone synthesis. Subclinical deficiency slows metabolism significantly.',     priority: 'medium',   color: '#34C759' },
  { rank: 10, name: 'Ashwagandha (KSM-66)',     dose: '300–600mg',      timing: 'Evening',                    benefit: 'Lowers cortisol 15–30%. High cortisol → visceral fat accumulation. Improves body composition.',    priority: 'medium',   color: '#AC8E68' },
  { rank: 11, name: 'B-Complex (P5P B6)',       dose: '1 capsule',      timing: 'Morning with food',          benefit: 'Cofactor for amino acid and glucose metabolism. P5P form bypasses absorption issues.',               priority: 'medium',   color: '#FFB800' },
  { rank: 12, name: 'Iron + Vitamin C',         dose: 'Iron 18mg + C 250mg', timing: 'On empty stomach',     benefit: 'Iron deficiency → fatigue → reduced activity → weight gain. Vitamin C triples absorption.',         priority: 'medium',   color: '#FF453A', note: 'Menstrual phase only — do not take year-round without testing' },
];

function SupplementCard({ s, expanded, onToggle, owned, onToggleOwned, pending, onTogglePending }: {
  s: Supplement; expanded: boolean; onToggle: () => void;
  owned: boolean; onToggleOwned: () => void;
  pending?: boolean; onTogglePending?: () => void;
}) {
  const cat = CATEGORY_META[s.category];
  return (
    <div className="mb-3 transition-all" style={{ border: `0.5px solid ${expanded ? s.color : 'var(--ng-border)'}`, borderLeft: `3px solid ${s.color}`, borderRadius: 12, background: 'var(--ng-surface)', boxShadow: expanded ? `0 2px 16px ${s.color}22` : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <button className="text-left p-3" style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer' }} onClick={onToggle}>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-orbitron font-bold" style={{ color: 'var(--ng-text)', fontSize: 12, letterSpacing: '0.5px' }}>{s.name}</span>
                {s.priority === 'critical' && <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-red)', border: '1px solid var(--ng-red)', padding: '1px 5px', letterSpacing: '1px' }}>CRITICAL</span>}
                {owned && <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-green)', border: '1px solid var(--ng-green)', padding: '1px 5px', letterSpacing: '1px' }}>✓ HAVE IT</span>}
              </div>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>{s.dose}</div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="font-orbitron" style={{ fontSize: 8, color: cat.color, letterSpacing: '1px' }}>{cat.icon} {cat.label}</span>
              <span style={{ color: 'var(--ng-muted)', fontSize: 12 }}>{expanded ? '▲' : '▼'}</span>
            </div>
          </div>
          <div className="font-mono mt-1" style={{ fontSize: 10, color: s.color }}>{s.purpose}</div>
        </button>
        {onTogglePending && !owned && (
          <button
            onClick={e => { e.stopPropagation(); onTogglePending(); }}
            style={{ padding: '0 12px', background: pending ? 'rgba(255,184,0,0.08)' : 'transparent', border: 'none', borderLeft: `1px solid ${pending ? 'rgba(255,184,0,0.3)' : 'var(--ng-border)'}`, color: pending ? 'var(--ng-amber)' : 'var(--ng-dimmer)', cursor: 'pointer', fontSize: 14, flexShrink: 0, transition: 'all 0.15s' }}
            title={pending ? 'Remove from buy list' : 'Add to buy list'}>
            🛒
          </button>
        )}
      </div>
      {expanded && (
        <div className="px-3 pb-3 border-t" style={{ borderColor: 'var(--ng-border)' }}>
          <div className="pt-2 pb-1 font-mono" style={{ fontSize: 11, color: 'var(--ng-text)', lineHeight: 1.6 }}>{s.why}</div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px' }}>TAKE:</span>
            {s.timing.map(t => (
              <span key={t} className="font-orbitron" style={{ fontSize: 9, letterSpacing: '1px', color: 'var(--ng-cyan)', border: '1px solid rgba(0,212,255,0.3)', padding: '1px 6px' }}>
                {TIMING_META[t].icon} {TIMING_META[t].label}
              </span>
            ))}
          </div>
          {s.cycleNote && (
            <div className="mt-2 p-2 flex items-center gap-2" style={{ background: 'rgba(255,159,10,0.06)', border: '1px solid rgba(255,159,10,0.25)', borderRadius: 8 }}>
              <span style={{ fontSize: 12 }}>⟳</span>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-amber)', lineHeight: 1.4 }}><strong>CYCLE:</strong> {s.cycleNote}</div>
            </div>
          )}
          {s.warning && (
            <div className="mt-2 p-2" style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.3)', borderRadius: 8 }}>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-red)', lineHeight: 1.5 }}>⚠ {s.warning}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button
              onClick={e => { e.stopPropagation(); onToggleOwned(); }}
              style={{ flex: 1, padding: '8px', fontSize: 11, fontWeight: 600, border: `1px solid ${owned ? 'var(--ng-green)' : 'var(--ng-border)'}`, color: owned ? 'var(--ng-green)' : 'var(--ng-muted)', background: owned ? 'rgba(48,209,88,0.08)' : 'transparent', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}>
              {owned ? '✓ IN MY STACK' : '+ I HAVE THIS'}
            </button>
            {onTogglePending && !owned && (
              <button
                onClick={e => { e.stopPropagation(); onTogglePending(); }}
                style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, border: `1px solid ${pending ? 'var(--ng-amber)' : 'var(--ng-border)'}`, color: pending ? 'var(--ng-amber)' : 'var(--ng-muted)', background: pending ? 'rgba(255,184,0,0.08)' : 'transparent', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}
                title={pending ? 'Remove from buy list' : 'Add to buy list'}>
                {pending ? '🛒 WANT' : '🛒'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SupplementGridCard({ s, expanded, onToggle, owned, onToggleOwned, pending, onTogglePending }: {
  s: Supplement; expanded: boolean; onToggle: () => void;
  owned: boolean; onToggleOwned: () => void;
  pending?: boolean; onTogglePending?: () => void;
}) {
  const cat = CATEGORY_META[s.category];
  return (
    <div style={{ border: `0.5px solid ${expanded ? s.color : 'var(--ng-border)'}`, borderTop: `3px solid ${s.color}`, borderRadius: 12, background: 'var(--ng-surface)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <button className="w-full text-left p-2" onClick={onToggle} style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span className="font-orbitron" style={{ fontSize: 7, color: cat.color, letterSpacing: '1px' }}>{cat.icon} {cat.label}</span>
          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            {pending && <span style={{ fontSize: 8, color: 'var(--ng-amber)' }}>🛒</span>}
            {owned && <span style={{ fontSize: 7, color: 'var(--ng-green)' }}>✓</span>}
            {s.priority === 'critical' && <span className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-red)' }}>!</span>}
          </div>
        </div>
        <div className="font-orbitron" style={{ fontSize: 10, color: 'var(--ng-text)', fontWeight: 700, lineHeight: 1.3, marginBottom: 3 }}>{s.name}</div>
        <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>{s.dose}</div>
        <div className="font-mono" style={{ fontSize: 9, color: s.color, marginTop: 3 }}>{s.purpose}</div>
      </button>
      {expanded && (
        <div className="p-2" style={{ borderTop: '1px solid var(--ng-border)' }}>
          <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-text)', lineHeight: 1.5 }}>{s.why}</div>
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            <button onClick={e => { e.stopPropagation(); onToggleOwned(); }}
              style={{ flex: 1, padding: '5px', fontSize: 9, fontWeight: 600, border: `1px solid ${owned ? 'var(--ng-green)' : 'var(--ng-border)'}`, color: owned ? 'var(--ng-green)' : 'var(--ng-muted)', background: owned ? 'rgba(48,209,88,0.08)' : 'transparent', borderRadius: 6, cursor: 'pointer' }}>
              {owned ? '✓ HAVE IT' : '+ ADD'}
            </button>
            {onTogglePending && !owned && (
              <button onClick={e => { e.stopPropagation(); onTogglePending(); }}
                style={{ padding: '5px 8px', fontSize: 10, border: `1px solid ${pending ? 'var(--ng-amber)' : 'var(--ng-border)'}`, color: pending ? 'var(--ng-amber)' : 'var(--ng-muted)', background: pending ? 'rgba(255,184,0,0.08)' : 'transparent', borderRadius: 6, cursor: 'pointer' }}>
                🛒
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Divider({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2" style={{ marginTop: 28, marginBottom: 12 }}>
      <div className="h-px flex-1" style={{ background: 'var(--ng-border)' }} />
      <span className="font-orbitron" style={{ fontSize: 9, color, letterSpacing: '2px' }}>{label}</span>
      <div className="h-px flex-1" style={{ background: 'var(--ng-border)' }} />
    </div>
  );
}

// ── Log tab: week / month toggle ─────────────────────────────────
function LogTab() {
  const [logView, setLogView] = useState<'week' | 'month'>('week');
  return (
    <>
      {/* Toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {(['week', 'month'] as const).map(v => (
          <button key={v} onClick={() => setLogView(v)} className="flex-1 font-orbitron"
            style={{
              padding: '8px', fontSize: 9, letterSpacing: '2px',
              border: `1px solid ${logView === v ? 'var(--ng-amber)' : 'var(--ng-border)'}`,
              color:  logView === v ? 'var(--ng-amber)' : 'var(--ng-muted)',
              background: logView === v ? 'rgba(255,184,0,0.08)' : 'transparent',
              borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
            }}>
            {v === 'week' ? '⬡ WEEK' : '◈ MONTH'}
          </button>
        ))}
      </div>

      {logView === 'week' ? (
        <>
          <div style={{ padding: '0 0 16px' }}>
            <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-amber)', letterSpacing: '3px', marginBottom: 4 }}>WEEKLY TRAINING LOG</div>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>Select an activity chip, then tap a day to log it. Tap again to remove.</div>
          </div>
          <GymTracker />
        </>
      ) : (
        <MonthLog />
      )}
    </>
  );
}

export default function BodyTab() {
  const { phaseChange, clearPhaseChange } = useGridContext();
  const [subTab,      setSubTab]      = useState<SubTab>('stack');
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [cycleStart,  setCycleStart]  = useState<string | null>(null);
  const [cycleInput,  setCycleInput]  = useState('');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium');
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [stackView,   setStackView]   = useState<'smart' | 'all' | 'timing'>('smart');
  const [suppView,    setSuppView]    = useState<'list' | 'grid'>('list');
  const [teaFilter,   setTeaFilter]   = useState<TeaCategory | 'all'>('all');
  const [catFilter,   setCatFilter]   = useState<string>('all');
  const [ownedSupps,    setOwnedSupps]    = useState<Set<string>>(new Set());
  const [pendingSupps,  setPendingSupps]  = useState<Set<string>>(new Set());
  const [steps,         setSteps]         = useState(0);
  const [stepsInput,    setStepsInput]    = useState('');
  const [showStepsInput, setShowStepsInput] = useState(false);
  const [autoStep,      setAutoStep]      = useState(false);
  const lastPeakRef  = useRef(0);
  const stepsRef     = useRef(0);

  const stepsDateKey = () => new Date().toISOString().split('T')[0];

  useEffect(() => {
    const sc = Storage.getCycleStart();
    if (sc) { setCycleStart(sc); setCycleInput(sc); }
    setEnergyLevel(Storage.getEnergyLevel());
    setSuppView(Storage.getSuppView());
    setOwnedSupps(Storage.getOwnedSupps());
    setPendingSupps(Storage.getPendingSupps());
    const all = Storage.getSteps();
    setSteps(all[stepsDateKey()] || 0);
  }, []);

  const saveSteps = (val: number) => {
    const clamped = Math.max(0, Math.min(99999, val));
    stepsRef.current = clamped;
    setSteps(clamped);
    const all = Storage.getSteps();
    all[stepsDateKey()] = clamped;
    Storage.setSteps(all);
  };

  const addSteps = (n: number) => saveSteps(steps + n);

  const changeSuppView = (v: 'list' | 'grid') => {
    setSuppView(v);
    Storage.setSuppView(v);
  };

  const toggleOwned = (id: string) => {
    setOwnedSupps(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      Storage.setOwnedSupps(next);
      return next;
    });
  };

  const togglePending = (id: string) => {
    setPendingSupps(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      Storage.setPendingSupps(next);
      return next;
    });
  };

  // ── Auto step counting via device accelerometer ──────────────
  const handleMotion = useCallback((e: DeviceMotionEvent) => {
    const ag = e.accelerationIncludingGravity;
    if (!ag || ag.x == null || ag.y == null || ag.z == null) return;
    const mag = Math.sqrt(ag.x * ag.x + ag.y * ag.y + ag.z * ag.z);
    const now = Date.now();
    if (mag > 12 && now - lastPeakRef.current > 300) {
      lastPeakRef.current = now;
      stepsRef.current += 1;
      saveSteps(stepsRef.current);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const startAutoStep = async () => {
    try {
      if (typeof DeviceMotionEvent !== 'undefined' &&
          typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function') {
        const perm = await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> }).requestPermission();
        if (perm !== 'granted') return;
      }
      stepsRef.current = steps;
      window.addEventListener('devicemotion', handleMotion);
      setAutoStep(true);
    } catch {}
  };

  const stopAutoStep = () => {
    window.removeEventListener('devicemotion', handleMotion);
    setAutoStep(false);
  };

  // Clean up on unmount
  useEffect(() => () => { window.removeEventListener('devicemotion', handleMotion); }, [handleMotion]);

  const phase = getCyclePhase(cycleStart);
  const dayOfCycle = getDayOfCycle(cycleStart);
  const phaseData = phase ? CYCLE_PHASES[phase] : null;

  const saveCycle = () => {
    if (!cycleInput) return;
    Storage.setCycleStart(cycleInput);
    setCycleStart(cycleInput);
  };
  const saveEnergy = (e: EnergyLevel) => { setEnergyLevel(e); Storage.setEnergyLevel(e); };

  const smartSupps = phase ? getSupplementsForContext(phase, energyLevel) : SUPPLEMENTS;
  const categories = ['all', ...Array.from(new Set(SUPPLEMENTS.map(s => s.category)))];
  const filteredAll = catFilter === 'all' ? SUPPLEMENTS : SUPPLEMENTS.filter(s => s.category === catFilter);
  const teaCategories: (TeaCategory | 'all')[] = ['all', 'morning', 'focus', 'fasting', 'evening', 'luteal', 'menstrual'];
  const filteredTeas = TEAS.filter(t => teaFilter === 'all' || t.categories.includes(teaFilter as TeaCategory));
  const movements = getMovementsForContext(phase, energyLevel);

  const SUB_TABS = [
    { id: 'stack' as SubTab, label: 'STACK',  icon: '◆',  color: 'var(--ng-green)'  },
    { id: 'cart'  as SubTab, label: 'CART',   icon: '🛒',  color: 'var(--ng-amber)',  badge: pendingSupps.size > 0 ? pendingSupps.size : undefined },
    { id: 'metab' as SubTab, label: 'METAB',  icon: '⚗',  color: '#FF6B35'          },
    { id: 'cycle' as SubTab, label: 'CYCLE',  icon: '◈',  color: 'var(--ng-purple)' },
    { id: 'fast'  as SubTab, label: 'FAST',   icon: '⏱',  color: 'var(--ng-cyan)'   },
    { id: 'log'   as SubTab, label: 'LOG',    icon: '⬡',  color: 'var(--ng-amber)'  },
    { id: 'tea'   as SubTab, label: 'TEA',    icon: '❋',  color: 'var(--ng-amber)'  },
    { id: 'move'  as SubTab, label: 'MOVE',   icon: '⚡',  color: 'var(--ng-cyan)'   },
    { id: 'gym'   as SubTab, label: 'GYM',    icon: '🏋️', color: '#FF453A'          },
  ];

  return (
    <div className="content-area" style={{ paddingBottom: 80 }}>
      {/* Phase change alert banner */}
      {phaseChange && (
        <div style={{ margin: '0 0 0', padding: '10px 16px', background: 'rgba(191,90,242,0.12)', borderBottom: '1px solid rgba(191,90,242,0.4)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>🔄</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="font-orbitron font-bold" style={{ fontSize: 9, color: 'var(--ng-purple)', letterSpacing: '2px' }}>PHASE CHANGE DETECTED</div>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-text)', lineHeight: 1.4 }}>
              {CYCLE_PHASES[phaseChange.from].icon} {CYCLE_PHASES[phaseChange.from].label} → {CYCLE_PHASES[phaseChange.to].icon} {CYCLE_PHASES[phaseChange.to].label} — Your supplement stack has been updated.
            </div>
          </div>
          <button onClick={clearPhaseChange} style={{ background: 'none', border: 'none', color: 'var(--ng-muted)', cursor: 'pointer', fontSize: 16, flexShrink: 0, padding: '0 4px' }}>✕</button>
        </div>
      )}

      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '0.5px solid var(--ng-border)' }}>
        <div className="flex items-start justify-between">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h2 className="font-orbitron font-bold" style={{ color: 'var(--ng-green)', fontSize: 16 }}>BODY</h2>
              {(() => { const t = SUB_TABS.find(t => t.id === subTab)!; return <span style={{ fontSize: 13, color: t.color, fontWeight: 500 }}>/ {t.label}</span>; })()}
            </div>
            <div className="font-mono" style={{ fontSize: 13, color: 'var(--ng-muted)' }}>
              {phaseData ? `${phaseData.icon} ${phaseData.label} — Day ${dayOfCycle}` : 'Set cycle date to personalise'}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="flex flex-col gap-1 items-end">
              <span style={{ fontSize: 11, color: 'var(--ng-muted)', fontWeight: 500 }}>ENERGY</span>
              <div className="flex gap-1">
                {(['low', 'medium', 'high'] as EnergyLevel[]).map(e => {
                  const ec = e === 'high' ? 'var(--ng-green)' : e === 'medium' ? 'var(--ng-amber)' : 'var(--ng-red)';
                  return (
                    <button key={e} onClick={() => saveEnergy(e)}
                      style={{ fontSize: 12, padding: '5px 10px', border: `1px solid ${energyLevel === e ? ec : 'var(--ng-border)'}`, color: energyLevel === e ? ec : 'var(--ng-muted)', background: energyLevel === e ? `${ec}15` : 'transparent', borderRadius: 20, cursor: 'pointer' }}>
                      {e.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
            <button onClick={() => setMenuOpen(true)}
              style={{ fontSize: 22, color: 'var(--ng-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px', lineHeight: 1, display: 'flex', alignItems: 'center' }}>
              ☰
            </button>
          </div>
        </div>

        {phaseData && (
          <div className="flex gap-1 mt-3">
            {(['menstrual', 'follicular', 'ovulatory', 'luteal'] as CyclePhase[]).map(p => (
              <div key={p} className="flex-1 h-1 rounded-full" style={{ background: p === phase ? CYCLE_PHASES[p].color : 'var(--ng-border)', boxShadow: p === phase ? `0 0 6px ${CYCLE_PHASES[p].color}88` : 'none', transition: 'all 0.3s' }} />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pt-5">

        {/* ═══ STACK ════════════════════════════════════════════ */}
        {subTab === 'stack' && (
          <>
            {!cycleStart && (
              <div className="p-4 mb-5" style={{ background: 'rgba(191,90,242,0.08)', border: '0.5px solid rgba(191,90,242,0.25)', borderRadius: 12 }}>
                <div className="font-orbitron font-bold mb-1" style={{ fontSize: 10, color: 'var(--ng-purple)', letterSpacing: '1px' }}>SET CYCLE DATE FOR PERSONALIZED STACK</div>
                <div className="font-mono mb-2" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>Log the first day of your last period to activate phase-specific supplements.</div>
                <div className="flex gap-2">
                  <input type="date" className="ng-input flex-1" value={cycleInput} onChange={e => setCycleInput(e.target.value)} />
                  <button className="btn-green" style={{ padding: '8px 14px', flexShrink: 0 }} onClick={saveCycle}>SET</button>
                </div>
              </div>
            )}

            {phaseData && (
              <div className="p-4 mb-5" style={{ background: phaseData.bg, border: `0.5px solid ${phaseData.color}33`, borderRadius: 12 }}>
                <div className="flex items-center gap-2 mb-2">
                  <span style={{ fontSize: 18 }}>{phaseData.icon}</span>
                  <div>
                    <div className="font-orbitron font-bold" style={{ color: phaseData.color, fontSize: 12, letterSpacing: '2px' }}>{phaseData.label} PHASE — DAY {dayOfCycle}</div>
                    <div className="font-orbitron" style={{ fontSize: 10, color: 'var(--ng-muted)', letterSpacing: '1px' }}>{phaseData.headline}</div>
                  </div>
                </div>
                <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-text)', lineHeight: 1.6 }}>{phaseData.craving}</div>
              </div>
            )}

            {/* View toggles + list/grid */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 20 }}>
              <div className="flex gap-1 flex-1">
                {[
                  { id: 'smart',  label: phase ? `PHASE STACK (${smartSupps.length})` : 'ALL SUPPLEMENTS' },
                  { id: 'all',    label: 'FULL LIBRARY' },
                  { id: 'timing', label: 'DAILY TIMING' },
                ].map(v => (
                  <button key={v.id} onClick={() => setStackView(v.id as any)} className="flex-1 py-1 font-orbitron"
                    style={{ fontSize: 12, border: `1px solid ${stackView === v.id ? 'var(--ng-green)' : 'var(--ng-border)'}`, color: stackView === v.id ? 'var(--ng-green)' : 'var(--ng-muted)', background: stackView === v.id ? 'rgba(48,209,88,0.08)' : 'transparent', borderRadius: 8 }}>
                    {v.label}
                  </button>
                ))}
              </div>
              {/* List / grid toggle */}
              {stackView !== 'timing' && (
                <div style={{ display: 'flex', border: '0.5px solid var(--ng-border)', borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                  <button onClick={() => changeSuppView('list')} className="font-orbitron"
                    style={{ padding: '4px 8px', fontSize: 10, background: suppView === 'list' ? 'rgba(0,255,65,0.1)' : 'transparent', color: suppView === 'list' ? 'var(--ng-green)' : 'var(--ng-muted)', border: 'none', cursor: 'pointer' }}>☰</button>
                  <button onClick={() => changeSuppView('grid')} className="font-orbitron"
                    style={{ padding: '4px 8px', fontSize: 10, background: suppView === 'grid' ? 'rgba(0,255,65,0.1)' : 'transparent', color: suppView === 'grid' ? 'var(--ng-green)' : 'var(--ng-muted)', border: 'none', borderLeft: '1px solid var(--ng-border)', cursor: 'pointer' }}>⊞</button>
                </div>
              )}
            </div>

            {stackView === 'smart' && (() => {
              const foundation  = SUPPLEMENTS.filter(s => s.category === 'foundation' && s.phases === 'all');
              const phaseAdds   = phase ? smartSupps.filter(s => s.phases !== 'all') : [];
              const cognitive   = SUPPLEMENTS.filter(s => s.category === 'serotonin' || (s.category === 'amino' && ['l-tyrosine', 'l-theanine', 'alpha-gpc'].includes(s.id)));
              const adaptogens  = SUPPLEMENTS.filter(s => s.category === 'adaptogen');
              const renderSupps = (list: Supplement[]) =>
                suppView === 'list' ? (
                  list.map(s => <SupplementCard key={s.id} s={s} expanded={expandedId === s.id} onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)} owned={ownedSupps.has(s.id)} onToggleOwned={() => toggleOwned(s.id)} pending={pendingSupps.has(s.id)} onTogglePending={() => togglePending(s.id)} />)
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    {list.map(s => <SupplementGridCard key={s.id} s={s} expanded={expandedId === s.id} onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)} owned={ownedSupps.has(s.id)} onToggleOwned={() => toggleOwned(s.id)} pending={pendingSupps.has(s.id)} onTogglePending={() => togglePending(s.id)} />)}
                  </div>
                );
              return (
                <>
                  <Divider label="⬡ FOUNDATION — DAILY NON-NEGOTIABLES" color="var(--ng-cyan)" />
                  {renderSupps(foundation)}
                  {phase && phaseAdds.length > 0 && (
                    <>
                      <Divider label={`${phaseData?.icon} ${phaseData?.label} PHASE ADDITIONS`} color={phaseData?.color || 'var(--ng-green)'} />
                      {renderSupps(phaseAdds)}
                    </>
                  )}
                  <Divider label="◈ SEROTONIN + COGNITION" color="var(--ng-purple)" />
                  {renderSupps(cognitive)}
                  <Divider label="❋ ADAPTOGENS" color="var(--ng-amber)" />
                  {renderSupps(adaptogens)}
                </>
              );
            })()}

            {stackView === 'all' && (
              <>
                <div className="flex gap-1 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  {categories.map(c => {
                    const meta = c === 'all' ? null : CATEGORY_META[c];
                    return (
                      <button key={c} onClick={() => setCatFilter(c)} className="whitespace-nowrap font-orbitron flex-shrink-0"
                        style={{ fontSize: 12, padding: '5px 12px', border: `1px solid ${catFilter === c ? (meta?.color || 'var(--ng-green)') : 'var(--ng-border)'}`, color: catFilter === c ? (meta?.color || 'var(--ng-green)') : 'var(--ng-muted)', background: catFilter === c ? `${meta?.color || 'var(--ng-green)'}12` : 'transparent', borderRadius: 20 }}>
                        {c === 'all' ? 'ALL' : `${meta?.icon} ${meta?.label}`}
                      </button>
                    );
                  })}
                </div>
                {suppView === 'list' ? (
                  filteredAll.map(s => <SupplementCard key={s.id} s={s} expanded={expandedId === s.id} onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)} owned={ownedSupps.has(s.id)} onToggleOwned={() => toggleOwned(s.id)} pending={pendingSupps.has(s.id)} onTogglePending={() => togglePending(s.id)} />)
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {filteredAll.map(s => <SupplementGridCard key={s.id} s={s} expanded={expandedId === s.id} onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)} owned={ownedSupps.has(s.id)} onToggleOwned={() => toggleOwned(s.id)} pending={pendingSupps.has(s.id)} onTogglePending={() => togglePending(s.id)} />)}
                  </div>
                )}
              </>
            )}

            {stackView === 'timing' && (
              <div>
                {[
                  { time: 'MORNING', icon: '🌅', color: 'var(--ng-amber)', items: ['Rhodiola 200–400mg (follicular/ovulatory)', 'L-Tyrosine 500–1,000mg', 'Alpha-GPC 300–600mg', 'Lion\'s Mane 500–1,000mg', 'B-Complex with P5P B6', 'Vitamin D3 + K2 (with first food)', 'Maca Root (smoothie)', '→ Matcha or Ginger + Lemon tea', '→ 5-min Nadi Shodhana before screens'] },
                  { time: 'PRE-WORKOUT', icon: '💪', color: 'var(--ng-green)', items: ['EAAs 10g (especially fasted)', 'Electrolytes — 1 serving', 'L-Carnitine 1–2g (luteal)', 'L-Citrulline 3–6g (ovulatory)'] },
                  { time: 'WITH FIRST MEAL', icon: '🍽️', color: 'var(--ng-cyan)', items: ['Omega-3 2–3g', 'Zinc 15–25mg', 'Creatine 5g', 'Iron + Vitamin C (menstrual only)', 'Shatavari 500–1,000mg', '→ Target 40–50g protein in this meal'] },
                  { time: 'AFTERNOON', icon: '☀️', color: 'var(--ng-purple)', items: ['L-Theanine 100–200mg', 'Holy Basil (Tulsi) 300–600mg', '→ Tulsi tea ritual (2–4PM)', 'Vitex — Chasteberry (luteal)'] },
                  { time: 'EVENING', icon: '🌙', color: 'var(--ng-purple)', items: ['Magnesium Glycinate 300–400mg', 'Ashwagandha 300–600mg (luteal)', '5-HTP 50–100mg (luteal/menstrual)', 'L-Glutamine 5–10g', 'Reishi Mushroom', '→ Chamomile + Lavender tea', '→ Screens off 30 min after this stack'] },
                ].map(block => (
                  <div key={block.time} className="card p-4 mb-4" style={{ borderLeft: `3px solid ${block.color}` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span style={{ fontSize: 14 }}>{block.icon}</span>
                      <span className="font-orbitron font-bold" style={{ fontSize: 11, color: block.color, letterSpacing: '2px' }}>{block.time}</span>
                    </div>
                    {block.items.map((item, i) => (
                      <div key={i} className="font-mono flex items-start gap-1 mb-1" style={{ fontSize: 10, color: item.startsWith('→') ? block.color : 'var(--ng-text)', lineHeight: 1.5 }}>
                        {!item.startsWith('→') && <span style={{ color: 'var(--ng-muted)', flexShrink: 0 }}>◈</span>}
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* PENDING BUY LIST */}
            {pendingSupps.size > 0 && (
              <div className="mt-6">
                <Divider label="🛒 PENDING PURCHASE" color="var(--ng-amber)" />
                <div style={{ background: 'rgba(255,184,0,0.04)', border: '0.5px solid rgba(255,184,0,0.2)', borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
                  {SUPPLEMENTS.filter(s => pendingSupps.has(s.id)).map((s, i, arr) => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: i < arr.length - 1 ? '0.5px solid rgba(255,184,0,0.15)' : 'none' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div className="font-orbitron" style={{ fontSize: 11, color: 'var(--ng-text)', letterSpacing: '0.5px' }}>{s.name}</div>
                        <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', marginTop: 2 }}>{s.dose}</div>
                      </div>
                      <button onClick={() => togglePending(s.id)}
                        style={{ fontSize: 9, padding: '4px 10px', border: '1px solid rgba(255,184,0,0.4)', color: 'var(--ng-amber)', background: 'transparent', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '1px', flexShrink: 0 }}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px', padding: '0 2px' }}>
                  {pendingSupps.size} item{pendingSupps.size !== 1 ? 's' : ''} — tap 🛒 on any supplement to add · ✕ to remove
                </div>
              </div>
            )}

            {/* DON'T TAKE TOGETHER section */}
            <div className="mt-6">
              <Divider label="⚠ DON'T TAKE TOGETHER" color="var(--ng-red)" />
              {SUPPLEMENT_CONFLICTS.map((conflict, i) => (
                <div key={i} className="mb-2 p-3" style={{ background: conflict.severity === 'critical' ? 'rgba(255,71,87,0.05)' : 'rgba(255,159,10,0.05)', border: `0.5px solid ${conflict.severity === 'critical' ? 'rgba(255,71,87,0.25)' : 'rgba(255,159,10,0.25)'}`, borderRadius: 10 }}>
                  <div className="flex items-center gap-1 mb-2 flex-wrap">
                    {conflict.supplements.map((name, j) => (
                      <span key={j} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {j > 0 && <span className="font-orbitron" style={{ fontSize: 9, color: conflict.severity === 'critical' ? 'var(--ng-red)' : 'var(--ng-amber)', padding: '0 2px' }}>+</span>}
                        <span className="font-orbitron" style={{ fontSize: 9, color: conflict.severity === 'critical' ? 'var(--ng-red)' : 'var(--ng-amber)', border: `1px solid ${conflict.severity === 'critical' ? 'rgba(255,71,87,0.3)' : 'rgba(255,159,10,0.3)'}`, padding: '1px 6px', borderRadius: 4 }}>{name}</span>
                      </span>
                    ))}
                    <span className="font-orbitron" style={{ fontSize: 8, color: conflict.severity === 'critical' ? 'var(--ng-red)' : 'var(--ng-amber)', marginLeft: 'auto', border: `1px solid ${conflict.severity === 'critical' ? 'rgba(255,71,87,0.3)' : 'rgba(255,159,10,0.3)'}`, padding: '1px 6px', borderRadius: 4 }}>{conflict.severity.toUpperCase()}</span>
                  </div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', lineHeight: 1.5 }}>{conflict.risk}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3" style={{ background: 'var(--ng-bg)', border: '0.5px solid var(--ng-border)', borderRadius: 10 }}>
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', lineHeight: 1.6 }}>
                ⚠ Educational guidance, not medical advice. Confirm with a doctor before starting any new supplement, especially 5-HTP, adaptogens, or hormone-adjacent botanicals. Available at Amazon, iHerb, Vitamin Shoppe (Dallas).
              </div>
            </div>
          </>
        )}

        {/* ═══ CYCLE ════════════════════════════════════════════ */}
        {subTab === 'cycle' && (
          <>
            <div className="card p-4 mb-5">
              <div className="font-orbitron mb-2" style={{ fontSize: 9, color: 'var(--ng-purple)', letterSpacing: '1px' }}>{cycleStart ? 'UPDATE CYCLE DATE' : 'LOG FIRST DAY OF PERIOD'}</div>
              <div className="flex gap-2">
                <input type="date" className="ng-input flex-1" value={cycleInput || cycleStart || ''} onChange={e => setCycleInput(e.target.value)} />
                <button className="btn-green" style={{ padding: '8px 14px', flexShrink: 0 }} onClick={saveCycle}>{cycleStart ? 'UPDATE' : 'SET'}</button>
              </div>
              {cycleStart && <div className="font-mono mt-2" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>Day {dayOfCycle} of cycle</div>}
            </div>

            {(['menstrual', 'follicular', 'ovulatory', 'luteal'] as CyclePhase[]).map(p => {
              const pd = CYCLE_PHASES[p];
              const isActive = p === phase;
              return (
                <div key={p} className="card mb-4" style={{ borderColor: isActive ? pd.color : 'var(--ng-border)', boxShadow: isActive ? `0 0 16px ${pd.color}22` : 'none', transition: 'all 0.2s' }}>
                  <div style={{ borderLeft: `4px solid ${pd.color}`, background: isActive ? pd.bg : 'transparent', padding: 12 }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: 18 }}>{pd.icon}</span>
                        <div>
                          <div className="font-orbitron font-bold" style={{ color: pd.color, fontSize: 11, letterSpacing: '2px' }}>{pd.label}</div>
                          <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>{pd.days}</div>
                        </div>
                      </div>
                      {isActive && <span className="font-orbitron" style={{ fontSize: 9, color: pd.color, border: `1px solid ${pd.color}`, padding: '2px 8px', letterSpacing: '1px' }}>YOU ARE HERE</span>}
                    </div>
                    <div className="font-orbitron font-bold mb-1" style={{ fontSize: 11, color: 'var(--ng-text)', letterSpacing: '1px' }}>{pd.headline}</div>
                    <div className="font-mono mb-3" style={{ fontSize: 10, color: 'var(--ng-text)', lineHeight: 1.6 }}>{pd.body}</div>
                    {[['🏋️', 'TRAINING', pd.training], ['⏱️', 'FASTING', pd.fasting], ['🧠', 'CRAVINGS', pd.craving]].map(([icon, label, text]) => (
                      <div key={label} className="p-2 mb-2" style={{ background: 'var(--ng-bg)', borderLeft: `2px solid ${pd.color}44` }}>
                        <div className="font-orbitron mb-0.5 flex items-center gap-1" style={{ fontSize: 9, color: pd.color, letterSpacing: '1px' }}>{icon} {label}</div>
                        <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', lineHeight: 1.5 }}>{text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {/* ═══ FAST ════════════════════════════════════════════ */}
        {subTab === 'fast' && (
          <>
            <div style={{ padding: '4px 0 20px' }}>
              <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-cyan)', letterSpacing: '3px', marginBottom: 4 }}>INTERMITTENT FASTING TRACKER</div>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>Circle fills over 24 hours. Each tick marks a phase transition.</div>
            </div>
            <FastingTimer />
          </>
        )}

        {/* ═══ LOG ═════════════════════════════════════════════ */}
        {subTab === 'log' && (
          <LogTab />
        )}

        {/* ═══ TEA ══════════════════════════════════════════════ */}
        {subTab === 'tea' && (
          <>
            <div className="flex gap-1 mb-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {teaCategories.map(c => (
                <button key={c} onClick={() => setTeaFilter(c)} className="whitespace-nowrap font-orbitron flex-shrink-0"
                  style={{ fontSize: 12, padding: '5px 12px', border: `1px solid ${teaFilter === c ? 'var(--ng-amber)' : 'var(--ng-border)'}`, color: teaFilter === c ? 'var(--ng-amber)' : 'var(--ng-muted)', background: teaFilter === c ? 'rgba(255,159,10,0.1)' : 'transparent', borderRadius: 20 }}>
                  {c === 'all' ? 'ALL' : c.toUpperCase()}
                </button>
              ))}
            </div>

            {filteredTeas.map(tea => (
              <div key={tea.id} className="card p-4 mb-4" style={{ borderLeft: '3px solid var(--ng-amber)' }}>
                <div className="flex items-start gap-2 mb-1">
                  <span style={{ fontSize: 18 }}>{tea.icon}</span>
                  <div>
                    <div className="font-orbitron font-bold" style={{ fontSize: 12, color: 'var(--ng-text)', letterSpacing: '0.5px' }}>{tea.name}</div>
                    <div className="flex gap-1 mt-0.5">
                      {tea.categories.slice(0, 2).map(c => (
                        <span key={c} className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-amber)', border: '1px solid rgba(255,184,0,0.3)', padding: '1px 5px', letterSpacing: '1px' }}>{c.toUpperCase()}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="font-mono mb-1" style={{ fontSize: 10, color: 'var(--ng-amber)' }}>{tea.purpose}</div>
                <div className="font-mono mb-2" style={{ fontSize: 10, color: 'var(--ng-text)', lineHeight: 1.5 }}>{tea.benefit}</div>
                <div className="p-2 mb-3" style={{ background: 'var(--ng-bg)', borderLeft: '2px solid var(--ng-border)' }}>
                  <div className="font-orbitron mb-0.5" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>HOW TO BREW</div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', lineHeight: 1.5 }}>{tea.notes}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => toggleOwned(tea.id)}
                    style={{ flex: 1, padding: '8px', fontSize: 11, fontWeight: 600, border: `1px solid ${ownedSupps.has(tea.id) ? 'var(--ng-green)' : 'var(--ng-border)'}`, color: ownedSupps.has(tea.id) ? 'var(--ng-green)' : 'var(--ng-muted)', background: ownedSupps.has(tea.id) ? 'rgba(48,209,88,0.08)' : 'transparent', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {ownedSupps.has(tea.id) ? '✓ I HAVE THIS' : '+ I HAVE THIS'}
                  </button>
                  {!ownedSupps.has(tea.id) && (
                    <button
                      onClick={() => togglePending(tea.id)}
                      style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, border: `1px solid ${pendingSupps.has(tea.id) ? 'var(--ng-amber)' : 'var(--ng-border)'}`, color: pendingSupps.has(tea.id) ? 'var(--ng-amber)' : 'var(--ng-muted)', background: pendingSupps.has(tea.id) ? 'rgba(255,184,0,0.08)' : 'transparent', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}>
                      {pendingSupps.has(tea.id) ? '🛒 WANT' : '🛒'}
                    </button>
                  )}
                </div>
              </div>
            ))}

            <Divider label="❋ FLOWERS & BOTANICALS" color="var(--ng-amber)" />
            {[
              { id: 'bot_lavender',     name: 'Lavender',     form: 'Tea, essential oil, diffusion',    note: 'Cortisol reduction, sleep quality. Diffuse at your desk during late-night sessions. Add dried flowers to evening chamomile.' },
              { id: 'bot_rose_petals',  name: 'Rose Petals',  form: 'Tea, tincture',                    note: 'Rich in Vitamin C. Historically used for emotional balance and feminine hormone support. Rose hip tea is especially high in bioavailable C.' },
              { id: 'bot_passionflower',name: 'Passionflower',form: 'Tea or capsule 250–500mg',          note: 'GABA agonist. Use during high-anxiety periods: FTMO challenge weeks, late luteal phase, intense deadlines.' },
              { id: 'bot_calendula',    name: 'Calendula',    form: 'Tea',                               note: 'Anti-inflammatory, hormone-supportive, gut healing. Gentle and consistent.' },
              { id: 'bot_blue_lotus',   name: 'Blue Lotus',   form: 'Tea (occasional)',                  note: 'Ancient Egyptian. Mild natural euphoriant, relaxing without sedation. For evening rituals and spiritual practices.' },
              { id: 'bot_shatavari',    name: 'Shatavari',    form: 'Capsule or powder',                 note: 'Ayurvedic adaptogen for women. Hormone balance, reproductive health. One of the most respected female wellness herbs.' },
              { id: 'bot_dong_quai',    name: 'Dong Quai',    form: 'Capsule — days 1–13 only',          note: 'Traditional Chinese "female ginseng." Blood circulation and iron support post-menstruation. Menstrual and early follicular phase only.' },
            ].map(b => (
              <div key={b.id} className="card p-3 mb-3" style={{ borderLeft: '3px solid rgba(191,0,255,0.5)' }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="font-orbitron font-bold" style={{ fontSize: 11, color: 'var(--ng-text)', letterSpacing: '0.5px' }}>{b.name}</div>
                  <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-purple)' }}>{b.form.split('(')[0].trim()}</span>
                </div>
                <div className="font-mono mb-3" style={{ fontSize: 10, color: 'var(--ng-muted)', lineHeight: 1.5 }}>{b.note}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => toggleOwned(b.id)}
                    style={{ flex: 1, padding: '7px', fontSize: 10, fontWeight: 600, border: `1px solid ${ownedSupps.has(b.id) ? 'var(--ng-green)' : 'var(--ng-border)'}`, color: ownedSupps.has(b.id) ? 'var(--ng-green)' : 'var(--ng-muted)', background: ownedSupps.has(b.id) ? 'rgba(48,209,88,0.08)' : 'transparent', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}>
                    {ownedSupps.has(b.id) ? '✓ I HAVE THIS' : '+ I HAVE THIS'}
                  </button>
                  {!ownedSupps.has(b.id) && (
                    <button
                      onClick={() => togglePending(b.id)}
                      style={{ padding: '7px 12px', fontSize: 10, fontWeight: 600, border: `1px solid ${pendingSupps.has(b.id) ? 'var(--ng-amber)' : 'var(--ng-border)'}`, color: pendingSupps.has(b.id) ? 'var(--ng-amber)' : 'var(--ng-muted)', background: pendingSupps.has(b.id) ? 'rgba(255,184,0,0.08)' : 'transparent', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}>
                      {pendingSupps.has(b.id) ? '🛒 WANT' : '🛒'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </>
        )}

        {/* ═══ MOVE ═════════════════════════════════════════════ */}
        {subTab === 'move' && (
          <>
            {/* ── Step counter hero ───────────────────────────── */}
            {(() => {
              const pct = Math.min(steps / STEPS_GOAL, 1);
              const r = 58, cx = 70, cy = 70;
              const circ = 2 * Math.PI * r;
              const dash = circ * pct;
              const goalReached = steps >= STEPS_GOAL;
              return (
                <div style={{ marginBottom: 24, padding: '20px 16px', background: goalReached ? 'rgba(48,209,88,0.06)' : 'rgba(0,212,255,0.04)', border: `0.5px solid ${goalReached ? 'var(--ng-green)' : 'var(--ng-cyan)'}33`, borderRadius: 16, textAlign: 'center' }}>
                  <div className="font-orbitron" style={{ fontSize: 8, color: goalReached ? 'var(--ng-green)' : 'var(--ng-cyan)', letterSpacing: '3px', marginBottom: 16 }}>
                    {goalReached ? '✓ DAILY GOAL REACHED' : 'STEP COUNTER'}
                  </div>

                  {/* SVG ring */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <svg width={140} height={140} viewBox="0 0 140 140">
                      {/* Background ring */}
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--ng-border)" strokeWidth={8} />
                      {/* Progress ring */}
                      <circle cx={cx} cy={cy} r={r} fill="none"
                        stroke={goalReached ? 'var(--ng-green)' : 'var(--ng-cyan)'}
                        strokeWidth={8}
                        strokeLinecap="round"
                        strokeDasharray={`${dash} ${circ}`}
                        strokeDashoffset={0}
                        transform={`rotate(-90 ${cx} ${cy})`}
                        style={{ transition: 'stroke-dasharray 0.5s ease', filter: `drop-shadow(0 0 8px ${goalReached ? 'var(--ng-green)' : 'var(--ng-cyan)'})` }}
                      />
                      {/* Center text */}
                      <text x={cx} y={cy - 8} textAnchor="middle" fill="var(--ng-text)" fontSize={20} fontFamily="Orbitron, monospace" fontWeight={700}>
                        {steps.toLocaleString()}
                      </text>
                      <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--ng-muted)" fontSize={9} fontFamily="Orbitron, monospace">
                        STEPS
                      </text>
                      <text x={cx} y={cy + 26} textAnchor="middle" fill={goalReached ? 'var(--ng-green)' : 'var(--ng-cyan)'} fontSize={8} fontFamily="Orbitron, monospace">
                        {Math.round(pct * 100)}% of 10k
                      </text>
                    </svg>
                  </div>

                  {/* Auto step badge */}
                  {autoStep && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ng-green)', boxShadow: '0 0 6px var(--ng-green)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                      <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-green)', letterSpacing: '2px' }}>AUTO COUNTING</span>
                    </div>
                  )}

                  {/* Quick-add buttons */}
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                    {!autoStep ? (
                      <button onClick={startAutoStep} className="font-orbitron"
                        style={{ fontSize: 9, padding: '7px 14px', border: '1px solid var(--ng-green)55', color: 'var(--ng-green)', background: 'rgba(48,209,88,0.08)', borderRadius: 8, cursor: 'pointer', letterSpacing: '1px' }}>
                        📱 AUTO
                      </button>
                    ) : (
                      <button onClick={stopAutoStep} className="font-orbitron"
                        style={{ fontSize: 9, padding: '7px 14px', border: '1px solid var(--ng-green)', color: 'var(--ng-green)', background: 'rgba(48,209,88,0.12)', borderRadius: 8, cursor: 'pointer', letterSpacing: '1px' }}>
                        ■ STOP
                      </button>
                    )}
                    {[1000, 2500, 5000].map(n => (
                      <button key={n} onClick={() => addSteps(n)} className="font-orbitron"
                        style={{ fontSize: 9, padding: '7px 12px', border: `1px solid ${goalReached ? 'var(--ng-green)' : 'var(--ng-cyan)'}55`, color: goalReached ? 'var(--ng-green)' : 'var(--ng-cyan)', background: 'transparent', borderRadius: 8, cursor: 'pointer', letterSpacing: '1px' }}>
                        +{(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k
                      </button>
                    ))}
                    <button onClick={() => setShowStepsInput(v => !v)} className="font-orbitron"
                      style={{ fontSize: 9, padding: '7px 12px', border: '1px solid var(--ng-border)', color: 'var(--ng-muted)', background: 'transparent', borderRadius: 8, cursor: 'pointer', letterSpacing: '1px' }}>
                      SET
                    </button>
                    {steps > 0 && (
                      <button onClick={() => saveSteps(0)} className="font-orbitron"
                        style={{ fontSize: 9, padding: '7px 12px', border: '1px solid var(--ng-border)', color: 'var(--ng-dimmer)', background: 'transparent', borderRadius: 8, cursor: 'pointer', letterSpacing: '1px' }}>
                        RESET
                      </button>
                    )}
                  </div>

                  {/* Manual input */}
                  {showStepsInput && (
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <input
                        type="number"
                        className="ng-input"
                        placeholder="Enter steps"
                        value={stepsInput}
                        onChange={e => setStepsInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            const n = parseInt(stepsInput, 10);
                            if (!isNaN(n)) { saveSteps(n); setStepsInput(''); setShowStepsInput(false); }
                          }
                        }}
                        style={{ width: 140, textAlign: 'center', fontSize: 14, fontFamily: 'monospace' }}
                      />
                      <button className="btn-green" style={{ padding: '8px 14px' }} onClick={() => {
                        const n = parseInt(stepsInput, 10);
                        if (!isNaN(n)) { saveSteps(n); setStepsInput(''); setShowStepsInput(false); }
                      }}>OK</button>
                    </div>
                  )}
                </div>
              );
            })()}

            {phaseData && (
              <div className="mb-5 p-4" style={{ background: phaseData.bg, border: `0.5px solid ${phaseData.color}33`, borderRadius: 10 }}>
                <div className="font-mono" style={{ fontSize: 10, color: phaseData.color }}>
                  {phaseData.icon} Phase recommendation: <strong>{phaseData.training}</strong>
                </div>
              </div>
            )}

            {movements.map(m => (
              <div key={m.id} className="card p-4 mb-4" style={{ borderLeft: '3px solid var(--ng-cyan)' }}>
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <div className="font-orbitron font-bold" style={{ fontSize: 12, color: 'var(--ng-text)', letterSpacing: '0.5px' }}>{m.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-cyan)' }}>{m.tradition}</span>
                      <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>· {m.duration}</span>
                    </div>
                  </div>
                </div>
                <div className="font-mono mb-1" style={{ fontSize: 10, color: 'var(--ng-cyan)' }}>{m.purpose}</div>
                <div className="font-mono mb-2" style={{ fontSize: 10, color: 'var(--ng-text)', lineHeight: 1.6 }}>{m.description}</div>
                <div className="flex gap-1 flex-wrap">
                  {m.tags.map(tag => (
                    <span key={tag} className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', border: '1px solid var(--ng-border)', padding: '1px 6px', letterSpacing: '1px' }}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}

            <div className="mt-4 p-4" style={{ background: 'var(--ng-bg)', border: '0.5px solid var(--ng-border)', borderRadius: 10 }}>
              <div className="font-orbitron mb-2" style={{ fontSize: 9, color: 'var(--ng-cyan)', letterSpacing: '1px' }}>⚡ PRIORITY DAILY PRACTICES</div>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', lineHeight: 1.7 }}>
                1. Morning sunlight walk (any phase, any energy)<br />
                2. Nadi Shodhana before every trading session<br />
                3. Yin Yoga on low-energy luteal days<br />
                4. Earthing 15 min (barefoot grass/soil)<br />
                5. Bhramari breath when emotionally reactive
              </div>
            </div>
          </>
        )}

        {/* ═══ CART ════════════════════════════════════════════ */}
        {subTab === 'cart' && (
          <>
            <div style={{ padding: '4px 0 20px' }}>
              <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-amber)', letterSpacing: '3px', marginBottom: 4 }}>PENDING PURCHASE LIST</div>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>Supplements you plan to buy. Tap 🛒 on any supplement to add here.</div>
            </div>

            {(() => {
              // Build a unified lookup: all item types that support cart
              type CartItem = { name: string; subtitle: string; color: string };
              const lookup: Record<string, CartItem> = {};
              SUPPLEMENTS.forEach(s => { lookup[s.id] = { name: s.name, subtitle: s.dose, color: s.color }; });
              TEAS.forEach(t => { lookup[t.id] = { name: t.name, subtitle: t.purpose, color: 'var(--ng-amber)' }; });
              [
                { id: 'bot_lavender',      name: 'Lavender',      subtitle: 'Tea, essential oil, diffusion' },
                { id: 'bot_rose_petals',   name: 'Rose Petals',   subtitle: 'Tea, tincture' },
                { id: 'bot_passionflower', name: 'Passionflower', subtitle: 'Tea or capsule 250–500mg' },
                { id: 'bot_calendula',     name: 'Calendula',     subtitle: 'Tea' },
                { id: 'bot_blue_lotus',    name: 'Blue Lotus',    subtitle: 'Tea (occasional)' },
                { id: 'bot_shatavari',     name: 'Shatavari',     subtitle: 'Capsule or powder' },
                { id: 'bot_dong_quai',     name: 'Dong Quai',     subtitle: 'Capsule — days 1–13 only' },
              ].forEach(b => { lookup[b.id] = { name: b.name, subtitle: b.subtitle, color: 'rgba(191,0,255,0.8)' }; });
              METAB_SUPPS.forEach(m => { lookup[`metab_${m.rank}`] = { name: m.name, subtitle: m.dose, color: m.color }; });

              const cartIds = [...pendingSupps].filter(id => lookup[id]);

              if (cartIds.length === 0) {
                return (
                  <div style={{ padding: '32px 16px', textAlign: 'center', border: '1px dashed var(--ng-border)', borderRadius: 12 }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>🛒</div>
                    <div className="font-orbitron" style={{ fontSize: 10, color: 'var(--ng-muted)', letterSpacing: '2px' }}>CART IS EMPTY</div>
                    <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-dimmer)', marginTop: 6 }}>Tap 🛒 on any supplement, tea, or botanical across STACK, TEA, and METAB tabs.</div>
                  </div>
                );
              }
              return (
                <>
                  <div style={{ background: 'rgba(255,184,0,0.04)', border: '0.5px solid rgba(255,184,0,0.2)', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
                    {cartIds.map((id, i) => {
                      const item = lookup[id];
                      return (
                        <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: i < cartIds.length - 1 ? '0.5px solid rgba(255,184,0,0.15)' : 'none' }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="font-orbitron" style={{ fontSize: 12, color: 'var(--ng-text)', letterSpacing: '0.5px' }}>{item.name}</div>
                            <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', marginTop: 2 }}>{item.subtitle}</div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', flexShrink: 0 }}>
                            <button onClick={() => { toggleOwned(id); togglePending(id); }}
                              style={{ fontSize: 9, padding: '4px 10px', border: '1px solid var(--ng-green)', color: 'var(--ng-green)', background: 'transparent', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '1px', whiteSpace: 'nowrap' }}>
                              ✓ GOT IT
                            </button>
                            <button onClick={() => togglePending(id)}
                              style={{ fontSize: 9, padding: '4px 10px', border: '1px solid rgba(255,71,87,0.4)', color: 'var(--ng-red)', background: 'transparent', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '1px' }}>
                              ✕ REMOVE
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px', padding: '0 2px', marginBottom: 8 }}>
                    {cartIds.length} item{cartIds.length !== 1 ? 's' : ''} · ✓ GOT IT marks owned and removes · covers all sections
                  </div>
                  <div className="p-3" style={{ background: 'var(--ng-bg)', border: '0.5px solid var(--ng-border)', borderRadius: 10 }}>
                    <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', lineHeight: 1.6 }}>
                      Available at Amazon, iHerb, Vitamin Shoppe (Dallas). Search by exact name for best results.
                    </div>
                  </div>
                </>
              );
            })()}
          </>
        )}

        {/* ═══ METAB ═══════════════════════════════════════════ */}
        {subTab === 'metab' && (
          <>
            <div style={{ padding: '4px 0 20px' }}>
              <div className="font-orbitron" style={{ fontSize: 8, color: '#FF6B35', letterSpacing: '3px', marginBottom: 4 }}>METABOLISM + WEIGHT LOSS PROTOCOL</div>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>12 evidence-ranked supplements for fat metabolism, insulin sensitivity, and hormonal weight regulation.</div>
            </div>

            {/* Priority legend */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[{ label: 'CRITICAL', color: 'var(--ng-red)' }, { label: 'HIGH', color: 'var(--ng-amber)' }, { label: 'MEDIUM', color: 'var(--ng-cyan)' }].map(p => (
                <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color }} />
                  <span className="font-orbitron" style={{ fontSize: 8, color: p.color, letterSpacing: '1px' }}>{p.label}</span>
                </div>
              ))}
            </div>

            {METAB_SUPPS.map(m => {
              const mid = `metab_${m.rank}`;
              const priorityColor = m.priority === 'critical' ? 'var(--ng-red)' : m.priority === 'high' ? 'var(--ng-amber)' : 'var(--ng-cyan)';
              return (
                <div key={m.rank} className="mb-3" style={{ border: `0.5px solid var(--ng-border)`, borderLeft: `3px solid ${m.color}`, borderRadius: 12, background: 'var(--ng-surface)', padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-dimmer)', letterSpacing: '1px' }}>#{m.rank}</span>
                        <span className="font-orbitron font-bold" style={{ fontSize: 12, color: 'var(--ng-text)', letterSpacing: '0.5px' }}>{m.name}</span>
                      </div>
                      <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>{m.dose} · {m.timing}</div>
                    </div>
                    <span className="font-orbitron" style={{ fontSize: 8, color: priorityColor, border: `1px solid ${priorityColor}`, padding: '2px 6px', letterSpacing: '1px', flexShrink: 0 }}>{m.priority.toUpperCase()}</span>
                  </div>
                  <div className="font-mono mb-3" style={{ fontSize: 10, color: 'var(--ng-text)', lineHeight: 1.5 }}>{m.benefit}</div>
                  {m.note && (
                    <div className="mb-3 p-2" style={{ background: 'rgba(255,71,87,0.06)', border: '1px solid rgba(255,71,87,0.25)', borderRadius: 6 }}>
                      <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-red)', lineHeight: 1.4 }}>⚠ {m.note}</div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => toggleOwned(mid)}
                      style={{ flex: 1, padding: '8px', fontSize: 11, fontWeight: 600, border: `1px solid ${ownedSupps.has(mid) ? 'var(--ng-green)' : 'var(--ng-border)'}`, color: ownedSupps.has(mid) ? 'var(--ng-green)' : 'var(--ng-muted)', background: ownedSupps.has(mid) ? 'rgba(48,209,88,0.08)' : 'transparent', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}>
                      {ownedSupps.has(mid) ? '✓ IN MY STACK' : '+ I HAVE THIS'}
                    </button>
                    {!ownedSupps.has(mid) && (
                      <button
                        onClick={() => togglePending(mid)}
                        style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, border: `1px solid ${pendingSupps.has(mid) ? 'var(--ng-amber)' : 'var(--ng-border)'}`, color: pendingSupps.has(mid) ? 'var(--ng-amber)' : 'var(--ng-muted)', background: pendingSupps.has(mid) ? 'rgba(255,184,0,0.08)' : 'transparent', borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}>
                        {pendingSupps.has(mid) ? '🛒 WANT' : '🛒'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            <div style={{ marginTop: 8, padding: '16px', background: 'rgba(255,107,53,0.06)', border: '0.5px solid rgba(255,107,53,0.25)', borderRadius: 12 }}>
              <div className="font-orbitron mb-2" style={{ fontSize: 9, color: '#FF6B35', letterSpacing: '2px' }}>EXPECTED OUTCOMES</div>
              {[
                ['Week 1–2', 'Reduced sugar cravings. Improved post-meal energy. Better sleep quality.'],
                ['Week 3–4', 'Noticeable increase in energy during training. Reduced water retention.'],
                ['Month 2', 'Improved body composition. Measurable fat loss with consistent training.'],
                ['Month 3+', 'Optimized hormonal baseline. Sustainable weight regulation without restriction.'],
              ].map(([time, text]) => (
                <div key={time} className="flex gap-2 mb-2">
                  <span className="font-orbitron" style={{ fontSize: 9, color: '#FF6B35', flexShrink: 0, minWidth: 64 }}>{time}</span>
                  <span className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', lineHeight: 1.4 }}>{text}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3" style={{ background: 'var(--ng-bg)', border: '0.5px solid var(--ng-border)', borderRadius: 10 }}>
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', lineHeight: 1.6 }}>
                ⚠ Educational guidance, not medical advice. Berberine interacts with medications — consult a doctor if on any prescriptions. Test iron levels before supplementing year-round.
              </div>
            </div>
          </>
        )}

        {/* ═══ GYM ══════════════════════════════════════════════ */}
        {subTab === 'gym' && (
          <>
            <div style={{ padding: '4px 0 20px' }}>
              <div className="font-orbitron" style={{ fontSize: 8, color: '#FF453A', letterSpacing: '3px', marginBottom: 4 }}>WORKOUT PROGRAM</div>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>Tap a day to open the session. Check off exercises as you go.</div>
            </div>
            <GymProgram />
          </>
        )}
      </div>

      {/* Side drawer */}
      {menuOpen && (
        <>
          <div className="side-drawer-backdrop" onClick={() => setMenuOpen(false)} />
          <div className="side-drawer">
            <div style={{ padding: '56px 20px 16px', borderBottom: '0.5px solid var(--ng-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--ng-muted)', fontWeight: 600, marginBottom: 2 }}>BODY</div>
              <div style={{ fontSize: 13, color: 'var(--ng-text)', fontWeight: 700 }}>Sections</div>
            </div>
            {SUB_TABS.map(t => (
              <button key={t.id} onClick={() => { setSubTab(t.id); setMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '15px 20px', width: '100%',
                  background: subTab === t.id ? `${t.color}10` : 'transparent',
                  borderLeft: `3px solid ${subTab === t.id ? t.color : 'transparent'}`,
                  border: 'none', cursor: 'pointer',
                  color: subTab === t.id ? t.color : 'var(--ng-muted)',
                  fontSize: 15, fontWeight: subTab === t.id ? 600 : 400,
                  transition: 'background 0.15s',
                }}>
                <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>{t.icon}</span>
                <span style={{ flex: 1, textAlign: 'left' }}>{t.label}</span>
                {'badge' in t && t.badge ? (
                  <span style={{ fontSize: 10, background: t.color, color: '#000', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: 'monospace' }}>{t.badge}</span>
                ) : subTab === t.id ? (
                  <span style={{ fontSize: 13, color: t.color }}>✓</span>
                ) : null}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
