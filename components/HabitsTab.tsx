'use client';
import { useState, useEffect } from 'react';
import { Habit, HabitCategory, CATEGORY_COLORS, CATEGORY_ICONS } from '../lib/gameStore';

const VIEW_KEY = 'grid_habits_view';

interface Props {
  habits: Habit[];
  onCompleteHabit:   (id: string) => void;
  onUncompleteHabit: (id: string) => void;
  onAddHabit: (data: Omit<Habit, 'id' | 'streak' | 'completedToday' | 'lastCompleted' | 'totalCompletions' | 'createdAt'>) => void;
  onDeleteHabit: (id: string) => void;
}

const PRESET_HABITS = [
  { name: 'Morning sunlight walk',    category: 'body'     as HabitCategory, icon: '☀️', xpReward: 20 },
  { name: 'Training session',         category: 'body'     as HabitCategory, icon: '🏋️', xpReward: 30 },
  { name: 'Nadi Shodhana breathwork', category: 'mind'     as HabitCategory, icon: '🌬️', xpReward: 15 },
  { name: 'Read 20+ minutes',         category: 'mind'     as HabitCategory, icon: '📖', xpReward: 20 },
  { name: 'Trading session review',   category: 'trade'    as HabitCategory, icon: '📊', xpReward: 25 },
  { name: 'Pre-market checklist',     category: 'trade'    as HabitCategory, icon: '✅', xpReward: 15 },
  { name: 'Work on a build project',  category: 'build'    as HabitCategory, icon: '🔧', xpReward: 25 },
  { name: 'Evening gratitude log',    category: 'spirit'   as HabitCategory, icon: '🙏', xpReward: 10 },
  { name: 'Meditation / qi gong',     category: 'spirit'   as HabitCategory, icon: '🌿', xpReward: 15 },
  { name: 'Evening supplement stack', category: 'recovery' as HabitCategory, icon: '🌙', xpReward: 10 },
  { name: 'Cold exposure / contrast', category: 'recovery' as HabitCategory, icon: '❄️', xpReward: 20 },
];

const CATEGORY_OPTIONS: { value: HabitCategory; label: string }[] = [
  { value: 'body',     label: '💪 BODY'     },
  { value: 'mind',     label: '🧠 MIND'     },
  { value: 'trade',    label: '📈 TRADE'    },
  { value: 'build',    label: '🔧 BUILD'    },
  { value: 'spirit',   label: '🌿 SPIRIT'   },
  { value: 'recovery', label: '🌙 RECOVERY' },
];

