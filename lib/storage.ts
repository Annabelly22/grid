// GRID — Typed Storage Manager
// Single source of truth for all localStorage keys

import type { CyclePhase, EnergyLevel } from './supplementData';
import type { UserProfile, Habit, Mission, Achievement } from './gameStore';

const K = {
  profile:      'grid_profile',
  habits:       'grid_habits',
  missions:     'grid_missions',
  achievements: 'grid_achievements',
  habitLog:     'grid_habit_log',
  cycleStart:   'grid_cycle_start',
  lastPhase:    'grid_last_phase',
  energyLevel:  'grid_energy_level',
  suppView:     'grid_supplements_view',
  ownedSupps:   'grid_owned_supps',
  pendingSupps: 'grid_pending_supps',
  fastStart:    'grid_fast_start',
  theme:        'grid_theme',
  habitsView:   'grid_habits_view',
  notifPerm:    'grid_notif_perm_asked',
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

  // Clear all data
  clearAll: () => {
    if (typeof window !== 'undefined') localStorage.clear();
  },
};
