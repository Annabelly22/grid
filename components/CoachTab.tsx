'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { UserProfile, TradeSession, TradingSession, TradeDirection } from '../lib/gameStore';
import { Storage } from '../lib/storage';
import { getTodayStr } from '../lib/time';

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

const QUICK_PROMPTS: Record<'general' | 'trading', string[]> = {
  general: [
    "What should I focus on today?",
    "I'm in my luteal phase — help",
    "Give me a 5-min morning protocol",
    "I broke my streak. How do I reset?",
    "Best supplements for a training day",
    "I'm feeling low energy today",
  ],
  trading: [
    "I broke my risk rules today",
    "I'm in a drawdown — help me stay disciplined",
    "Pre-market bias check",
    "I'm about to revenge trade — talk me off the ledge",
    "Rate my trade setup logic",
    "Walk me through ICT market structure review",
  ],
};

const EMOTIONAL_STATES: TradeSession['emotionalState'][] = ['calm', 'confident', 'neutral', 'anxious', 'fearful'];
const TRADING_SESSIONS: TradingSession[] = ['LONDON', 'ASIAN', 'NEWYORK'];
const TRADE_DIRECTIONS: TradeDirection[] = ['BUY', 'SELL'];
const COMMON_PAIRS = ['XAUUSD', 'GBPJPY', 'GBPAUD', 'EURUSD', 'USDJPY', 'GBPUSD'];

// Trading rules based on Notion journal analysis (75 trades analyzed)
// LONDON: 87.5% WR (+$2,715) | NY: 30.8% WR (-$313) | ASIAN: 42.9% WR (-$193)
const TRADING_RULES = [
  { rule: 'LONDON session ONLY (87.5% WR vs 30% NY)', icon: '🎯', critical: true },
  { rule: 'XAUUSD, GBPJPY, GBPAUD, AUDJPY only (100% WR)', icon: '💰', critical: true },
  { rule: 'Use Daily/4H for structure — no lower TFs', icon: '📊', critical: true },
  { rule: 'No overleveraging — forced early exits kill wins', icon: '⚠️', critical: true },
  { rule: 'Max 3 positions open at once', icon: '🔢', critical: false },
  { rule: 'Check news before every trade', icon: '📰', critical: false },
  { rule: 'Avoid NZDUSD, XPDUSD, DXY (negative P&L)', icon: '🚫', critical: false },
  { rule: 'No trading when uncertain or traveling', icon: '🧘', critical: true },
  { rule: 'Cut losses fast — they affect winning trades', icon: '✂️', critical: false },
];

const INITIAL_MSG = (codename: string, xp: number, streak: number): Message => ({
  role: 'assistant',
  content: `ALPHAWILL ONLINE — ${codename}.\n\n${xp} XP · ${streak}d best streak.\n\nWhat do you need?`,
  id: 0,
});

