// GRID — Typed Storage Manager
// Single source of truth for all localStorage keys

import type { CyclePhase, EnergyLevel } from './supplementData';
import type { UserProfile, Habit, Mission, Achievement } from './gameStore';

export interface FastRecord {
  id: string;
  startTime: number;
  endTime: number;
  durationH: number;
  phaseReached: string;
}

export interface SleepEntry {
  date: string;       // 'YYYY-MM-DD'
  bedtime: string;    // 'HH:MM' 24h
  waketime: string;   // 'HH:MM' 24h
  quality: 1 | 2 | 3 | 4 | 5;
  durationH: number;
}

const K = {
  profile:         'grid_profile',
  habits:          'grid_habits',
  missions:        'grid_missions',
  achievements:    'grid_achievements',
  habitLog:        'grid_habit_log',
  cycleStart:      'grid_cycle_start',
  lastPhase:       'grid_last_phase',
  energyLevel:     'grid_energy_level',
  suppView:        'grid_supplements_view',
  ownedSupps:      'grid_owned_supps',
  pendingSupps:    'grid_pending_supps',
  fastStart:       'grid_fast_start',
  fastHistory:     'grid_fast_history',
  theme:           'grid_theme',
  habitsView:      'grid_habits_view',
  notifPerm:       'grid_notif_perm_asked',
  tradeJournal:    'grid_trade_journal',
  alphawillChat:   'grid_alphawill_chat',
  focusLog:        'grid_focus_log',
  dailyPriorities: 'grid_daily_priorities',
  sleepLog:        'grid_sleep_log',
  habitTimes:      'grid_habit_times',
  energyLog:       'grid_energy_log',
} as const;

function get<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch { return fallback; }
}

function set(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function remove(key: string): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(key); } catch {}
}

function getRaw(key: string): string | null {
  if (typeof window === 'undefined') return null;
  try { return localStorage.getItem(key); } catch { return null; }
}

function setRaw(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, value); } catch {}
}

