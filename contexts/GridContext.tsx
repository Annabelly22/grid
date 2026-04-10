'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  UserProfile, Habit, Mission, Achievement,
  loadProfile, saveProfile, loadHabits, saveHabits,
  loadMissions, saveMissions, loadAchievements, saveAchievements,
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
  handleAddHabit: (data: Omit<Habit, 'id' | 'streak' | 'completedToday' | 'lastCompleted' | 'totalCompletions' | 'createdAt'>) => void;
  handleDeleteHabit: (id: string) => void;
  handleCompleteMission: (id: string) => void;
  handleFocusMinutes: (minutes: number) => void;
  handleToggleTheme: () => void;
  handleUpdateCodename: (name: string) => void;
  handleResetData: () => void;
}

const GridContext = createContext<GridContextValue | null>(null);

export function useGridContext(): GridContextValue {
  const ctx = useContext(GridContext);
  if (!ctx) throw new Error('useGridContext must be used within GridProvider');
  return ctx;
}

export function GridProvider({ children }: { children: ReactNode }) {
  const [tab, setTab]             = useState<Tab>('dashboard');
  const [profile, setProfile]     = useState<UserProfile | null>(null);
  const [habits, setHabits]       = useState<Habit[]>([]);
  const [missions, setMissions]   = useState<Mission[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [toasts, setToasts]       = useState<AchievementToast[]>([]);
  const [xpPopups, setXpPopups]   = useState<XPPopup[]>([]);
  const [mounted, setMounted]     = useState(false);
  const [onboarded, setOnboarded] = useState(true);
  const [onboardName, setOnboardName] = useState('');
  const [theme, setTheme]         = useState<'dark' | 'light'>('dark');
  const [phaseChange, setPhaseChange] = useState<PhaseChange | null>(null);

  useEffect(() => {
    setMounted(true);
    const p = loadProfile();
    const h = loadHabits();
    const m = loadMissions();
    const a = loadAchievements();
    setProfile(p); setHabits(h); setMissions(m); setAchievements(a);
    if (!p.onboarded) setOnboarded(false);

    const t = Storage.getTheme();
    setTheme(t);

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
    const today = new Date().toISOString().split('T')[0];
    const log = Storage.getHabitLog();
    log[today] = {
      completed: updatedHabits.filter(h => h.completedToday).length,
      total:     updatedHabits.length,
    };
    Storage.setHabitLog(log);
  };

  const handleCompleteHabit = (id: string) => {
    if (!profile) return;
    const today     = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const updated = habits.map(h => {
      if (h.id !== id || h.completedToday) return h;
      const streak = (h.lastCompleted === yesterday || h.streak === 0) ? h.streak + 1 : 1;
      return { ...h, completedToday: true, lastCompleted: today, streak, totalCompletions: h.totalCompletions + 1 };
    });
    saveHabits(updated); setHabits(updated);
    snapshotHabitLog(updated);
    const habit = habits.find(h => h.id === id);
    if (!habit) return;
    awardXP(
      habit.xpReward,
      { ...profile, totalHabitsCompleted: profile.totalHabitsCompleted + 1, longestStreak: Math.max(profile.longestStreak, updated.find(h => h.id === id)?.streak || 0) },
      updated, achievements,
    );
  };

  const handleUncompleteHabit = (id: string) => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const updated = habits.map(h => {
      if (h.id !== id || !h.completedToday) return h;
      return { ...h, completedToday: false, lastCompleted: h.streak > 1 ? yesterday : null, streak: Math.max(0, h.streak - 1), totalCompletions: Math.max(0, h.totalCompletions - 1) };
    });
    saveHabits(updated); setHabits(updated);
    snapshotHabitLog(updated);
  };

  const handleAddHabit = (data: Omit<Habit, 'id' | 'streak' | 'completedToday' | 'lastCompleted' | 'totalCompletions' | 'createdAt'>) => {
    const newHabit: Habit = { ...data, id: `h_${Date.now()}`, streak: 0, completedToday: false, lastCompleted: null, totalCompletions: 0, createdAt: new Date().toISOString() };
    const updated = [...habits, newHabit];
    saveHabits(updated); setHabits(updated);
    if (updated.length >= 5 && profile) {
      const { updated: a2, newlyUnlocked } = checkAchievements(profile, updated, achievements);
      if (newlyUnlocked.length > 0) { saveAchievements(a2); setAchievements(a2); newlyUnlocked.forEach(a => addToast(a)); }
    }
  };

  const handleDeleteHabit = (id: string) => {
    const u = habits.filter(h => h.id !== id);
    saveHabits(u); setHabits(u);
  };

  const handleCompleteMission = (id: string) => {
    if (!profile) return;
    const m = missions.find(m => m.id === id);
    if (!m || m.completed) return;
    const updated = missions.map(ms => ms.id === id ? { ...ms, completed: true, completedAt: new Date().toISOString() } : ms);
    saveMissions(updated); setMissions(updated);
    awardXP(m.xpReward, { ...profile, missionsCompleted: profile.missionsCompleted + 1 }, habits, achievements);
  };

  const handleFocusMinutes = (minutes: number) => {
    if (!profile) return;
    const u = { ...profile, focusMinutes: profile.focusMinutes + minutes };
    saveProfile(u); setProfile(u);
    awardXP(minutes * 2, u, habits, achievements);
  };

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    Storage.setTheme(next);
    document.documentElement.setAttribute('data-theme', next === 'light' ? 'light' : '');
  };

  const handleUpdateCodename = (name: string) => {
    if (!profile) return;
    const u = { ...profile, codename: name };
    saveProfile(u); setProfile(u);
  };

  const handleOnboard = () => {
    if (!profile) return;
    const u = { ...profile, codename: onboardName.trim().toUpperCase() || 'OPERATIVE', onboarded: true };
    saveProfile(u); setProfile(u); setOnboarded(true);
  };

  const handleResetData = () => { Storage.clearAll(); window.location.reload(); };

  const clearPhaseChange = () => setPhaseChange(null);

  return (
    <GridContext.Provider value={{
      profile, habits, missions, achievements,
      tab, theme, toasts, xpPopups, mounted, onboarded, onboardName, phaseChange,
      setTab, setOnboardName, clearPhaseChange,
      handleOnboard, handleCompleteHabit, handleUncompleteHabit,
      handleAddHabit, handleDeleteHabit, handleCompleteMission,
      handleFocusMinutes, handleToggleTheme, handleUpdateCodename, handleResetData,
    }}>
      {children}
    </GridContext.Provider>
  );
}
