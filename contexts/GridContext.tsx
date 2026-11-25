'use client';
import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { getTodayStr, getYesterdayStr, getNowTimeStr, getMsUntilMidnight } from '../lib/time';
import {
  UserProfile, Habit, Mission, Achievement, TradeSession,
  loadProfile, saveProfile, loadHabits, saveHabits,
  loadMissions, saveMissions, loadAchievements, saveAchievements,
  loadTradeJournal,
  checkAchievements,
} from '../lib/gameStore';
import { Storage } from '../lib/storage';
import { getCyclePhase, CYCLE_PHASES, CyclePhase } from '../lib/supplementData';
import { scheduleGridNotifications } from '../lib/notifications';
import { loadTradesFromIDB, saveTradesToIDB, migrateFromLocalStorage } from '../lib/indexedDB';

export type Tab = 'dashboard' | 'habits' | 'missions' | 'body' | 'coach' | 'profile' | 'meals' | 'storm';

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
  isSyncing: boolean;
  pendingDelete: { habit: Habit; timeout: number } | null;
  stormActive: boolean;
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
  handleEditHabit: (id: string, updates: Pick<Habit, 'name' | 'category' | 'icon' | 'xpReward' | 'weeklyTarget' | 'reminderTime'>) => void;
  handleToggleFavorite: (id: string) => void;
  handleReorderHabits: (reordered: Habit[]) => void;
  handleCompleteMission: (id: string) => void;
  handleFocusMinutes: (minutes: number) => void;
  handleToggleTheme: () => void;
  handleUpdateCodename: (name: string) => void;
  handleResetData: () => void;
  handleLogTrade: (data: Omit<TradeSession, 'id' | 'createdAt'>) => void;
  handleUpdateTrade: (id: string, data: Partial<Omit<TradeSession, 'id' | 'createdAt'>>) => void;
  handleDeleteTradeSession: (id: string) => void;
  handleSetPriorities: (items: string[]) => void;
  handleSetCycleStart: (date: string) => void;
  undoDelete: () => void;
  syncNow: () => void;
  saveNow: () => void;
  enterStormMode: () => void;
  exitStormMode: () => void;
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
    console.log('[GRID SYNC] Starting cloud save for uid:', uid);
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, payload }),
    });
    const data = await res.json().catch(() => ({}));
    console.log('[GRID SYNC] Cloud save response:', res.status, data);
  } catch (err) {
    console.error('[GRID SYNC] Cloud save error:', err);
  }
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ habit: Habit; timeout: number } | null>(null);
  const [stormActive, setStormActive] = useState(false);

  // Ref to always have latest trades for sync (since trades are in IndexedDB, not localStorage)
  const tradesRef = useRef<TradeSession[]>([]);
  useEffect(() => { tradesRef.current = tradeJournal; }, [tradeJournal]);

  // Debounced cloud sync — fires 3s after the last state change
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const midnightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerSync = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      const uid = Storage.getUserId();
      if (!uid) return;
      setIsSyncing(true);
      // Ensure timestamp is current before sync
      Storage.touchLastModified();
      // Merge localStorage data with IndexedDB trades
      const payload = {
        ...Storage.getAllData(),
        tradeJournal: tradesRef.current, // Include trades from IndexedDB
      };
      await cloudSave(uid, payload);
      setIsSyncing(false);
    }, 3000);
  }, []);

  // Immediate cloud sync — cancels any pending debounce and saves right now
  const saveNow = useCallback(async () => {
    console.log('[GRID SYNC] saveNow called');
    if (syncTimer.current) clearTimeout(syncTimer.current);
    const uid = Storage.getUserId();
    console.log('[GRID SYNC] saveNow uid:', uid);
    if (!uid) return;
    setIsSyncing(true);
    // Ensure timestamp is current before sync
    Storage.touchLastModified();
    // Merge localStorage data with IndexedDB trades
    const payload = {
      ...Storage.getAllData(),
      tradeJournal: tradesRef.current,
    };
    console.log('[GRID SYNC] saveNow payload keys:', Object.keys(payload));
    await cloudSave(uid, payload);
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    setMounted(true);

    const uid = Storage.getUserId();

    // Initialize last modified timestamp if not set (first run after update)
    if (Storage.getLastModified() === 0) {
      Storage.touchLastModified();
      console.log('[GRID SYNC] Initialized lastModified timestamp for existing user');
    }

    // 1. Load from localStorage immediately (fast, offline-safe)
    const p = loadProfile();
    const h = loadHabits();
    const m = loadMissions();
    const a = loadAchievements();
    setProfile(p); setHabits(h); setMissions(m); setAchievements(a);
    if (!p.onboarded) setOnboarded(false);
    const dp = Storage.getDailyPriorities();
    setDailyPriorities(dp.date === getTodayStr() ? dp.items : []);

    const t = Storage.getTheme();
    setTheme(t);

    // Load storm mode state
    const storm = Storage.getStormActive();
    setStormActive(storm);
    if (storm) setTab('storm');

    // 2. Load trades from IndexedDB (async, larger storage)
    const loadTrades = async () => {
      // First, migrate any existing localStorage trades to IndexedDB
      await migrateFromLocalStorage();
      // Then load from IndexedDB
      const trades = await loadTradesFromIDB();
      if (trades.length > 0) {
        setTradeJournal(trades);
      } else {
        // Fallback: try localStorage (for first-time migration)
        const localTrades = loadTradeJournal();
        if (localTrades.length > 0) {
          setTradeJournal(localTrades);
          // Save to IndexedDB for next time
          await saveTradesToIDB(localTrades);
        }
      }
    };
    loadTrades();

    // 3. Hydrate from cloud in background — with COMPREHENSIVE merge logic
    // CRITICAL: Local data ALWAYS wins to prevent stale cloud data from overwriting recent changes
    cloudLoad(uid).then(async cloudData => {
      if (!cloudData) return; // first-time user or offline — local is source of truth

      // ─── STEP 1: Capture ALL local data before any cloud processing ───
      const localSnapshot = Storage.captureLocalSnapshot();
      const localLastModified = Storage.getLastModified();
      const cloudLastModified = typeof cloudData.grid_last_modified === 'number'
        ? cloudData.grid_last_modified
        : (typeof cloudData.grid_last_modified === 'string' ? parseInt(cloudData.grid_last_modified, 10) : 0);

      console.log('[GRID SYNC] Local lastModified:', localLastModified, 'Cloud lastModified:', cloudLastModified);

      // ─── STEP 2: If local is newer, skip cloud hydration entirely ───
      if (localLastModified > 0 && localLastModified >= cloudLastModified) {
        console.log('[GRID SYNC] Local data is newer or same age — skipping cloud hydration');
        return;
      }

      console.log('[GRID SYNC] Cloud data is newer — merging with local preservation');

      // ─── STEP 3: Apply cloud data as base ───
      Storage.setAllData(cloudData);

      // ─── STEP 4: Restore ALL local data that should never be overwritten ───
      // These are values where local state is ALWAYS correct (user just changed it)

      // 4a. Body stats & weight journey — ALWAYS preserve local
      const localBodyStats = localSnapshot['grid_body_stats'];
      const localWeightJourney = localSnapshot['grid_weight_journey'];
      if (localBodyStats) {
        localStorage.setItem('grid_body_stats', typeof localBodyStats === 'string' ? localBodyStats : JSON.stringify(localBodyStats));
      }
      if (localWeightJourney) {
        localStorage.setItem('grid_weight_journey', typeof localWeightJourney === 'string' ? localWeightJourney : JSON.stringify(localWeightJourney));
      }

      // 4b. Daily priorities — ALWAYS preserve local (user just set them today)
      const localPriorities = localSnapshot['grid_daily_priorities'];
      if (localPriorities) {
        localStorage.setItem('grid_daily_priorities', typeof localPriorities === 'string' ? localPriorities : JSON.stringify(localPriorities));
      }

      // 4c. Weekly plan — ALWAYS preserve local (trading setups are critical)
      const localWeeklyPlan = localSnapshot['grid_weekly_plan'];
      if (localWeeklyPlan) {
        localStorage.setItem('grid_weekly_plan', typeof localWeeklyPlan === 'string' ? localWeeklyPlan : JSON.stringify(localWeeklyPlan));
      }

      // 4d. Godwill chat — ALWAYS preserve local (don't lose conversation)
      const localChat = localSnapshot['grid_alphawill_chat'];
      if (localChat) {
        localStorage.setItem('grid_alphawill_chat', typeof localChat === 'string' ? localChat : JSON.stringify(localChat));
      }

      // 4e. Fast start (active fasting session) — ALWAYS preserve local
      const localFastStart = localSnapshot['grid_fast_start'];
      if (localFastStart) {
        localStorage.setItem('grid_fast_start', typeof localFastStart === 'string' ? localFastStart : JSON.stringify(localFastStart));
      }

      // ─── STEP 5: Merge date-keyed data (local wins on date conflicts) ───
      const mergeDateKeyed = (localKey: string, cloudKey: string) => {
        const local = (localSnapshot[localKey] || {}) as Record<string, unknown>;
        const cloud = (cloudData[cloudKey] || cloudData[localKey] || {}) as Record<string, unknown>;
        const merged = { ...cloud, ...local }; // Local wins on same-date conflicts
        localStorage.setItem(localKey, JSON.stringify(merged));
      };

      mergeDateKeyed('grid_meal_log', 'grid_meal_log');
      mergeDateKeyed('grid_meal_checks', 'grid_meal_checks');
      mergeDateKeyed('grid_habit_times', 'grid_habit_times');
      mergeDateKeyed('grid_energy_log', 'grid_energy_log');
      mergeDateKeyed('grid_focus_log', 'grid_focus_log');
      mergeDateKeyed('grid_steps', 'grid_steps');
      mergeDateKeyed('grid_habit_log', 'grid_habit_log');

      // ─── STEP 6: Merge array data with IDs (deduplicate, local wins) ───
      const mergeArrayById = <T extends { id: string }>(localKey: string, cloudKey: string): T[] => {
        const local = (localSnapshot[localKey] || []) as T[];
        const cloud = (cloudData[cloudKey] || cloudData[localKey] || []) as T[];
        const idMap = new Map<string, T>();
        // Add cloud items first
        for (const item of cloud) {
          if (item.id) idMap.set(item.id, item);
        }
        // Local items overwrite cloud items with same ID
        for (const item of local) {
          if (item.id) idMap.set(item.id, item);
        }
        return Array.from(idMap.values());
      };

      // Merge habits (preserve local streaks, completedToday, etc.)
      const mergedHabits = mergeArrayById<Habit>('grid_habits', 'grid_habits');
      localStorage.setItem('grid_habits', JSON.stringify(mergedHabits));

      // Merge missions (preserve local completion state)
      const mergedMissions = mergeArrayById<Mission>('grid_missions', 'grid_missions');
      localStorage.setItem('grid_missions', JSON.stringify(mergedMissions));

      // Merge achievements (preserve local unlock state)
      const mergedAchievements = mergeArrayById<Achievement>('grid_achievements', 'grid_achievements');
      localStorage.setItem('grid_achievements', JSON.stringify(mergedAchievements));

      // Merge fast history
      const mergedFastHistory = mergeArrayById<{ id: string }>('grid_fast_history', 'grid_fast_history');
      localStorage.setItem('grid_fast_history', JSON.stringify(mergedFastHistory));

      // Merge sleep log (by date as ID proxy)
      const localSleep = (localSnapshot['grid_sleep_log'] || []) as Array<{ date: string }>;
      const cloudSleep = (cloudData['grid_sleep_log'] || []) as Array<{ date: string }>;
      const sleepMap = new Map<string, { date: string }>();
      for (const entry of cloudSleep) sleepMap.set(entry.date, entry);
      for (const entry of localSleep) sleepMap.set(entry.date, entry); // Local wins
      localStorage.setItem('grid_sleep_log', JSON.stringify(Array.from(sleepMap.values())));

      // ─── STEP 7: Profile — merge XP (take higher), preserve local streaks ───
      const localProfile = localSnapshot['grid_profile'] as UserProfile | undefined;
      const cloudProfile = cloudData['grid_profile'] as UserProfile | undefined;
      if (localProfile && cloudProfile) {
        const mergedProfile: UserProfile = {
          ...cloudProfile,
          ...localProfile,
          // Take the HIGHER XP (never lose progress)
          xp: Math.max(localProfile.xp || 0, cloudProfile.xp || 0),
          // Keep local codename if set
          codename: localProfile.codename || cloudProfile.codename,
          // Keep local onboarded state
          onboarded: localProfile.onboarded,
        };
        localStorage.setItem('grid_profile', JSON.stringify(mergedProfile));
      } else if (localProfile) {
        localStorage.setItem('grid_profile', JSON.stringify(localProfile));
      }

      // ─── STEP 8: Restore dynamic keys (gym checks, gym perf, notifs) ───
      for (const [key, value] of Object.entries(localSnapshot)) {
        if (key.startsWith('grid_gym_checks_') || key.startsWith('grid_gym_perf_') || key.startsWith('grid_notif_')) {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        }
      }

      // ─── STEP 9: Reload React state from merged localStorage ───
      const cp = loadProfile();
      const ch = loadHabits();
      const cm = loadMissions();
      const ca = loadAchievements();
      setProfile(cp); setHabits(ch); setMissions(cm); setAchievements(ca);
      if (!cp.onboarded) setOnboarded(false);
      const cdp = Storage.getDailyPriorities();
      setDailyPriorities(cdp.date === getTodayStr() ? cdp.items : []);
      const ct = Storage.getTheme();
      setTheme(ct);

      // ─── STEP 10: Merge trades from IndexedDB + cloud (by ID, local wins) ───
      if (cloudData.tradeJournal && Array.isArray(cloudData.tradeJournal)) {
        const cloudTrades = cloudData.tradeJournal as TradeSession[];
        const localTrades = tradesRef.current; // Current local trades from IndexedDB

        // Merge by ID — local always wins
        const tradeMap = new Map<string, TradeSession>();
        for (const trade of cloudTrades) {
          if (trade.id) tradeMap.set(trade.id, trade);
        }
        for (const trade of localTrades) {
          if (trade.id) tradeMap.set(trade.id, trade); // Local overwrites cloud
        }
        const mergedTrades = Array.from(tradeMap.values());

        // Sort by createdAt descending (newest first)
        mergedTrades.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setTradeJournal(mergedTrades);
        await saveTradesToIDB(mergedTrades);
        console.log('[GRID SYNC] Merged trades:', localTrades.length, 'local +', cloudTrades.length, 'cloud =', mergedTrades.length, 'merged');
      }

      console.log('[GRID SYNC] Cloud hydration complete with local preservation');
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
      } else if (document.visibilityState === 'hidden') {
        // Flush any pending sync immediately when app is closed or backgrounded
        const uid = Storage.getUserId();
        if (uid) {
          // Ensure timestamp is current before sync
          Storage.touchLastModified();
          // Include trades from IndexedDB in the sync payload
          const payload = {
            ...Storage.getAllData(),
            tradeJournal: tradesRef.current,
          };
          cloudSave(uid, payload);
        }
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
    const habitToDelete = habits.find(h => h.id === id);
    if (!habitToDelete) return;

    // Cancel any existing pending delete
    if (pendingDelete) {
      clearTimeout(pendingDelete.timeout);
    }

    // Remove from list immediately (optimistic)
    const u = habits.filter(h => h.id !== id);
    setHabits(u);

    // Set up pending delete with 5s undo window
    const timeout = window.setTimeout(() => {
      // Actually save to storage after timeout
      saveHabits(u);
      triggerSync();
      setPendingDelete(null);
    }, 5000);

    setPendingDelete({ habit: habitToDelete, timeout });
  };

  const undoDelete = () => {
    if (!pendingDelete) return;
    clearTimeout(pendingDelete.timeout);
    // Restore the habit
    const restored = [...habits, pendingDelete.habit];
    setHabits(restored);
    setPendingDelete(null);
  };

  const handleEditHabit = (id: string, updates: Pick<Habit, 'name' | 'category' | 'icon' | 'xpReward' | 'weeklyTarget' | 'reminderTime'>) => {
    const updated = habits.map(h => h.id === id ? { ...h, ...updates } : h);
    saveHabits(updated); setHabits(updated);
    // Reschedule notifications with updated reminder times
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      scheduleGridNotifications(updated);
    }
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

  const handleLogTrade = async (data: Omit<TradeSession, 'id' | 'createdAt'>) => {
    const session: TradeSession = { ...data, id: `t_${Date.now()}`, createdAt: new Date().toISOString() };
    const updated = [session, ...tradeJournal];
    setTradeJournal(updated);
    await saveTradesToIDB(updated);
    triggerSync();
  };

  const handleUpdateTrade = async (id: string, data: Partial<Omit<TradeSession, 'id' | 'createdAt'>>) => {
    const updated = tradeJournal.map(t => t.id === id ? { ...t, ...data } : t);
    setTradeJournal(updated);
    await saveTradesToIDB(updated);
    triggerSync();
  };

  const handleDeleteTradeSession = async (id: string) => {
    const updated = tradeJournal.filter(t => t.id !== id);
    setTradeJournal(updated);
    await saveTradesToIDB(updated);
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

  const handleResetData = () => {
    const confirmed = window.confirm(
      '⚠️ RESET ALL DATA?\n\n' +
      'This will permanently delete:\n' +
      '• All habits and streaks\n' +
      '• All XP and achievements\n' +
      '• All meal logs and body data\n' +
      '• All settings\n\n' +
      'This action cannot be undone.'
    );
    if (confirmed) {
      Storage.clearAll();
      window.location.reload();
    }
  };

  const clearPhaseChange = () => setPhaseChange(null);

  const enterStormMode = () => {
    setStormActive(true);
    Storage.setStormActive(true);
    setTab('storm');
    triggerSync();
  };

  const exitStormMode = () => {
    setStormActive(false);
    Storage.setStormActive(false);
    setTab('dashboard');
    triggerSync();
  };

  return (
    <GridContext.Provider value={{
      profile, habits, missions, achievements, tradeJournal, dailyPriorities,
      tab, theme, toasts, xpPopups, mounted, onboarded, onboardName, phaseChange,
      isSyncing, pendingDelete, stormActive,
      setTab, setOnboardName, clearPhaseChange,
      handleOnboard, handleCompleteHabit, handleUncompleteHabit,
      handleAddHabit, handleDeleteHabit, handleEditHabit, handleCompleteMission,
      handleFocusMinutes, handleToggleTheme, handleUpdateCodename, handleResetData,
      handleToggleFavorite, handleReorderHabits,
      handleLogTrade, handleUpdateTrade, handleDeleteTradeSession, handleSetPriorities, handleSetCycleStart,
      undoDelete,
      syncNow: triggerSync,
      saveNow,
      enterStormMode, exitStormMode,
    }}>
      {children}
    </GridContext.Provider>
  );
}
