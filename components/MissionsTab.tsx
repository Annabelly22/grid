'use client';
import { useState } from 'react';
import { Mission, UserProfile, Habit } from '../lib/gameStore';

interface Props {
  missions: Mission[];
  profile: UserProfile;
  habits: Habit[];
  onCompleteMission: (id: string) => void;
}

const DIFFICULTY_CONFIG = {
  EASY:    { color: 'var(--ng-green)',  bg: 'rgba(0,255,65,0.08)'   },
  MEDIUM:  { color: 'var(--ng-cyan)',   bg: 'rgba(0,212,255,0.08)'  },
  HARD:    { color: 'var(--ng-amber)',  bg: 'rgba(255,184,0,0.08)'  },
  EXTREME: { color: 'var(--ng-red)',    bg: 'rgba(255,71,87,0.08)'  },
};

interface Progress { current: number; max: number; label: string; }

function getMissionProgress(mission: Mission, profile: UserProfile, habits: Habit[]): Progress | null {
  if (mission.completed) return null;
  const bestStreak = habits.length > 0 ? Math.max(...habits.map(h => h.streak)) : 0;

  switch (mission.id) {
    case 'm1':
      return profile.totalHabitsCompleted === 0
        ? { current: 0, max: 1, label: '0/1 completions' }
        : null;
    case 'm2':
      return { current: Math.min(bestStreak, 7), max: 7, label: `${bestStreak}/7 days` };
    case 'm3': {
      const done = habits.filter(h => h.completedToday).length;
      return { current: Math.min(done, 6), max: 6, label: `${done}/6 today` };
    }
    case 'm4': {
      const h = habits.find(h => h.name === 'Morning sunlight walk');
      const s = h?.streak || 0;
      return { current: Math.min(s, 14), max: 14, label: `${s}/14 days` };
    }
    case 'm5':
      return { current: Math.min(profile.xp, 1000), max: 1000, label: `${profile.xp.toLocaleString()}/1,000 XP` };
    case 'm6': {
      const h = habits.find(h => h.name === 'Evening supplement stack');
      const s = h?.streak || 0;
      return { current: Math.min(s, 21), max: 21, label: `${s}/21 days` };
    }
    case 'm7':
      return { current: Math.min(profile.xp, 10000), max: 10000, label: `${profile.xp.toLocaleString()}/10,000 XP` };
    default:
      return null;
  }
}

export default function MissionsTab({ missions, profile, habits, onCompleteMission }: Props) {
  const [showCompleted, setShowCompleted] = useState(false);
  const pending   = missions.filter(m => !m.completed);
  const completed = missions.filter(m => m.completed);
  const xpAvailable = pending.reduce((s, m) => s + m.xpReward, 0);

  return (
    <div className="content-area" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--ng-border)' }}>
        <h2 className="font-orbitron font-bold" style={{ color: 'var(--ng-purple)', fontSize: 16, letterSpacing: '3px' }}>MISSIONS</h2>
        <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>
          {completed.length}/{missions.length} complete · {xpAvailable.toLocaleString()} XP available
        </div>
      </div>

      <div className="px-4 pt-4">

        {/* Active missions */}
        {pending.length > 0 && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1" style={{ background: 'var(--ng-border)' }} />
              <span className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-purple)', letterSpacing: '2px' }}>◆ ACTIVE MISSIONS</span>
              <div className="h-px flex-1" style={{ background: 'var(--ng-border)' }} />
            </div>
            {pending.map(m => (
              <MissionCard
                key={m.id}
                mission={m}
                progress={getMissionProgress(m, profile, habits)}
                onComplete={onCompleteMission}
              />
            ))}
          </>
        )}

        {pending.length === 0 && completed.length > 0 && (
          <div className="text-center py-6 mb-4">
            <div className="font-orbitron" style={{ fontSize: 11, color: 'var(--ng-purple)', letterSpacing: '2px' }}>ALL MISSIONS COMPLETE</div>
          </div>
        )}

        {missions.length === 0 && (
          <div className="text-center py-12">
            <div className="font-orbitron" style={{ fontSize: 12, color: 'var(--ng-muted)', letterSpacing: '2px' }}>NO MISSIONS LOADED</div>
          </div>
        )}

        {/* Completed missions — collapsed */}
        {completed.length > 0 && (
          <>
            <button onClick={() => setShowCompleted(!showCompleted)} className="w-full font-orbitron mb-2"
              style={{ padding: '9px 12px', fontSize: 9, letterSpacing: '2px', color: 'var(--ng-muted)', background: 'var(--ng-surface)', border: '1px solid var(--ng-border)', borderRadius: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>✓ DEBRIEF LOG ({completed.length})</span>
              <span>{showCompleted ? '▲' : '▼'}</span>
            </button>
            {showCompleted && completed.map(m => (
              <MissionCard key={m.id} mission={m} progress={null} onComplete={onCompleteMission} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function MissionCard({ mission, progress, onComplete }: {
  mission: Mission;
  progress: Progress | null;
  onComplete: (id: string) => void;
}) {
  const cfg = DIFFICULTY_CONFIG[mission.difficulty];
  const pct = progress ? Math.round((progress.current / progress.max) * 100) : 0;

  return (
    <div className="mb-3" style={{
      background: mission.completed ? 'var(--ng-bg)' : cfg.bg,
      border: `1px solid ${mission.completed ? 'var(--ng-border)' : cfg.color + '33'}`,
      borderLeft: `3px solid ${mission.completed ? 'var(--ng-border)' : cfg.color}`,
      borderRadius: 2,
      opacity: mission.completed ? 0.5 : 1,
      transition: 'all 0.2s',
    }}>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="font-orbitron font-bold" style={{ fontSize: 12, color: mission.completed ? 'var(--ng-muted)' : 'var(--ng-text)', letterSpacing: '0.5px', textDecoration: mission.completed ? 'line-through' : 'none' }}>
            {mission.title}
          </div>
          <span className="font-orbitron flex-shrink-0" style={{ fontSize: 8, color: cfg.color, border: `1px solid ${cfg.color}`, padding: '2px 6px', letterSpacing: '1px' }}>
            {mission.difficulty}
          </span>
        </div>

        <div className="font-mono mb-2" style={{ fontSize: 10, color: 'var(--ng-muted)', lineHeight: 1.5 }}>
          {mission.description}
        </div>

        {/* Progress bar */}
        {progress && (
          <div className="mb-3">
            <div className="flex justify-between mb-1">
              <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>PROGRESS</span>
              <span className="font-mono" style={{ fontSize: 9, color: cfg.color }}>{progress.label}</span>
            </div>
            <div style={{ height: 3, background: 'var(--ng-border)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: cfg.color, borderRadius: 2, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-orbitron" style={{ fontSize: 10, color: 'var(--ng-amber)', letterSpacing: '1px' }}>+{mission.xpReward} XP</span>
            <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>{mission.category.toUpperCase()}</span>
          </div>

          {!mission.completed && (
            <button onClick={() => onComplete(mission.id)} className="font-orbitron"
              style={{ fontSize: 9, color: cfg.color, border: `1px solid ${cfg.color}`, padding: '4px 12px', background: 'transparent', cursor: 'pointer', letterSpacing: '1px', borderRadius: 2, transition: 'all 0.2s' }}>
              COMPLETE ✓
            </button>
          )}
          {mission.completed && mission.completedAt && (
            <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-dimmer)' }}>
              {new Date(mission.completedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