export const Storage = {
  // Profile
  getProfile: (fallback: UserProfile) => get<UserProfile>(K.profile, fallback),
  setProfile: (p: UserProfile) => set(K.profile, p),

  // Habits
  getHabits: (fallback: Habit[]) => get<Habit[]>(K.habits, fallback),
  setHabits: (h: Habit[]) => set(K.habits, h),

  // Missions
  getMissions: (fallback: Mission[]) => get<Mission[]>(K.missions, fallback),
  setMissions: (m: Mission[]) => set(K.missions, m),

  // Achievements
  getAchievements: (fallback: Achievement[]) => get<Achievement[]>(K.achievements, fallback),
  setAchievements: (a: Achievement[]) => set(K.achievements, a),

  // Habit log
  getHabitLog: () => get<Record<string, { completed: number; total: number }>>(K.habitLog, {}),
  setHabitLog: (log: Record<string, { completed: number; total: number }>) => set(K.habitLog, log),

  // Cycle
  getCycleStart: (): string | null => getRaw(K.cycleStart),
  setCycleStart: (d: string) => setRaw(K.cycleStart, d),

  // Last known phase (for phase change detection)
  getLastPhase: (): CyclePhase | null => getRaw(K.lastPhase) as CyclePhase | null,
  setLastPhase: (p: CyclePhase) => setRaw(K.lastPhase, p),

  // Energy level
  getEnergyLevel: (): EnergyLevel => (getRaw(K.energyLevel) as EnergyLevel) || 'medium',
  setEnergyLevel: (e: EnergyLevel) => setRaw(K.energyLevel, e),

  // Supplement view
  getSuppView: (): 'list' | 'grid' => (getRaw(K.suppView) as 'list' | 'grid') || 'list',
  setSuppView: (v: 'list' | 'grid') => setRaw(K.suppView, v),

  // Owned supplements
  getOwnedSupps: (): Set<string> => new Set(get<string[]>(K.ownedSupps, [])),
  setOwnedSupps: (s: Set<string>) => set(K.ownedSupps, [...s]),

  // Pending/cart supplements
  getPendingSupps: (): Set<string> => new Set(get<string[]>(K.pendingSupps, [])),
  setPendingSupps: (s: Set<string>) => set(K.pendingSupps, [...s]),

  // Steps (daily)
  getSteps: (): Record<string, number> => get<Record<string, number>>('grid_steps', {}),
  setSteps: (s: Record<string, number>) => set('grid_steps', s),

  // Fasting
  getFastStart: (): number | null => {
    const raw = getRaw(K.fastStart);
    return raw ? Number(raw) : null;
  },
  setFastStart: (t: number) => setRaw(K.fastStart, String(t)),
  clearFastStart: () => remove(K.fastStart),

  // Fast history
  getFastHistory: () => get<FastRecord[]>(K.fastHistory, []),
  setFastHistory: (h: FastRecord[]) => set(K.fastHistory, h),

  // Sleep log
  getSleepLog: () => get<SleepEntry[]>(K.sleepLog, []),
  setSleepLog: (log: SleepEntry[]) => set(K.sleepLog, log),

  // Habit completion times (date → habitId → 'HH:MM')
  getHabitTimes: () => get<Record<string, Record<string, string>>>(K.habitTimes, {}),
  setHabitTimes: (t: Record<string, Record<string, string>>) => set(K.habitTimes, t),

  // Energy log (date → EnergyLevel string)
  getEnergyLog: () => get<Record<string, string>>(K.energyLog, {}),
  setEnergyLog: (log: Record<string, string>) => set(K.energyLog, log),

  // Gym performance (per exercise per day per date)
  getGymPerf: (dayId: string, exId: string, date: string): { w: string; reps: number; rpe: number }[] =>
    get<{ w: string; reps: number; rpe: number }[]>(`grid_gym_perf_${dayId}_${exId}_${date}`, []),
  setGymPerf: (dayId: string, exId: string, date: string, sets: { w: string; reps: number; rpe: number }[]) =>
    set(`grid_gym_perf_${dayId}_${exId}_${date}`, sets),

  // Theme
  getTheme: (): 'dark' | 'light' => (getRaw(K.theme) as 'dark' | 'light') || 'dark',
  setTheme: (t: 'dark' | 'light') => setRaw(K.theme, t),

  // Habits view
  getHabitsView: (): 'list' | 'grid' => (getRaw(K.habitsView) as 'list' | 'grid') || 'list',
  setHabitsView: (v: 'list' | 'grid') => setRaw(K.habitsView, v),

  // Gym checks (per day+date)
  getGymChecks: (dayId: string, suffix: string, date: string): Record<string, boolean> =>
    get<Record<string, boolean>>(`grid_gym_checks_${dayId}${suffix}_${date}`, {}),
  setGymChecks: (dayId: string, suffix: string, date: string, data: Record<string, boolean>) =>
    set(`grid_gym_checks_${dayId}${suffix}_${date}`, data),

  // Notification deduplication
  getNotifDate: (key: string): string | null => getRaw(`grid_notif_${key}`),
  setNotifDate: (key: string, date: string) => setRaw(`grid_notif_${key}`, date),

  // Notification permission asked
  hasAskedNotifPerm: (): boolean => getRaw(K.notifPerm) === '1',
  markAskedNotifPerm: () => setRaw(K.notifPerm, '1'),

  // Motivational quote cycling index
  getQuoteIdx: (): number => { const v = getRaw('grid_quote_idx'); return v ? parseInt(v, 10) : 0; },
  setQuoteIdx: (n: number) => setRaw('grid_quote_idx', String(n)),

  // Trade journal
  getTradeJournal: () => get<import('./gameStore').TradeSession[]>(K.tradeJournal, []),
  setTradeJournal: (s: import('./gameStore').TradeSession[]) => set(K.tradeJournal, s),

  // AlphaWill chat history
  getAlphaWillChat: () => get<{ role: 'user' | 'assistant'; content: string }[]>(K.alphawillChat, []),
  setAlphaWillChat: (msgs: { role: 'user' | 'assistant'; content: string }[]) => set(K.alphawillChat, msgs),

  // Focus log (date → minutes)
  getFocusLog: () => get<Record<string, number>>(K.focusLog, {}),
  setFocusLog: (log: Record<string, number>) => set(K.focusLog, log),

  // Daily priorities
  getDailyPriorities: () => get<{ date: string; items: string[] }>(K.dailyPriorities, { date: '', items: [] }),
  setDailyPriorities: (v: { date: string; items: string[] }) => set(K.dailyPriorities, v),

  // Clear all data
  clearAll: () => {
    if (typeof window !== 'undefined') localStorage.clear();
  },

  // ── Cloud sync helpers ──────────────────────────────────────

  // Stable user ID — generated once, persisted forever in localStorage
  getUserId: (): string => {
    if (typeof window === 'undefined') return '';
    const existing = localStorage.getItem('grid_user_id');
    if (existing) return existing;
    const id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem('grid_user_id', id);
    return id;
  },

  // Snapshot every grid_ key into one object for cloud upload
  getAllData: (): Record<string, unknown> => {
    if (typeof window === 'undefined') return {};
    const snapshot: Record<string, unknown> = {};
    const staticKeys = [
      'grid_profile', 'grid_habits', 'grid_missions', 'grid_achievements',
      'grid_habit_log', 'grid_cycle_start', 'grid_last_phase', 'grid_energy_level',
      'grid_supplements_view', 'grid_owned_supps', 'grid_pending_supps',
      'grid_steps', 'grid_fast_start', 'grid_theme', 'grid_habits_view', 'grid_quote_idx',
      'grid_trade_journal', 'grid_alphawill_chat', 'grid_focus_log', 'grid_daily_priorities',
      'grid_fast_history', 'grid_sleep_log', 'grid_habit_times', 'grid_energy_log',
    ];
    for (const key of staticKeys) {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try { snapshot[key] = JSON.parse(raw); } catch { snapshot[key] = raw; }
      }
    }
    // Capture dynamic gym check keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('grid_gym_checks_') || key?.startsWith('grid_notif_') || key?.startsWith('grid_gym_perf_')) {
        const raw = localStorage.getItem(key);
        if (raw !== null) {
          try { snapshot[key] = JSON.parse(raw); } catch { snapshot[key] = raw; }
        }
      }
    }
    return snapshot;
  },

  // Restore a cloud snapshot back into localStorage
  setAllData: (data: Record<string, unknown>): void => {
    if (typeof window === 'undefined') return;
    for (const [key, value] of Object.entries(data)) {
      if (!key.startsWith('grid_')) continue;
      try {
        localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
      } catch {}
    }
  },
};