export default function CoachTab({ profile, onFocusMinutes, tradeJournal, onLogTrade, onDeleteTradeSession }: Props) {
  const [activeTab, setActiveTab] = useState<'chat' | 'journal'>('journal');
  const [messages, setMessages] = useState<Message[]>([INITIAL_MSG(profile.codename, profile.xp, profile.longestStreak)]);
  const [input, setInput]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [timerPhase, setTimerPhase] = useState<'idle' | 'focus' | 'break'>('idle');
  const [focusTime, setFocusTime]   = useState(0);
  const [breakTime, setBreakTime]   = useState(0);
  const [focusDuration, setFocusDuration] = useState(25);
  const [promptCategory, setPromptCategory] = useState<'general' | 'trading'>('general');
  const focusActive = timerPhase === 'focus';
  const breakDuration = focusDuration === 25 ? 5 : focusDuration === 50 ? 10 : 15;
  const chatEndRef = useRef<HTMLDivElement>(null);
  const timerRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  // Journal form state
  const today = getTodayStr();
  const [journalDate, setJournalDate] = useState(today);
  const [journalQuality, setJournalQuality] = useState<1|2|3|4|5>(3);
  const [journalRules, setJournalRules] = useState<boolean | null>(null);
  const [journalEmotion, setJournalEmotion] = useState<TradeSession['emotionalState']>('neutral');
  const [journalNote, setJournalNote] = useState('');
  // Extended trade fields
  const [journalPnl, setJournalPnl] = useState<string>('');
  const [journalPair, setJournalPair] = useState<string>('XAUUSD');
  const [journalSession, setJournalSession] = useState<TradingSession>('LONDON');
  const [journalDirection, setJournalDirection] = useState<TradeDirection>('BUY');
  const [showLogForm, setShowLogForm] = useState(false);
  // Image upload
  const [journalImages, setJournalImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [expandedTrade, setExpandedTrade] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate stats from trade journal
  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // Sunday
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const weekTrades = tradeJournal.filter(t => new Date(t.date) >= weekStart);
    const monthTrades = tradeJournal.filter(t => new Date(t.date) >= monthStart);

    const weekPnl = weekTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const monthPnl = monthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const totalPnl = tradeJournal.reduce((sum, t) => sum + (t.pnl || 0), 0);

    const weekWins = weekTrades.filter(t => (t.pnl || 0) > 0).length;
    const weekLosses = weekTrades.filter(t => (t.pnl || 0) < 0).length;
    const weekWinRate = weekTrades.length > 0 ? Math.round((weekWins / weekTrades.length) * 100) : 0;

    // Best pairs (by total P&L)
    const pairPnl: Record<string, { pnl: number; wins: number; total: number }> = {};
    tradeJournal.forEach(t => {
      if (t.pair) {
        if (!pairPnl[t.pair]) pairPnl[t.pair] = { pnl: 0, wins: 0, total: 0 };
        pairPnl[t.pair].pnl += t.pnl || 0;
        pairPnl[t.pair].total += 1;
        if ((t.pnl || 0) > 0) pairPnl[t.pair].wins += 1;
      }
    });
    const bestPairs = Object.entries(pairPnl)
      .sort((a, b) => b[1].pnl - a[1].pnl)
      .slice(0, 3)
      .map(([pair, data]) => ({
        pair,
        pnl: data.pnl,
        winRate: data.total > 0 ? Math.round((data.wins / data.total) * 100) : 0,
      }));

    // Session performance
    const sessionPnl: Record<TradingSession, { pnl: number; wins: number; total: number }> = {
      LONDON: { pnl: 0, wins: 0, total: 0 },
      ASIAN: { pnl: 0, wins: 0, total: 0 },
      NEWYORK: { pnl: 0, wins: 0, total: 0 },
    };
    tradeJournal.forEach(t => {
      if (t.session) {
        sessionPnl[t.session].pnl += t.pnl || 0;
        sessionPnl[t.session].total += 1;
        if ((t.pnl || 0) > 0) sessionPnl[t.session].wins += 1;
      }
    });

    // Rules compliance this week
    const rulesFollowedWeek = weekTrades.filter(t => t.rulesFollowed).length;
    const rulesComplianceWeek = weekTrades.length > 0 ? Math.round((rulesFollowedWeek / weekTrades.length) * 100) : 100;

    return {
      weekPnl,
      monthPnl,
      totalPnl,
      weekTrades: weekTrades.length,
      monthTrades: monthTrades.length,
      weekWinRate,
      weekWins,
      weekLosses,
      bestPairs,
      sessionPnl,
      rulesComplianceWeek,
    };
  }, [tradeJournal]);

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
    if (timerRef.current) clearInterval(timerRef.current);
    if (timerPhase === 'focus') {
      timerRef.current = setInterval(() => {
        setFocusTime(t => {
          if (t + 1 >= focusDuration * 60) {
            clearInterval(timerRef.current!);
            onFocusMinutes(focusDuration);
            setTimerPhase('break');
            setBreakTime(0);
            addMessage('assistant', `⚡ FOCUS COMPLETE — ${focusDuration}m logged. +${focusDuration * 2} XP. ${breakDuration}m break starting now.`);
            return 0;
          }
          return t + 1;
        });
      }, 1000);
    } else if (timerPhase === 'break') {
      timerRef.current = setInterval(() => {
        setBreakTime(t => {
          if (t + 1 >= breakDuration * 60) {
            clearInterval(timerRef.current!);
            setTimerPhase('idle');
            addMessage('assistant', `✓ BREAK COMPLETE — Ready for another block, ${profile.codename}?`);
            return 0;
          }
          return t + 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerPhase]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const userId = Storage.getUserId();

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', userId);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (data.url) {
          setJournalImages(prev => [...prev, data.url]);
        } else {
          console.error('Upload failed:', data.error);
        }
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    setUploading(false);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = async (url: string) => {
    try {
      await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
    } catch (err) {
      console.error('Delete error:', err);
    }
    setJournalImages(prev => prev.filter(u => u !== url));
  };

  const handleLogSession = () => {
    if (journalRules === null) return;
    const pnlValue = journalPnl.trim() ? parseFloat(journalPnl) : undefined;
    onLogTrade({
      date: journalDate,
      quality: journalQuality,
      rulesFollowed: journalRules,
      emotionalState: journalEmotion,
      note: journalNote.trim(),
      pnl: pnlValue,
      pair: journalPair,
      session: journalSession,
      direction: journalDirection,
      images: journalImages.length > 0 ? journalImages : undefined,
    });
    // Reset form
    setJournalDate(today);
    setJournalQuality(3);
    setJournalRules(null);
    setJournalEmotion('neutral');
    setJournalNote('');
    setJournalPnl('');
    setJournalPair('XAUUSD');
    setJournalSession('LONDON');
    setJournalDirection('BUY');
    setJournalImages([]);
    setShowLogForm(false);
  };

  const formatTime = (s: number) => {
    const m   = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const remaining     = focusDuration * 60 - focusTime;
  const breakRemaining = breakDuration * 60 - breakTime;
  const focusPct  = timerPhase === 'focus' ? Math.round((focusTime / (focusDuration * 60)) * 100) : 0;
  const breakPct  = timerPhase === 'break' ? Math.round((breakTime / (breakDuration * 60)) * 100) : 0;

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
            {timerPhase === 'focus' ? (
              <>
                <span className="font-orbitron font-bold" style={{ fontSize: 15, color: 'var(--ng-green)', letterSpacing: '1px' }}>
                  {formatTime(remaining)}
                </span>
                <button onClick={() => { setTimerPhase('idle'); setFocusTime(0); setBreakTime(0); }} className="font-orbitron"
                  style={{ fontSize: 13, padding: '7px 14px', border: '1.5px solid var(--ng-red)', color: 'var(--ng-red)', background: 'transparent', cursor: 'pointer', borderRadius: 8 }}>
                  ■ STOP
                </button>
              </>
            ) : timerPhase === 'break' ? (
              <>
                <div className="flex flex-col items-end">
                  <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-cyan)', letterSpacing: '2px' }}>BREAK</span>
                  <span className="font-orbitron font-bold" style={{ fontSize: 15, color: 'var(--ng-cyan)', letterSpacing: '1px' }}>
                    {formatTime(breakRemaining)}
                  </span>
                </div>
                <button onClick={() => { setTimerPhase('idle'); setBreakTime(0); }} className="font-orbitron"
                  style={{ fontSize: 13, padding: '7px 14px', border: '1.5px solid var(--ng-cyan)', color: 'var(--ng-cyan)', background: 'transparent', cursor: 'pointer', borderRadius: 8 }}>
                  SKIP
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
                <button onClick={() => { setTimerPhase('focus'); setFocusTime(0); }} className="font-orbitron"
                  style={{ fontSize: 13, padding: '7px 14px', border: '1.5px solid var(--ng-amber)', color: 'var(--ng-amber)', background: 'transparent', cursor: 'pointer', borderRadius: 8 }}>
                  ▷
                </button>
              </>
            )}
          </div>
        </div>

        {timerPhase !== 'idle' && (
          <div style={{ height: 2, background: 'var(--ng-border)', marginTop: 10, borderRadius: 1, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${timerPhase === 'focus' ? focusPct : breakPct}%`, background: timerPhase === 'focus' ? 'var(--ng-green)' : 'var(--ng-cyan)', transition: 'width 1s linear' }} />
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
            <div className="flex gap-1 mb-2">
              {(['general', 'trading'] as const).map(cat => (
                <button key={cat} onClick={() => setPromptCategory(cat)} className="font-orbitron"
                  style={{ padding: '4px 12px', fontSize: 8, letterSpacing: '1px', border: `1px solid ${promptCategory === cat ? 'var(--ng-amber)' : 'var(--ng-border)'}`, color: promptCategory === cat ? 'var(--ng-amber)' : 'var(--ng-muted)', background: promptCategory === cat ? 'rgba(255,159,10,0.08)' : 'transparent', borderRadius: 6, cursor: 'pointer' }}>
                  {cat === 'general' ? 'GENERAL' : '📈 TRADING'}
                </button>
              ))}
            </div>
            <div className="flex gap-1 overflow-x-auto pb-2 mb-2" style={{ scrollbarWidth: 'none' }}>
              {QUICK_PROMPTS[promptCategory].map(p => (
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

      {/* ── Journal tab — Trading Dashboard ──────────────────── */}
      {activeTab === 'journal' && (
        <div className="flex-1 overflow-y-auto px-4 py-4">

          {/* P&L Stats Cards */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="card" style={{ padding: '12px 10px', textAlign: 'center', borderColor: stats.weekPnl >= 0 ? 'rgba(0,255,65,0.3)' : 'rgba(255,71,87,0.3)' }}>
              <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px', marginBottom: 4 }}>THIS WEEK</div>
              <div className="font-orbitron font-bold" style={{ fontSize: 16, color: stats.weekPnl >= 0 ? 'var(--ng-green)' : 'var(--ng-red)' }}>
                {stats.weekPnl >= 0 ? '+' : ''}{stats.weekPnl.toFixed(2)}
              </div>
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-dimmer)' }}>{stats.weekTrades} trades</div>
            </div>
            <div className="card" style={{ padding: '12px 10px', textAlign: 'center', borderColor: stats.monthPnl >= 0 ? 'rgba(0,255,65,0.3)' : 'rgba(255,71,87,0.3)' }}>
              <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px', marginBottom: 4 }}>THIS MONTH</div>
              <div className="font-orbitron font-bold" style={{ fontSize: 16, color: stats.monthPnl >= 0 ? 'var(--ng-green)' : 'var(--ng-red)' }}>
                {stats.monthPnl >= 0 ? '+' : ''}{stats.monthPnl.toFixed(2)}
              </div>
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-dimmer)' }}>{stats.monthTrades} trades</div>
            </div>
            <div className="card" style={{ padding: '12px 10px', textAlign: 'center', borderColor: 'rgba(0,212,255,0.3)' }}>
              <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px', marginBottom: 4 }}>WIN RATE</div>
              <div className="font-orbitron font-bold" style={{ fontSize: 16, color: 'var(--ng-cyan)' }}>{stats.weekWinRate}%</div>
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-dimmer)' }}>{stats.weekWins}W / {stats.weekLosses}L</div>
            </div>
          </div>

          {/* Trading Rules */}
          <div className="card mb-4" style={{ borderColor: 'rgba(255,184,0,0.3)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-amber)', letterSpacing: '2px' }}>TRADING RULES</div>
              <div className="font-mono" style={{ fontSize: 10, color: stats.rulesComplianceWeek >= 80 ? 'var(--ng-green)' : 'var(--ng-red)' }}>
                {stats.rulesComplianceWeek}% compliance
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {TRADING_RULES.map((item, i) => (
                <div key={i} className="flex items-center gap-2" style={{ padding: '6px 8px', background: item.critical ? 'rgba(255,184,0,0.08)' : 'transparent', borderRadius: 6 }}>
                  <span style={{ fontSize: 12 }}>{item.icon}</span>
                  <span className="font-mono" style={{ fontSize: 10, color: item.critical ? 'var(--ng-amber)' : 'var(--ng-muted)' }}>{item.rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Best Pairs */}
          {stats.bestPairs.length > 0 && (
            <div className="card mb-4" style={{ borderColor: 'rgba(0,255,65,0.3)' }}>
              <div className="font-orbitron mb-3" style={{ fontSize: 9, color: 'var(--ng-green)', letterSpacing: '2px' }}>TOP PERFORMING PAIRS</div>
              <div className="flex flex-col gap-2">
                {stats.bestPairs.map((p, i) => (
                  <div key={p.pair} className="flex items-center justify-between" style={{ padding: '8px 10px', background: i === 0 ? 'rgba(0,255,65,0.08)' : 'transparent', borderRadius: 6 }}>
                    <div className="flex items-center gap-2">
                      <span className="font-orbitron" style={{ fontSize: 10, color: i === 0 ? 'var(--ng-green)' : 'var(--ng-muted)', width: 16 }}>#{i + 1}</span>
                      <span className="font-orbitron font-bold" style={{ fontSize: 12, color: 'var(--ng-text)' }}>{p.pair}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono" style={{ fontSize: 10, color: 'var(--ng-cyan)' }}>{p.winRate}% WR</span>
                      <span className="font-orbitron font-bold" style={{ fontSize: 12, color: p.pnl >= 0 ? 'var(--ng-green)' : 'var(--ng-red)' }}>
                        {p.pnl >= 0 ? '+' : ''}{p.pnl.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session Performance */}
          <div className="card mb-4" style={{ borderColor: 'rgba(0,212,255,0.3)' }}>
            <div className="font-orbitron mb-3" style={{ fontSize: 9, color: 'var(--ng-cyan)', letterSpacing: '2px' }}>SESSION PERFORMANCE</div>
            <div className="flex gap-2">
              {TRADING_SESSIONS.map(s => {
                const data = stats.sessionPnl[s];
                const winRate = data.total > 0 ? Math.round((data.wins / data.total) * 100) : 0;
                const isLondon = s === 'LONDON';
                return (
                  <div key={s} className="flex-1" style={{ padding: '10px', background: isLondon ? 'rgba(0,255,65,0.08)' : 'var(--ng-surface)', border: `1px solid ${isLondon ? 'var(--ng-green)' : 'var(--ng-border)'}`, borderRadius: 8, textAlign: 'center' }}>
                    <div className="font-orbitron" style={{ fontSize: 9, color: isLondon ? 'var(--ng-green)' : 'var(--ng-muted)', letterSpacing: '1px', marginBottom: 4 }}>{s}</div>
                    <div className="font-orbitron font-bold" style={{ fontSize: 13, color: data.pnl >= 0 ? 'var(--ng-green)' : 'var(--ng-red)' }}>
                      {data.pnl >= 0 ? '+' : ''}{data.pnl.toFixed(0)}
                    </div>
                    <div className="font-mono" style={{ fontSize: 8, color: 'var(--ng-dimmer)' }}>{winRate}% · {data.total} trades</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Log Trade Button / Form */}
          {!showLogForm ? (
            <button onClick={() => setShowLogForm(true)} className="btn-green-solid w-full mb-4" style={{ padding: '14px' }}>
              + LOG NEW TRADE
            </button>
          ) : (
            <div className="card mb-4" style={{ borderColor: 'rgba(255,159,10,0.3)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-amber)', letterSpacing: '2px' }}>LOG TRADE</div>
                <button onClick={() => setShowLogForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ng-muted)', fontSize: 14, padding: '2px' }}>✕</button>
              </div>

              {/* Row 1: Date, Pair, P&L */}
              <div className="flex gap-2 mb-3">
                <div style={{ flex: 1 }}>
                  <div className="font-orbitron mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>DATE</div>
                  <input type="date" className="ng-input" style={{ width: '100%' }} value={journalDate} onChange={e => setJournalDate(e.target.value)} max={today} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="font-orbitron mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>PAIR</div>
                  <select className="ng-input" style={{ width: '100%' }} value={journalPair} onChange={e => setJournalPair(e.target.value)}>
                    {COMMON_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div style={{ width: 90 }}>
                  <div className="font-orbitron mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>P&L ($)</div>
                  <input type="number" className="ng-input" style={{ width: '100%' }} placeholder="+/-" value={journalPnl} onChange={e => setJournalPnl(e.target.value)} />
                </div>
              </div>

              {/* Row 2: Session, Direction */}
              <div className="flex gap-2 mb-3">
                <div style={{ flex: 1 }}>
                  <div className="font-orbitron mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>SESSION</div>
                  <div className="flex gap-1">
                    {TRADING_SESSIONS.map(s => (
                      <button key={s} onClick={() => setJournalSession(s)} className="font-orbitron flex-1"
                        style={{ padding: '6px 4px', fontSize: 8, border: `1px solid ${journalSession === s ? 'var(--ng-cyan)' : 'var(--ng-border)'}`, color: journalSession === s ? 'var(--ng-cyan)' : 'var(--ng-muted)', background: journalSession === s ? 'rgba(0,212,255,0.08)' : 'transparent', borderRadius: 6, cursor: 'pointer' }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ width: 120 }}>
                  <div className="font-orbitron mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>DIRECTION</div>
                  <div className="flex gap-1">
                    {TRADE_DIRECTIONS.map(d => (
                      <button key={d} onClick={() => setJournalDirection(d)} className="font-orbitron flex-1"
                        style={{ padding: '6px', fontSize: 9, border: `1px solid ${journalDirection === d ? (d === 'BUY' ? 'var(--ng-green)' : 'var(--ng-red)') : 'var(--ng-border)'}`, color: journalDirection === d ? (d === 'BUY' ? 'var(--ng-green)' : 'var(--ng-red)') : 'var(--ng-muted)', background: journalDirection === d ? (d === 'BUY' ? 'rgba(0,255,65,0.08)' : 'rgba(255,71,87,0.08)') : 'transparent', borderRadius: 6, cursor: 'pointer' }}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Quality, Rules */}
              <div className="flex gap-2 mb-3">
                <div style={{ flex: 1 }}>
                  <div className="font-orbitron mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>QUALITY</div>
                  <div className="flex gap-1">
                    {([1,2,3,4,5] as const).map(n => (
                      <button key={n} onClick={() => setJournalQuality(n)} style={{ fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', color: n <= journalQuality ? '#FFD700' : 'var(--ng-dimmer)', padding: '2px', lineHeight: 1 }}>★</button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="font-orbitron mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>RULES FOLLOWED</div>
                  <div className="flex gap-1">
                    <button onClick={() => setJournalRules(true)} className="font-orbitron flex-1"
                      style={{ padding: '6px', fontSize: 9, border: `1px solid ${journalRules === true ? 'var(--ng-green)' : 'var(--ng-border)'}`, color: journalRules === true ? 'var(--ng-green)' : 'var(--ng-muted)', background: journalRules === true ? 'rgba(0,255,65,0.08)' : 'transparent', borderRadius: 6, cursor: 'pointer' }}>
                      ✓ YES
                    </button>
                    <button onClick={() => setJournalRules(false)} className="font-orbitron flex-1"
                      style={{ padding: '6px', fontSize: 9, border: `1px solid ${journalRules === false ? 'var(--ng-red)' : 'var(--ng-border)'}`, color: journalRules === false ? 'var(--ng-red)' : 'var(--ng-muted)', background: journalRules === false ? 'rgba(255,71,87,0.08)' : 'transparent', borderRadius: 6, cursor: 'pointer' }}>
                      ✗ NO
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 4: Emotional State */}
              <div className="mb-3">
                <div className="font-orbitron mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>EMOTIONAL STATE</div>
                <div className="flex gap-1 flex-wrap">
                  {EMOTIONAL_STATES.map(s => (
                    <button key={s} onClick={() => setJournalEmotion(s)} className="font-orbitron"
                      style={{ padding: '5px 10px', fontSize: 8, border: `1px solid ${journalEmotion === s ? 'var(--ng-cyan)' : 'var(--ng-border)'}`, color: journalEmotion === s ? 'var(--ng-cyan)' : 'var(--ng-muted)', background: journalEmotion === s ? 'rgba(0,212,255,0.08)' : 'transparent', borderRadius: 6, cursor: 'pointer', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 5: Note */}
              <div className="mb-3">
                <div className="font-orbitron mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>NOTE <span style={{ fontWeight: 400 }}>({journalNote.length}/280)</span></div>
                <textarea className="ng-textarea" rows={2} style={{ width: '100%', resize: 'none' }} placeholder="Brief note..." value={journalNote} onChange={e => setJournalNote(e.target.value.slice(0, 280))} />
              </div>

              {/* Row 6: Screenshots */}
              <div className="mb-3">
                <div className="font-orbitron mb-2" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>SCREENSHOTS</div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <div className="flex gap-2 flex-wrap">
                  {journalImages.map((url, i) => (
                    <div key={i} style={{ position: 'relative', width: 60, height: 60 }}>
                      <img src={url} alt={`Screenshot ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6, border: '1px solid var(--ng-border)' }} />
                      <button
                        onClick={() => handleRemoveImage(url)}
                        style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--ng-red)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >✕</button>
                    </div>
                  ))}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      width: 60, height: 60, border: '1.5px dashed var(--ng-border)', borderRadius: 6,
                      background: 'transparent', cursor: uploading ? 'wait' : 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                      color: 'var(--ng-muted)',
                    }}
                  >
                    {uploading ? (
                      <div className="loader-dots" style={{ transform: 'scale(0.5)' }}><span /><span /><span /></div>
                    ) : (
                      <>
                        <span style={{ fontSize: 18 }}>📷</span>
                        <span className="font-mono" style={{ fontSize: 7 }}>ADD</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <button onClick={handleLogSession} disabled={journalRules === null} className="btn-green-solid w-full" style={{ opacity: journalRules === null ? 0.5 : 1 }}>
                SUBMIT TRADE
              </button>
            </div>
          )}

          {/* Recent Trades */}
          {tradeJournal.length > 0 && (
            <>
              <div className="font-orbitron mb-3" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '2px' }}>RECENT TRADES — {tradeJournal.length} TOTAL</div>
              {tradeJournal.slice(0, 10).map(session => (
                <div key={session.id} className="mb-2" style={{ background: 'var(--ng-surface)', border: '0.5px solid var(--ng-border)', borderLeft: `3px solid ${(session.pnl || 0) >= 0 ? 'var(--ng-green)' : 'var(--ng-red)'}`, borderRadius: 10 }}>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>{session.date}</span>
                        {session.pair && <span className="font-orbitron font-bold" style={{ fontSize: 11, color: 'var(--ng-text)' }}>{session.pair}</span>}
                        {session.session && <span className="font-mono" style={{ fontSize: 8, color: session.session === 'LONDON' ? 'var(--ng-green)' : 'var(--ng-muted)', padding: '2px 6px', background: 'var(--ng-surface2)', borderRadius: 4 }}>{session.session}</span>}
                        {session.direction && <span className="font-orbitron" style={{ fontSize: 8, color: session.direction === 'BUY' ? 'var(--ng-green)' : 'var(--ng-red)' }}>{session.direction}</span>}
                        {session.images && session.images.length > 0 && (
                          <span className="font-mono" style={{ fontSize: 8, color: 'var(--ng-purple)', padding: '2px 6px', background: 'rgba(191,0,255,0.1)', borderRadius: 4 }}>📷 {session.images.length}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {session.pnl !== undefined && (
                          <span className="font-orbitron font-bold" style={{ fontSize: 13, color: session.pnl >= 0 ? 'var(--ng-green)' : 'var(--ng-red)' }}>
                            {session.pnl >= 0 ? '+' : ''}{session.pnl.toFixed(2)}
                          </span>
                        )}
                        <button onClick={() => onDeleteTradeSession(session.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ng-dimmer)', fontSize: 12, padding: '2px' }}>✕</button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: 10, color: '#FFD700' }}>{'★'.repeat(session.quality)}{'☆'.repeat(5 - session.quality)}</span>
                      <span className="font-orbitron" style={{ fontSize: 8, color: session.rulesFollowed ? 'var(--ng-green)' : 'var(--ng-red)', letterSpacing: '1px' }}>
                        {session.rulesFollowed ? '✓ RULES' : '✗ BROKE'}
                      </span>
                      <span className="font-mono" style={{ fontSize: 8, color: 'var(--ng-cyan)', textTransform: 'uppercase' }}>{session.emotionalState}</span>
                    </div>
                    {session.note && <div className="font-mono mt-1" style={{ fontSize: 9, color: 'var(--ng-dimmer)', lineHeight: 1.4 }}>{session.note}</div>}
                    {/* Trade Screenshots */}
                    {session.images && session.images.length > 0 && (
                      <div className="mt-2">
                        <button
                          onClick={() => setExpandedTrade(expandedTrade === session.id ? null : session.id)}
                          className="font-mono"
                          style={{ fontSize: 9, color: 'var(--ng-purple)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          {expandedTrade === session.id ? '▼ Hide screenshots' : '▶ View screenshots'}
                        </button>
                        {expandedTrade === session.id && (
                          <div className="flex gap-2 mt-2 flex-wrap">
                            {session.images.map((url, i) => (
                              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                                <img
                                  src={url}
                                  alt={`Trade screenshot ${i + 1}`}
                                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--ng-border)', cursor: 'pointer' }}
                                />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {tradeJournal.length === 0 && (
            <div className="text-center py-8">
              <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
              <div className="font-orbitron" style={{ fontSize: 11, color: 'var(--ng-muted)', letterSpacing: '2px' }}>NO TRADES LOGGED YET</div>
              <div className="font-mono mt-2" style={{ fontSize: 10, color: 'var(--ng-dimmer)' }}>Start tracking your trades to see insights</div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
