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
  onUpdateTrade: (id: string, data: Partial<Omit<TradeSession, 'id' | 'createdAt'>>) => void;
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
// Pairs ordered by win rate from Notion data (top performers first)
const COMMON_PAIRS = ['XAUUSD', 'GBPJPY', 'GBPAUD', 'AUDJPY', 'EURUSD', 'GBPUSD', 'USDJPY', 'OTHER'];

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
  content: `GODWILL ONLINE — ${codename}.\n\n${xp} XP · ${streak}d best streak.\n\nWhat do you need?`,
  id: 0,
});

export default function CoachTab({ profile, onFocusMinutes, tradeJournal, onLogTrade, onUpdateTrade, onDeleteTradeSession }: Props) {
  const [activeTab, setActiveTab] = useState<'journal' | 'log' | 'chat'>('journal');
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

  // Log view state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());

  const toggleWeek = (weekIdx: number) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      if (next.has(weekIdx)) {
        next.delete(weekIdx);
      } else {
        next.add(weekIdx);
      }
      return next;
    });
  };

  // Edit trade state
  const [editingTradeId, setEditingTradeId] = useState<string | null>(null);
  const [editPnl, setEditPnl] = useState('');
  const [editPair, setEditPair] = useState('');
  const [editSession, setEditSession] = useState<TradingSession>('LONDON');
  const [editDirection, setEditDirection] = useState<TradeDirection>('BUY');
  const [editQuality, setEditQuality] = useState<1|2|3|4|5>(3);
  const [editRules, setEditRules] = useState<boolean>(true);
  const [editEmotion, setEditEmotion] = useState<TradeSession['emotionalState']>('neutral');
  const [editNote, setEditNote] = useState('');

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
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
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

  // Get trades grouped by week for log view
  const logViewData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const monthTrades = tradeJournal.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    // Group by week (Sunday to Saturday)
    const weeks: { weekStart: string; weekEnd: string; trades: TradeSession[]; totalPnl: number }[] = [];
    const firstOfMonth = new Date(year, month - 1, 1);
    const lastOfMonth = new Date(year, month, 0);

    // Find the Sunday on or before the first of the month
    let currentWeekStart = new Date(firstOfMonth);
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

    while (currentWeekStart <= lastOfMonth) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekTrades = monthTrades.filter(t => {
        const d = new Date(t.date);
        return d >= currentWeekStart && d <= weekEnd;
      });

      if (weekTrades.length > 0 || (currentWeekStart <= lastOfMonth && weekEnd >= firstOfMonth)) {
        weeks.push({
          weekStart: currentWeekStart.toISOString().slice(0, 10),
          weekEnd: weekEnd.toISOString().slice(0, 10),
          trades: weekTrades.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
          totalPnl: weekTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
        });
      }

      currentWeekStart = new Date(weekEnd);
      currentWeekStart.setDate(currentWeekStart.getDate() + 1);
    }

    const monthlyPnl = monthTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const monthlyWins = monthTrades.filter(t => (t.pnl || 0) > 0).length;
    const monthlyLosses = monthTrades.filter(t => (t.pnl || 0) < 0).length;

    return { weeks, monthlyPnl, monthlyWins, monthlyLosses, totalTrades: monthTrades.length };
  }, [tradeJournal, selectedMonth]);

  // Start editing a trade
  const startEditTrade = (trade: TradeSession) => {
    setEditingTradeId(trade.id);
    setEditPnl(trade.pnl?.toString() || '');
    setEditPair(trade.pair || 'XAUUSD');
    setEditSession(trade.session || 'LONDON');
    setEditDirection(trade.direction || 'BUY');
    setEditQuality(trade.quality);
    setEditRules(trade.rulesFollowed);
    setEditEmotion(trade.emotionalState);
    setEditNote(trade.note);
  };

  // Save edited trade
  const saveEditTrade = () => {
    if (!editingTradeId) return;
    onUpdateTrade(editingTradeId, {
      pnl: editPnl ? parseFloat(editPnl) : undefined,
      pair: editPair,
      session: editSession,
      direction: editDirection,
      quality: editQuality,
      rulesFollowed: editRules,
      emotionalState: editEmotion,
      note: editNote,
    });
    setEditingTradeId(null);
  };

  // Cancel editing
  const cancelEditTrade = () => {
    setEditingTradeId(null);
  };

  // Load persisted chat on mount
  useEffect(() => {
    const stored = Storage.getGodwillChat();
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
      Storage.setGodwillChat(next.slice(-50).map(m => ({ role: m.role, content: m.content })));
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
      addMessage('assistant', data.reply || 'GODWILL encountered an error. Try again.');
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
              <h2 className="font-orbitron font-bold" style={{ color: 'var(--ng-amber)', fontSize: 16, letterSpacing: '3px' }}>GODWILL</h2>
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

        {/* Sub-tab toggle: JOURNAL -> LOG -> CHAT */}
        <div className="flex gap-1 mt-3">
          {(['journal', 'log', 'chat'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className="font-orbitron"
              style={{ padding: '6px 14px', fontSize: 9, letterSpacing: '1px', border: `1px solid ${activeTab === t ? 'var(--ng-amber)' : 'var(--ng-border)'}`, color: activeTab === t ? 'var(--ng-amber)' : 'var(--ng-muted)', background: activeTab === t ? 'rgba(255,159,10,0.08)' : 'transparent', borderRadius: 8, cursor: 'pointer' }}>
              {t === 'journal' ? '📋 JOURNAL' : t === 'log' ? '📊 LOG' : '⚡ CHAT'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Log tab — Weekly/Monthly P&L View ────────────────── */}
      {activeTab === 'log' && (
        <div className="flex-1 overflow-y-auto">
          {/* Monthly Hero Header */}
          <div style={{
            background: logViewData.monthlyPnl >= 0
              ? 'linear-gradient(135deg, rgba(0,255,65,0.15) 0%, rgba(0,212,255,0.08) 100%)'
              : 'linear-gradient(135deg, rgba(255,71,87,0.15) 0%, rgba(255,159,10,0.08) 100%)',
            borderBottom: `1px solid ${logViewData.monthlyPnl >= 0 ? 'rgba(0,255,65,0.3)' : 'rgba(255,71,87,0.3)'}`,
            padding: '20px 16px 24px',
          }}>
            {/* Month Navigator */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  const [y, m] = selectedMonth.split('-').map(Number);
                  const prev = new Date(y, m - 2, 1);
                  setSelectedMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
                }}
                style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--ng-border)', borderRadius: 8, cursor: 'pointer', color: 'var(--ng-text)', fontSize: 14 }}
              >
                ◀
              </button>
              <div className="text-center">
                <div className="font-orbitron" style={{ fontSize: 18, color: 'var(--ng-text)', letterSpacing: '3px', fontWeight: 900 }}>
                  {new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long' }).toUpperCase()}
                </div>
                <div className="font-mono" style={{ fontSize: 11, color: 'var(--ng-muted)' }}>
                  {new Date(selectedMonth + '-01').getFullYear()}
                </div>
              </div>
              <button
                onClick={() => {
                  const [y, m] = selectedMonth.split('-').map(Number);
                  const next = new Date(y, m, 1);
                  setSelectedMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
                }}
                style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--ng-border)', borderRadius: 8, cursor: 'pointer', color: 'var(--ng-text)', fontSize: 14 }}
              >
                ▶
              </button>
            </div>

            {/* Big P&L Display */}
            <div className="text-center mb-4">
              <div className="font-orbitron font-bold" style={{
                fontSize: 48,
                color: logViewData.monthlyPnl >= 0 ? 'var(--ng-green)' : 'var(--ng-red)',
                textShadow: logViewData.monthlyPnl >= 0
                  ? '0 0 30px rgba(0,255,65,0.4)'
                  : '0 0 30px rgba(255,71,87,0.4)',
                letterSpacing: '2px',
              }}>
                {logViewData.monthlyPnl >= 0 ? '+' : ''}{logViewData.monthlyPnl.toFixed(2)}
              </div>
              <div className="font-mono" style={{ fontSize: 12, color: 'var(--ng-muted)', marginTop: 4 }}>
                MONTHLY P&L
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex justify-center gap-6">
              <div className="text-center">
                <div className="font-orbitron font-bold" style={{ fontSize: 20, color: 'var(--ng-text)' }}>
                  {logViewData.totalTrades}
                </div>
                <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px' }}>TRADES</div>
              </div>
              <div style={{ width: 1, background: 'var(--ng-border)' }} />
              <div className="text-center">
                <div className="font-orbitron font-bold" style={{ fontSize: 20, color: 'var(--ng-green)' }}>
                  {logViewData.monthlyWins}
                </div>
                <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px' }}>WINS</div>
              </div>
              <div style={{ width: 1, background: 'var(--ng-border)' }} />
              <div className="text-center">
                <div className="font-orbitron font-bold" style={{ fontSize: 20, color: 'var(--ng-red)' }}>
                  {logViewData.monthlyLosses}
                </div>
                <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px' }}>LOSSES</div>
              </div>
              <div style={{ width: 1, background: 'var(--ng-border)' }} />
              <div className="text-center">
                <div className="font-orbitron font-bold" style={{ fontSize: 20, color: 'var(--ng-cyan)' }}>
                  {logViewData.totalTrades > 0 ? Math.round((logViewData.monthlyWins / logViewData.totalTrades) * 100) : 0}%
                </div>
                <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px' }}>WIN RATE</div>
              </div>
            </div>

            {/* Win Rate Progress Bar */}
            {logViewData.totalTrades > 0 && (
              <div style={{ marginTop: 16 }}>
                <div style={{ height: 6, background: 'rgba(255,71,87,0.3)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${(logViewData.monthlyWins / logViewData.totalTrades) * 100}%`,
                    background: 'linear-gradient(90deg, var(--ng-green), var(--ng-cyan))',
                    borderRadius: 3,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Weekly breakdown */}
          <div className="px-4 py-4">
            {logViewData.weeks.map((week, weekIdx) => {
              const weekWins = week.trades.filter(t => (t.pnl || 0) > 0).length;
              const weekLosses = week.trades.filter(t => (t.pnl || 0) < 0).length;

              const isExpanded = expandedWeeks.has(weekIdx);

              return (
                <div key={weekIdx} className="mb-4">
                  {/* Week header - clickable to expand/collapse */}
                  <button
                    onClick={() => week.trades.length > 0 && toggleWeek(weekIdx)}
                    style={{
                      width: '100%',
                      background: week.totalPnl >= 0 ? 'rgba(0,255,65,0.08)' : 'rgba(255,71,87,0.08)',
                      border: `1px solid ${week.totalPnl >= 0 ? 'rgba(0,255,65,0.25)' : 'rgba(255,71,87,0.25)'}`,
                      borderRadius: 12,
                      padding: '14px 16px',
                      cursor: week.trades.length > 0 ? 'pointer' : 'default',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Expand/collapse indicator */}
                        {week.trades.length > 0 && (
                          <span style={{
                            fontSize: 12,
                            color: 'var(--ng-muted)',
                            transition: 'transform 0.2s ease',
                            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                          }}>
                            ▶
                          </span>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-orbitron font-bold" style={{ fontSize: 12, color: 'var(--ng-text)', letterSpacing: '1px' }}>
                              WEEK {weekIdx + 1}
                            </span>
                            {/* Trade count badge - prominent */}
                            {week.trades.length > 0 && (
                              <span style={{
                                padding: '3px 10px',
                                background: 'var(--ng-amber)',
                                color: '#000',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 700,
                                fontFamily: 'var(--font-orbitron)',
                              }}>
                                {week.trades.length} {week.trades.length === 1 ? 'TRADE' : 'TRADES'}
                              </span>
                            )}
                          </div>
                          <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', marginTop: 2 }}>
                            {new Date(week.weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(week.weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-orbitron font-bold" style={{
                          fontSize: 20,
                          color: week.totalPnl >= 0 ? 'var(--ng-green)' : 'var(--ng-red)',
                        }}>
                          {week.totalPnl >= 0 ? '+' : ''}{week.totalPnl.toFixed(2)}
                        </div>
                        <div className="flex items-center gap-2 justify-end" style={{ marginTop: 2 }}>
                          <span className="font-mono" style={{ fontSize: 10, color: 'var(--ng-green)', fontWeight: 600 }}>{weekWins}W</span>
                          <span style={{ color: 'var(--ng-border)' }}>·</span>
                          <span className="font-mono" style={{ fontSize: 10, color: 'var(--ng-red)', fontWeight: 600 }}>{weekLosses}L</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Trades in this week - collapsible */}
                  {isExpanded && week.trades.length > 0 && (
                    <div style={{ marginTop: 10, paddingLeft: 8 }}>
                      {week.trades.map(trade => {
                      const isEditing = editingTradeId === trade.id;

                      return (
                        <div key={trade.id} className="mb-2" style={{
                          background: 'var(--ng-surface)',
                          border: '1px solid var(--ng-border)',
                          borderLeft: `4px solid ${(trade.pnl || 0) >= 0 ? 'var(--ng-green)' : 'var(--ng-red)'}`,
                          borderRadius: 10,
                        }}>
                          {isEditing ? (
                            /* Edit form */
                            <div className="p-3">
                              <div className="flex gap-2 mb-2">
                                <input type="number" className="ng-input flex-1" placeholder="P&L" value={editPnl} onChange={e => setEditPnl(e.target.value)} style={{ padding: '8px 12px' }} />
                                <select className="ng-input" value={editPair} onChange={e => setEditPair(e.target.value)} style={{ padding: '8px 12px' }}>
                                  {COMMON_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                              </div>
                              <div className="flex gap-2 mb-2">
                                <select className="ng-input flex-1" value={editSession} onChange={e => setEditSession(e.target.value as TradingSession)} style={{ padding: '8px 12px' }}>
                                  {TRADING_SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <select className="ng-input" value={editDirection} onChange={e => setEditDirection(e.target.value as TradeDirection)} style={{ padding: '8px 12px' }}>
                                  {TRADE_DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                              </div>
                              <div className="flex gap-2 mb-2">
                                <button onClick={() => setEditRules(!editRules)} className="font-orbitron flex-1"
                                  style={{ padding: '8px', fontSize: 10, border: `1.5px solid ${editRules ? 'var(--ng-green)' : 'var(--ng-red)'}`, color: editRules ? 'var(--ng-green)' : 'var(--ng-red)', background: editRules ? 'rgba(0,255,65,0.1)' : 'rgba(255,71,87,0.1)', borderRadius: 8, cursor: 'pointer' }}>
                                  {editRules ? '✓ RULES FOLLOWED' : '✗ BROKE RULES'}
                                </button>
                                <div className="flex gap-1 items-center" style={{ padding: '0 8px' }}>
                                  {([1,2,3,4,5] as const).map(n => (
                                    <button key={n} onClick={() => setEditQuality(n)} style={{ fontSize: 18, background: 'none', border: 'none', cursor: 'pointer', color: n <= editQuality ? '#FFD700' : 'var(--ng-dimmer)', padding: '2px' }}>★</button>
                                  ))}
                                </div>
                              </div>
                              <textarea className="ng-textarea mb-3" rows={2} style={{ width: '100%', resize: 'none', padding: '10px' }} placeholder="Trade notes..." value={editNote} onChange={e => setEditNote(e.target.value)} />
                              <div className="flex gap-2">
                                <button onClick={saveEditTrade} className="btn-green-solid flex-1" style={{ padding: '10px', fontSize: 11 }}>SAVE CHANGES</button>
                                <button onClick={cancelEditTrade} className="font-orbitron flex-1" style={{ padding: '10px', fontSize: 11, border: '1px solid var(--ng-border)', background: 'transparent', color: 'var(--ng-muted)', borderRadius: 8, cursor: 'pointer' }}>CANCEL</button>
                              </div>
                            </div>
                          ) : (
                            /* Display view */
                            <div className="p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--ng-muted)', minWidth: 50 }}>
                                    {new Date(trade.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                                  </span>
                                  {trade.pair && <span className="font-orbitron font-bold" style={{ fontSize: 13, color: 'var(--ng-text)' }}>{trade.pair}</span>}
                                  {trade.direction && (
                                    <span className="font-orbitron" style={{
                                      fontSize: 9,
                                      color: trade.direction === 'BUY' ? 'var(--ng-green)' : 'var(--ng-red)',
                                      padding: '3px 8px',
                                      background: trade.direction === 'BUY' ? 'rgba(0,255,65,0.15)' : 'rgba(255,71,87,0.15)',
                                      borderRadius: 4,
                                    }}>
                                      {trade.direction === 'BUY' ? '▲' : '▼'} {trade.direction}
                                    </span>
                                  )}
                                  {trade.session && (
                                    <span className="font-mono" style={{
                                      fontSize: 9,
                                      color: trade.session === 'LONDON' ? 'var(--ng-green)' : 'var(--ng-muted)',
                                      padding: '3px 8px',
                                      background: trade.session === 'LONDON' ? 'rgba(0,255,65,0.1)' : 'var(--ng-surface2)',
                                      borderRadius: 4,
                                    }}>
                                      {trade.session}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-orbitron font-bold" style={{ fontSize: 16, color: (trade.pnl || 0) >= 0 ? 'var(--ng-green)' : 'var(--ng-red)' }}>
                                    {(trade.pnl || 0) >= 0 ? '+' : ''}{(trade.pnl || 0).toFixed(2)}
                                  </span>
                                  <button onClick={() => startEditTrade(trade)} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--ng-border)', borderRadius: 6, cursor: 'pointer', color: 'var(--ng-muted)', fontSize: 12, padding: '4px 8px' }}>✎</button>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 mt-2">
                                <span style={{ fontSize: 12, color: '#FFD700' }}>{'★'.repeat(trade.quality)}{'☆'.repeat(5 - trade.quality)}</span>
                                <span className="font-orbitron" style={{
                                  fontSize: 9,
                                  color: trade.rulesFollowed ? 'var(--ng-green)' : 'var(--ng-red)',
                                  padding: '2px 6px',
                                  background: trade.rulesFollowed ? 'rgba(0,255,65,0.1)' : 'rgba(255,71,87,0.1)',
                                  borderRadius: 4,
                                }}>
                                  {trade.rulesFollowed ? '✓ RULES' : '✗ BROKE'}
                                </span>
                                <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-cyan)', textTransform: 'uppercase' }}>{trade.emotionalState}</span>
                                {trade.images && trade.images.length > 0 && (
                                  <span style={{ fontSize: 10, color: 'var(--ng-purple)' }}>📷 {trade.images.length}</span>
                                )}
                              </div>
                              {trade.note && <div className="font-mono mt-2" style={{ fontSize: 10, color: 'var(--ng-dimmer)', lineHeight: 1.5 }}>{trade.note}</div>}
                              {trade.images && trade.images.length > 0 && (
                                <div className="flex gap-2 mt-3">
                                  {trade.images.map((url, i) => (
                                    <button key={i} onClick={() => setLightboxImage(url)} style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}>
                                      <img src={url} alt="" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6, border: '2px solid var(--ng-border)' }} />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>
              );
            })}

            {logViewData.weeks.length === 0 && (
              <div className="text-center py-12">
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📊</div>
                <div className="font-orbitron" style={{ fontSize: 13, color: 'var(--ng-muted)', letterSpacing: '2px', marginBottom: 8 }}>NO TRADES THIS MONTH</div>
                <div className="font-mono" style={{ fontSize: 11, color: 'var(--ng-dimmer)' }}>Log some trades to see your P&L breakdown</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Chat tab ─────────────────────────────────────────── */}
      {activeTab === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3" style={{ minHeight: 0 }}>
            {messages.map(msg => (
              <div key={msg.id} className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                {msg.role === 'assistant' && (
                  <div style={{ fontSize: 10, color: 'var(--ng-green)', fontWeight: 700, marginBottom: 6, letterSpacing: 0 }}>⚡ GODWILL</div>
                )}
                {msg.role === 'assistant'
                  ? <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.content) }} />
                  : msg.content
                }
              </div>
            ))}
            {loading && (
              <div className="chat-bubble-ai">
                <div className="font-orbitron mb-1" style={{ fontSize: 8, color: 'var(--ng-green)', letterSpacing: '2px' }}>⚡ GODWILL</div>
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
                placeholder="Ask GODWILL anything..."
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

              {/* Row 1: Date & P&L side by side */}
              <div className="flex gap-3 mb-4">
                <div style={{ flex: 1 }}>
                  <div className="font-orbitron mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>DATE</div>
                  <input type="date" className="ng-input" style={{ width: '100%', padding: '10px 12px' }} value={journalDate} onChange={e => setJournalDate(e.target.value)} max={today} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="font-orbitron mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>P&L ($)</div>
                  <input type="number" className="ng-input" style={{ width: '100%', padding: '10px 12px' }} placeholder="e.g. +150 or -50" value={journalPnl} onChange={e => setJournalPnl(e.target.value)} />
                </div>
              </div>

              {/* Row 2: Pair selection as pill buttons */}
              <div className="mb-4">
                <div className="font-orbitron mb-2" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>PAIR</div>
                <div className="flex gap-1 flex-wrap">
                  {COMMON_PAIRS.map(p => {
                    const isSelected = journalPair === p;
                    const isTopPair = ['XAUUSD', 'GBPJPY', 'GBPAUD', 'AUDJPY'].includes(p);
                    const isOther = p === 'OTHER';
                    return (
                      <button
                        key={p}
                        onClick={() => setJournalPair(p)}
                        className="font-orbitron"
                        style={{
                          padding: '6px 12px',
                          fontSize: 9,
                          border: `1px solid ${isSelected ? (isTopPair ? 'var(--ng-green)' : 'var(--ng-cyan)') : 'var(--ng-border)'}`,
                          color: isSelected ? (isTopPair ? 'var(--ng-green)' : isOther ? 'var(--ng-amber)' : 'var(--ng-cyan)') : (isTopPair ? 'var(--ng-green)' : 'var(--ng-muted)'),
                          background: isSelected ? (isTopPair ? 'rgba(0,255,65,0.12)' : isOther ? 'rgba(255,159,10,0.12)' : 'rgba(0,212,255,0.08)') : 'transparent',
                          borderRadius: 20,
                          cursor: 'pointer',
                          fontWeight: isTopPair ? 600 : 400,
                        }}
                      >
                        {isTopPair && !isSelected && '★ '}{p}
                      </button>
                    );
                  })}
                </div>
                <div className="font-mono mt-1" style={{ fontSize: 8, color: 'var(--ng-dimmer)' }}>★ = 100% win rate pairs</div>
              </div>

              {/* Row 3: Direction & Session */}
              <div className="flex gap-3 mb-4">
                <div style={{ flex: 1 }}>
                  <div className="font-orbitron mb-2" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>DIRECTION</div>
                  <div className="flex gap-2">
                    {TRADE_DIRECTIONS.map(d => (
                      <button key={d} onClick={() => setJournalDirection(d)} className="font-orbitron flex-1"
                        style={{
                          padding: '10px',
                          fontSize: 11,
                          fontWeight: 700,
                          border: `2px solid ${journalDirection === d ? (d === 'BUY' ? 'var(--ng-green)' : 'var(--ng-red)') : 'var(--ng-border)'}`,
                          color: journalDirection === d ? (d === 'BUY' ? 'var(--ng-green)' : 'var(--ng-red)') : 'var(--ng-muted)',
                          background: journalDirection === d ? (d === 'BUY' ? 'rgba(0,255,65,0.15)' : 'rgba(255,71,87,0.15)') : 'transparent',
                          borderRadius: 8,
                          cursor: 'pointer',
                        }}>
                        {d === 'BUY' ? '▲ BUY' : '▼ SELL'}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="font-orbitron mb-2" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>SESSION</div>
                  <div className="flex gap-1">
                    {TRADING_SESSIONS.map(s => {
                      const isLondon = s === 'LONDON';
                      const isSelected = journalSession === s;
                      return (
                        <button key={s} onClick={() => setJournalSession(s)} className="font-orbitron flex-1"
                          style={{
                            padding: '10px 4px',
                            fontSize: 8,
                            border: `1px solid ${isSelected ? (isLondon ? 'var(--ng-green)' : 'var(--ng-cyan)') : 'var(--ng-border)'}`,
                            color: isSelected ? (isLondon ? 'var(--ng-green)' : 'var(--ng-cyan)') : (isLondon ? 'var(--ng-green)' : 'var(--ng-muted)'),
                            background: isSelected ? (isLondon ? 'rgba(0,255,65,0.12)' : 'rgba(0,212,255,0.08)') : 'transparent',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontWeight: isLondon ? 600 : 400,
                          }}>
                          {s.replace('-SESSION', '').replace(' SESSION', '')}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Row 4: Rules & Quality */}
              <div className="flex gap-3 mb-4">
                <div style={{ flex: 1 }}>
                  <div className="font-orbitron mb-2" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>RULES FOLLOWED?</div>
                  <div className="flex gap-2">
                    <button onClick={() => setJournalRules(true)} className="font-orbitron flex-1"
                      style={{
                        padding: '10px',
                        fontSize: 10,
                        border: `2px solid ${journalRules === true ? 'var(--ng-green)' : 'var(--ng-border)'}`,
                        color: journalRules === true ? 'var(--ng-green)' : 'var(--ng-muted)',
                        background: journalRules === true ? 'rgba(0,255,65,0.15)' : 'transparent',
                        borderRadius: 8,
                        cursor: 'pointer',
                      }}>
                      ✓ YES
                    </button>
                    <button onClick={() => setJournalRules(false)} className="font-orbitron flex-1"
                      style={{
                        padding: '10px',
                        fontSize: 10,
                        border: `2px solid ${journalRules === false ? 'var(--ng-red)' : 'var(--ng-border)'}`,
                        color: journalRules === false ? 'var(--ng-red)' : 'var(--ng-muted)',
                        background: journalRules === false ? 'rgba(255,71,87,0.15)' : 'transparent',
                        borderRadius: 8,
                        cursor: 'pointer',
                      }}>
                      ✗ NO
                    </button>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="font-orbitron mb-2" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>TRADE QUALITY</div>
                  <div className="flex gap-1 justify-center" style={{ padding: '6px 0' }}>
                    {([1,2,3,4,5] as const).map(n => (
                      <button key={n} onClick={() => setJournalQuality(n)} style={{ fontSize: 22, background: 'none', border: 'none', cursor: 'pointer', color: n <= journalQuality ? '#FFD700' : 'var(--ng-dimmer)', padding: '2px', lineHeight: 1 }}>★</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 5: Emotional State */}
              <div className="mb-4">
                <div className="font-orbitron mb-2" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>EMOTIONAL STATE</div>
                <div className="flex gap-1 flex-wrap">
                  {EMOTIONAL_STATES.map(s => {
                    const isSelected = journalEmotion === s;
                    const emotionColors: Record<string, string> = {
                      calm: 'var(--ng-green)',
                      confident: 'var(--ng-purple)',
                      neutral: 'var(--ng-cyan)',
                      anxious: 'var(--ng-amber)',
                      fearful: 'var(--ng-red)',
                    };
                    const color = emotionColors[s] || 'var(--ng-cyan)';
                    return (
                      <button key={s} onClick={() => setJournalEmotion(s)} className="font-orbitron"
                        style={{
                          padding: '7px 14px',
                          fontSize: 9,
                          border: `1px solid ${isSelected ? color : 'var(--ng-border)'}`,
                          color: isSelected ? color : 'var(--ng-muted)',
                          background: isSelected ? `${color}15` : 'transparent',
                          borderRadius: 20,
                          cursor: 'pointer',
                          textTransform: 'uppercase',
                        }}>
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 6: Note */}
              <div className="mb-4">
                <div className="font-orbitron mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>
                  NOTE {journalPair === 'OTHER' && <span style={{ color: 'var(--ng-amber)' }}>(specify pair here)</span>}
                  <span style={{ fontWeight: 400, marginLeft: 8 }}>({journalNote.length}/280)</span>
                </div>
                <textarea
                  className="ng-textarea"
                  rows={3}
                  style={{ width: '100%', resize: 'none', padding: '12px' }}
                  placeholder={journalPair === 'OTHER' ? "Specify pair and add notes about the trade..." : "What happened? What did you learn?"}
                  value={journalNote}
                  onChange={e => setJournalNote(e.target.value.slice(0, 280))}
                />
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
                              <button key={i} onClick={() => setLightboxImage(url)} style={{ padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}>
                                <img
                                  src={url}
                                  alt={`Trade screenshot ${i + 1}`}
                                  style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--ng-border)' }}
                                />
                              </button>
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

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20,
            cursor: 'pointer',
          }}
        >
          <button
            onClick={() => setLightboxImage(null)}
            style={{
              position: 'absolute',
              top: 20,
              right: 20,
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: '#fff',
              fontSize: 24,
              width: 44,
              height: 44,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
          <img
            src={lightboxImage}
            alt="Trade screenshot"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              borderRadius: 8,
              cursor: 'default',
            }}
          />
        </div>
      )}

    </div>
  );
}
