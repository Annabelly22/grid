'use client';
import { useState, useEffect } from 'react';
import {
  CyclePhase, EnergyLevel, TeaCategory,
  CYCLE_PHASES, SUPPLEMENTS, TEAS, MOVEMENTS,
  getCyclePhase, getDayOfCycle,
  getSupplementsForContext, getMovementsForContext,
  CATEGORY_META, TIMING_META, Supplement,
} from '../lib/supplementData';
import FastingTimer from './FastingTimer';
import GymTracker   from './GymTracker';

const CYCLE_KEY      = 'grid_cycle_start';
const ENERGY_KEY     = 'grid_energy_level';
const SUPP_VIEW_KEY  = 'grid_supplements_view';
type SubTab = 'stack' | 'cycle' | 'fast' | 'log' | 'tea' | 'move';

function SupplementCard({ s, expanded, onToggle }: { s: Supplement; expanded: boolean; onToggle: () => void }) {
  const cat = CATEGORY_META[s.category];
  return (
    <div className="mb-2 transition-all" style={{ border: `0.5px solid ${expanded ? s.color : 'var(--ng-border)'}`, borderLeft: `3px solid ${s.color}`, borderRadius: 12, background: 'var(--ng-surface)', boxShadow: expanded ? `0 2px 16px ${s.color}22` : 'none' }}>
      <button className="w-full text-left p-3" onClick={onToggle}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-orbitron font-bold" style={{ color: 'var(--ng-text)', fontSize: 12, letterSpacing: '0.5px' }}>{s.name}</span>
              {s.priority === 'critical' && <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-red)', border: '1px solid var(--ng-red)', padding: '1px 5px', letterSpacing: '1px' }}>CRITICAL</span>}
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
          {s.warning && (
            <div className="mt-2 p-2" style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.3)' }}>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-red)', lineHeight: 1.5 }}>⚠ {s.warning}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SupplementGridCard({ s, expanded, onToggle }: { s: Supplement; expanded: boolean; onToggle: () => void }) {
  const cat = CATEGORY_META[s.category];
  return (
    <div style={{ border: `0.5px solid ${expanded ? s.color : 'var(--ng-border)'}`, borderTop: `3px solid ${s.color}`, borderRadius: 12, background: 'var(--ng-surface)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <button className="w-full text-left p-2" onClick={onToggle} style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span className="font-orbitron" style={{ fontSize: 7, color: cat.color, letterSpacing: '1px' }}>{cat.icon} {cat.label}</span>
          {s.priority === 'critical' && <span className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-red)' }}>!</span>}
        </div>
        <div className="font-orbitron" style={{ fontSize: 10, color: 'var(--ng-text)', fontWeight: 700, lineHeight: 1.3, marginBottom: 3 }}>{s.name}</div>
        <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>{s.dose}</div>
        <div className="font-mono" style={{ fontSize: 9, color: s.color, marginTop: 3 }}>{s.purpose}</div>
      </button>
      {expanded && (
        <div className="p-2" style={{ borderTop: '1px solid var(--ng-border)' }}>
          <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-text)', lineHeight: 1.5 }}>{s.why}</div>
        </div>
      )}
    </div>
  );
}

function Divider({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2 my-3">
      <div className="h-px flex-1" style={{ background: 'var(--ng-border)' }} />
      <span className="font-orbitron" style={{ fontSize: 9, color, letterSpacing: '2px' }}>{label}</span>
      <div className="h-px flex-1" style={{ background: 'var(--ng-border)' }} />
    </div>
  );
}

export default function BodyTab() {
  const [subTab,      setSubTab]      = useState<SubTab>('stack');
  const [cycleStart,  setCycleStart]  = useState<string | null>(null);
  const [cycleInput,  setCycleInput]  = useState('');
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('medium');
  const [expandedId,  setExpandedId]  = useState<string | null>(null);
  const [stackView,   setStackView]   = useState<'smart' | 'all' | 'timing'>('smart');
  const [suppView,    setSuppView]    = useState<'list' | 'grid'>('list');
  const [teaFilter,   setTeaFilter]   = useState<TeaCategory | 'all'>('all');
  const [catFilter,   setCatFilter]   = useState<string>('all');

  useEffect(() => {
    const sc = localStorage.getItem(CYCLE_KEY);
    if (sc) { setCycleStart(sc); setCycleInput(sc); }
    const se = localStorage.getItem(ENERGY_KEY) as EnergyLevel | null;
    if (se) setEnergyLevel(se);
    const sv = localStorage.getItem(SUPP_VIEW_KEY) as 'list' | 'grid' | null;
    if (sv) setSuppView(sv);
  }, []);

  const changeSuppView = (v: 'list' | 'grid') => {
    setSuppView(v);
    localStorage.setItem(SUPP_VIEW_KEY, v);
  };

  const phase = getCyclePhase(cycleStart);
  const dayOfCycle = getDayOfCycle(cycleStart);
  const phaseData = phase ? CYCLE_PHASES[phase] : null;

  const saveCycle = () => {
    if (!cycleInput) return;
    localStorage.setItem(CYCLE_KEY, cycleInput);
    setCycleStart(cycleInput);
  };
  const saveEnergy = (e: EnergyLevel) => { setEnergyLevel(e); localStorage.setItem(ENERGY_KEY, e); };

  const smartSupps = phase ? getSupplementsForContext(phase, energyLevel) : SUPPLEMENTS;
  const categories = ['all', ...Array.from(new Set(SUPPLEMENTS.map(s => s.category)))];
  const filteredAll = catFilter === 'all' ? SUPPLEMENTS : SUPPLEMENTS.filter(s => s.category === catFilter);
  const teaCategories: (TeaCategory | 'all')[] = ['all', 'morning', 'focus', 'fasting', 'evening', 'luteal', 'menstrual'];
  const filteredTeas = TEAS.filter(t => teaFilter === 'all' || t.categories.includes(teaFilter as TeaCategory));
  const movements = getMovementsForContext(phase, energyLevel);

  const SUB_TABS = [
    { id: 'stack' as SubTab, label: 'STACK', icon: '◆', color: 'var(--ng-green)'  },
    { id: 'cycle' as SubTab, label: 'CYCLE', icon: '◈', color: 'var(--ng-purple)' },
    { id: 'fast'  as SubTab, label: 'FAST',  icon: '⏱', color: 'var(--ng-cyan)'   },
    { id: 'log'   as SubTab, label: 'LOG',   icon: '⬡', color: 'var(--ng-amber)'  },
    { id: 'tea'   as SubTab, label: 'TEA',   icon: '❋', color: 'var(--ng-amber)'  },
    { id: 'move'  as SubTab, label: 'MOVE',  icon: '⚡', color: 'var(--ng-cyan)'   },
  ];

  return (
    <div className="content-area" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--ng-border)' }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="font-orbitron font-bold" style={{ color: 'var(--ng-green)', fontSize: 16, letterSpacing: '3px' }}>BODY</h2>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>
              {phaseData ? `${phaseData.icon} ${phaseData.label} — Day ${dayOfCycle}` : 'SET CYCLE DATE TO PERSONALIZE'}
            </div>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>ENERGY</span>
            <div className="flex gap-1">
              {(['low', 'medium', 'high'] as EnergyLevel[]).map(e => {
                const ec = e === 'high' ? 'var(--ng-green)' : e === 'medium' ? 'var(--ng-amber)' : 'var(--ng-red)';
                return (
                  <button key={e} onClick={() => saveEnergy(e)} className="font-orbitron"
                    style={{ fontSize: 12, padding: '5px 10px', border: `1px solid ${energyLevel === e ? ec : 'var(--ng-border)'}`, color: energyLevel === e ? ec : 'var(--ng-muted)', background: energyLevel === e ? `${ec}15` : 'transparent', borderRadius: 20 }}>
                    {e.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {phaseData && (
          <div className="flex gap-1 mb-3">
            {(['menstrual', 'follicular', 'ovulatory', 'luteal'] as CyclePhase[]).map(p => (
              <div key={p} className="flex-1 h-1 rounded-full" style={{ background: p === phase ? CYCLE_PHASES[p].color : 'var(--ng-border)', boxShadow: p === phase ? `0 0 6px ${CYCLE_PHASES[p].color}88` : 'none', transition: 'all 0.3s' }} />
            ))}
          </div>
        )}

        <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {SUB_TABS.map(t => (
            <button key={t.id} onClick={() => setSubTab(t.id)} className="flex-shrink-0 py-1.5 font-orbitron"
              style={{ fontSize: 12, padding: '7px 14px', border: `1px solid ${subTab === t.id ? t.color : 'var(--ng-border)'}`, color: subTab === t.id ? t.color : 'var(--ng-muted)', background: subTab === t.id ? `${t.color}12` : 'transparent', borderRadius: 20, transition: 'all 0.2s' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">

        {/* ═══ STACK ════════════════════════════════════════════ */}
        {subTab === 'stack' && (
          <>
            {!cycleStart && (
              <div className="p-3 mb-4" style={{ background: 'rgba(191,90,242,0.08)', border: '0.5px solid rgba(191,90,242,0.25)', borderRadius: 12 }}>
                <div className="font-orbitron font-bold mb-1" style={{ fontSize: 10, color: 'var(--ng-purple)', letterSpacing: '1px' }}>SET CYCLE DATE FOR PERSONALIZED STACK</div>
                <div className="font-mono mb-2" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>Log the first day of your last period to activate phase-specific supplements.</div>
                <div className="flex gap-2">
                  <input type="date" className="ng-input flex-1" value={cycleInput} onChange={e => setCycleInput(e.target.value)} />
                  <button className="btn-green" style={{ padding: '8px 14px', flexShrink: 0 }} onClick={saveCycle}>SET</button>
                </div>
              </div>
            )}

            {phaseData && (
              <div className="p-3 mb-4" style={{ background: phaseData.bg, border: `0.5px solid ${phaseData.color}33`, borderRadius: 12 }}>
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
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16 }}>
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
                  list.map(s => <SupplementCard key={s.id} s={s} expanded={expandedId === s.id} onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)} />)
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                    {list.map(s => <SupplementGridCard key={s.id} s={s} expanded={expandedId === s.id} onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)} />)}
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
                  filteredAll.map(s => <SupplementCard key={s.id} s={s} expanded={expandedId === s.id} onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)} />)
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {filteredAll.map(s => <SupplementGridCard key={s.id} s={s} expanded={expandedId === s.id} onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)} />)}
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
                  <div key={block.time} className="card p-3 mb-3" style={{ borderLeft: `3px solid ${block.color}` }}>
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

            <div className="mt-4 p-3" style={{ background: 'var(--ng-bg)', border: '1px solid var(--ng-border)', borderRadius: 2 }}>
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', lineHeight: 1.6 }}>
                ⚠ Educational guidance, not medical advice. Confirm with a doctor before starting any new supplement, especially 5-HTP, adaptogens, or hormone-adjacent botanicals. Available at Amazon, iHerb, Vitamin Shoppe (Dallas).
              </div>
            </div>
          </>
        )}

        {/* ═══ CYCLE ════════════════════════════════════════════ */}
        {subTab === 'cycle' && (
          <>
            <div className="card p-4 mb-4">
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
                <div key={p} className="card mb-3" style={{ borderColor: isActive ? pd.color : 'var(--ng-border)', boxShadow: isActive ? `0 0 16px ${pd.color}22` : 'none', transition: 'all 0.2s' }}>
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
          <>
            <div style={{ padding: '4px 0 20px' }}>
              <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-amber)', letterSpacing: '3px', marginBottom: 4 }}>WEEKLY TRAINING LOG</div>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>Select an activity chip, then tap a day to log it. Tap again to remove.</div>
            </div>
            <GymTracker />
          </>
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
              <div key={tea.id} className="card p-3 mb-3" style={{ borderLeft: '3px solid var(--ng-amber)' }}>
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
                <div className="p-2" style={{ background: 'var(--ng-bg)', borderLeft: '2px solid var(--ng-border)' }}>
                  <div className="font-orbitron mb-0.5" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>HOW TO BREW</div>
                  <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', lineHeight: 1.5 }}>{tea.notes}</div>
                </div>
              </div>
            ))}

            <Divider label="❋ FLOWERS & BOTANICALS" color="var(--ng-amber)" />
            {[
              { name: 'Lavender', form: 'Tea, essential oil, diffusion', note: 'Cortisol reduction, sleep quality. Diffuse at your desk during late-night sessions. Add dried flowers to evening chamomile.' },
              { name: 'Rose Petals', form: 'Tea, tincture', note: 'Rich in Vitamin C. Historically used for emotional balance and feminine hormone support. Rose hip tea is especially high in bioavailable C.' },
              { name: 'Passionflower', form: 'Tea or capsule 250–500mg', note: 'GABA agonist. Use during high-anxiety periods: FTMO challenge weeks, late luteal phase, intense deadlines.' },
              { name: 'Calendula', form: 'Tea', note: 'Anti-inflammatory, hormone-supportive, gut healing. Gentle and consistent.' },
              { name: 'Blue Lotus', form: 'Tea (occasional)', note: 'Ancient Egyptian. Mild natural euphoriant, relaxing without sedation. For evening rituals and spiritual practices.' },
              { name: 'Shatavari', form: 'Capsule or powder', note: 'Ayurvedic adaptogen for women. Hormone balance, reproductive health. One of the most respected female wellness herbs.' },
              { name: 'Dong Quai', form: 'Capsule — days 1–13 only', note: 'Traditional Chinese "female ginseng." Blood circulation and iron support post-menstruation. Menstrual and early follicular phase only.' },
            ].map(b => (
              <div key={b.name} className="card p-3 mb-2" style={{ borderLeft: '3px solid rgba(191,0,255,0.5)' }}>
                <div className="flex items-center justify-between mb-1">
                  <div className="font-orbitron font-bold" style={{ fontSize: 11, color: 'var(--ng-text)', letterSpacing: '0.5px' }}>{b.name}</div>
                  <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-purple)' }}>{b.form.split('(')[0].trim()}</span>
                </div>
                <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', lineHeight: 1.5 }}>{b.note}</div>
              </div>
            ))}
          </>
        )}

        {/* ═══ MOVE ═════════════════════════════════════════════ */}
        {subTab === 'move' && (
          <>
            {phaseData && (
              <div className="mb-4 p-2" style={{ background: phaseData.bg, border: `1px solid ${phaseData.color}33`, borderRadius: 2 }}>
                <div className="font-mono" style={{ fontSize: 10, color: phaseData.color }}>
                  {phaseData.icon} Phase recommendation: <strong>{phaseData.training}</strong>
                </div>
              </div>
            )}

            {movements.map(m => (
              <div key={m.id} className="card p-3 mb-3" style={{ borderLeft: '3px solid var(--ng-cyan)' }}>
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

            <div className="mt-4 p-3" style={{ background: 'var(--ng-bg)', border: '1px solid var(--ng-border)', borderRadius: 2 }}>
              <div className="font-orbitron mb-1" style={{ fontSize: 9, color: 'var(--ng-cyan)', letterSpacing: '1px' }}>⚡ PRIORITY DAILY PRACTICES</div>
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
      </div>
    </div>
  );
}
