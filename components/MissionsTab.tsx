'use client';
import { Mission } from '../lib/gameStore';

interface Props {
  missions: Mission[];
  onCompleteMission: (id: string) => void;
}

const DIFFICULTY_CONFIG = {
  EASY: { color: 'var(--ng-green)', bg: 'rgba(0,255,65,0.08)' },
  MEDIUM: { color: 'var(--ng-cyan)', bg: 'rgba(0,212,255,0.08)' },
  HARD: { color: 'var(--ng-amber)', bg: 'rgba(255,184,0,0.08)' },
  EXTREME: { color: 'var(--ng-red)', bg: 'rgba(255,71,87,0.08)' },
};

export default function MissionsTab({ missions, onCompleteMission }: Props) {
  const pending = missions.filter(m => !m.completed);
  const completed = missions.filter(m => m.completed);

  return (
    <div className="content-area" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid var(--ng-border)' }}>
        <h2 className="font-orbitron font-bold" style={{ color: 'var(--ng-purple)', fontSize: 16, letterSpacing: '3px' }}>MISSIONS</h2>
        <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>
          {completed.length}/{missions.length} complete · {missions.filter(m => !m.completed).reduce((s, m) => s + m.xpReward, 0)} XP available
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
            {pending.map(m => <MissionCard key={m.id} mission={m} onComplete={onCompleteMission} />)}
          </>
        )}

        {/* Completed missions */}
        {completed.length > 0 && (
          <>
            <div className="flex items-center gap-2 my-4">
              <div className="h-px flex-1" style={{ background: 'var(--ng-border)' }} />
              <span className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '2px' }}>✓ COMPLETED</span>
              <div className="h-px flex-1" style={{ background: 'var(--ng-border)' }} />
            </div>
            {completed.map(m => <MissionCard key={m.id} mission={m} onComplete={onCompleteMission} />)}
          </>
        )}

        {missions.length === 0 && (
          <div className="text-center py-12">
            <div className="font-orbitron" style={{ fontSize: 12, color: 'var(--ng-muted)', letterSpacing: '2px' }}>NO MISSIONS LOADED</div>
          </div>
        )}
      </div>
    </div>
  );
}

function MissionCard({ mission, onComplete }: { mission: Mission; onComplete: (id: string) => void }) {
  const cfg = DIFFICULTY_CONFIG[mission.difficulty];

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
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="font-orbitron" style={{ fontSize: 8, color: cfg.color, border: `1px solid ${cfg.color}`, padding: '2px 6px', letterSpacing: '1px' }}>
              {mission.difficulty}
            </span>
          </div>
        </div>

        <div className="font-mono mb-2" style={{ fontSize: 10, color: 'var(--ng-muted)', lineHeight: 1.5 }}>
          {mission.description}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-orbitron" style={{ fontSize: 10, color: 'var(--ng-amber)', letterSpacing: '1px' }}>+{mission.xpReward} XP</span>
            <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>{mission.category.toUpperCase()}</span>
          </div>

          {!mission.completed && (
            <button onClick={() => onComplete(mission.id)}
              className="font-orbitron"
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
