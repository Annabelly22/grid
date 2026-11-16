'use client';
import { useState, useRef, useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { UserProfile, TradeSession, TradingSession, TradeDirection, TradeTimeline, WeeklyPlan, WeeklySetup, WeeklyNews, Habit } from '../lib/gameStore';
import { Storage } from '../lib/storage';
import { getTodayStr } from '../lib/time';

interface Props {
  profile: UserProfile;
  habits: Habit[];
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

const QUICK_PROMPTS: Record<'general' | 'trading', { label: string; prompt: string; needsMarket?: boolean }[]> = {
  general: [
    { label: "Today's focus", prompt: "What should I focus on today?" },
    { label: "Luteal phase", prompt: "I'm in my luteal phase — help" },
    { label: "Morning protocol", prompt: "Give me a 5-min morning protocol" },
    { label: "Broke streak", prompt: "I broke my streak. How do I reset mentally?" },
    { label: "Training supps", prompt: "Best supplements for a training day" },
    { label: "Low energy", prompt: "I'm feeling low energy today" },
  ],
  trading: [
    { label: "🔍 Scan All", prompt: "Scan all pairs and tell me which has the cleanest setup right now. Give specific entry, SL, TP.", needsMarket: true },
    { label: "📊 Session?", prompt: "What session are we in? Should I be trading right now based on my stats?", needsMarket: true },
    { label: "XAUUSD", prompt: "Analyze XAUUSD. Bias, entry zone, SL, TP.", needsMarket: true },
    { label: "XAGUSD", prompt: "Analyze XAGUSD. Bias, entry zone, SL, TP.", needsMarket: true },
    { label: "GBPJPY", prompt: "Analyze GBPJPY. Bias, entry zone, SL, TP.", needsMarket: true },
    { label: "GBPAUD", prompt: "Analyze GBPAUD. Bias, entry zone, SL, TP.", needsMarket: true },
    { label: "AUDJPY", prompt: "Analyze AUDJPY. Bias, entry zone, SL, TP.", needsMarket: true },
    { label: "EURUSD", prompt: "Analyze EURUSD. Bias, entry zone, SL, TP.", needsMarket: true },
    { label: "⚠️ Checklist", prompt: "Pre-trade checklist. Mental state? Right session? Do I have edge?", needsMarket: true },
    { label: "🛑 Revenge", prompt: "I'm about to revenge trade. Talk me off the ledge with my stats." },
    { label: "📉 Drawdown", prompt: "I'm in a drawdown. Position sizing, mental reset, when to step away." },
    { label: "✅ Review", prompt: "I just took a trade. What should I journal?" },
  ],
};

const EMOTIONAL_STATES: TradeSession['emotionalState'][] = ['calm', 'confident', 'neutral', 'anxious', 'fearful'];
const TRADING_SESSIONS: TradingSession[] = ['LONDON', 'ASIAN', 'NEWYORK'];
const TRADE_DIRECTIONS: TradeDirection[] = ['BUY', 'SELL'];
// Pairs ordered by win rate from Notion data (top performers first)
const COMMON_PAIRS = ['XAUUSD', 'XAGUSD', 'GBPJPY', 'GBPAUD', 'AUDJPY', 'EURUSD', 'GBPUSD', 'USDJPY', 'OTHER'];

// Trading rules based on Notion journal analysis (75 trades analyzed)
// LONDON: 87.5% WR (+$2,715) | NY: 30.8% WR (-$313) | ASIAN: 42.9% WR (-$193)
const TRADING_RULES = [
  { rule: 'Define your edge — backtest, forward test, prove expectancy', icon: '🎯', critical: true },
  { rule: 'Size small — 1-2% max, survival first', icon: '⚖️', critical: true },
  { rule: 'Execute mechanically — remove decisions from the moment', icon: '🤖', critical: true },
  { rule: 'Journal everything — self-awareness = improvement speed', icon: '📓', critical: true },
  { rule: 'LONDON session ONLY (87.5% WR vs 30% NY)', icon: '🕐', critical: true },
  { rule: 'XAUUSD, GBPJPY, GBPAUD, AUDJPY only (100% WR)', icon: '💰', critical: true },
  { rule: 'Use Daily/4H for structure — no lower TFs', icon: '📊', critical: false },
  { rule: 'No overleveraging — forced early exits kill wins', icon: '⚠️', critical: true },
  { rule: 'Max 3 positions open at once', icon: '🔢', critical: false },
  { rule: 'Check news before every trade', icon: '📰', critical: false },
  { rule: 'Avoid NZDUSD, XPDUSD, DXY (negative P&L)', icon: '🚫', critical: false },
  { rule: 'No trading when uncertain or traveling', icon: '🧘', critical: false },
  { rule: 'Cut losses fast — they affect winning trades', icon: '✂️', critical: false },
];

const TRADE_TIMELINES: { value: TradeTimeline; label: string; color: string }[] = [
  { value: 'SCALP', label: 'SCALP', color: 'var(--ng-red)' },
  { value: 'INTRADAY', label: 'INTRADAY', color: 'var(--ng-amber)' },
  { value: 'SWING', label: 'SWING', color: 'var(--ng-cyan)' },
  { value: 'WEEKLY', label: '1 WEEK', color: 'var(--ng-green)' },
  { value: '2WEEKS', label: '2 WEEKS', color: 'var(--ng-purple)' },
  { value: 'MONTHLY', label: 'MONTHLY', color: 'var(--ng-blue)' },
];

const NEWS_IMPACT_COLORS = {
  HIGH: 'var(--ng-red)',
  MEDIUM: 'var(--ng-amber)',
  LOW: 'var(--ng-muted)',
};

const INITIAL_MSG = (codename: string, xp: number, streak: number): Message => ({
  role: 'assistant',
  content: `GODWILL ONLINE — ${codename}.\n\n${xp} XP · ${streak}d best streak.\n\nWhat do you need?`,
  id: 0,
});

export default function CoachTab({ profile, habits, onFocusMinutes, tradeJournal, onLogTrade, onUpdateTrade, onDeleteTradeSession }: Props) {
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
  const [editImages, setEditImages] = useState<string[]>([]);
  const [editTimeline, setEditTimeline] = useState<TradeTimeline>('INTRADAY');
  const [editDate, setEditDate] = useState('');
  const [editUploading, setEditUploading] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

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
  const logFormRef = useRef<HTMLDivElement>(null);

  // Trade timeline
  const [journalTimeline, setJournalTimeline] = useState<TradeTimeline>('INTRADAY');

  // Weekly planning state
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [showNewsForm, setShowNewsForm] = useState(false);
  const [setupPair, setSetupPair] = useState('XAUUSD');
  const [setupDirection, setSetupDirection] = useState<TradeDirection>('BUY');
  const [setupBias, setSetupBias] = useState('');
  const [setupEntryZone, setSetupEntryZone] = useState('');
  const [setupTP, setSetupTP] = useState('');
  const [setupSL, setSetupSL] = useState('');
  const [setupTimeline, setSetupTimeline] = useState<TradeTimeline>('SWING');
  const [setupStatus, setSetupStatus] = useState<'WATCHING' | 'PENDING'>('WATCHING');
  const [newsDate, setNewsDate] = useState('');
  const [newsTime, setNewsTime] = useState('');
  const [newsEvent, setNewsEvent] = useState('');
  const [newsImpact, setNewsImpact] = useState<'HIGH' | 'MEDIUM' | 'LOW'>('HIGH');
  const [newsPairs, setNewsPairs] = useState<string[]>([]);
  const [weeklyGoal, setWeeklyGoal] = useState('');
  const [executingSetupId, setExecutingSetupId] = useState<string | null>(null); // Track setup being journaled

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

    // Profit factor (gross profit / gross loss)
    const weekGrossProfit = weekTrades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + (t.pnl || 0), 0);
    const weekGrossLoss = Math.abs(weekTrades.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + (t.pnl || 0), 0));
    const monthGrossProfit = monthTrades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + (t.pnl || 0), 0);
    const monthGrossLoss = Math.abs(monthTrades.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + (t.pnl || 0), 0));
    const weekProfitFactor = weekGrossLoss > 0 ? weekGrossProfit / weekGrossLoss : weekGrossProfit > 0 ? Infinity : 0;
    const monthProfitFactor = monthGrossLoss > 0 ? monthGrossProfit / monthGrossLoss : monthGrossProfit > 0 ? Infinity : 0;

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
      weekProfitFactor,
      monthProfitFactor,
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
    const monthlyGrossProfit = monthTrades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + (t.pnl || 0), 0);
    const monthlyGrossLoss = Math.abs(monthTrades.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + (t.pnl || 0), 0));
    const monthlyProfitFactor = monthlyGrossLoss > 0 ? monthlyGrossProfit / monthlyGrossLoss : monthlyGrossProfit > 0 ? Infinity : 0;
    const monthlyWinRate = monthTrades.length > 0 ? Math.round((monthlyWins / monthTrades.length) * 100) : 0;

    return { weeks, monthlyPnl, monthlyWins, monthlyLosses, totalTrades: monthTrades.length, monthlyProfitFactor, monthlyWinRate };
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
    setEditImages(trade.images || []);
    setEditTimeline(trade.timeline || 'INTRADAY');
    setEditDate(trade.date);
  };

  // Save edited trade
  const saveEditTrade = () => {
    if (!editingTradeId) return;
    onUpdateTrade(editingTradeId, {
      date: editDate,
      pnl: editPnl ? parseFloat(editPnl) : undefined,
      pair: editPair,
      session: editSession,
      direction: editDirection,
      quality: editQuality,
      rulesFollowed: editRules,
      emotionalState: editEmotion,
      note: editNote,
      images: editImages.length > 0 ? editImages : undefined,
      timeline: editTimeline,
    });
    setEditingTradeId(null);
  };

  // Cancel editing
  const cancelEditTrade = () => {
    setEditingTradeId(null);
  };

  // Handle edit image upload
  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setEditUploading(true);
    const userId = profile?.codename || 'anonymous';

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
          setEditImages(prev => [...prev, data.url]);
        } else {
          console.error('Upload failed:', data.error);
        }
      } catch (err) {
        console.error('Upload error:', err);
      }
    }

    setEditUploading(false);
    if (editFileInputRef.current) {
      editFileInputRef.current.value = '';
    }
  };

  // Remove edit image
  const handleRemoveEditImage = async (url: string) => {
    try {
      await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
    } catch (err) {
      console.error('Delete error:', err);
    }
    setEditImages(prev => prev.filter(u => u !== url));
  };

  // Load persisted chat on mount
  useEffect(() => {
    const stored = Storage.getGodwillChat();
    if (stored.length > 0) {
      setMessages(stored.map((m, i) => ({ ...m, id: i })));
    }
  }, []);

  // Load weekly plan on mount
  useEffect(() => {
    const plan = Storage.getWeeklyPlan();
    if (plan) {
      setWeeklyPlan(plan);
      setWeeklyGoal(plan.goal?.toString() || '');
    }
  }, []);

  // Get current week start (Monday)
  const getWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().slice(0, 10);
  };

  // Save weekly plan
  const saveWeeklyPlan = (plan: WeeklyPlan) => {
    setWeeklyPlan(plan);
    Storage.setWeeklyPlan(plan);
  };

  // Add a setup
  const handleAddSetup = () => {
    if (!setupBias.trim()) return;
    const newSetup: WeeklySetup = {
      id: `setup_${Date.now()}`,
      pair: setupPair,
      direction: setupDirection,
      bias: setupBias.trim(),
      entryZone: setupEntryZone.trim() || undefined,
      tp: setupTP.trim() || undefined,
      sl: setupSL.trim() || undefined,
      timeline: setupTimeline,
      status: setupStatus,
      createdAt: new Date().toISOString(),
    };
    const currentPlan = weeklyPlan || { weekStart: getWeekStart(), goal: parseFloat(weeklyGoal) || 0, setups: [], news: [] };
    const updatedPlan = { ...currentPlan, setups: [...currentPlan.setups, newSetup] };
    saveWeeklyPlan(updatedPlan);
    // Reset form
    setSetupBias('');
    setSetupEntryZone('');
    setSetupTP('');
    setSetupSL('');
    setSetupStatus('WATCHING');
    setShowSetupForm(false);
  };

  // Update setup status
  const handleUpdateSetupStatus = (setupId: string, status: WeeklySetup['status']) => {
    if (!weeklyPlan) return;

    // When marking EXECUTED, pre-fill journal form with setup data
    if (status === 'EXECUTED') {
      const setup = weeklyPlan.setups.find(s => s.id === setupId);
      if (setup) {
        // Pre-fill journal form with setup data
        setJournalDate(getTodayStr());
        setJournalPair(setup.pair);
        setJournalDirection(setup.direction);
        setJournalTimeline(setup.timeline);
        setJournalSession('LONDON'); // Default to LONDON (best session)
        setJournalQuality(3);
        setJournalRules(true); // Assume rules followed since it was a planned setup
        setJournalEmotion('calm');
        // Pre-fill note with setup context
        const noteLines = [`Setup: ${setup.bias}`];
        if (setup.entryZone) noteLines.push(`Entry: ${setup.entryZone}`);
        if (setup.tp) noteLines.push(`TP: ${setup.tp}`);
        if (setup.sl) noteLines.push(`SL: ${setup.sl}`);
        setJournalNote(noteLines.join('\n'));
        setJournalPnl(''); // User needs to fill this
        setJournalImages([]);
        setExecutingSetupId(setupId);
        setShowLogForm(true);
        setActiveTab('journal');
        // Scroll to the form after state updates
        setTimeout(() => {
          logFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        return; // Don't update status yet - wait for journal submission
      }
    }

    const updatedSetups = weeklyPlan.setups.map(s => s.id === setupId ? { ...s, status } : s);
    saveWeeklyPlan({ ...weeklyPlan, setups: updatedSetups });
  };

  // Delete setup
  const handleDeleteSetup = (setupId: string) => {
    if (!weeklyPlan) return;
    const updatedSetups = weeklyPlan.setups.filter(s => s.id !== setupId);
    saveWeeklyPlan({ ...weeklyPlan, setups: updatedSetups });
  };

  // Add news event
  const handleAddNews = () => {
    if (!newsEvent.trim() || !newsDate) return;
    const newNews: WeeklyNews = {
      id: `news_${Date.now()}`,
      date: newsDate,
      time: newsTime || '00:00',
      event: newsEvent.trim(),
      impact: newsImpact,
      pairs: newsPairs.length > 0 ? newsPairs : ['USD'],
    };
    const currentPlan = weeklyPlan || { weekStart: getWeekStart(), goal: parseFloat(weeklyGoal) || 0, setups: [], news: [] };
    const updatedPlan = { ...currentPlan, news: [...currentPlan.news, newNews].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)) };
    saveWeeklyPlan(updatedPlan);
    // Reset form
    setNewsDate('');
    setNewsTime('');
    setNewsEvent('');
    setNewsPairs([]);
    setShowNewsForm(false);
  };

  // Delete news event
  const handleDeleteNews = (newsId: string) => {
    if (!weeklyPlan) return;
    const updatedNews = weeklyPlan.news.filter(n => n.id !== newsId);
    saveWeeklyPlan({ ...weeklyPlan, news: updatedNews });
  };

  // Update weekly goal
  const handleUpdateGoal = () => {
    const goal = parseFloat(weeklyGoal) || 0;
    const currentPlan = weeklyPlan || { weekStart: getWeekStart(), goal: 0, setups: [], news: [] };
    saveWeeklyPlan({ ...currentPlan, goal });
  };

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

  async function sendMessage(text?: string, needsMarket?: boolean) {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    addMessage('user', msg);
    setLoading(true);

    try {
      // Fetch market data if this is a trading query that needs it
      let marketData = null;
      const isTrading = needsMarket || promptCategory === 'trading';

      if (isTrading) {
        try {
          const marketRes = await fetch('/api/market');
          const marketJson = await marketRes.json();
          if (marketJson.prices && marketJson.prices.length > 0) {
            marketData = marketJson.prices;
          }
        } catch {
          console.warn('Market data unavailable');
        }
      }

      // Build comprehensive user data context
      const today = getTodayStr();
      const bodyStats = Storage.getBodyStats?.() || {};
      const fastStart = Storage.getFastStart?.();
      const fastHistory = Storage.getFastHistory?.() || [];
      const sleepLog = Storage.getSleepLog?.() || [];
      const weightJourney = (() => {
        try {
          const raw = localStorage.getItem('grid_weight_journey');
          return raw ? JSON.parse(raw) : null;
        } catch { return null; }
      })();

      // Habits summary
      const habitsToday = habits.filter(h => h.completedToday).length;
      const totalHabits = habits.length;
      const topStreaks = habits.filter(h => h.streak > 0).sort((a, b) => b.streak - a.streak).slice(0, 5);

      // Trading stats (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentTrades = tradeJournal.filter(t => new Date(t.date) >= thirtyDaysAgo);
      const tradingStats = {
        total: recentTrades.length,
        wins: recentTrades.filter(t => (t.pnl || 0) > 0).length,
        losses: recentTrades.filter(t => (t.pnl || 0) < 0).length,
        totalPnl: recentTrades.reduce((sum, t) => sum + (t.pnl || 0), 0),
        winRate: recentTrades.length > 0 ? Math.round((recentTrades.filter(t => (t.pnl || 0) > 0).length / recentTrades.length) * 100) : 0,
        rulesFollowed: recentTrades.filter(t => t.rulesFollowed).length,
        lastTrade: recentTrades.length > 0 ? recentTrades[recentTrades.length - 1] : null,
      };

      // Fasting status
      const fastingStatus = fastStart ? {
        active: true,
        startedAt: new Date(fastStart).toISOString(),
        hoursIn: Math.floor((Date.now() - fastStart) / (1000 * 60 * 60)),
      } : { active: false };

      const userData = {
        habits: {
          completedToday: habitsToday,
          total: totalHabits,
          percentage: totalHabits > 0 ? Math.round((habitsToday / totalHabits) * 100) : 0,
          topStreaks: topStreaks.map(h => ({ name: h.name, streak: h.streak, category: h.category })),
          notDoneToday: habits.filter(h => !h.completedToday).slice(0, 5).map(h => h.name),
        },
        body: {
          currentWeight: bodyStats.weight,
          goalWeight: bodyStats.goalWeight,
          startWeight: weightJourney?.startWeight,
          lbsLost: weightJourney?.startWeight ? weightJourney.startWeight - bodyStats.weight : 0,
          journeyStartDate: weightJourney?.startDate,
        },
        fasting: fastingStatus,
        sleep: sleepLog.length > 0 ? sleepLog[sleepLog.length - 1] : null,
        trading: tradingStats,
      };

      const res = await fetch('/api/cipher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          profile,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
          marketData,
          isTrading,
          userData,
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
      timeline: journalTimeline,
    });

    // If this was from an executed setup, mark the setup as EXECUTED
    if (executingSetupId && weeklyPlan) {
      const updatedSetups = weeklyPlan.setups.map(s =>
        s.id === executingSetupId ? { ...s, status: 'EXECUTED' as const } : s
      );
      saveWeeklyPlan({ ...weeklyPlan, setups: updatedSetups });
      setExecutingSetupId(null);
    }

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
    setJournalTimeline('INTRADAY');
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
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-orbitron font-bold" style={{ color: 'var(--ng-amber)', fontSize: 16, letterSpacing: '3px' }}>GODWILL</h2>
            <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-green)', border: '1px solid var(--ng-green)', padding: '2px 7px', letterSpacing: '1px' }}>ONLINE</span>
          </div>
          <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* Sub-tab toggle: JOURNAL -> LOG -> CHAT */}
        <div className="flex gap-1">
          {(['journal', 'log', 'chat'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className="font-orbitron flex-1"
              style={{ padding: '8px 14px', fontSize: 9, letterSpacing: '1px', border: `1px solid ${activeTab === t ? 'var(--ng-amber)' : 'var(--ng-border)'}`, color: activeTab === t ? 'var(--ng-amber)' : 'var(--ng-muted)', background: activeTab === t ? 'rgba(255,159,10,0.08)' : 'transparent', borderRadius: 8, cursor: 'pointer' }}>
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
                  {logViewData.monthlyWinRate}%
                </div>
                <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px' }}>WIN RATE</div>
              </div>
              <div style={{ width: 1, background: 'var(--ng-border)' }} />
              <div className="text-center">
                <div className="font-orbitron font-bold" style={{ fontSize: 20, color: logViewData.monthlyProfitFactor >= 1.5 ? 'var(--ng-green)' : logViewData.monthlyProfitFactor >= 1 ? 'var(--ng-amber)' : 'var(--ng-red)' }}>
                  {logViewData.monthlyProfitFactor === Infinity ? '∞' : logViewData.monthlyProfitFactor.toFixed(2)}
                </div>
                <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px' }}>PF</div>
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
                            /* Edit form - full featured */
                            <div className="p-3">
                              {/* Header */}
                              <div className="font-orbitron mb-3" style={{ fontSize: 11, color: 'var(--ng-cyan)', letterSpacing: '1px' }}>EDIT TRADE</div>

                              {/* Row 1: Date + P&L */}
                              <div className="flex gap-2 mb-2">
                                <input type="date" className="ng-input" value={editDate} onChange={e => setEditDate(e.target.value)} style={{ padding: '8px 12px', flex: '0 0 130px' }} />
                                <input type="number" className="ng-input flex-1" placeholder="P&L ($)" value={editPnl} onChange={e => setEditPnl(e.target.value)} style={{ padding: '8px 12px' }} />
                              </div>

                              {/* Row 2: Pair + Direction */}
                              <div className="flex gap-2 mb-2">
                                <select className="ng-input flex-1" value={editPair} onChange={e => setEditPair(e.target.value)} style={{ padding: '8px 12px' }}>
                                  {COMMON_PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                                <div className="flex gap-1">
                                  {TRADE_DIRECTIONS.map(d => (
                                    <button type="button" key={d} onClick={() => setEditDirection(d)} className="font-orbitron"
                                      style={{
                                        padding: '8px 16px', fontSize: 10, borderRadius: 8, cursor: 'pointer',
                                        border: `1.5px solid ${editDirection === d ? (d === 'BUY' ? 'var(--ng-green)' : 'var(--ng-red)') : 'var(--ng-border)'}`,
                                        color: editDirection === d ? (d === 'BUY' ? 'var(--ng-green)' : 'var(--ng-red)') : 'var(--ng-muted)',
                                        background: editDirection === d ? (d === 'BUY' ? 'rgba(0,255,65,0.1)' : 'rgba(255,71,87,0.1)') : 'transparent',
                                      }}>
                                      {d === 'BUY' ? '▲' : '▼'} {d}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Row 3: Session + Timeline */}
                              <div className="flex gap-2 mb-2">
                                <select className="ng-input flex-1" value={editSession} onChange={e => setEditSession(e.target.value as TradingSession)} style={{ padding: '8px 12px' }}>
                                  {TRADING_SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <select className="ng-input flex-1" value={editTimeline} onChange={e => setEditTimeline(e.target.value as TradeTimeline)} style={{ padding: '8px 12px' }}>
                                  {TRADE_TIMELINES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                              </div>

                              {/* Row 4: Rules + Quality */}
                              <div className="flex gap-2 mb-2 items-center">
                                <button type="button" onClick={() => setEditRules(!editRules)} className="font-orbitron flex-1"
                                  style={{ padding: '8px', fontSize: 10, border: `1.5px solid ${editRules ? 'var(--ng-green)' : 'var(--ng-red)'}`, color: editRules ? 'var(--ng-green)' : 'var(--ng-red)', background: editRules ? 'rgba(0,255,65,0.1)' : 'rgba(255,71,87,0.1)', borderRadius: 8, cursor: 'pointer' }}>
                                  {editRules ? '✓ RULES' : '✗ BROKE'}
                                </button>
                                <div className="flex gap-1 items-center flex-1 justify-center">
                                  {([1,2,3,4,5] as const).map(n => (
                                    <button type="button" key={n} onClick={() => setEditQuality(n)} style={{ fontSize: 20, background: 'none', border: 'none', cursor: 'pointer', color: n <= editQuality ? '#FFD700' : 'var(--ng-dimmer)', padding: '2px' }}>★</button>
                                  ))}
                                </div>
                              </div>

                              {/* Row 5: Emotion */}
                              <div className="flex gap-1 mb-2 flex-wrap">
                                {(['calm', 'confident', 'neutral', 'anxious', 'fearful'] as const).map(e => (
                                  <button type="button" key={e} onClick={() => setEditEmotion(e)}
                                    style={{
                                      padding: '6px 10px', fontSize: 9, borderRadius: 6, cursor: 'pointer', textTransform: 'uppercase',
                                      border: `1px solid ${editEmotion === e ? 'var(--ng-cyan)' : 'var(--ng-border)'}`,
                                      color: editEmotion === e ? 'var(--ng-cyan)' : 'var(--ng-muted)',
                                      background: editEmotion === e ? 'rgba(100,210,255,0.1)' : 'transparent',
                                    }}>
                                    {e}
                                  </button>
                                ))}
                              </div>

                              {/* Row 6: Notes */}
                              <textarea className="ng-textarea mb-2" rows={2} style={{ width: '100%', resize: 'none', padding: '10px' }} placeholder="Trade notes..." value={editNote} onChange={e => setEditNote(e.target.value)} maxLength={280} />

                              {/* Row 7: Images */}
                              <div className="mb-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <input ref={editFileInputRef} type="file" accept="image/*" multiple onChange={handleEditImageUpload} style={{ display: 'none' }} />
                                  <button type="button" onClick={() => editFileInputRef.current?.click()} disabled={editUploading}
                                    style={{
                                      padding: '8px 16px', fontSize: 10, borderRadius: 8, cursor: 'pointer',
                                      border: '1px solid var(--ng-purple)', color: 'var(--ng-purple)',
                                      background: 'rgba(191,90,242,0.1)',
                                      opacity: editUploading ? 0.5 : 1,
                                    }}>
                                    {editUploading ? 'UPLOADING...' : '📷 ADD SCREENSHOT'}
                                  </button>
                                  {editImages.length > 0 && (
                                    <span className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>{editImages.length} attached</span>
                                  )}
                                </div>
                                {editImages.length > 0 && (
                                  <div className="flex gap-2 flex-wrap">
                                    {editImages.map((url, i) => (
                                      <div key={i} style={{ position: 'relative' }}>
                                        <img src={url} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--ng-border)' }} />
                                        <button type="button" onClick={() => handleRemoveEditImage(url)}
                                          style={{
                                            position: 'absolute', top: -6, right: -6, width: 18, height: 18,
                                            borderRadius: '50%', border: 'none', background: 'var(--ng-red)',
                                            color: '#fff', fontSize: 10, cursor: 'pointer', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                          }}>×</button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex gap-2">
                                <button type="button" onClick={saveEditTrade} style={{ flex: 1, padding: '12px', fontSize: 11, background: 'var(--ng-green)', border: 'none', borderRadius: 8, color: '#000', fontWeight: 600, cursor: 'pointer' }}>SAVE CHANGES</button>
                                <button type="button" onClick={cancelEditTrade} style={{ flex: 1, padding: '12px', fontSize: 11, border: '1px solid var(--ng-border)', background: 'transparent', color: 'var(--ng-muted)', borderRadius: 8, cursor: 'pointer' }}>CANCEL</button>
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
                                  {trade.timeline && (
                                    <span className="font-mono" style={{
                                      fontSize: 8,
                                      color: TRADE_TIMELINES.find(t => t.value === trade.timeline)?.color || 'var(--ng-muted)',
                                      padding: '3px 8px',
                                      background: 'var(--ng-surface2)',
                                      borderRadius: 4,
                                    }}>
                                      {trade.timeline}
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
          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3" style={{ minHeight: 0 }}>
            {messages.map(msg => (
              <div key={msg.id} className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}>
                {msg.role === 'assistant'
                  ? <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.content) }} />
                  : msg.content
                }
              </div>
            ))}
            {loading && (
              <div className="chat-bubble-ai">
                <div className="loader-dots flex gap-2"><span /><span /><span /></div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input area with prompts */}
          <div className="px-4 pb-3 flex-shrink-0" style={{ borderTop: '1px solid var(--ng-border)' }}>
            {/* Category toggle */}
            <div className="flex gap-2 py-2">
              {(['general', 'trading'] as const).map(cat => (
                <button key={cat} onClick={() => setPromptCategory(cat)} className="font-orbitron"
                  style={{
                    padding: '6px 14px',
                    fontSize: 9,
                    letterSpacing: '1px',
                    border: `1px solid ${promptCategory === cat ? 'var(--ng-amber)' : 'var(--ng-border)'}`,
                    color: promptCategory === cat ? 'var(--ng-amber)' : 'var(--ng-muted)',
                    background: promptCategory === cat ? 'rgba(255,159,10,0.08)' : 'transparent',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}>
                  {cat === 'general' ? 'LIFE' : 'TRADING'}
                </button>
              ))}
            </div>

            {/* Quick prompts - horizontal scroll */}
            <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {QUICK_PROMPTS[promptCategory].map(p => (
                <button key={p.label} onClick={() => sendMessage(p.prompt, p.needsMarket)} className="font-mono flex-shrink-0"
                  style={{
                    fontSize: 11,
                    padding: '8px 12px',
                    border: `1px solid ${p.needsMarket ? 'rgba(48,209,88,0.4)' : 'var(--ng-border)'}`,
                    color: p.needsMarket ? 'var(--ng-green)' : 'var(--ng-muted)',
                    background: p.needsMarket ? 'rgba(48,209,88,0.06)' : 'var(--ng-surface)',
                    cursor: 'pointer',
                    borderRadius: 8,
                    whiteSpace: 'nowrap'
                  }}>
                  {p.label}
                </button>
              ))}
            </div>

            {/* Text input */}
            <div className="flex gap-2 pt-1">
              <textarea
                className="ng-textarea"
                rows={1}
                placeholder="Ask anything..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                style={{ fontSize: 15, minHeight: 44, resize: 'none' }}
              />
              <button onClick={() => sendMessage()} disabled={loading || !input.trim()}
                style={{ width: 44, height: 44, background: input.trim() ? 'var(--ng-green)' : 'var(--ng-surface2)', border: 'none', color: input.trim() ? '#000' : 'var(--ng-muted)', cursor: input.trim() ? 'pointer' : 'default', borderRadius: 10, fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                ↑
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Journal tab — Weekly Planning Hub ──────────────────── */}
      {activeTab === 'journal' && (
        <div className="flex-1 overflow-y-auto px-4 py-4">

          {/* Weekly Goal Banner - Hero Section */}
          <div className="card mb-4" style={{
            background: weeklyPlan?.goal && stats.weekPnl >= weeklyPlan.goal
              ? 'linear-gradient(135deg, rgba(0,255,65,0.2) 0%, rgba(0,212,255,0.15) 100%)'
              : 'linear-gradient(135deg, rgba(0,212,255,0.12) 0%, rgba(191,0,255,0.08) 100%)',
            borderColor: weeklyPlan?.goal && stats.weekPnl >= weeklyPlan.goal ? 'var(--ng-green)' : 'rgba(0,212,255,0.4)',
            padding: '20px 16px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Goal hit celebration effect */}
            {weeklyPlan?.goal && stats.weekPnl >= weeklyPlan.goal && (
              <div style={{ position: 'absolute', top: 8, right: 12, fontSize: 28, animation: 'pulse 2s infinite' }}>🎯</div>
            )}

            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-orbitron" style={{ fontSize: 10, color: 'var(--ng-cyan)', letterSpacing: '2px', marginBottom: 2 }}>THIS WEEK'S TARGET</div>
                <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-dimmer)' }}>
                  {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </div>
              {weeklyPlan?.goal && stats.weekPnl >= weeklyPlan.goal && (
                <div className="font-orbitron" style={{
                  fontSize: 11,
                  color: '#000',
                  padding: '6px 14px',
                  background: 'linear-gradient(90deg, var(--ng-green), var(--ng-cyan))',
                  borderRadius: 20,
                  fontWeight: 900,
                  letterSpacing: '1px',
                  boxShadow: '0 0 20px rgba(0,255,65,0.4)',
                }}>
                  ✓ GOAL CRUSHED
                </div>
              )}
            </div>

            <div className="flex items-end gap-4 mb-4">
              <div style={{ flex: 1 }}>
                <div className="flex items-center gap-2">
                  <span className="font-orbitron" style={{ fontSize: 14, color: 'var(--ng-muted)' }}>$</span>
                  <input
                    type="number"
                    className="ng-input"
                    style={{
                      flex: 1,
                      padding: '12px 14px',
                      fontSize: 24,
                      fontWeight: 900,
                      background: 'rgba(0,0,0,0.4)',
                      border: '2px solid rgba(0,212,255,0.3)',
                      letterSpacing: '1px',
                    }}
                    placeholder="0"
                    value={weeklyGoal}
                    onChange={e => setWeeklyGoal(e.target.value)}
                    onBlur={handleUpdateGoal}
                  />
                </div>
                <div className="font-mono mt-1" style={{ fontSize: 9, color: 'var(--ng-dimmer)', paddingLeft: 24 }}>weekly target</div>
              </div>
              <div className="text-center" style={{ minWidth: 100 }}>
                <div className="font-orbitron font-bold" style={{
                  fontSize: 32,
                  color: stats.weekPnl >= 0 ? 'var(--ng-green)' : 'var(--ng-red)',
                  textShadow: stats.weekPnl >= 0 ? '0 0 20px rgba(0,255,65,0.3)' : '0 0 20px rgba(255,71,87,0.3)',
                  lineHeight: 1,
                }}>
                  {stats.weekPnl >= 0 ? '+' : ''}{stats.weekPnl.toFixed(0)}
                </div>
                <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', marginTop: 4 }}>current P&L</div>
              </div>
            </div>

            {/* Progress bar */}
            {weeklyPlan?.goal && weeklyPlan.goal > 0 && (
              <div>
                <div style={{ height: 8, background: 'rgba(0,0,0,0.3)', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(100, Math.max(0, (stats.weekPnl / weeklyPlan.goal) * 100))}%`,
                    background: stats.weekPnl >= weeklyPlan.goal
                      ? 'linear-gradient(90deg, var(--ng-green), var(--ng-cyan))'
                      : stats.weekPnl >= 0
                        ? 'linear-gradient(90deg, var(--ng-cyan), var(--ng-purple))'
                        : 'var(--ng-red)',
                    borderRadius: 4,
                    transition: 'width 0.5s ease',
                    boxShadow: stats.weekPnl >= weeklyPlan.goal ? '0 0 10px rgba(0,255,65,0.5)' : 'none',
                  }} />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>
                    {stats.weekPnl < 0 ? 'In the red' : `${Math.round((stats.weekPnl / weeklyPlan.goal) * 100)}% there`}
                  </span>
                  <span className="font-mono" style={{ fontSize: 10, color: stats.weekPnl >= weeklyPlan.goal ? 'var(--ng-green)' : 'var(--ng-cyan)' }}>
                    {stats.weekPnl >= weeklyPlan.goal ? 'Exceeded!' : `$${(weeklyPlan.goal - stats.weekPnl).toFixed(0)} to go`}
                  </span>
                </div>
              </div>
            )}

            {!weeklyPlan?.goal && (
              <div className="font-mono text-center" style={{ fontSize: 11, color: 'var(--ng-amber)', padding: '8px', background: 'rgba(255,159,10,0.1)', borderRadius: 6 }}>
                ⚠️ Set a weekly goal to track your progress
              </div>
            )}
          </div>

          {/* Quick Action: Log Trade Button - Always Visible */}
          {!showLogForm && (
            <button
              onClick={() => setShowLogForm(true)}
              className="w-full mb-4"
              style={{
                padding: '16px',
                background: 'linear-gradient(135deg, var(--ng-green) 0%, #00B847 100%)',
                border: 'none',
                borderRadius: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                boxShadow: '0 4px 20px rgba(0,255,65,0.3)',
              }}
            >
              <span style={{ fontSize: 20 }}>+</span>
              <span className="font-orbitron" style={{ fontSize: 13, color: '#000', fontWeight: 900, letterSpacing: '2px' }}>LOG NEW TRADE</span>
            </button>
          )}

          {/* Quick Stats Row - 2x2 Grid for better readability */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="card" style={{ padding: '14px 12px', background: 'linear-gradient(135deg, var(--ng-surface) 0%, rgba(0,212,255,0.05) 100%)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px', marginBottom: 4 }}>TRADES</div>
                  <div className="font-orbitron font-bold" style={{ fontSize: 28, color: 'var(--ng-text)', lineHeight: 1 }}>{stats.weekTrades}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-green)' }}>{stats.weekWins}W</div>
                  <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-red)' }}>{stats.weekLosses}L</div>
                </div>
              </div>
            </div>
            <div className="card" style={{ padding: '14px 12px', background: 'linear-gradient(135deg, var(--ng-surface) 0%, rgba(0,212,255,0.08) 100%)' }}>
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px', marginBottom: 4 }}>WIN RATE</div>
              <div className="flex items-end gap-2">
                <div className="font-orbitron font-bold" style={{ fontSize: 28, color: stats.weekWinRate >= 60 ? 'var(--ng-green)' : stats.weekWinRate >= 50 ? 'var(--ng-cyan)' : 'var(--ng-red)', lineHeight: 1 }}>{stats.weekWinRate}%</div>
                {stats.weekWinRate >= 60 && <span style={{ fontSize: 14, marginBottom: 2 }}>🔥</span>}
              </div>
            </div>
            <div className="card" style={{ padding: '14px 12px', background: `linear-gradient(135deg, var(--ng-surface) 0%, ${stats.weekProfitFactor >= 1.5 ? 'rgba(0,255,65,0.08)' : stats.weekProfitFactor >= 1 ? 'rgba(255,159,10,0.08)' : 'rgba(255,71,87,0.08)'} 100%)` }}>
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px', marginBottom: 4 }}>PROFIT FACTOR</div>
              <div className="flex items-end gap-2">
                <div className="font-orbitron font-bold" style={{ fontSize: 28, color: stats.weekProfitFactor >= 1.5 ? 'var(--ng-green)' : stats.weekProfitFactor >= 1 ? 'var(--ng-amber)' : 'var(--ng-red)', lineHeight: 1 }}>
                  {stats.weekProfitFactor === Infinity ? '∞' : stats.weekProfitFactor.toFixed(2)}
                </div>
                <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-dimmer)', marginBottom: 4 }}>
                  {stats.weekProfitFactor >= 2 ? 'Excellent' : stats.weekProfitFactor >= 1.5 ? 'Good' : stats.weekProfitFactor >= 1 ? 'Break even' : 'Losing edge'}
                </span>
              </div>
            </div>
            <div className="card" style={{ padding: '14px 12px', background: `linear-gradient(135deg, var(--ng-surface) 0%, ${stats.rulesComplianceWeek >= 80 ? 'rgba(0,255,65,0.08)' : 'rgba(255,71,87,0.08)'} 100%)` }}>
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px', marginBottom: 4 }}>RULES FOLLOWED</div>
              <div className="flex items-end gap-2">
                <div className="font-orbitron font-bold" style={{ fontSize: 28, color: stats.rulesComplianceWeek >= 80 ? 'var(--ng-green)' : 'var(--ng-red)', lineHeight: 1 }}>{stats.rulesComplianceWeek}%</div>
                {stats.rulesComplianceWeek >= 90 && <span style={{ fontSize: 14, marginBottom: 2 }}>⭐</span>}
                {stats.rulesComplianceWeek < 80 && <span style={{ fontSize: 14, marginBottom: 2 }}>⚠️</span>}
              </div>
            </div>
          </div>

          {/* Trading Rules - With Daily Focus */}
          <div className="card mb-4" style={{ borderColor: 'rgba(255,184,0,0.3)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="font-orbitron" style={{ fontSize: 10, color: 'var(--ng-amber)', letterSpacing: '2px' }}>TRADING RULES</div>
              <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-dimmer)' }}>{TRADING_RULES.length} rules</div>
            </div>

            {/* Daily Focus Rule - Rotates based on day */}
            {(() => {
              const todayRuleIndex = new Date().getDate() % TRADING_RULES.length;
              const todayRule = TRADING_RULES[todayRuleIndex];
              return (
                <div style={{
                  padding: '12px 14px',
                  background: 'linear-gradient(135deg, rgba(255,184,0,0.15) 0%, rgba(255,159,10,0.08) 100%)',
                  border: '1px solid rgba(255,184,0,0.4)',
                  borderRadius: 8,
                  marginBottom: 12,
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ fontSize: 10 }}>🎯</span>
                    <span className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-amber)', letterSpacing: '1px' }}>TODAY'S FOCUS</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 20 }}>{todayRule.icon}</span>
                    <span className="font-mono" style={{ fontSize: 11, color: 'var(--ng-text)', lineHeight: 1.4, fontWeight: 500 }}>{todayRule.rule}</span>
                  </div>
                </div>
              );
            })()}

            {/* Scrollable rules list */}
            <div style={{ maxHeight: 110, overflowY: 'auto' }} className="custom-scrollbar">
              <div className="flex flex-col gap-1">
                {TRADING_RULES.map((item, i) => {
                  const isTodayRule = new Date().getDate() % TRADING_RULES.length === i;
                  return (
                    <div key={i} className="flex items-center gap-2" style={{
                      padding: '8px 10px',
                      background: isTodayRule ? 'rgba(255,184,0,0.12)' : item.critical ? 'rgba(255,184,0,0.05)' : 'transparent',
                      borderRadius: 6,
                      borderLeft: isTodayRule ? '3px solid var(--ng-amber)' : item.critical ? '3px solid rgba(255,184,0,0.3)' : '3px solid transparent',
                      opacity: isTodayRule ? 1 : 0.8,
                    }}>
                      <span style={{ fontSize: 13, minWidth: 20 }}>{item.icon}</span>
                      <span className="font-mono" style={{
                        fontSize: 10,
                        color: isTodayRule ? 'var(--ng-amber)' : item.critical ? 'var(--ng-text)' : 'var(--ng-muted)',
                        lineHeight: 1.4,
                        fontWeight: isTodayRule ? 600 : 400,
                      }}>{item.rule}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Weekly Setups */}
          <div className="card mb-4" style={{ borderColor: 'rgba(0,255,65,0.3)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="font-orbitron" style={{ fontSize: 10, color: 'var(--ng-green)', letterSpacing: '2px' }}>WEEKLY SETUPS</div>
                {weeklyPlan?.setups && weeklyPlan.setups.length > 0 && (
                  <div className="flex gap-1">
                    {weeklyPlan.setups.filter(s => s.status === 'WATCHING').length > 0 && (
                      <span className="font-mono" style={{ fontSize: 8, padding: '2px 6px', background: 'rgba(191,0,255,0.2)', color: 'var(--ng-purple)', borderRadius: 10 }}>
                        👁 {weeklyPlan.setups.filter(s => s.status === 'WATCHING').length}
                      </span>
                    )}
                    {weeklyPlan.setups.filter(s => s.status === 'PENDING').length > 0 && (
                      <span className="font-mono" style={{ fontSize: 8, padding: '2px 6px', background: 'var(--ng-surface2)', color: 'var(--ng-muted)', borderRadius: 10 }}>
                        {weeklyPlan.setups.filter(s => s.status === 'PENDING').length} ready
                      </span>
                    )}
                    {weeklyPlan.setups.filter(s => s.status === 'ACTIVE').length > 0 && (
                      <span className="font-mono" style={{ fontSize: 8, padding: '2px 6px', background: 'rgba(0,212,255,0.2)', color: 'var(--ng-cyan)', borderRadius: 10 }}>
                        {weeklyPlan.setups.filter(s => s.status === 'ACTIVE').length} active
                      </span>
                    )}
                    {weeklyPlan.setups.filter(s => s.status === 'EXECUTED').length > 0 && (
                      <span className="font-mono" style={{ fontSize: 8, padding: '2px 6px', background: 'rgba(0,255,65,0.2)', color: 'var(--ng-green)', borderRadius: 10 }}>
                        {weeklyPlan.setups.filter(s => s.status === 'EXECUTED').length} ✓
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowSetupForm(!showSetupForm)}
                className="font-orbitron"
                style={{ fontSize: 9, padding: '6px 12px', background: showSetupForm ? 'rgba(255,71,87,0.15)' : 'rgba(0,255,65,0.15)', border: `1px solid ${showSetupForm ? 'var(--ng-red)' : 'var(--ng-green)'}`, color: showSetupForm ? 'var(--ng-red)' : 'var(--ng-green)', borderRadius: 6, cursor: 'pointer' }}
              >
                {showSetupForm ? '✕ CLOSE' : '+ ADD SETUP'}
              </button>
            </div>

            {showSetupForm && (
              <div style={{ padding: '12px', background: 'rgba(0,255,65,0.05)', borderRadius: 8, marginBottom: 12, border: '1px solid rgba(0,255,65,0.2)' }}>
                <div className="flex gap-2 mb-3">
                  <div style={{ flex: 1 }}>
                    <div className="font-mono mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)' }}>PAIR</div>
                    <select className="ng-input" value={setupPair} onChange={e => setSetupPair(e.target.value)} style={{ width: '100%', padding: '8px' }}>
                      {COMMON_PAIRS.filter(p => p !== 'OTHER').map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="font-mono mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)' }}>DIRECTION</div>
                    <div className="flex gap-1">
                      {TRADE_DIRECTIONS.map(d => (
                        <button key={d} onClick={() => setSetupDirection(d)} className="font-orbitron flex-1"
                          style={{ padding: '8px', fontSize: 9, border: `1px solid ${setupDirection === d ? (d === 'BUY' ? 'var(--ng-green)' : 'var(--ng-red)') : 'var(--ng-border)'}`, color: setupDirection === d ? (d === 'BUY' ? 'var(--ng-green)' : 'var(--ng-red)') : 'var(--ng-muted)', background: setupDirection === d ? (d === 'BUY' ? 'rgba(0,255,65,0.15)' : 'rgba(255,71,87,0.15)') : 'transparent', borderRadius: 6, cursor: 'pointer' }}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="font-mono mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)' }}>BIAS / REASONING</div>
                  <textarea className="ng-textarea" rows={2} placeholder="Why this setup? What's the structure telling you?" value={setupBias} onChange={e => setSetupBias(e.target.value)} style={{ width: '100%', resize: 'none' }} />
                </div>
                <div className="flex gap-2 mb-3">
                  <div style={{ flex: 1 }}>
                    <div className="font-mono mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)' }}>ENTRY ZONE</div>
                    <input className="ng-input" placeholder="e.g. 2650-2655" value={setupEntryZone} onChange={e => setSetupEntryZone(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="font-mono mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)' }}>TP</div>
                    <input className="ng-input" placeholder="e.g. 2680" value={setupTP} onChange={e => setSetupTP(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="font-mono mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)' }}>SL</div>
                    <input className="ng-input" placeholder="e.g. 2640" value={setupSL} onChange={e => setSetupSL(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                  </div>
                </div>
                <div className="flex gap-3 mb-3">
                  <div style={{ flex: 1 }}>
                    <div className="font-mono mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)' }}>TIMELINE</div>
                    <div className="flex gap-1 flex-wrap">
                      {TRADE_TIMELINES.map(t => (
                        <button key={t.value} onClick={() => setSetupTimeline(t.value)} className="font-orbitron"
                          style={{ padding: '6px 10px', fontSize: 8, border: `1px solid ${setupTimeline === t.value ? t.color : 'var(--ng-border)'}`, color: setupTimeline === t.value ? t.color : 'var(--ng-muted)', background: setupTimeline === t.value ? `${t.color}15` : 'transparent', borderRadius: 4, cursor: 'pointer' }}>
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ minWidth: 140 }}>
                    <div className="font-mono mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)' }}>STATUS</div>
                    <div className="flex gap-1">
                      <button onClick={() => setSetupStatus('WATCHING')} className="font-orbitron flex-1"
                        style={{ padding: '6px 8px', fontSize: 8, border: `1px solid ${setupStatus === 'WATCHING' ? 'var(--ng-purple)' : 'var(--ng-border)'}`, color: setupStatus === 'WATCHING' ? 'var(--ng-purple)' : 'var(--ng-muted)', background: setupStatus === 'WATCHING' ? 'rgba(191,0,255,0.15)' : 'transparent', borderRadius: 4, cursor: 'pointer' }}>
                        👁 WATCHING
                      </button>
                      <button onClick={() => setSetupStatus('PENDING')} className="font-orbitron flex-1"
                        style={{ padding: '6px 8px', fontSize: 8, border: `1px solid ${setupStatus === 'PENDING' ? 'var(--ng-cyan)' : 'var(--ng-border)'}`, color: setupStatus === 'PENDING' ? 'var(--ng-cyan)' : 'var(--ng-muted)', background: setupStatus === 'PENDING' ? 'rgba(0,212,255,0.15)' : 'transparent', borderRadius: 4, cursor: 'pointer' }}>
                        ⏳ READY
                      </button>
                    </div>
                  </div>
                </div>
                <button onClick={handleAddSetup} disabled={!setupBias.trim()} className="btn-green-solid w-full" style={{ padding: '10px', opacity: setupBias.trim() ? 1 : 0.5 }}>
                  ADD SETUP
                </button>
              </div>
            )}

            {/* Setup list */}
            {weeklyPlan?.setups && weeklyPlan.setups.length > 0 ? (
              <div className="flex flex-col gap-2">
                {weeklyPlan.setups.map(setup => (
                  <div key={setup.id} style={{
                    padding: '10px 12px',
                    background: setup.status === 'EXECUTED' ? 'rgba(0,255,65,0.08)'
                      : setup.status === 'WATCHING' ? 'rgba(191,0,255,0.05)'
                      : setup.status === 'CANCELLED' ? 'rgba(255,71,87,0.05)'
                      : 'var(--ng-surface)',
                    border: `1px solid ${
                      setup.status === 'EXECUTED' ? 'var(--ng-green)'
                      : setup.status === 'ACTIVE' ? 'var(--ng-cyan)'
                      : setup.status === 'WATCHING' ? 'rgba(191,0,255,0.4)'
                      : 'var(--ng-border)'
                    }`,
                    borderLeft: `3px solid ${setup.status === 'WATCHING' ? 'var(--ng-purple)' : setup.direction === 'BUY' ? 'var(--ng-green)' : 'var(--ng-red)'}`,
                    borderRadius: 8,
                    opacity: setup.status === 'CANCELLED' || setup.status === 'MISSED' ? 0.6 : 1,
                  }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {setup.status === 'WATCHING' && (
                          <span className="font-mono" style={{ fontSize: 8, padding: '2px 6px', background: 'rgba(191,0,255,0.2)', borderRadius: 4, color: 'var(--ng-purple)' }}>👁 WATCHING</span>
                        )}
                        <span className="font-orbitron font-bold" style={{ fontSize: 12, color: 'var(--ng-text)' }}>{setup.pair}</span>
                        <span className="font-orbitron" style={{ fontSize: 9, color: setup.direction === 'BUY' ? 'var(--ng-green)' : 'var(--ng-red)' }}>{setup.direction}</span>
                        <span className="font-mono" style={{ fontSize: 8, padding: '2px 6px', background: 'var(--ng-surface2)', borderRadius: 4, color: TRADE_TIMELINES.find(t => t.value === setup.timeline)?.color || 'var(--ng-muted)' }}>{setup.timeline}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {setup.status === 'WATCHING' && (
                          <>
                            <button onClick={() => handleUpdateSetupStatus(setup.id, 'PENDING')} style={{ padding: '4px 8px', fontSize: 8, background: 'rgba(0,212,255,0.15)', border: '1px solid var(--ng-cyan)', color: 'var(--ng-cyan)', borderRadius: 4, cursor: 'pointer' }}>✓ READY</button>
                            <button onClick={() => handleUpdateSetupStatus(setup.id, 'ACTIVE')} style={{ padding: '4px 8px', fontSize: 8, background: 'rgba(0,255,65,0.15)', border: '1px solid var(--ng-green)', color: 'var(--ng-green)', borderRadius: 4, cursor: 'pointer' }}>▶ ENTER</button>
                            <button onClick={() => handleUpdateSetupStatus(setup.id, 'CANCELLED')} style={{ padding: '4px 8px', fontSize: 8, background: 'rgba(255,71,87,0.15)', border: '1px solid var(--ng-red)', color: 'var(--ng-red)', borderRadius: 4, cursor: 'pointer' }}>✕</button>
                          </>
                        )}
                        {setup.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleUpdateSetupStatus(setup.id, 'ACTIVE')} style={{ padding: '4px 8px', fontSize: 8, background: 'rgba(0,255,65,0.15)', border: '1px solid var(--ng-green)', color: 'var(--ng-green)', borderRadius: 4, cursor: 'pointer' }}>▶ ENTER</button>
                            <button onClick={() => handleUpdateSetupStatus(setup.id, 'WATCHING')} style={{ padding: '4px 8px', fontSize: 8, background: 'rgba(191,0,255,0.15)', border: '1px solid var(--ng-purple)', color: 'var(--ng-purple)', borderRadius: 4, cursor: 'pointer' }}>👁</button>
                            <button onClick={() => handleUpdateSetupStatus(setup.id, 'MISSED')} style={{ padding: '4px 8px', fontSize: 8, background: 'rgba(255,159,10,0.15)', border: '1px solid var(--ng-amber)', color: 'var(--ng-amber)', borderRadius: 4, cursor: 'pointer' }}>MISSED</button>
                            <button onClick={() => handleUpdateSetupStatus(setup.id, 'CANCELLED')} style={{ padding: '4px 8px', fontSize: 8, background: 'rgba(255,71,87,0.15)', border: '1px solid var(--ng-red)', color: 'var(--ng-red)', borderRadius: 4, cursor: 'pointer' }}>✕</button>
                          </>
                        )}
                        {setup.status === 'ACTIVE' && (
                          <button onClick={() => handleUpdateSetupStatus(setup.id, 'MISSED')} style={{ padding: '4px 8px', fontSize: 8, background: 'rgba(255,159,10,0.15)', border: '1px solid var(--ng-amber)', color: 'var(--ng-amber)', borderRadius: 4, cursor: 'pointer' }}>MISSED</button>
                        )}
                        {setup.status === 'EXECUTED' && (
                          <button onClick={() => handleUpdateSetupStatus(setup.id, 'EXECUTED')} style={{ padding: '4px 8px', fontSize: 8, background: 'rgba(0,212,255,0.15)', border: '1px solid var(--ng-cyan)', color: 'var(--ng-cyan)', borderRadius: 4, cursor: 'pointer' }}>+ JOURNAL</button>
                        )}
                        {(setup.status === 'EXECUTED' || setup.status === 'CANCELLED' || setup.status === 'MISSED') && (
                          <button onClick={() => handleDeleteSetup(setup.id)} style={{ padding: '4px 8px', fontSize: 8, background: 'transparent', border: '1px solid var(--ng-border)', color: 'var(--ng-muted)', borderRadius: 4, cursor: 'pointer' }}>🗑</button>
                        )}
                      </div>
                    </div>
                    <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', lineHeight: 1.4 }}>{setup.bias}</div>
                    {(setup.entryZone || setup.tp || setup.sl) && (
                      <div className="flex gap-3 mt-2">
                        {setup.entryZone && <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-cyan)' }}>Entry: {setup.entryZone}</span>}
                        {setup.tp && <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-green)' }}>TP: {setup.tp}</span>}
                        {setup.sl && <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-red)' }}>SL: {setup.sl}</span>}
                      </div>
                    )}
                    {/* Prominent JOURNAL button for ACTIVE trades */}
                    {setup.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleUpdateSetupStatus(setup.id, 'EXECUTED')}
                        className="w-full mt-3"
                        style={{
                          padding: '12px',
                          background: 'linear-gradient(135deg, var(--ng-green) 0%, #00B847 100%)',
                          border: 'none',
                          borderRadius: 8,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                        }}
                      >
                        <span className="font-orbitron" style={{ fontSize: 11, color: '#000', fontWeight: 700, letterSpacing: '1px' }}>✓ CLOSE TRADE & JOURNAL</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6" style={{ background: 'rgba(0,255,65,0.03)', borderRadius: 8, border: '1px dashed rgba(0,255,65,0.2)' }}>
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.6 }}>📋</div>
                <div className="font-orbitron" style={{ fontSize: 11, color: 'var(--ng-muted)', marginBottom: 4 }}>NO SETUPS PLANNED</div>
                <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-dimmer)', lineHeight: 1.5 }}>
                  Plan your trades before the week starts.<br />
                  <span style={{ color: 'var(--ng-green)' }}>Winners prepare. Losers react.</span>
                </div>
              </div>
            )}
          </div>

          {/* Weekly News Calendar */}
          <div className="card mb-4" style={{ borderColor: 'rgba(255,71,87,0.3)' }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="font-orbitron" style={{ fontSize: 10, color: 'var(--ng-red)', letterSpacing: '2px' }}>NEWS CALENDAR</div>
                {weeklyPlan?.news && weeklyPlan.news.length > 0 && (
                  <div className="flex gap-1">
                    {weeklyPlan.news.filter(n => n.impact === 'HIGH').length > 0 && (
                      <span className="font-mono" style={{ fontSize: 8, padding: '2px 6px', background: 'rgba(255,71,87,0.2)', color: 'var(--ng-red)', borderRadius: 10 }}>
                        {weeklyPlan.news.filter(n => n.impact === 'HIGH').length} HIGH
                      </span>
                    )}
                    {(() => {
                      const now = new Date();
                      const upcoming = weeklyPlan.news
                        .filter(n => new Date(`${n.date}T${n.time}`) > now)
                        .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];
                      if (upcoming) {
                        const eventDate = new Date(`${upcoming.date}T${upcoming.time}`);
                        const hoursUntil = Math.round((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60));
                        if (hoursUntil <= 24) {
                          return (
                            <span className="font-mono" style={{
                              fontSize: 8,
                              padding: '2px 8px',
                              background: upcoming.impact === 'HIGH' ? 'rgba(255,71,87,0.3)' : 'rgba(255,159,10,0.2)',
                              color: upcoming.impact === 'HIGH' ? 'var(--ng-red)' : 'var(--ng-amber)',
                              borderRadius: 10,
                              animation: upcoming.impact === 'HIGH' && hoursUntil <= 2 ? 'pulse 1s infinite' : 'none',
                            }}>
                              ⚡ {hoursUntil <= 0 ? 'NOW' : `${hoursUntil}h`}
                            </span>
                          );
                        }
                      }
                      return null;
                    })()}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowNewsForm(!showNewsForm)}
                className="font-orbitron"
                style={{ fontSize: 9, padding: '6px 12px', background: showNewsForm ? 'rgba(255,71,87,0.15)' : 'rgba(255,71,87,0.1)', border: `1px solid var(--ng-red)`, color: 'var(--ng-red)', borderRadius: 6, cursor: 'pointer' }}
              >
                {showNewsForm ? '✕ CLOSE' : '+ ADD EVENT'}
              </button>
            </div>

            {showNewsForm && (
              <div style={{ padding: '12px', background: 'rgba(255,71,87,0.05)', borderRadius: 8, marginBottom: 12, border: '1px solid rgba(255,71,87,0.2)' }}>
                <div className="flex gap-2 mb-3">
                  <div style={{ flex: 1 }}>
                    <div className="font-mono mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)' }}>DATE</div>
                    <input type="date" className="ng-input" value={newsDate} onChange={e => setNewsDate(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="font-mono mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)' }}>TIME (UTC)</div>
                    <input type="time" className="ng-input" value={newsTime} onChange={e => setNewsTime(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                  </div>
                </div>
                <div className="mb-3">
                  <div className="font-mono mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)' }}>EVENT</div>
                  <input className="ng-input" placeholder="e.g. FOMC Meeting, NFP, CPI" value={newsEvent} onChange={e => setNewsEvent(e.target.value)} style={{ width: '100%', padding: '8px' }} />
                </div>
                <div className="flex gap-2 mb-3">
                  <div style={{ flex: 1 }}>
                    <div className="font-mono mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)' }}>IMPACT</div>
                    <div className="flex gap-1">
                      {(['HIGH', 'MEDIUM', 'LOW'] as const).map(imp => (
                        <button key={imp} onClick={() => setNewsImpact(imp)} className="font-orbitron flex-1"
                          style={{ padding: '6px', fontSize: 8, border: `1px solid ${newsImpact === imp ? NEWS_IMPACT_COLORS[imp] : 'var(--ng-border)'}`, color: newsImpact === imp ? NEWS_IMPACT_COLORS[imp] : 'var(--ng-muted)', background: newsImpact === imp ? `${NEWS_IMPACT_COLORS[imp]}15` : 'transparent', borderRadius: 4, cursor: 'pointer' }}>
                          {imp}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="font-mono mb-1" style={{ fontSize: 8, color: 'var(--ng-muted)' }}>AFFECTED PAIRS</div>
                  <div className="flex gap-1 flex-wrap">
                    {['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'XAU'].map(curr => (
                      <button key={curr} onClick={() => setNewsPairs(p => p.includes(curr) ? p.filter(x => x !== curr) : [...p, curr])} className="font-orbitron"
                        style={{ padding: '5px 10px', fontSize: 8, border: `1px solid ${newsPairs.includes(curr) ? 'var(--ng-cyan)' : 'var(--ng-border)'}`, color: newsPairs.includes(curr) ? 'var(--ng-cyan)' : 'var(--ng-muted)', background: newsPairs.includes(curr) ? 'rgba(0,212,255,0.15)' : 'transparent', borderRadius: 4, cursor: 'pointer' }}>
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={handleAddNews} disabled={!newsEvent.trim() || !newsDate} className="w-full" style={{ padding: '10px', background: 'var(--ng-red)', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontWeight: 700, opacity: newsEvent.trim() && newsDate ? 1 : 0.5 }}>
                  ADD NEWS EVENT
                </button>
              </div>
            )}

            {/* News list */}
            {weeklyPlan?.news && weeklyPlan.news.length > 0 ? (
              <div className="flex flex-col gap-2">
                {weeklyPlan.news.map(news => (
                  <div key={news.id} style={{
                    padding: '10px 12px',
                    background: 'var(--ng-surface)',
                    border: `1px solid ${NEWS_IMPACT_COLORS[news.impact]}30`,
                    borderLeft: `3px solid ${NEWS_IMPACT_COLORS[news.impact]}`,
                    borderRadius: 8,
                  }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>{news.date}</span>
                        <span className="font-mono" style={{ fontSize: 10, color: 'var(--ng-cyan)' }}>{news.time}</span>
                        <span className="font-orbitron" style={{ fontSize: 8, padding: '2px 6px', background: `${NEWS_IMPACT_COLORS[news.impact]}20`, color: NEWS_IMPACT_COLORS[news.impact], borderRadius: 4 }}>{news.impact}</span>
                      </div>
                      <button onClick={() => handleDeleteNews(news.id)} style={{ padding: '2px 6px', fontSize: 8, background: 'transparent', border: 'none', color: 'var(--ng-muted)', cursor: 'pointer' }}>🗑</button>
                    </div>
                    <div className="font-orbitron font-bold mt-1" style={{ fontSize: 11, color: 'var(--ng-text)' }}>{news.event}</div>
                    <div className="flex gap-1 mt-2">
                      {news.pairs.map(p => (
                        <span key={p} className="font-mono" style={{ fontSize: 8, padding: '2px 6px', background: 'var(--ng-surface2)', borderRadius: 4, color: 'var(--ng-muted)' }}>{p}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6" style={{ background: 'rgba(255,71,87,0.03)', borderRadius: 8, border: '1px dashed rgba(255,71,87,0.2)' }}>
                <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.6 }}>📰</div>
                <div className="font-orbitron" style={{ fontSize: 11, color: 'var(--ng-muted)', marginBottom: 4 }}>NO NEWS LOGGED</div>
                <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-dimmer)', lineHeight: 1.5 }}>
                  Add high-impact events for the week.<br />
                  <span style={{ color: 'var(--ng-red)' }}>Trade around news, not through it.</span>
                </div>
              </div>
            )}
          </div>

          {/* Log Trade Form */}
          {showLogForm && (
            <div ref={logFormRef} className="card mb-4" style={{ borderColor: executingSetupId ? 'rgba(0,255,65,0.4)' : 'rgba(255,159,10,0.4)', background: executingSetupId ? 'linear-gradient(135deg, var(--ng-surface) 0%, rgba(0,255,65,0.08) 100%)' : 'linear-gradient(135deg, var(--ng-surface) 0%, rgba(255,159,10,0.05) 100%)' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-orbitron" style={{ fontSize: 10, color: executingSetupId ? 'var(--ng-green)' : 'var(--ng-amber)', letterSpacing: '2px' }}>
                    {executingSetupId ? 'JOURNAL EXECUTED SETUP' : 'LOG TRADE'}
                  </div>
                  {executingSetupId && (
                    <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', marginTop: 2 }}>
                      {journalPair} {journalDirection} — add P&L, notes, screenshot
                    </div>
                  )}
                </div>
                <button onClick={() => { setShowLogForm(false); setExecutingSetupId(null); }} style={{ background: 'rgba(255,71,87,0.15)', border: '1px solid var(--ng-red)', borderRadius: 6, cursor: 'pointer', color: 'var(--ng-red)', fontSize: 9, padding: '4px 10px' }}>✕ CANCEL</button>
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

              {/* Row 5.5: Trade Timeline */}
              <div className="mb-4">
                <div className="font-orbitron mb-2" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px' }}>EXPECTED TIMELINE TO TP</div>
                <div className="flex gap-1 flex-wrap">
                  {TRADE_TIMELINES.map(t => (
                    <button key={t.value} onClick={() => setJournalTimeline(t.value)} className="font-orbitron"
                      style={{
                        padding: '7px 14px',
                        fontSize: 9,
                        border: `1px solid ${journalTimeline === t.value ? t.color : 'var(--ng-border)'}`,
                        color: journalTimeline === t.value ? t.color : 'var(--ng-muted)',
                        background: journalTimeline === t.value ? `${t.color}15` : 'transparent',
                        borderRadius: 20,
                        cursor: 'pointer',
                      }}>
                      {t.label}
                    </button>
                  ))}
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
                {executingSetupId ? 'SAVE & MARK EXECUTED' : 'SUBMIT TRADE'}
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
                        {session.timeline && <span className="font-mono" style={{ fontSize: 7, color: TRADE_TIMELINES.find(t => t.value === session.timeline)?.color || 'var(--ng-muted)', padding: '2px 6px', background: 'var(--ng-surface2)', borderRadius: 4 }}>{session.timeline}</span>}
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
