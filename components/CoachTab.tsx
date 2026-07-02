'use client';
import { useState, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { UserProfile, TradeSession } from '../lib/gameStore';
import { Storage } from '../lib/storage';

interface Props {
  profile: UserProfile;
  onFocusMinutes: (minutes: number) => void;
  tradeJournal: TradeSession[];
  onLogTrade: (data: Omit<TradeSession, 'id' | 'createdAt'>) => void;
  onDeleteTradeSession: (id: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: number;
}

const QUICK_PROMPTS = [
  "What should I focus on today?",
  "I'm in my luteal phase — help",
  "My trading session was off. What do I check?",
  "Give me a 5-min morning protocol",
  "I broke my streak. How do I reset?",
  "Best supplements for a training day",
  "I'm feeling low energy today",
];

const EMOTIONAL_STATES: TradeSession['emotionalState'][] = ['calm', 'confident', 'neutral', 'anxious', 'fearful'];

const INITIAL_MSG = (codename: string, xp: number, streak: number): Message => ({
  role: 'assistant',
  content: `ALPHAWILL ONLINE — ${codename}.\n\n${xp} XP · ${streak}d best streak.\n\nWhat do you need?`,
  id: 0,
});

export default function CoachTab({ profile, onFocusMinutes, tradeJournal, onLogTrade, onDeleteTradeSession }: Props) {
  const [activeTab, setActiveTab] = useState<'chat' | 'journal'>('chat');
  const [messages, setMessages] = useState<Message[]>([INITIAL_MSG(profile.codename, profile.xp, profile.longestStreak)]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [focusActive, setFocusActive]   = useState(false);
  const [focusTime, setFocusTime]       = useState(0);
  const [focusDuration, setFocusDuration] = useState(25);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // Journal form state
  const today = new Date().toISOString().split('T')[0];
  const [journalDate, setJournalDate] = useState(today);
  const [journalQuality, setJournalQuality] = useState<1|2|3|4|5>(3);
  const [journalRules, setJournalRules] = useState<boolean | null>(null);
  const [journalEmotion, setJournalEmotion] = useState<TradeSession['emotionalState']>('neutral');
  const [journalNote, setJournalNote] = useState('');

  // Load persisted chat on mount
  useEffect(() => {
    const stored = Storage.getAlphaWillChat();
    if (stored.length > 0) {
      setMessages(stored.map((m, i) => ({ ...m, id: i })));
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (focusActive) {
      timerRef.current = setInterval(() => {
        setFocusTime(t => {
          if (t + 1 >= focusDuration * 60) {
            clearInterval(timerRef.current!);
            setFocusActive(false);
            onFocusMinutes(focusDuration);
            addMessage('assistant', `⚡ FOCUS SESSION COMPLETE — ${focusDuration} minutes logged. +${focusDuration * 2} XP earned. Well done, ${profile.codename}.`);
            return 0;
          }
          return t + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [focusActive]);

  function addMessage(role: 'user' | 'assistant', content: string) {
    setMessages(prev => {
      const next = [...prev, { role, content, id: Date.now() + Math.random() }];
      // Persist last 50 messages (skip the initial greeting if saving)
      Storage.setAlphaWillChat(next.slice(-50).map(m => ({ role: m.role, content: m.content })));
      return next;
    });
  }

  async function sendMessage(text?: string) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    addMessage('user', msg);
    setLoading(true);
    try {
      const res = await fetch('/api/cipher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          profile,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      addMessage('assistant', data.reply || 'ALPHAWILL encountered an error. Try again.');
    } catch {
      addMessage('assistant', 'Network error — check your connection and try again.');
    }
    setLoading(false);
  }

  const handleLogSession = () => {
    if (journalRules === null) return;
    onLogTrade({ date: journalDate, quality: journalQuality, rulesFollowed: journalRules, emotionalState: journalEmotion, note: journalNote.trim() });
    setJournalDate(today);
    setJournalQuality(3);
    setJournalRules(null);
    setJournalEmotion('neutral');
    setJournalNote('');
  };

  const formatTime = (s: number) => {
    const m   = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const remaining = focusDuration * 60 - focusTime;
  const focusPct  = focusActive ? Math.round((focusTime / (focusDuration * 60)) * 100) : 0;

  return (
    <div className="content-area flex flex-col" style={{ paddingBottom: 80 }}>

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--ng-border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-orbitron font-bold" style={{ color: 'var(--ng-amber)', fontSize: 16, letterSpacing: '3px' }}>ALPHAWILL</h2>
              <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-green)', border: '1px solid var(--ng-green)', padding: '2px 7px', letterSpacing: '1px' }}>ONLINE</span>
            </div>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>
              AI COACH · {profile.focusMinutes} focus mins logged
            </div>
          </div>

          {/* Focus widget */}
          <div className="flex items-center gap-2">
            {focusActive ? (
              <>
                <span className="font-orbitron font-bold" style={{ fontSize: 15, color: 'var(--ng-green)', letterSpacing: '1px' }}>
                  {formatTime(remaining)}
                </span>
                <button onClick={() => { setFocusActive(false); setFocusTime(0); }} className="font-orbitron"
                  style={{ fontSize: 13, padding: '7px 14px', border: '1.5px solid var(--ng-red)', color: 'var(--ng-red)', background: 'transparent', cursor: 'pointer', borderRadius: 8 }}>
                  ■ STOP
                </button>
              </>
            ) : (
              <>
                <div className="flex gap-1">
                  {[25, 50, 90].map(d => (
                    <button key={d} onClick={() => setFocusDuration(d)} className="font-orbitron"
                      style={{ fontSize: 12, padding: '6px 10px', border: `1px solid ${focusDuration === d ? 'var(--ng-amber)' : 'var(--ng-border)'}`, color: focusDuration === d ? 'var(--ng-amber)' : 'var(--ng-muted)', background: focusDuration === d ? 'rgba(255,159,10,0.1)' : 'transparent', cursor: 'pointer', borderRadius: 8 }}>
                      {d}m
                    </button>
                  ))}
                </div>
                <button onClick={() => setFocusActive(true)} className="font-orbitron"
                  style={{ fontSize: 13, padding: '7px 14px', border: '1.5px solid var(--ng-amber)', color: 'var(--ng-amber)', background: 'transparent', cursor: 'pointer', borderRadius: 8 }}>
                  ▷
                </button>
              </>
            )}
          </div>
        </div>

        {focusActive && (
          <div style={{ height: 2, background: 'var(--ng-border)', marginTop: 10, borderRadius: 1, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${focusPct}%`, background: 'var(--ng-green)', transition: 'width 1s linear' }} />
          </div>
        )}

        {/* Sub-tab toggle */}
        <div className="flex gap-1 mt-3">
          {(['chat', 'journal'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className="font-orbitron"
              style={{ padding: '6px 14px', fontSize: 9, letterSpacing: '1px', border: `1px solid ${activeTab === t ? 'var(--ng-amber)' : 'var(--ng-border)'}`, color: activeTab === t ? 'var(--ng-amber)' : 'var(--ng-muted)', background: activeTab === t ? 'rgba(255,159,10,0.08)' : 'transparent', borderRadius: 8, cursor: 'pointer' }}>
              {t === 'chat' ? '⚡ CHAT' : '📋 JOURNAL'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chat tab ─────────────────────────────────────────── */}
      {activeTab === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3" style={{ minHeight: 0 }}>
            {messages.map(msg => (
              <div key={msg.id} className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                {msg.role === 'assistant' && (
                  <div style={{ fontSize: 10, color: 'var(--ng-green)', fontWeight: 700, marginBottom: 6, letterSpacing: 0 }}>⚡ ALPHAWILL</div>
                )}
                {msg.role === 'assistant'
                  ? <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.content) }} />
                  : msg.content
                }
              </div>
            ))}
            {loading && (
              <div className="chat-bubble-ai">
                <div className="font-orbitron mb-1" style={{ fontSize: 8, color: 'var(--ng-green)', letterSpacing: '2px' }}>⚡ ALPHAWILL</div>
                <div className="loader-dots flex gap-1"><span /><span /><span /></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="px-4 pb-2 flex-shrink-0" style={{ borderTop: '1px solid var(--ng-border)', paddingTop: 10 }}>
            <div className="flex gap-1 overflow-x-auto pb-2 mb-2" style={{ scrollbarWidth: 'none' }}>
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => sendMessage(p)} className="font-mono flex-shrink-0"
                  style={{ fontSize: 12, padding: '7px 14px', border: '0.5px solid var(--ng-border)', color: 'var(--ng-muted)', background: 'var(--ng-surface)', cursor: 'pointer', borderRadius: 20, whiteSpace: 'nowrap' }}>
                  {p}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <textarea
                className="ng-textarea"
                rows={2}
                placeholder="Ask ALPHAWILL anything..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />
              <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
                style={{ width: 44, background: input.trim() ? 'var(--ng-green)' : 'var(--ng-surface2)', border: 'none', color: input.trim() ? '#000' : 'var(--ng-muted)', cursor: input.trim() ? 'pointer' : 'default', borderRadius: 10, fontWeight: 700, fontSize: 16, flexShrink: 0, transition: 'all 0.2s' }}>
                ▷
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Journal tab ──────────────────────────────────────── */}
      {activeTab === 'journal' && (
        <div className="flex-1 overflow-y-auto px-4 py-4">

          {/* Log form */}
          <div className="card mb-4" style={{ borderColor: 'rgba(255,159,10,0.3)' }}>
            <div className="font-orbitron mb-3" style={{ fontSize: 9, color: 'var(--ng-amber)', letterSpacing: '2px' }}>LOG TRADE SESSION</div>

            <div className="flex gap-2 mb-3">
              <div className="flex-1">
                <div className="font-orbitron mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>DATE</div>
                <input type="date" className="ng-input" style={{ width: '100%' }} value={journalDate} onChange={e => setJournalDate(e.target.value)} max={today} />
              </div>
              <div>
                <div className="font-orbitron mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>QUALITY</div>
                <div className="flex gap-1">
                  {([1,2,3,4,5] as const).map(n => (
                    <button key={n} onClick={() => setJournalQuality(n)} style={{ fontSize: 16, background: 'none', border: 'none', cursor: 'pointer', color: n <= journalQuality ? '#FFD700' : 'var(--ng-dimmer)', padding: '2px', lineHeight: 1 }}>★</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-3">
              <div className="font-orbitron mb-2" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>RULES FOLLOWED</div>
              <div className="flex gap-2">
                <button onClick={() => setJournalRules(true)} className="font-orbitron"
                  style={{ flex: 1, padding: '8px', fontSize: 10, border: `1.5px solid ${journalRules === true ? 'var(--ng-green)' : 'var(--ng-border)'}`, color: journalRules === true ? 'var(--ng-green)' : 'var(--ng-muted)', background: journalRules === true ? 'rgba(0,255,65,0.08)' : 'transparent', borderRadius: 8, cursor: 'pointer', letterSpacing: '1px' }}>
                  ✓ YES
                </button>
                <button onClick={() => setJournalRules(false)} className="font-orbitron"
                  style={{ flex: 1, padding: '8px', fontSize: 10, border: `1.5px solid ${journalRules === false ? 'var(--ng-red)' : 'var(--ng-border)'}`, color: journalRules === false ? 'var(--ng-red)' : 'var(--ng-muted)', background: journalRules === false ? 'rgba(255,71,87,0.08)' : 'transparent', borderRadius: 8, cursor: 'pointer', letterSpacing: '1px' }}>
                  ✗ NO
                </button>
              </div>
            </div>

            <div className="mb-3">
              <div className="font-orbitron mb-2" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>EMOTIONAL STATE</div>
              <div className="flex gap-1 flex-wrap">
                {EMOTIONAL_STATES.map(s => (
                  <button key={s} onClick={() => setJournalEmotion(s)} className="font-orbitron"
                    style={{ padding: '5px 10px', fontSize: 8, border: `1px solid ${journalEmotion === s ? 'var(--ng-cyan)' : 'var(--ng-border)'}`, color: journalEmotion === s ? 'var(--ng-cyan)' : 'var(--ng-muted)', background: journalEmotion === s ? 'rgba(0,212,255,0.08)' : 'transparent', borderRadius: 6, cursor: 'pointer', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3">
              <div className="font-orbitron mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>NOTE <span style={{ fontWeight: 400 }}>({journalNote.length}/280)</span></div>
              <textarea className="ng-textarea" rows={3} style={{ width: '100%', resize: 'none' }} placeholder="Brief note on today's session..." value={journalNote} onChange={e => setJournalNote(e.target.value.slice(0, 280))} />
            </div>

            <button onClick={handleLogSession} disabled={journalRules === null} className="btn-green-solid w-full" style={{ opacity: journalRules === null ? 0.5 : 1 }}>
              SUBMIT LOG
            </button>
          </div>

          {/* Past sessions */}
          {tradeJournal.length > 0 && (
            <>
              <div className="font-orbitron mb-3" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '2px' }}>JOURNAL LOG — {tradeJournal.length} SESSIONS</div>
              {tradeJournal.map(session => (
                <div key={session.id} className="mb-3" style={{ background: 'var(--ng-surface)', border: '0.5px solid var(--ng-border)', borderLeft: `3px solid ${session.rulesFollowed ? 'var(--ng-green)' : 'var(--ng-red)'}`, borderRadius: 10 }}>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono" style={{ fontSize: 11, color: 'var(--ng-text)' }}>{session.date}</span>
                        <span style={{ fontSize: 12, color: '#FFD700' }}>{'★'.repeat(session.quality)}{'☆'.repeat(5 - session.quality)}</span>
                      </div>
                      <button onClick={() => onDeleteTradeSession(session.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ng-dimmer)', fontSize: 13, padding: '2px' }}>✕</button>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-orbitron" style={{ fontSize: 8, color: session.rulesFollowed ? 'var(--ng-green)' : 'var(--ng-red)', letterSpacing: '1px' }}>
                        {session.rulesFollowed ? '✓ RULES' : '✗ BROKE RULES'}
                      </span>
                      <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-cyan)', letterSpacing: '1px', textTransform: 'uppercase' }}>{session.emotionalState}</span>
                    </div>
                    {session.note && <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', lineHeight: 1.5 }}>{session.note}</div>}
                  </div>
                </div>
              ))}
            </>
          )}

          {tradeJournal.length === 0 && (
            <div className="text-center py-8">
              <div className="font-orbitron" style={{ fontSize: 11, color: 'var(--ng-muted)', letterSpacing: '2px' }}>NO SESSIONS LOGGED</div>
              <div className="font-mono mt-2" style={{ fontSize: 10, color: 'var(--ng-dimmer)' }}>Log your first trade session above</div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
