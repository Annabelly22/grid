'use client';
import { useState, useEffect } from 'react';
import { getHomeTimezone, setHomeTimezone, getSupportedTimezones, getNowTimeStr } from '../lib/time';
import { UserProfile, Habit, Achievement, Mission, getLevel, CATEGORY_COLORS, CATEGORY_ICONS } from '../lib/gameStore';

const DIFFICULTY_CONFIG = {
  EASY:    { color: 'var(--ng-green)',  bg: 'rgba(0,255,65,0.08)'   },
  MEDIUM:  { color: 'var(--ng-cyan)',   bg: 'rgba(0,212,255,0.08)'  },
  HARD:    { color: 'var(--ng-amber)',  bg: 'rgba(255,184,0,0.08)'  },
  EXTREME: { color: 'var(--ng-red)',    bg: 'rgba(255,71,87,0.08)'  },
};

interface MissionProgress { current: number; max: number; label: string; }

function getMissionProgress(mission: Mission, profile: UserProfile, habits: Habit[]): MissionProgress | null {
  if (mission.completed) return null;
  const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;
  switch (mission.id) {
    case 'm1': return profile.totalHabitsCompleted === 0 ? { current: 0, max: 1, label: '0/1 completions' } : null;
    case 'm2': return { current: Math.min(bestStreak, 7), max: 7, label: `${bestStreak}/7 days` };
    case 'm3': { const done = habits.filter(h => h.completedToday).length; return { current: Math.min(done, 6), max: 6, label: `${done}/6 today` }; }
    case 'm4': { const h = habits.find(h => h.name === 'Morning sunlight walk'); const s = h?.streak || 0; return { current: Math.min(s, 14), max: 14, label: `${s}/14 days` }; }
    case 'm5': return { current: Math.min(profile.xp, 1000), max: 1000, label: `${profile.xp.toLocaleString()}/1,000 XP` };
    case 'm6': { const h = habits.find(h => h.name === 'Evening supplement stack'); const s = h?.streak || 0; return { current: Math.min(s, 21), max: 21, label: `${s}/21 days` }; }
    case 'm7': return { current: Math.min(profile.xp, 10000), max: 10000, label: `${profile.xp.toLocaleString()}/10,000 XP` };
    default: return null;
  }
}

