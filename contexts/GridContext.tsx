'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { getTodayStr, getYesterdayStr, getNowTimeStr, getMsUntilMidnight } from '../lib/time';
import {
  UserProfile, Habit, Mission, Achievement, TradeSession,
  loadProfile, saveProfile, loadHabits, saveHabits,
  loadMissions, saveMissions, loadAchievements, saveAchievements,
  loadTradeJournal, saveTradeJournal,
  checkAchievements,
} from '../lib/gameStore';
import { Storage } from '../lib/storage';
import { getCyclePhase, CYCLE_PHASES, CyclePhase } from '../lib/supplementData';
import { scheduleGridNotifications } from '../lib/notifications';

export type Tab = 'dashboard' | 'habits' | 'missions' | 'body' | 'coach' | 'profile';

interface AchievementToast { achievement: Achievement; id: number; }
interface XPPopup { amount: number; id: number; }

export interface PhaseChange { from: CyclePhase; to: CyclePhase; }

interface GridContextValue {
  // State
  profile: UserProfile | null;
  habits: Habit[];
  missions: Mission[];
  achievements: Achievement[];
  tradeJournal: TradeSession[];
  dailyPriorities: string[];
  tab: Tab;
  theme: 'dark' | 'light';
  toasts: AchievementToast[];
  xpPopups: XPPopup[];
  mounted: boolean;
  onboarded: boolean;
  onboardName: string;
  phaseChange: PhaseChange | null;
  // Setters
  setTab: (t: Tab) => void;
  setOnboardName: (n: string) => void;
  clearPhaseChange: () => void;
  // Handlers
  handleOnboard: () => void;
  handleCompleteHabit: (id: string) => void;
  handleUncompleteHabit: (id: string) => void;
  handleAddHabit: (data: Omit<Habit, 'id' | 'streak' | 'completedToday' | 'lastCompleted' | 'totalCompletions' | 'createdAt' | 'weeklyCompletions'>) => void;
  handleDeleteHabit: (id: string) => void;
  handleEditHabit: (id: string, updates: Pick<Habit, 'name' | 'category' | 'icon' | 'xpReward' | 'weeklyTarget'>) => void;
  handleToggleFavorite: (id: string) => void;
  handleReorderHabits: (reordered: Habit[]) => void;
  handleCompleteMission: (id: string) => void;
  handleFocusMinutes: (minutes: number) => void;
  handleToggleTheme: () => void;
  handleUpdateCodename: (name: string) => void;
  handleResetData: () => void;
  handleLogTrade: (data: Omit<TradeSession, 'id' | 'createdAt'>) => void;
  handleDeleteTradeSession: (id: string) => void;
  handleSetPriorities: (items: string[]) => void;
  handleSetCycleStart: (date: string) => void;
  syncNow: () => void;
}

const GridContext = createContext<GridContextValue | null>(null);

export function useGridContext(): GridContextValue {
  const ctx = useContext(GridContext);
  if (!ctx) throw new Error('useGridContext must be used within GridProvider');
  return ctx;
}

// ── Cloud sync helpers ──────────────────────────────────────────────────────
async function cloudLoad(uid: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`/api/sync?uid=${encodeURIComponent(uid)}`);
    if (!res.ok) return null;
    const { payload } = await res.json();
    return payload ?? null;
  } catch { return null; }
}

async function cloudSave(uid: string, payload: Record<string, unknown>): Promise<void> {
  try {
    await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, payload }),
    });
  } catch {}
}

