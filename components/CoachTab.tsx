'use client';
import { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../lib/gameStore';

interface Props {
  profile: UserProfile;
  onFocusMinutes: (minutes: number) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  id: number;
}

const QUICK_PROMPTS = [
  "What should I focus on today?",
  "I'm in my luteal phase and craving sugar — help",
  "My trading session was off. What do I check?",
  "Give me a 5-minute morning protocol",
  "I broke my streak. How do I reset?",
  "Best supplements for a training day",
  "I'm feeling low energy today",
];

export default function CoachTab({ profile, onFocusMinutes }: Props) {
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `CIPHER ONLINE.\n\nOperative ${profile.codename} — I have your full context. ${profile.xp} XP earned. Longest streak: ${profile.longestStreak} days.\n\nHow can I help you execute today?`,
    id: 0,
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusActive, setFocusActive] = useState(false);
  const [focusTime, setFocusTime] = useState(0);
  const [focusDuration, setFocusDuration] = useState(25);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    setMessages(prev => [...prev, { role, content, id: Date.now() + Math.random() }]);
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
      addMessage('assistant', data.reply || 'CIPHER encountered an error. Try again.');
    } catch {
      addMessage('assistant', 'Network error — check your connection and try again.');
    }
    setLoading(false);
  }

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const focusPct = focusActive ? Math.round((focusTime / (focusDuration * 60)) * 100) : 0;

  return (
    <div className="content-area flex flex-col" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--ng-border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-orbitron font-bold" style={{ color: 'var(--ng-amber)', fontSize: 16, letterSpacing: '3px' }}>CIPHER</h2>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>AI COACH · {profile.focusMinutes} focus mins logged</div>
          </div>
          <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-green)', border: '1px solid var(--ng-green)', padding: '3px 8px', letterSpacing: '1px' }}>ONLINE</div>
        </div>
      </div>

      {/* Focus Timer */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0" style={{ borderBottom: '1px solid var(--ng-border)' }}>
        <div className="flex items-center gap-3">
          <div style={{ flex: 1 }}>
            {focusActive ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-amber)', letterSpacing: '1px' }}>FOCUS SESSION ACTIVE</span>
                  <span className="font-orbitron font-bold" style={{ fontSize: 14, color: 'var(--ng-green)' }}>{formatTime(focusDuration * 60 - focusTime)}</span>
                </div>
                <div style={{ height: 3, background: 'var(--ng-border)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${focusPct}%`, background: 'var(--ng-green)', transition: 'width 1s linear', borderRadius: 2 }} />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px' }}>FOCUS:</span>
                {[25, 50, 90].map(d => (
                  <button key={d} onClick={() => setFocusDuration(d)} className="font-orbitron"
                    style={{ fontSize: 9, padding: '3px 8px', border: `1px solid ${focusDuration === d ? 'var(--ng-amber)' : 'var(--ng-border)'}`, color: focusDuration === d ? 'var(--ng-amber)' : 'var(--ng-muted)', background: 'transparent', cursor: 'pointer', borderRadius: 2 }}>
                    {d}m
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={() => { setFocusActive(!focusActive); if (focusActive) { setFocusTime(0); } }}
            style={{ padding: '6px 14px', border: `1px solid ${focusActive ? 'var(--ng-red)' : 'var(--ng-amber)'}`, color: focusActive ? 'var(--ng-red)' : 'var(--ng-amber)', background: 'transparent', cursor: 'pointer', borderRadius: 2 }}
            className="font-orbitron">
            <span className="font-orbitron" style={{ fontSize: 9, letterSpacing: '1px' }}>{focusActive ? '■ STOP' : '▷ START'}</span>
          </button>
        </div>
      </div>

      {/* Quick prompts */}
      <div className="px-4 pt-2 pb-2 flex-shrink-0">
        <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {QUICK_PROMPTS.map(p => (
            <button key={p} onClick={() => sendMessage(p)}
              className="font-mono flex-shrink-0"
              style={{ fontSize: 9, padding: '4px 10px', border: '1px solid var(--ng-border)', color: 'var(--ng-muted)', background: 'transparent', cursor: 'pointer', borderRadius: 2, whiteSpace: 'nowrap' }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-3" style={{ minHeight: 0 }}>
        {messages.map(msg => (
          <div key={msg.id} className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
            {msg.role === 'assistant' && (
              <div className="font-orbitron mb-1" style={{ fontSize: 8, color: 'var(--ng-green)', letterSpacing: '2px' }}>⚡ CIPHER</div>
            )}
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="chat-bubble-ai">
            <div className="font-orbitron mb-1" style={{ fontSize: 8, color: 'var(--ng-green)', letterSpacing: '2px' }}>⚡ CIPHER</div>
            <div className="loader-dots flex gap-1"><span /><span /><span /></div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-2 flex-shrink-0" style={{ borderTop: '1px solid var(--ng-border)', paddingTop: 12 }}>
        <div className="flex gap-2">
          <textarea
            className="ng-textarea"
            rows={2}
            placeholder="Ask CIPHER anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          />
          <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
            style={{ width: 44, background: input.trim() ? 'var(--ng-green)' : 'var(--ng-border)', border: 'none', color: '#000', cursor: input.trim() ? 'pointer' : 'default', borderRadius: 2, fontWeight: 900, fontSize: 16, flexShrink: 0, transition: 'all 0.2s' }}>
            ▷
          </button>
        </div>
      </div>
    </div>
  );
}
