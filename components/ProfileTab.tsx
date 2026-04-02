'use client';
import { useState } from 'react';
import { UserProfile, Habit, Achievement, getLevel, CATEGORY_COLORS, CATEGORY_ICONS } from '../lib/gameStore';

interface Props {
  profile: UserProfile;
  habits: Habit[];
  achievements: Achievement[];
  theme: 'dark' | 'light';
  onUpdateCodename: (name: string) => void;
  onToggleTheme: () => void;
  onResetData: () => void;
}

export default function ProfileTab({ profile, habits, achievements, theme, onUpdateCodename, onToggleTheme, onResetData }: Props) {
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(profile.codename);
  const [confirmReset, setConfirmReset] = useState(false);

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