export default function HabitsTab({ habits, onCompleteHabit, onUncompleteHabit, onAddHabit, onDeleteHabit }: Props) {
  const [showAdd,       setShowAdd]       = useState(false);
  const [showPresets,   setShowPresets]   = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [name,     setName]     = useState('');
  const [category, setCategory] = useState<HabitCategory>('body');
  const [icon,     setIcon]     = useState('⚡');
  const [xp,       setXp]       = useState(20);
  const [filter,   setFilter]   = useState<HabitCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(VIEW_KEY) as 'list' | 'grid' | null;
    if (saved) setViewMode(saved);
  }, []);

  const changeView = (v: 'list' | 'grid') => {
    setViewMode(v);
    localStorage.setItem(VIEW_KEY, v);
  };

  const filtered     = filter === 'all' ? habits : habits.filter(h => h.category === filter);
  const incomplete   = filtered.filter(h => !h.completedToday);
  const completed    = filtered.filter(h =>  h.completedToday);
  const completedToday = habits.filter(h => h.completedToday).length;

  const handleAdd = () => {
    if (!name.trim()) return;
    onAddHabit({ name: name.trim(), category, icon, xpReward: xp });
    setName(''); setIcon('⚡'); setXp(20); setShowAdd(false);
  };

  const addPreset = (preset: typeof PRESET_HABITS[0]) => {
    if (!habits.find(h => h.name === preset.name)) onAddHabit(preset);
  };

  return (
    <div className="content-area" style={{ paddingBottom: 80 }}>

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '0.5px solid var(--ng-border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h2 className="font-orbitron font-bold" style={{ color: 'var(--ng-cyan)', fontSize: 16 }}>HABITS</h2>
              {filter !== 'all' && (
                <span style={{ fontSize: 13, color: 'var(--ng-cyan)', fontWeight: 500 }}>/ {filter.toUpperCase()}</span>
              )}
            </div>
            <div className="font-mono" style={{ fontSize: 13, color: 'var(--ng-muted)' }}>
              {completedToday}/{habits.length} complete today
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {/* List / Grid toggle */}
            <div style={{ display: 'flex', border: '0.5px solid var(--ng-border)', borderRadius: 8, overflow: 'hidden' }}>
              <button onClick={() => changeView('list')}
                style={{ padding: '6px 10px', fontSize: 13, background: viewMode === 'list' ? 'rgba(100,210,255,0.12)' : 'transparent', color: viewMode === 'list' ? 'var(--ng-cyan)' : 'var(--ng-muted)', border: 'none', cursor: 'pointer' }}>☰</button>
              <button onClick={() => changeView('grid')}
                style={{ padding: '6px 10px', fontSize: 13, background: viewMode === 'grid' ? 'rgba(100,210,255,0.12)' : 'transparent', color: viewMode === 'grid' ? 'var(--ng-cyan)' : 'var(--ng-muted)', border: 'none', cursor: 'pointer', borderLeft: '0.5px solid var(--ng-border)' }}>⊞</button>
            </div>
            <button onClick={() => setShowPresets(!showPresets)} className="btn-green" style={{ padding: '7px 12px', fontSize: 12 }}>PRESETS</button>
            <button onClick={() => setShowAdd(!showAdd)} className="btn-green" style={{ padding: '7px 12px', fontSize: 12 }}>+ ADD</button>
            <button onClick={() => setMenuOpen(true)}
              style={{ fontSize: 22, color: 'var(--ng-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', lineHeight: 1 }}>
              ☰
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-3">

        {/* Presets panel */}
        {showPresets && (
          <div className="card mb-4" style={{ borderColor: 'rgba(0,212,255,0.3)' }}>
            <div className="font-orbitron mb-3" style={{ fontSize: 9, color: 'var(--ng-cyan)', letterSpacing: '2px' }}>PRESET HABITS — TAP TO ADD</div>
            {PRESET_HABITS.map(p => {
              const exists = habits.find(h => h.name === p.name);
              return (
                <button key={p.name} onClick={() => addPreset(p)} disabled={!!exists}
                  className="w-full text-left flex items-center gap-3 mb-2 p-2"
                  style={{ background: exists ? 'rgba(0,255,65,0.06)' : 'var(--ng-bg)', border: `1px solid ${exists ? 'var(--ng-green)33' : 'var(--ng-border)'}`, borderRadius: 2, opacity: exists ? 0.6 : 1 }}>
                  <span style={{ fontSize: 14 }}>{p.icon}</span>
                  <span className="flex-1 font-mono" style={{ fontSize: 11, color: 'var(--ng-text)' }}>{p.name}</span>
                  <span className="font-orbitron" style={{ fontSize: 9, color: CATEGORY_COLORS[p.category] }}>{exists ? '✓ ADDED' : `+${p.xpReward}xp`}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Add custom habit */}
        {showAdd && (
          <div className="card mb-4" style={{ borderColor: 'rgba(0,212,255,0.3)' }}>
            <div className="font-orbitron mb-3" style={{ fontSize: 9, color: 'var(--ng-cyan)', letterSpacing: '2px' }}>NEW HABIT</div>
            <div className="flex gap-2 mb-2">
              <input className="ng-input" style={{ width: 60, textAlign: 'center', fontSize: 18, padding: '8px' }} value={icon} onChange={e => setIcon(e.target.value)} placeholder="⚡" />
              <input className="ng-input flex-1" placeholder="Habit name..." value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
            </div>
            <div className="flex gap-2 mb-3">
              <select className="ng-select flex-1" value={category} onChange={e => setCategory(e.target.value as HabitCategory)}>
                {CATEGORY_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>XP:</span>
                <input type="number" className="ng-input" style={{ width: 60 }} value={xp} onChange={e => setXp(Number(e.target.value))} min={5} max={100} step={5} />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="btn-green-solid" style={{ flex: 1, padding: '8px' }}>ADD HABIT</button>
              <button onClick={() => setShowAdd(false)} className="btn-red">CANCEL</button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="font-orbitron" style={{ fontSize: 12, color: 'var(--ng-muted)', letterSpacing: '2px' }}>NO HABITS YET</div>
            <div className="font-mono mt-2" style={{ fontSize: 11, color: 'var(--ng-dimmer)' }}>Add presets or create your own</div>
          </div>
        ) : (
          <>
            {incomplete.length === 0 && completed.length > 0 && (
              <div className="text-center py-6">
                <div className="font-orbitron mb-1" style={{ fontSize: 11, color: 'var(--ng-green)', letterSpacing: '2px' }}>◆ ALL HABITS LOGGED</div>
                <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>Protocol complete for today</div>
              </div>
            )}

            {/* Incomplete */}
            {viewMode === 'list' ? (
              incomplete.map(habit => (
                <HabitCard key={habit.id} habit={habit} onComplete={onCompleteHabit} onUncomplete={onUncompleteHabit} onDelete={onDeleteHabit} />
              ))
            ) : (
              incomplete.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                  {incomplete.map(habit => (
                    <HabitGridCard key={habit.id} habit={habit} onComplete={onCompleteHabit} onUncomplete={onUncompleteHabit} onDelete={onDeleteHabit} />
                  ))}
                </div>
              )
            )}

            {/* Completed — collapsible */}
            {completed.length > 0 && (
              <>
                <button onClick={() => setShowCompleted(!showCompleted)} className="w-full font-orbitron mb-2"
                  style={{ padding: '12px 14px', fontSize: 13, color: 'var(--ng-green)', background: 'rgba(48,209,88,0.06)', border: '0.5px solid rgba(48,209,88,0.2)', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>✓ LOGGED TODAY ({completed.length})</span>
                  <span>{showCompleted ? '▲' : '▼'}</span>
                </button>
                {showCompleted && (
                  viewMode === 'list' ? (
                    completed.map(habit => (
                      <HabitCard key={habit.id} habit={habit} onComplete={onCompleteHabit} onUncomplete={onUncompleteHabit} onDelete={onDeleteHabit} />
                    ))
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                      {completed.map(habit => (
                        <HabitGridCard key={habit.id} habit={habit} onComplete={onCompleteHabit} onUncomplete={onUncompleteHabit} onDelete={onDeleteHabit} />
                      ))}
                    </div>
                  )
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Category filter side drawer */}
      {menuOpen && (
        <>
          <div className="side-drawer-backdrop" onClick={() => setMenuOpen(false)} />
          <div className="side-drawer">
            <div style={{ padding: '56px 20px 16px', borderBottom: '0.5px solid var(--ng-border)' }}>
              <div style={{ fontSize: 11, color: 'var(--ng-muted)', fontWeight: 600, marginBottom: 2 }}>HABITS</div>
              <div style={{ fontSize: 13, color: 'var(--ng-text)', fontWeight: 700 }}>Filter by category</div>
            </div>
            {[
              { value: 'all'      as const, label: 'All habits',  icon: '◈', color: 'var(--ng-cyan)'   },
              { value: 'body'     as const, label: 'Body',         icon: '💪', color: CATEGORY_COLORS['body']     },
              { value: 'mind'     as const, label: 'Mind',         icon: '🧠', color: CATEGORY_COLORS['mind']     },
              { value: 'trade'    as const, label: 'Trade',        icon: '📈', color: CATEGORY_COLORS['trade']    },
              { value: 'build'    as const, label: 'Build',        icon: '🔧', color: CATEGORY_COLORS['build']    },
              { value: 'spirit'   as const, label: 'Spirit',       icon: '🌿', color: CATEGORY_COLORS['spirit']   },
              { value: 'recovery' as const, label: 'Recovery',     icon: '🌙', color: CATEGORY_COLORS['recovery'] },
            ].map(opt => (
              <button key={opt.value} onClick={() => { setFilter(opt.value); setMenuOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '15px 20px', width: '100%',
                  background: filter === opt.value ? `${opt.color}12` : 'transparent',
                  borderLeft: `3px solid ${filter === opt.value ? opt.color : 'transparent'}`,
                  border: 'none', cursor: 'pointer',
                  color: filter === opt.value ? opt.color : 'var(--ng-muted)',
                  fontSize: 15, fontWeight: filter === opt.value ? 600 : 400,
                  transition: 'background 0.15s',
                }}>
                <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>{opt.icon}</span>
                <span style={{ flex: 1, textAlign: 'left' }}>{opt.label}</span>
                {filter === opt.value && <span style={{ fontSize: 13, color: opt.color }}>✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── List card ────────────────────────────────────────────────
function HabitCard({ habit, onComplete, onUncomplete, onDelete }: { habit: Habit; onComplete: (id: string) => void; onUncomplete: (id: string) => void; onDelete: (id: string) => void }) {
  const [showDelete, setShowDelete] = useState(false);
  const color = CATEGORY_COLORS[habit.category];

  return (
    <div className="mb-3" style={{ background: 'var(--ng-surface)', border: `0.5px solid ${habit.completedToday ? color + '44' : 'var(--ng-border)'}`, borderLeft: `3px solid ${color}`, borderRadius: 12, opacity: habit.completedToday ? 0.7 : 1, transition: 'all 0.2s' }}>
      <div className="flex items-center gap-3 p-3">
        {/* Toggle button */}
        <button
          onClick={() => habit.completedToday ? onUncomplete(habit.id) : onComplete(habit.id)}
          title={habit.completedToday ? 'Tap to uncomplete' : 'Tap to complete'}
          style={{ width: 28, height: 28, border: `1.5px solid ${habit.completedToday ? color : 'var(--ng-border)'}`, borderRadius: 8, background: habit.completedToday ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}>
          {habit.completedToday && <span style={{ color: '#000', fontWeight: 900, fontSize: 14 }}>✓</span>}
        </button>

        <span style={{ fontSize: 18, flexShrink: 0 }}>{habit.icon}</span>

        <div className="flex-1 min-w-0">
          <div className="font-mono" style={{ fontSize: 12, color: habit.completedToday ? 'var(--ng-muted)' : 'var(--ng-text)', textDecoration: habit.completedToday ? 'line-through' : 'none' }}>
            {habit.name}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="font-orbitron" style={{ fontSize: 8, color: color, letterSpacing: '1px' }}>{habit.category.toUpperCase()}</span>
            <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-amber)', letterSpacing: '1px' }}>+{habit.xpReward}xp</span>
            {habit.streak > 0 && <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-amber)' }}>🔥 {habit.streak}d</span>}
            {habit.totalCompletions > 0 && <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-dimmer)' }}>×{habit.totalCompletions}</span>}
          </div>
        </div>

        <button onClick={() => setShowDelete(!showDelete)} style={{ color: 'var(--ng-dimmer)', fontSize: 16, background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>⋯</button>
      </div>

      {showDelete && (
        <div className="px-3 pb-3 flex gap-2" style={{ borderTop: '1px solid var(--ng-border)' }}>
          <div className="font-mono pt-2 flex-1" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>
            {habit.totalCompletions} total · created {new Date(habit.createdAt).toLocaleDateString()}
          </div>
          <button onClick={() => { onDelete(habit.id); setShowDelete(false); }} className="btn-red" style={{ marginTop: 8 }}>DELETE</button>
        </div>
      )}
    </div>
  );
}

// ── Grid card ────────────────────────────────────────────────
function HabitGridCard({ habit, onComplete, onUncomplete, onDelete }: { habit: Habit; onComplete: (id: string) => void; onUncomplete: (id: string) => void; onDelete: (id: string) => void }) {
  const [showDelete, setShowDelete] = useState(false);
  const color = CATEGORY_COLORS[habit.category];

  return (
    <div style={{ background: 'var(--ng-surface)', border: `0.5px solid ${habit.completedToday ? color + '44' : 'var(--ng-border)'}`, borderTop: `3px solid ${color}`, borderRadius: 12, opacity: habit.completedToday ? 0.7 : 1, transition: 'all 0.2s', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 10px 8px', flex: 1 }}>
        {/* Icon + menu row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <span style={{ fontSize: 22 }}>{habit.icon}</span>
          <button onClick={() => setShowDelete(!showDelete)} style={{ color: 'var(--ng-dimmer)', fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}>⋯</button>
        </div>

        <div className="font-mono" style={{ fontSize: 11, color: habit.completedToday ? 'var(--ng-muted)' : 'var(--ng-text)', textDecoration: habit.completedToday ? 'line-through' : 'none', lineHeight: 1.4, marginBottom: 6 }}>
          {habit.name}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          <span className="font-orbitron" style={{ fontSize: 7, color: color, letterSpacing: '1px' }}>{habit.category.toUpperCase()}</span>
          <span className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-amber)', letterSpacing: '1px' }}>+{habit.xpReward}xp</span>
          {habit.streak > 0 && <span className="font-mono" style={{ fontSize: 8, color: 'var(--ng-amber)' }}>🔥{habit.streak}d</span>}
        </div>
      </div>

      {/* Checkbox */}
      <button onClick={() => habit.completedToday ? onUncomplete(habit.id) : onComplete(habit.id)}
        style={{ width: '100%', padding: '8px', background: habit.completedToday ? `${color}22` : 'transparent', border: 'none', borderTop: `1px solid ${habit.completedToday ? color + '44' : 'var(--ng-border)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <div style={{ width: 16, height: 16, border: `2px solid ${habit.completedToday ? color : 'var(--ng-border)'}`, borderRadius: 2, background: habit.completedToday ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {habit.completedToday && <span style={{ color: '#000', fontWeight: 900, fontSize: 10 }}>✓</span>}
        </div>
        <span className="font-orbitron" style={{ fontSize: 7, color: habit.completedToday ? color : 'var(--ng-dimmer)', letterSpacing: '1px' }}>
          {habit.completedToday ? 'LOGGED' : 'LOG IT'}
        </span>
      </button>

      {showDelete && (
        <div className="px-2 pb-2" style={{ borderTop: '1px solid var(--ng-border)' }}>
          <button onClick={() => { onDelete(habit.id); setShowDelete(false); }} className="btn-red w-full" style={{ marginTop: 6, fontSize: 8 }}>DELETE</button>
        </div>
      )}
    </div>
  );
}