export function GridProvider({ children }: { children: ReactNode }) {
  const [tab, setTab]             = useState<Tab>('dashboard');
  const [profile, setProfile]     = useState<UserProfile | null>(null);
  const [habits, setHabits]       = useState<Habit[]>([]);
  const [missions, setMissions]   = useState<Mission[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [tradeJournal, setTradeJournal] = useState<TradeSession[]>([]);
  const [dailyPriorities, setDailyPriorities] = useState<string[]>([]);
  const [toasts, setToasts]       = useState<AchievementToast[]>([]);
  const [xpPopups, setXpPopups]   = useState<XPPopup[]>([]);
  const [mounted, setMounted]     = useState(false);
  const [onboarded, setOnboarded] = useState(true);
  const [onboardName, setOnboardName] = useState('');
  const [theme, setTheme]         = useState<'dark' | 'light'>('dark');
  const [phaseChange, setPhaseChange] = useState<PhaseChange | null>(null);

  // Debounced cloud sync — fires 3s after the last state change
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const midnightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      const uid = Storage.getUserId();
      if (!uid) return;
      const payload = Storage.getAllData();
      cloudSave(uid, payload);
    }, 3000);
  }, []);

  useEffect(() => {
    setMounted(true);

    const uid = Storage.getUserId();

    // 1. Load from localStorage immediately (fast, offline-safe)
    const p = loadProfile();
    const h = loadHabits();
    const m = loadMissions();
    const a = loadAchievements();
    const tj = loadTradeJournal();
    setProfile(p); setHabits(h); setMissions(m); setAchievements(a); setTradeJournal(tj);
    if (!p.onboarded) setOnboarded(false);
    const dp = Storage.getDailyPriorities();
    setDailyPriorities(dp.date === getTodayStr() ? dp.items : []);

    const t = Storage.getTheme();
    setTheme(t);

    // 2. Hydrate from Supabase in background — overrides localStorage if cloud is newer
    cloudLoad(uid).then(cloudData => {
      if (!cloudData) return; // first-time user or offline — localStorage is source of truth
      Storage.setAllData(cloudData);
      // Reload state from the freshly-restored localStorage
      const cp = loadProfile();
      const ch = loadHabits();
      const cm = loadMissions();
      const ca = loadAchievements();
      const ctj = loadTradeJournal();
      setProfile(cp); setHabits(ch); setMissions(cm); setAchievements(ca); setTradeJournal(ctj);
      if (!cp.onboarded) setOnboarded(false);
      const cdp = Storage.getDailyPriorities();
      setDailyPriorities(cdp.date === getTodayStr() ? cdp.items : []);
      const ct = Storage.getTheme();
      setTheme(ct);
    });

    // Phase change detection
    const cycleStart = Storage.getCycleStart();
    if (cycleStart) {
      const current = getCyclePhase(cycleStart);
      const last    = Storage.getLastPhase();
      if (current && last && current !== last) {
        setPhaseChange({ from: last, to: current });
        // Fire browser notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification(`🔄 ${CYCLE_PHASES[current].label} PHASE`, {
              body: `${CYCLE_PHASES[last].icon} → ${CYCLE_PHASES[current].icon} ${CYCLE_PHASES[current].headline}. Your stack has been updated.`,
              icon: '/icon.png',
              badge: '/icon.png',
              tag: 'phase-change',
            } as NotificationOptions);
          } catch {}
        }
      }
      if (current) Storage.setLastPhase(current);
    }

    // Request notification permission (once)
    if (typeof window !== 'undefined' && 'Notification' in window
        && Notification.permission === 'default'
        && !Storage.hasAskedNotifPerm()) {
      Storage.markAskedNotifPerm();
      Notification.requestPermission().then(perm => {
        if (perm === 'granted') scheduleGridNotifications(h);
      });
    } else if (typeof window !== 'undefined' && 'Notification' in window
               && Notification.permission === 'granted') {
      scheduleGridNotifications(h);
    }

    // Register service worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Midnight reset — re-run loadHabits at midnight in the home timezone
    function scheduleReset() {
      return setTimeout(() => {
        setHabits(loadHabits());
        midnightTimer.current = scheduleReset();
      }, getMsUntilMidnight());
    }
    midnightTimer.current = scheduleReset();

    // Visibility reset — catches returning to a tab that was left open overnight
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        setHabits(loadHabits());
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (midnightTimer.current) clearTimeout(midnightTimer.current);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const addXPPopup = (amount: number) => {
    const id = Date.now() + Math.random();
    setXpPopups(prev => [...prev, { amount, id }]);
    setTimeout(() => setXpPopups(prev => prev.filter(p => p.id !== id)), 2000);
  };

  const addToast = (achievement: Achievement) => {
    const id = Date.now();
    setToasts(prev => [...prev, { achievement, id }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  const awardXP = useCallback((amount: number, p: UserProfile, h: Habit[], a: Achievement[]) => {
    addXPPopup(amount);
    const working: UserProfile = { ...p, xp: p.xp + amount };
    const { updated: newAch, newlyUnlocked } = checkAchievements(working, h, a);
    const bonus = newlyUnlocked.reduce((s, a) => s + a.xpReward, 0);
    const final: UserProfile = { ...working, xp: working.xp + bonus };
    saveProfile(final); setProfile(final);
    if (newlyUnlocked.length > 0) {
      saveAchievements(newAch); setAchievements(newAch);
      newlyUnlocked.forEach(a => setTimeout(() => addToast(a), 500));
    }
    return final;
  }, []);

  const snapshotHabitLog = (updatedHabits: Habit[]) => {
    const today = getTodayStr();
    const log = Storage.getHabitLog();
    log[today] = {
      completed: updatedHabits.filter(h => h.completedToday).length,
      total:     updatedHabits.length,
    };
    Storage.setHabitLog(log);
  };

  const handleCompleteHabit = (id: string) => {
    if (!profile) return;
    const today     = getTodayStr();
    const yesterday = getYesterdayStr();
    const updated = habits.map(h => {
      if (h.id !== id || h.completedToday) return h;
      const streak = (h.lastCompleted === yesterday || h.streak === 0) ? h.streak + 1 : 1;
      const weeklyCompletions = h.weeklyTarget !== undefined ? (h.weeklyCompletions ?? 0) + 1 : (h.weeklyCompletions ?? 0);
      return { ...h, completedToday: true, lastCompleted: today, streak, totalCompletions: h.totalCompletions + 1, weeklyCompletions };
    });
    saveHabits(updated); setHabits(updated);
    snapshotHabitLog(updated);
    // Save completion time (HH:MM) in home timezone
    const timeStr = getNowTimeStr();
    const times = Storage.getHabitTimes();
    if (!times[today]) times[today] = {};
    times[today][id] = timeStr;
    Storage.setHabitTimes(times);
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    let currentProfile = awardXP(
      habit.xpReward,
      { ...profile, totalHabitsCompleted: profile.totalHabitsCompleted + 1, longestStreak: Math.max(profile.longestStreak, updated.find(h => h.id === id)?.streak || 0) },
      updated, achievements,
    );

    // Check category-based missions — auto-complete when total completions hit threshold
    const category = habit.category;
    const catTotal = updated
      .filter(h => h.category === category)
      .reduce((sum, h) => sum + h.totalCompletions, 0);
    const pendingCatMissions = missions.filter(m =>
      !m.completed && m.categoryGoal?.category === category && catTotal >= m.categoryGoal.count
    );
    if (pendingCatMissions.length > 0 && currentProfile) {
      let updatedMissions = missions;
      for (const m of pendingCatMissions) {
        updatedMissions = updatedMissions.map(ms => ms.id === m.id ? { ...ms, completed: true, completedAt: new Date().toISOString() } : ms);
        currentProfile = awardXP(m.xpReward, { ...currentProfile, missionsCompleted: currentProfile.missionsCompleted + 1 }, updated, achievements);
      }
      saveMissions(updatedMissions); setMissions(updatedMissions);
    }

    triggerSync();
  };

  const handleUncompleteHabit = (id: string) => {
    const yesterday = getYesterdayStr();
    const updated = habits.map(h => {
      if (h.id !== id || !h.completedToday) return h;
      const weeklyCompletions = h.weeklyTarget !== undefined ? Math.max(0, (h.weeklyCompletions ?? 0) - 1) : (h.weeklyCompletions ?? 0);
      return { ...h, completedToday: false, lastCompleted: h.streak > 1 ? yesterday : null, streak: Math.max(0, h.streak - 1), totalCompletions: Math.max(0, h.totalCompletions - 1), weeklyCompletions };
    });
    saveHabits(updated); setHabits(updated);
    snapshotHabitLog(updated);
    triggerSync();
  };

  const handleAddHabit = (data: Omit<Habit, 'id' | 'streak' | 'completedToday' | 'lastCompleted' | 'totalCompletions' | 'createdAt' | 'weeklyCompletions'>) => {
    const newHabit: Habit = { ...data, id: `h_${Date.now()}`, streak: 0, completedToday: false, lastCompleted: null, totalCompletions: 0, createdAt: new Date().toISOString(), weeklyCompletions: 0 };
    const updated = [...habits, newHabit];
    saveHabits(updated); setHabits(updated);
    if (updated.length >= 5 && profile) {
      const { updated: a2, newlyUnlocked } = checkAchievements(profile, updated, achievements);
      if (newlyUnlocked.length > 0) { saveAchievements(a2); setAchievements(a2); newlyUnlocked.forEach(a => addToast(a)); }
    }
    triggerSync();
  };

  const handleDeleteHabit = (id: string) => {
    const u = habits.filter(h => h.id !== id);
    saveHabits(u); setHabits(u);
    triggerSync();
  };

  const handleEditHabit = (id: string, updates: Pick<Habit, 'name' | 'category' | 'icon' | 'xpReward' | 'weeklyTarget'>) => {
    const updated = habits.map(h => h.id === id ? { ...h, ...updates } : h);
    saveHabits(updated); setHabits(updated);
    triggerSync();
  };

  const handleCompleteMission = (id: string) => {
    if (!profile) return;
    const m = missions.find(m => m.id === id);
    if (!m || m.completed) return;
    const updated = missions.map(ms => ms.id === id ? { ...ms, completed: true, completedAt: new Date().toISOString() } : ms);
    saveMissions(updated); setMissions(updated);
    awardXP(m.xpReward, { ...profile, missionsCompleted: profile.missionsCompleted + 1 }, habits, achievements);
    triggerSync();
  };

  const handleFocusMinutes = (minutes: number) => {
    if (!profile) return;
    const u = { ...profile, focusMinutes: profile.focusMinutes + minutes };
    saveProfile(u); setProfile(u);
    awardXP(minutes * 2, u, habits, achievements);
    const today = getTodayStr();
    const log = Storage.getFocusLog();
    log[today] = (log[today] || 0) + minutes;
    Storage.setFocusLog(log);
    triggerSync();
  };

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    Storage.setTheme(next);
    document.documentElement.setAttribute('data-theme', next === 'light' ? 'light' : '');
    triggerSync();
  };

  const handleUpdateCodename = (name: string) => {
    if (!profile) return;
    const u = { ...profile, codename: name };
    saveProfile(u); setProfile(u);
    triggerSync();
  };

  const handleOnboard = () => {
    if (!profile) return;
    const u = { ...profile, codename: onboardName.trim().toUpperCase() || 'OPERATIVE', onboarded: true };
    saveProfile(u); setProfile(u); setOnboarded(true);
    triggerSync();
  };

  const handleToggleFavorite = (id: string) => {
    const updated = habits.map(h => h.id === id ? { ...h, favorited: !h.favorited } : h);
    saveHabits(updated); setHabits(updated);
    triggerSync();
  };

  const handleReorderHabits = (reordered: Habit[]) => {
    saveHabits(reordered); setHabits(reordered);
    triggerSync();
  };

  const handleLogTrade = (data: Omit<TradeSession, 'id' | 'createdAt'>) => {
    const session: TradeSession = { ...data, id: `t_${Date.now()}`, createdAt: new Date().toISOString() };
    const updated = [session, ...tradeJournal];
    saveTradeJournal(updated); setTradeJournal(updated);
    triggerSync();
  };

  const handleDeleteTradeSession = (id: string) => {
    const updated = tradeJournal.filter(t => t.id !== id);
    saveTradeJournal(updated); setTradeJournal(updated);
    triggerSync();
  };

  const handleSetPriorities = (items: string[]) => {
    Storage.setDailyPriorities({ date: getTodayStr(), items });
    setDailyPriorities(items);
    triggerSync();
  };

  const handleSetCycleStart = (date: string) => {
    Storage.setCycleStart(date);
    triggerSync();
  };

  const handleResetData = () => { Storage.clearAll(); window.location.reload(); };

  const clearPhaseChange = () => setPhaseChange(null);

  return (
    <GridContext.Provider value={{
      profile, habits, missions, achievements, tradeJournal, dailyPriorities,
      tab, theme, toasts, xpPopups, mounted, onboarded, onboardName, phaseChange,
      setTab, setOnboardName, clearPhaseChange,
      handleOnboard, handleCompleteHabit, handleUncompleteHabit,
      handleAddHabit, handleDeleteHabit, handleEditHabit, handleCompleteMission,
      handleFocusMinutes, handleToggleTheme, handleUpdateCodename, handleResetData,
      handleToggleFavorite, handleReorderHabits,
      handleLogTrade, handleDeleteTradeSession, handleSetPriorities, handleSetCycleStart,
      syncNow: triggerSync,
    }}>
      {children}
    </GridContext.Provider>
  );
}
