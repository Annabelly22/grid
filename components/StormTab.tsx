'use client';
import { useState, useEffect, useCallback } from 'react';
import { Storage } from '../lib/storage';
import {
  StormSession, StormMoodEntry, StormConfig, StormAction, StormRung,
  STORM_ACTIONS,
} from '../lib/gameStore';
import { getTodayStr } from '../lib/time';

interface Props {
  onExit: () => void;
  triggerSync: () => void;
}

type StormView = 'mood' | 'ladder' | 'meal' | 'config' | 'insights';

export default function StormTab({ onExit, triggerSync }: Props) {
  const [view, setView] = useState<StormView>('mood');
  const [session, setSession] = useState<StormSession | null>(null);
  const [config, setConfig] = useState<StormConfig>({ defaultMeals: [] });
  const [moodLog, setMoodLog] = useState<StormMoodEntry[]>([]);
  const [selectedMood, setSelectedMood] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [currentAction, setCurrentAction] = useState<StormAction | null>(null);

  // Load state on mount
  useEffect(() => {
    const s = Storage.getStormSession();
    const c = Storage.getStormConfig();
    const m = Storage.getStormMoodLog();
    setSession(s);
    setConfig(c);
    setMoodLog(m);

    // If session exists, go to ladder view
    if (s) {
      setView('ladder');
      // Find the next action to do
      const nextAction = getNextAction(s);
      setCurrentAction(nextAction);
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!timerActive || timerSeconds <= 0) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  // Get next action based on current rung and completed actions
  const getNextAction = useCallback((s: StormSession): StormAction | null => {
    const rungActions = STORM_ACTIONS.filter(a => a.rung === s.currentRung && a.type !== 'outside' && a.type !== 'presentable');
    const remaining = rungActions.filter(a => !s.actionsCompleted.includes(a.id));
    return remaining[0] || null;
  }, []);

  // Start a new storm session
  const startSession = (mood: 1 | 2 | 3 | 4 | 5) => {
    const newSession: StormSession = {
      startedAt: new Date().toISOString(),
      currentRung: 1,
      actionsCompleted: [],
      moodAtStart: mood,
    };
    setSession(newSession);
    Storage.setStormSession(newSession);

    // Log initial mood
    const entry: StormMoodEntry = {
      timestamp: new Date().toISOString(),
      level: mood,
    };
    const newLog = [...moodLog, entry];
    setMoodLog(newLog);
    Storage.setStormMoodLog(newLog);

    // Set first action
    const first = getNextAction(newSession);
    setCurrentAction(first);
    setView('ladder');
    triggerSync();
  };

  // Complete current action
  const completeAction = () => {
    if (!session || !currentAction) return;

    const updated: StormSession = {
      ...session,
      actionsCompleted: [...session.actionsCompleted, currentAction.id],
    };

    // Check if rung is complete
    const rungActions = STORM_ACTIONS.filter(a => a.rung === session.currentRung && a.type !== 'outside' && a.type !== 'presentable');
    const allRungComplete = rungActions.every(a => updated.actionsCompleted.includes(a.id));

    if (allRungComplete && session.currentRung < 4) {
      updated.currentRung = (session.currentRung + 1) as StormRung;
    }

    setSession(updated);
    Storage.setStormSession(updated);

    // Get next action
    const next = getNextAction(updated);
    setCurrentAction(next);
    setTimerActive(false);
    setTimerSeconds(0);
    triggerSync();
  };

  // Start timer for current action
  const startTimer = () => {
    if (!currentAction) return;
    setTimerSeconds(currentAction.durationMin * 60);
    setTimerActive(true);
  };

  // Skip to next rung (optional, user decided this rung is enough)
  const advanceRung = () => {
    if (!session || session.currentRung >= 4) return;
    const updated: StormSession = {
      ...session,
      currentRung: (session.currentRung + 1) as StormRung,
    };
    setSession(updated);
    Storage.setStormSession(updated);
    const next = getNextAction(updated);
    setCurrentAction(next);
    triggerSync();
  };

  // End session and log final mood
  const endSession = (finalMood: 1 | 2 | 3 | 4 | 5) => {
    if (!session) return;

    // Log final mood
    const entry: StormMoodEntry = {
      timestamp: new Date().toISOString(),
      level: finalMood,
      afterAction: session.actionsCompleted[session.actionsCompleted.length - 1],
    };
    const newLog = [...moodLog, entry];
    setMoodLog(newLog);
    Storage.setStormMoodLog(newLog);

    // Clear session
    setSession(null);
    Storage.setStormSession(null);
    Storage.setStormActive(false);
    triggerSync();
    onExit();
  };

  // Check meal times
  const getCurrentMeal = (): string | null => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    for (const meal of config.defaultMeals) {
      // Check if within 30 min window of meal time
      const [mealH, mealM] = meal.time.split(':').map(Number);
      const mealMinutes = mealH * 60 + mealM;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      if (Math.abs(currentMinutes - mealMinutes) <= 30) {
        return meal.name;
      }
    }
    return null;
  };

  // Calculate mood insights (what lifted mood over time)
  const getMoodInsights = () => {
    if (moodLog.length < 4) return null;

    // Find pairs where mood improved after an action
    const improvements: Record<string, number[]> = {};
    for (let i = 1; i < moodLog.length; i++) {
      const prev = moodLog[i - 1];
      const curr = moodLog[i];
      if (curr.afterAction && curr.level > prev.level) {
        const action = STORM_ACTIONS.find(a => a.id === curr.afterAction);
        if (action) {
          if (!improvements[action.type]) improvements[action.type] = [];
          improvements[action.type].push(curr.level - prev.level);
        }
      }
    }

    // Calculate average improvement per action type
    const avgImprovements = Object.entries(improvements).map(([type, gains]) => ({
      type,
      avg: gains.reduce((a, b) => a + b, 0) / gains.length,
      count: gains.length,
    })).sort((a, b) => b.avg - a.avg);

    return avgImprovements;
  };

  // Format timer
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Rung labels
  const RUNG_LABELS: Record<StormRung, { name: string; desc: string }> = {
    1: { name: 'RESET', desc: 'Interrupt the freeze' },
    2: { name: 'TASK', desc: 'Get one small thing done' },
    3: { name: 'MOVE', desc: 'Get blood flowing' },
    4: { name: 'WORK', desc: 'Real output' },
  };

  const currentMeal = getCurrentMeal();
  const insights = getMoodInsights();

  // ─── MOOD CHECK VIEW ───────────────────────────────────────────
  if (view === 'mood') {
    return (
      <div className="content-area" style={{ paddingBottom: 100 }}>
        <div style={{ padding: '24px 16px' }}>
          <div className="card" style={{ padding: 24, textAlign: 'center' }}>
            <div className="font-orbitron" style={{ fontSize: 11, letterSpacing: '2px', color: 'var(--ng-cyan)', marginBottom: 8 }}>
              STORM PROTOCOL
            </div>
            <div style={{ fontSize: 15, color: 'var(--ng-text)', marginBottom: 24 }}>
              How are you feeling right now?
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 32 }}>
              {([1, 2, 3, 4, 5] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setSelectedMood(level)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    border: selectedMood === level ? '2px solid var(--ng-cyan)' : '1px solid var(--ng-border)',
                    background: selectedMood === level ? 'rgba(0,212,255,0.1)' : 'var(--ng-surface)',
                    fontSize: 20,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {level === 1 ? '😞' : level === 2 ? '😔' : level === 3 ? '😐' : level === 4 ? '🙂' : '😊'}
                </button>
              ))}
            </div>

            <div className="font-mono" style={{ fontSize: 11, color: 'var(--ng-muted)', marginBottom: 24 }}>
              {selectedMood === 1 && 'Very low — that\'s okay. Let\'s get one thing done.'}
              {selectedMood === 2 && 'Low — you showed up. That counts.'}
              {selectedMood === 3 && 'Neutral — let\'s build some momentum.'}
              {selectedMood === 4 && 'Decent — good foundation to work from.'}
              {selectedMood === 5 && 'You\'re doing well — maybe you don\'t need this.'}
            </div>

            {selectedMood && (
              <button
                className="btn-green-solid"
                onClick={() => startSession(selectedMood)}
                style={{ width: '100%' }}
              >
                START STORM PROTOCOL
              </button>
            )}

            <button
              onClick={onExit}
              className="font-mono"
              style={{
                marginTop: 16,
                padding: '10px 20px',
                background: 'transparent',
                border: '1px solid var(--ng-border)',
                borderRadius: 8,
                color: 'var(--ng-muted)',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              I don't need this right now
            </button>
          </div>

          {/* Config link */}
          <button
            onClick={() => setView('config')}
            className="font-mono"
            style={{
              marginTop: 16,
              width: '100%',
              padding: '12px',
              background: 'var(--ng-surface)',
              border: '1px solid var(--ng-border)',
              borderRadius: 8,
              color: 'var(--ng-muted)',
              cursor: 'pointer',
              fontSize: 11,
              textAlign: 'center',
            }}
          >
            Configure default meals & contact
          </button>

          {insights && insights.length > 0 && (
            <button
              onClick={() => setView('insights')}
              className="font-mono"
              style={{
                marginTop: 8,
                width: '100%',
                padding: '12px',
                background: 'var(--ng-surface)',
                border: '1px solid var(--ng-border)',
                borderRadius: 8,
                color: 'var(--ng-cyan)',
                cursor: 'pointer',
                fontSize: 11,
                textAlign: 'center',
              }}
            >
              View mood insights ({moodLog.length} entries)
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── LADDER VIEW ───────────────────────────────────────────────
  if (view === 'ladder' && session) {
    return (
      <div className="content-area" style={{ paddingBottom: 100 }}>
        <div style={{ padding: '24px 16px' }}>
          {/* Rung indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
            {([1, 2, 3, 4] as const).map(rung => (
              <div
                key={rung}
                style={{
                  width: 40,
                  height: 6,
                  borderRadius: 3,
                  background: rung <= session.currentRung ? 'var(--ng-green)' : 'var(--ng-border)',
                  transition: 'background 0.3s',
                }}
              />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div className="font-orbitron" style={{ fontSize: 10, letterSpacing: '2px', color: 'var(--ng-green)' }}>
              RUNG {session.currentRung} — {RUNG_LABELS[session.currentRung].name}
            </div>
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--ng-muted)' }}>
              {RUNG_LABELS[session.currentRung].desc}
            </div>
          </div>

          {/* Current action card */}
          {currentAction ? (
            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>
                  {currentAction.type === 'reset' && '💧'}
                  {currentAction.type === 'task' && '📝'}
                  {currentAction.type === 'move' && '🏃'}
                  {currentAction.type === 'work' && '💻'}
                </div>

                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--ng-text)', marginBottom: 8 }}>
                  {currentAction.label}
                </div>

                {currentAction.durationMin > 0 && (
                  <div className="font-mono" style={{ fontSize: 12, color: 'var(--ng-muted)', marginBottom: 24 }}>
                    {currentAction.durationMin} minute{currentAction.durationMin > 1 ? 's' : ''}
                  </div>
                )}

                {/* Timer display */}
                {timerActive && (
                  <div className="font-orbitron" style={{
                    fontSize: 48,
                    color: timerSeconds <= 10 ? 'var(--ng-red)' : 'var(--ng-cyan)',
                    marginBottom: 24,
                  }}>
                    {formatTimer(timerSeconds)}
                  </div>
                )}

                {/* Timer finished */}
                {!timerActive && timerSeconds === 0 && currentAction.durationMin > 0 && session.actionsCompleted.length > 0 && (
                  <div className="font-mono" style={{ fontSize: 12, color: 'var(--ng-green)', marginBottom: 16 }}>
                    Timer complete
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {!timerActive && currentAction.durationMin > 0 && (
                    <button
                      className="btn-green"
                      onClick={startTimer}
                      style={{ width: '100%' }}
                    >
                      START TIMER
                    </button>
                  )}

                  <button
                    className="btn-green-solid"
                    onClick={completeAction}
                    style={{ width: '100%' }}
                  >
                    DONE
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Rung complete */
            <div className="card" style={{ padding: 24, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ng-green)', marginBottom: 8 }}>
                Rung {session.currentRung} Complete
              </div>
              <div className="font-mono" style={{ fontSize: 12, color: 'var(--ng-muted)', marginBottom: 24 }}>
                {session.currentRung < 4
                  ? 'You can stop here. This counts as a win.'
                  : 'You completed the full ladder.'}
              </div>

              {session.currentRung < 4 && (
                <button
                  className="btn-green"
                  onClick={advanceRung}
                  style={{ width: '100%', marginBottom: 12 }}
                >
                  CONTINUE TO RUNG {session.currentRung + 1}
                </button>
              )}

              <button
                onClick={() => setView('mood')}
                className="btn-green-solid"
                style={{ width: '100%' }}
              >
                END SESSION
              </button>
            </div>
          )}

          {/* Meal reminder */}
          {currentMeal && (
            <div className="card" style={{
              padding: 16,
              marginBottom: 16,
              background: 'rgba(255,184,0,0.1)',
              border: '1px solid rgba(255,184,0,0.3)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>🍽️</span>
                <div>
                  <div className="font-orbitron" style={{ fontSize: 10, letterSpacing: '1px', color: 'var(--ng-amber)' }}>
                    MEAL TIME
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--ng-text)' }}>
                    Eat this now: <strong>{currentMeal}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button
              onClick={() => {
                const presentable = STORM_ACTIONS.find(a => a.id === 'presentable');
                if (presentable) {
                  setCurrentAction(presentable);
                }
              }}
              className="font-mono"
              style={{
                flex: 1,
                padding: '10px',
                background: 'var(--ng-surface)',
                border: '1px solid var(--ng-border)',
                borderRadius: 8,
                color: 'var(--ng-muted)',
                cursor: 'pointer',
                fontSize: 10,
              }}
            >
              GET PRESENTABLE
            </button>

            {config.contactName && (
              <a
                href={config.contactPhone ? `tel:${config.contactPhone}` : '#'}
                className="font-mono"
                style={{
                  flex: 1,
                  padding: '10px',
                  background: 'rgba(0,212,255,0.1)',
                  border: '1px solid rgba(0,212,255,0.3)',
                  borderRadius: 8,
                  color: 'var(--ng-cyan)',
                  textDecoration: 'none',
                  fontSize: 10,
                  textAlign: 'center',
                }}
              >
                REACH OUT TO {config.contactName.toUpperCase()}
              </a>
            )}
          </div>

          {/* Exit */}
          <button
            onClick={() => {
              setSelectedMood(null);
              setView('mood');
            }}
            className="font-mono"
            style={{
              width: '100%',
              padding: '12px',
              background: 'transparent',
              border: '1px solid var(--ng-border)',
              borderRadius: 8,
              color: 'var(--ng-muted)',
              cursor: 'pointer',
              fontSize: 11,
            }}
          >
            End session early
          </button>
        </div>
      </div>
    );
  }

  // ─── CONFIG VIEW ───────────────────────────────────────────────
  if (view === 'config') {
    const [mealName, setMealName] = useState('');
    const [mealTime, setMealTime] = useState('');
    const [contactName, setContactName] = useState(config.contactName || '');
    const [contactPhone, setContactPhone] = useState(config.contactPhone || '');

    const addMeal = () => {
      if (!mealName || !mealTime) return;
      const newConfig = {
        ...config,
        defaultMeals: [...config.defaultMeals, { id: `m_${Date.now()}`, name: mealName, time: mealTime }],
      };
      setConfig(newConfig);
      Storage.setStormConfig(newConfig);
      setMealName('');
      setMealTime('');
      triggerSync();
    };

    const removeMeal = (id: string) => {
      const newConfig = {
        ...config,
        defaultMeals: config.defaultMeals.filter(m => m.id !== id),
      };
      setConfig(newConfig);
      Storage.setStormConfig(newConfig);
      triggerSync();
    };

    const saveContact = () => {
      const newConfig = { ...config, contactName, contactPhone };
      setConfig(newConfig);
      Storage.setStormConfig(newConfig);
      triggerSync();
    };

    return (
      <div className="content-area" style={{ paddingBottom: 100 }}>
        <div style={{ padding: '24px 16px' }}>
          <button
            onClick={() => setView(session ? 'ladder' : 'mood')}
            className="font-mono"
            style={{
              marginBottom: 16,
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              color: 'var(--ng-cyan)',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            &larr; Back
          </button>

          <div className="font-orbitron" style={{ fontSize: 11, letterSpacing: '2px', color: 'var(--ng-cyan)', marginBottom: 24 }}>
            STORM PROTOCOL CONFIG
          </div>

          {/* Default meals */}
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <div className="font-orbitron" style={{ fontSize: 10, letterSpacing: '1px', color: 'var(--ng-muted)', marginBottom: 12 }}>
              DEFAULT MEALS
            </div>
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--ng-text)', marginBottom: 16 }}>
              Set meals when you're calm. Storm mode tells you "eat this now" at meal times.
            </div>

            {config.defaultMeals.map(meal => (
              <div key={meal.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--ng-border)' }}>
                <div>
                  <span style={{ color: 'var(--ng-text)' }}>{meal.name}</span>
                  <span className="font-mono" style={{ marginLeft: 8, color: 'var(--ng-muted)', fontSize: 11 }}>{meal.time}</span>
                </div>
                <button
                  onClick={() => removeMeal(meal.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--ng-red)', cursor: 'pointer', fontSize: 14 }}
                >
                  ×
                </button>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input
                className="ng-input"
                placeholder="Meal name"
                value={mealName}
                onChange={e => setMealName(e.target.value)}
                style={{ flex: 2 }}
              />
              <input
                className="ng-input"
                type="time"
                value={mealTime}
                onChange={e => setMealTime(e.target.value)}
                style={{ flex: 1 }}
              />
              <button onClick={addMeal} className="btn-green" style={{ padding: '8px 16px' }}>
                ADD
              </button>
            </div>
          </div>

          {/* Contact */}
          <div className="card" style={{ padding: 16 }}>
            <div className="font-orbitron" style={{ fontSize: 10, letterSpacing: '1px', color: 'var(--ng-muted)', marginBottom: 12 }}>
              REACH-OUT CONTACT
            </div>
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--ng-text)', marginBottom: 16 }}>
              One person to contact when you're low. One tap.
            </div>

            <input
              className="ng-input"
              placeholder="Name"
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <input
              className="ng-input"
              placeholder="Phone number"
              value={contactPhone}
              onChange={e => setContactPhone(e.target.value)}
              style={{ marginBottom: 12 }}
            />
            <button onClick={saveContact} className="btn-green-solid" style={{ width: '100%' }}>
              SAVE CONTACT
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── INSIGHTS VIEW ─────────────────────────────────────────────
  if (view === 'insights') {
    const typeLabels: Record<string, string> = {
      reset: 'Reset actions (water, face, curtains)',
      task: '5-minute tasks',
      move: 'Indoor movement',
      work: 'Work blocks',
      presentable: 'Getting presentable',
      outside: 'Going outside',
      reach: 'Reaching out',
    };

    return (
      <div className="content-area" style={{ paddingBottom: 100 }}>
        <div style={{ padding: '24px 16px' }}>
          <button
            onClick={() => setView(session ? 'ladder' : 'mood')}
            className="font-mono"
            style={{
              marginBottom: 16,
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              color: 'var(--ng-cyan)',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            &larr; Back
          </button>

          <div className="font-orbitron" style={{ fontSize: 11, letterSpacing: '2px', color: 'var(--ng-cyan)', marginBottom: 8 }}>
            WHAT LIFTS YOUR MOOD
          </div>
          <div className="font-mono" style={{ fontSize: 11, color: 'var(--ng-muted)', marginBottom: 24 }}>
            Based on {moodLog.length} mood check-ins
          </div>

          {insights && insights.length > 0 ? (
            <div className="card" style={{ padding: 16 }}>
              {insights.map((item, i) => (
                <div key={item.type} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: i < insights.length - 1 ? '1px solid var(--ng-border)' : 'none',
                }}>
                  <div>
                    <div style={{ color: 'var(--ng-text)', fontSize: 13 }}>
                      {typeLabels[item.type] || item.type}
                    </div>
                    <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>
                      {item.count} time{item.count > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="font-orbitron" style={{
                    fontSize: 14,
                    color: item.avg >= 1.5 ? 'var(--ng-green)' : item.avg >= 0.5 ? 'var(--ng-cyan)' : 'var(--ng-muted)',
                  }}>
                    +{item.avg.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card" style={{ padding: 24, textAlign: 'center' }}>
              <div className="font-mono" style={{ fontSize: 12, color: 'var(--ng-muted)' }}>
                Not enough data yet. Keep using Storm Protocol and patterns will emerge.
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