function MissionCard({ mission, progress, onComplete }: { mission: Mission; progress: MissionProgress | null; onComplete: (id: string) => void }) {
  const cfg = DIFFICULTY_CONFIG[mission.difficulty];
  const pct = progress ? Math.round((progress.current / progress.max) * 100) : 0;
  return (
    <div className="mb-3" style={{ background: mission.completed ? 'var(--ng-bg)' : cfg.bg, border: `0.5px solid ${mission.completed ? 'var(--ng-border)' : cfg.color + '33'}`, borderLeft: `3px solid ${mission.completed ? 'var(--ng-border)' : cfg.color}`, borderRadius: 10, opacity: mission.completed ? 0.5 : 1 }}>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="font-orbitron font-bold" style={{ fontSize: 11, color: mission.completed ? 'var(--ng-muted)' : 'var(--ng-text)', textDecoration: mission.completed ? 'line-through' : 'none' }}>{mission.title}</div>
          <span className="font-orbitron flex-shrink-0" style={{ fontSize: 9, color: cfg.color, background: `${cfg.color}15`, padding: '2px 6px', borderRadius: 5 }}>{mission.difficulty}</span>
        </div>
        <div className="font-mono mb-2" style={{ fontSize: 9, color: 'var(--ng-muted)', lineHeight: 1.5 }}>{mission.description}</div>
        {progress && (
          <div className="mb-2">
            <div className="flex justify-between mb-1">
              <span className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-muted)', letterSpacing: '1px' }}>PROGRESS</span>
              <span className="font-mono" style={{ fontSize: 8, color: cfg.color }}>{progress.label}</span>
            </div>
            <div style={{ height: 2, background: 'var(--ng-border)', borderRadius: 1, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: cfg.color, borderRadius: 1, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-amber)' }}>+{mission.xpReward} XP</span>
          {!mission.completed && (
            <button onClick={() => onComplete(mission.id)} className="font-orbitron" style={{ fontSize: 11, color: cfg.color, border: `1px solid ${cfg.color}`, padding: '4px 10px', background: 'transparent', cursor: 'pointer', borderRadius: 7 }}>COMPLETE ✓</button>
          )}
          {mission.completed && mission.completedAt && (
            <span className="font-mono" style={{ fontSize: 8, color: 'var(--ng-dimmer)' }}>{new Date(mission.completedAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  profile: UserProfile;
  habits: Habit[];
  achievements: Achievement[];
  missions: Mission[];
  theme: 'dark' | 'light';
  onUpdateCodename: (name: string) => void;
  onToggleTheme: () => void;
  onResetData: () => void;
  onCompleteMission: (id: string) => void;
}

export default function ProfileTab({ profile, habits, achievements, missions, theme, onUpdateCodename, onToggleTheme, onResetData, onCompleteMission }: Props) {
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(profile.codename);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showCompletedMissions, setShowCompletedMissions] = useState(false);

  // ── Home Clock ────────────────────────────────────────────────────────────
  const allTimezones = getSupportedTimezones();
  const [savedTz,    setSavedTz]    = useState(() => getHomeTimezone());
  const [selectedTz, setSelectedTz] = useState(() => getHomeTimezone());
  const [tzSearch,   setTzSearch]   = useState('');
  const [clockTime,  setClockTime]  = useState(() => getNowTimeStr());
  const filteredTzs = tzSearch
    ? allTimezones.filter(tz => tz.toLowerCase().includes(tzSearch.toLowerCase()))
    : allTimezones;
  // Tick the clock every second
  useEffect(() => {
    const tick = setInterval(() => setClockTime(getNowTimeStr()), 1_000);
    return () => clearInterval(tick);
  }, []);
  const handleSaveTz = () => {
    setHomeTimezone(selectedTz);
    setSavedTz(selectedTz);
    window.location.reload();
  };

  const lvl = getLevel(profile.xp);
  const daysSinceJoin = Math.floor((Date.now() - new Date(profile.joinDate).getTime()) / 86400000);
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  const lockedAchievements = achievements.filter(a => !a.unlocked);

  // Stats by category
  const catStats = (['body', 'mind', 'trade', 'build', 'spirit', 'recovery'] as const).map(cat => {
    const catHabits = habits.filter(h => h.category === cat);
    const total = catHabits.reduce((s, h) => s + h.totalCompletions, 0);
    const bestStreak = catHabits.reduce((s, h) => Math.max(s, h.streak), 0);
    return { cat, count: catHabits.length, completions: total, bestStreak };
  }).filter(c => c.count > 0);

  const handleSaveName = () => {
    const trimmed = newName.trim().toUpperCase().slice(0, 16);
    if (trimmed) { onUpdateCodename(trimmed); setEditingName(false); }
  };

  return (
    <div className="content-area" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-4" style={{ borderBottom: '0.5px solid var(--ng-border)' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-orbitron font-bold" style={{ color: 'var(--ng-cyan)', fontSize: 16, letterSpacing: '3px' }}>PROFILE</h2>
          <button onClick={onToggleTheme} className="font-orbitron"
            style={{ padding: '8px 14px', fontSize: 13, border: '0.5px solid var(--ng-border)', color: 'var(--ng-muted)', background: 'transparent', borderRadius: 8, cursor: 'pointer' }}>
            {theme === 'dark' ? '☀ LIGHT' : '☾ DARK'}
          </button>
        </div>
      </div>

      <div className="px-4 pt-5">

        {/* Identity card */}
        <div className="card mb-4" style={{ borderColor: 'var(--ng-green)33', background: 'rgba(0,255,65,0.03)' }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              {editingName ? (
                <div className="flex gap-2">
                  <input className="ng-input" style={{ fontSize: 14, fontFamily: 'Orbitron, sans-serif', letterSpacing: '3px' }} value={newName} onChange={e => setNewName(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && handleSaveName()} maxLength={16} autoFocus />
                  <button onClick={handleSaveName} className="btn-green" style={{ padding: '6px 12px' }}>SAVE</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="font-orbitron font-black" style={{ fontSize: 20, color: 'var(--ng-green)', letterSpacing: '4px' }}>{profile.codename}</div>
                  <button onClick={() => setEditingName(true)} style={{ color: 'var(--ng-dimmer)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>✎</button>
                </div>
              )}
              <div className="font-orbitron mt-1" style={{ fontSize: 10, color: 'var(--ng-amber)', letterSpacing: '2px' }}>{lvl.title} — LV{lvl.level}</div>
            </div>
            <div className="text-right">
              <div className="font-orbitron font-black" style={{ fontSize: 22, color: 'var(--ng-amber)' }}>{profile.xp.toLocaleString()}</div>
              <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>XP EARNED</div>
            </div>
          </div>

          {/* XP bar */}
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>{lvl.title}</span>
              <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>{lvl.next.title}</span>
            </div>
            <div className="xp-bar" style={{ height: 5 }}>
              <div className="xp-fill" style={{ width: `${lvl.progress}%` }} />
            </div>
            <div className="font-mono mt-1 text-center" style={{ fontSize: 9, color: 'var(--ng-dimmer)' }}>
              {lvl.xpToNext} XP to next rank
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'DAYS ACTIVE', value: daysSinceJoin },
              { label: 'HABITS BUILT', value: habits.length },
              { label: 'TOTAL COMPLETIONS', value: profile.totalHabitsCompleted },
              { label: 'BEST STREAK', value: `${profile.longestStreak}d` },
              { label: 'MISSIONS DONE', value: profile.missionsCompleted },
              { label: 'FOCUS MINUTES', value: profile.focusMinutes },
            ].map(stat => (
              <div key={stat.label} style={{ background: 'var(--ng-surface2)', border: '0.5px solid var(--ng-border)', padding: '12px', borderRadius: 10 }}>
                <div className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-muted)', letterSpacing: '1px' }}>{stat.label}</div>
                <div className="font-orbitron font-bold" style={{ fontSize: 16, color: 'var(--ng-text)' }}>{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        {catStats.length > 0 && (
          <div className="card mb-4">
            <div className="font-orbitron mb-4" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '2px' }}>CATEGORY PERFORMANCE</div>
            {catStats.map(({ cat, count, completions, bestStreak }) => (
              <div key={cat} className="flex items-center gap-3 mb-3 p-3" style={{ background: 'var(--ng-bg)', border: `0.5px solid ${CATEGORY_COLORS[cat]}22`, borderLeft: `3px solid ${CATEGORY_COLORS[cat]}`, borderRadius: 8 }}>
                <span style={{ fontSize: 14 }}>{CATEGORY_ICONS[cat]}</span>
                <div className="flex-1">
                  <div className="font-orbitron" style={{ fontSize: 10, color: CATEGORY_COLORS[cat], letterSpacing: '1px' }}>{cat.toUpperCase()}</div>
                  <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>{count} habits · {completions} reps</div>
                </div>
                {bestStreak > 0 && (
                  <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-amber)' }}>🔥 {bestStreak}d</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Missions */}
        {missions.length > 0 && (() => {
          const pending = missions.filter(m => !m.completed);
          const completed = missions.filter(m => m.completed);
          const xpAvailable = pending.reduce((s, m) => s + m.xpReward, 0);
          return (
            <div className="card mb-4" style={{ borderColor: 'rgba(191,0,255,0.2)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-purple)', letterSpacing: '2px' }}>◆ MISSIONS</div>
                <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>{completed.length}/{missions.length} · {xpAvailable.toLocaleString()} XP left</div>
              </div>
              {pending.map(m => <MissionCard key={m.id} mission={m} progress={getMissionProgress(m, profile, habits)} onComplete={onCompleteMission} />)}
              {pending.length === 0 && <div className="font-orbitron text-center py-3" style={{ fontSize: 9, color: 'var(--ng-purple)', letterSpacing: '2px' }}>ALL MISSIONS COMPLETE</div>}
              {completed.length > 0 && (
                <>
                  <button onClick={() => setShowCompletedMissions(!showCompletedMissions)} className="w-full font-orbitron mt-1"
                    style={{ padding: '8px 12px', fontSize: 11, color: 'var(--ng-muted)', background: 'var(--ng-bg)', border: '0.5px solid var(--ng-border)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>✓ DEBRIEF LOG ({completed.length})</span>
                    <span>{showCompletedMissions ? '▲' : '▼'}</span>
                  </button>
                  {showCompletedMissions && completed.map(m => <MissionCard key={m.id} mission={m} progress={null} onComplete={onCompleteMission} />)}
                </>
              )}
            </div>
          );
        })()}

        {/* Achievements */}
        <div className="card mb-4">
          <div className="font-orbitron mb-3" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '2px' }}>
            ACHIEVEMENTS — {unlockedAchievements.length}/{achievements.length}
          </div>

          {unlockedAchievements.map(a => (
            <div key={a.id} className="flex items-center gap-3 mb-3 p-3" style={{ background: 'rgba(255,159,10,0.08)', border: '0.5px solid rgba(255,159,10,0.2)', borderRadius: 10 }}>
              <span style={{ fontSize: 20 }}>{a.icon}</span>
              <div className="flex-1">
                <div className="font-orbitron font-bold" style={{ fontSize: 10, color: 'var(--ng-amber)', letterSpacing: '0.5px' }}>{a.title}</div>
                <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>{a.description}</div>
              </div>
              <span className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-amber)' }}>+{a.xpReward}</span>
            </div>
          ))}

          {lockedAchievements.map(a => (
            <div key={a.id} className="flex items-center gap-3 mb-3 p-3" style={{ background: 'var(--ng-surface2)', border: '0.5px solid var(--ng-border)', borderRadius: 10, opacity: 0.4 }}>
              <span style={{ fontSize: 20, filter: 'grayscale(1)' }}>{a.icon}</span>
              <div className="flex-1">
                <div className="font-orbitron font-bold" style={{ fontSize: 10, color: 'var(--ng-muted)', letterSpacing: '0.5px' }}>{a.title}</div>
                <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-dimmer)' }}>{a.description}</div>
              </div>
              <span className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-dimmer)' }}>+{a.xpReward}</span>
            </div>
          ))}
        </div>

        {/* Home Clock */}
        <div className="card mb-4" style={{ borderColor: 'rgba(0,212,255,0.2)' }}>
          <div className="font-orbitron mb-3" style={{ fontSize: 9, color: 'var(--ng-cyan)', letterSpacing: '2px' }}>◈ HOME CLOCK</div>
          <div className="flex items-baseline gap-3 mb-3">
            <span className="font-mono font-bold" style={{ fontSize: 20, color: 'var(--ng-text)', letterSpacing: '2px' }}>{clockTime}</span>
            <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>{savedTz}</span>
          </div>
          <input
            className="ng-input w-full mb-2"
            placeholder="Search timezone... (e.g. London, Tokyo, New_York)"
            value={tzSearch}
            onChange={e => setTzSearch(e.target.value)}
            style={{ fontSize: 10 }}
          />
          <select
            className="ng-input w-full mb-3"
            value={selectedTz}
            onChange={e => setSelectedTz(e.target.value)}
            style={{ fontSize: 10, height: 36 }}
          >
            {filteredTzs.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
          {selectedTz !== savedTz && (
            <button
              onClick={handleSaveTz}
              className="font-orbitron w-full mb-2"
              style={{ padding: '10px', fontSize: 11, letterSpacing: '2px', background: 'rgba(0,212,255,0.1)', border: '1px solid var(--ng-cyan)', color: 'var(--ng-cyan)', borderRadius: 8, cursor: 'pointer' }}
            >
              SAVE &amp; RELOAD
            </button>
          )}
          <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-dimmer)', lineHeight: 1.6 }}>
            Set to your home timezone. Change when travelling — habits reset and quotes update at midnight here.
          </div>
        </div>

        {/* Danger zone */}
        <div className="card mb-4" style={{ borderColor: 'rgba(255,71,87,0.3)' }}>
          <div className="font-orbitron mb-2" style={{ fontSize: 9, color: 'var(--ng-red)', letterSpacing: '2px' }}>⚠ DANGER ZONE</div>
          {!confirmReset ? (
            <button onClick={() => setConfirmReset(true)} className="btn-red" style={{ width: '100%' }}>RESET ALL DATA</button>
          ) : (
            <div>
              <div className="font-mono mb-3" style={{ fontSize: 11, color: 'var(--ng-red)' }}>This will erase ALL data permanently. There is no undo.</div>
              <div className="flex gap-2">
                <button onClick={onResetData} className="btn-red" style={{ flex: 1 }}>CONFIRM RESET</button>
                <button onClick={() => setConfirmReset(false)} className="btn-green" style={{ flex: 1 }}>CANCEL</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
