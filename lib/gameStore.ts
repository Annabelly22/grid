// ============================================================
// GRID — Game Store & Data Models
// ============================================================

export interface UserProfile {
  codename: string;
  xp: number;
  totalHabitsCompleted: number;
  longestStreak: number;
  focusMinutes: number;
  missionsCompleted: number;
  joinDate: string;
}

export interface Habit {
  id: string;
  name: string;
  category: HabitCategory;
  icon: string;
  xpReward: number;
  streak: number;
  completedToday: boolean;
  lastCompleted: string | null;
  totalCompletions: number;
  createdAt: string;
}

export type HabitCategory = 'body' | 'mind' | 'trade' | 'build' | 'spirit' | 'recovery';

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXTREME';
  xpReward: number;
  completed: boolean;
  completedAt?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
  condition: (profile: UserProfile, habits: Habit[]) => boolean;
}

// ─── XP LEVELS ───────────────────────────────────────────────
export const LEVELS = [
  { level: 1, title: 'RECRUIT', minXP: 0 },
  { level: 2, title: 'OPERATIVE', minXP: 100 },
  { level: 3, title: 'AGENT', minXP: 300 },
  { level: 4, title: 'SPECIALIST', minXP: 600 },
  { level: 5, title: 'TACTICIAN', minXP: 1000 },
  { level: 6, title: 'COMMANDER', minXP: 1600 },
  { level: 7, title: 'SENTINEL', minXP: 2400 },
  { level: 8, title: 'ELITE', minXP: 3500 },
  { level: 9, title: 'MASTER', minXP: 5000 },
  { level: 10, title: 'LEGEND', minXP: 7500 },
];

export function getLevel(xp: number) {
  let current = LEVELS[0];
  let next = LEVELS[1];
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) {
      current = LEVELS[i];
      next = LEVELS[Math.min(i + 1, LEVELS.length - 1)];
      break;
    }
  }
  const progress = next.minXP > current.minXP
    ? Math.round(((xp - current.minXP) / (next.minXP - current.minXP)) * 100)
    : 100;
  return { ...current, next, progress, xpToNext: Math.max(0, next.minXP - xp) };
}

// ─── CATEGORY META ────────────────────────────────────────────
export const CATEGORY_COLORS: Record<HabitCategory, string> = {
  body: '#FF4757',
  mind: '#00D4FF',
  trade: '#00FF41',
  build: '#BF00FF',
  spirit: '#FFB800',
  recovery: '#FF6B9D',
};

export const CATEGORY_ICONS: Record<HabitCategory, string> = {
  body: '💪',
  mind: '🧠',
  trade: '📈',
  build: '🔧',
  spirit: '🌿',
  recovery: '🌙',
};

// ─── DEFAULT DATA ─────────────────────────────────────────────
const DEFAULT_HABITS: Habit[] = [
  { id: 'h1', name: 'Morning sunlight walk', category: 'body', icon: '☀️', xpReward: 20, streak: 0, completedToday: false, lastCompleted: null, totalCompletions: 0, createdAt: new Date().toISOString() },
  { id: 'h2', name: 'Training session', category: 'body', icon: '🏋️', xpReward: 30, streak: 0, completedToday: false, lastCompleted: null, totalCompletions: 0, createdAt: new Date().toISOString() },
  { id: 'h3', name: 'Nadi Shodhana before charts', category: 'mind', icon: '🌬️', xpReward: 15, streak: 0, completedToday: false, lastCompleted: null, totalCompletions: 0, createdAt: new Date().toISOString() },
  { id: 'h4', name: 'Log one thing learned', category: 'mind', icon: '📖', xpReward: 15, streak: 0, completedToday: false, lastCompleted: null, totalCompletions: 0, createdAt: new Date().toISOString() },
  { id: 'h5', name: 'Trading session review', category: 'trade', icon: '📊', xpReward: 25, streak: 0, completedToday: false, lastCompleted: null, totalCompletions: 0, createdAt: new Date().toISOString() },
  { id: 'h6', name: 'Evening supplement stack', category: 'recovery', icon: '🌙', xpReward: 10, streak: 0, completedToday: false, lastCompleted: null, totalCompletions: 0, createdAt: new Date().toISOString() },
];

const DEFAULT_MISSIONS: Mission[] = [
  { id: 'm1', title: 'First Step', description: 'Complete any habit for the first time', category: 'body', difficulty: 'EASY', xpReward: 50, completed: false },
  { id: 'm2', title: '7-Day Streak', description: 'Maintain any single habit for 7 consecutive days', category: 'mind', difficulty: 'MEDIUM', xpReward: 150, completed: false },
  { id: 'm3', title: 'Foundation Builder', description: 'Complete all 6 starter habits in a single day', category: 'body', difficulty: 'HARD', xpReward: 300, completed: false },
  { id: 'm4', title: 'Morning Protocol', description: 'Complete morning sunlight walk 14 days in a row', category: 'spirit', difficulty: 'HARD', xpReward: 250, completed: false },
  { id: 'm5', title: 'Level 5 Ascension', description: 'Reach TACTICIAN rank (1,000 XP)', category: 'build', difficulty: 'EXTREME', xpReward: 500, completed: false },
  { id: 'm6', title: 'Supplement Discipline', description: 'Take evening supplement stack 21 days straight', category: 'body', difficulty: 'MEDIUM', xpReward: 200, completed: false },
  { id: 'm7', title: 'Deep Work', description: 'Log 10,000 total XP earned', category: 'build', difficulty: 'EXTREME', xpReward: 1000, completed: false },
  { id: 'm8', title: 'Cycle Tracker', description: 'Set cycle date and track for one full phase', category: 'body', difficulty: 'EASY', xpReward: 75, completed: false },
];

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_habit', title: 'First Rep', description: 'Complete your first habit', icon: '⚡', xpReward: 25, unlocked: false,
    condition: (p) => p.totalHabitsCompleted >= 1,
  },
  {
    id: 'streak_7', title: 'IRON WEEK', description: '7-day streak on any habit', icon: '🔥', xpReward: 100, unlocked: false,
    condition: (_, h) => h.some(habit => habit.streak >= 7),
  },
  {
    id: 'streak_30', title: 'SOVEREIGN MONTH', description: '30-day streak on any habit', icon: '👑', xpReward: 500, unlocked: false,
    condition: (_, h) => h.some(habit => habit.streak >= 30),
  },
  {
    id: 'habits_5', title: 'PROTOCOL ACTIVE', description: 'Build 5 active habits', icon: '◆', xpReward: 75, unlocked: false,
    condition: (_, h) => h.length >= 5,
  },
  {
    id: 'xp_1000', title: 'LEVEL SURGE', description: 'Earn 1,000 XP', icon: '💎', xpReward: 150, unlocked: false,
    condition: (p) => p.xp >= 1000,
  },
  {
    id: 'xp_5000', title: 'ELITE STATUS', description: 'Earn 5,000 XP', icon: '🏆', xpReward: 500, unlocked: false,
    condition: (p) => p.xp >= 5000,
  },
  {
    id: 'missions_5', title: 'MISSION SPECIALIST', description: 'Complete 5 missions', icon: '🎯', xpReward: 200, unlocked: false,
    condition: (p) => p.missionsCompleted >= 5,
  },
];

// ─── STORAGE KEYS ─────────────────────────────────────────────
const KEY_PROFILE = 'grid_profile';
const KEY_HABITS = 'grid_habits';
const KEY_MISSIONS = 'grid_missions';
const KEY_ACHIEVEMENTS = 'grid_achievements';

// ─── LOAD / SAVE ──────────────────────────────────────────────
export function loadProfile(): UserProfile {
  if (typeof window === 'undefined') return defaultProfile();
  try {
    const raw = localStorage.getItem(KEY_PROFILE);
    return raw ? JSON.parse(raw) : defaultProfile();
  } catch { return defaultProfile(); }
}
export function saveProfile(p: UserProfile) {
  localStorage.setItem(KEY_PROFILE, JSON.stringify(p));
}

export function loadHabits(): Habit[] {
  if (typeof window === 'undefined') return [...DEFAULT_HABITS];
  try {
    const raw = localStorage.getItem(KEY_HABITS);
    if (!raw) return resetHabitsForNewDay([...DEFAULT_HABITS]);
    const stored: Habit[] = JSON.parse(raw);
    return resetHabitsForNewDay(stored);
  } catch { return [...DEFAULT_HABITS]; }
}
export function saveHabits(h: Habit[]) {
  localStorage.setItem(KEY_HABITS, JSON.stringify(h));
}

export function loadMissions(): Mission[] {
  if (typeof window === 'undefined') return [...DEFAULT_MISSIONS];
  try {
    const raw = localStorage.getItem(KEY_MISSIONS);
    return raw ? JSON.parse(raw) : [...DEFAULT_MISSIONS];
  } catch { return [...DEFAULT_MISSIONS]; }
}
export function saveMissions(m: Mission[]) {
  localStorage.setItem(KEY_MISSIONS, JSON.stringify(m));
}

export function loadAchievements(): Achievement[] {
  if (typeof window === 'undefined') return DEFAULT_ACHIEVEMENTS.map(a => ({ ...a }));
  try {
    const raw = localStorage.getItem(KEY_ACHIEVEMENTS);
    if (!raw) return DEFAULT_ACHIEVEMENTS.map(a => ({ ...a }));
    const stored = JSON.parse(raw);
    // Merge stored unlock state with default definitions (so new achievements appear)
    return DEFAULT_ACHIEVEMENTS.map(def => {
      const found = stored.find((s: any) => s.id === def.id);
      return found ? { ...def, unlocked: found.unlocked, unlockedAt: found.unlockedAt } : def;
    });
  } catch { return DEFAULT_ACHIEVEMENTS.map(a => ({ ...a })); }
}
export function saveAchievements(a: Achievement[]) {
  localStorage.setItem(KEY_ACHIEVEMENTS, JSON.stringify(a.map(({ condition: _, ...rest }) => rest)));
}

function defaultProfile(): UserProfile {
  return {
    codename: 'OPERATIVE',
    xp: 0,
    totalHabitsCompleted: 0,
    longestStreak: 0,
    focusMinutes: 0,
    missionsCompleted: 0,
    joinDate: new Date().toISOString(),
  };
}

// Reset completedToday if it's a new day
function resetHabitsForNewDay(habits: Habit[]): Habit[] {
  const today = new Date().toISOString().split('T')[0];
  return habits.map(h => ({
    ...h,
    completedToday: h.lastCompleted === today,
  }));
}

// ─── ACHIEVEMENT CHECK ────────────────────────────────────────
export function checkAchievements(
  profile: UserProfile,
  habits: Habit[],
  current: Achievement[]
): { updated: Achievement[]; newlyUnlocked: Achievement[] } {
  const newlyUnlocked: Achievement[] = [];
  const updated = current.map(a => {
    if (a.unlocked) return a;
    if (a.condition(profile, habits)) {
      newlyUnlocked.push({ ...a, unlocked: true, unlockedAt: new Date().toISOString() });
      return { ...a, unlocked: true, unlockedAt: new Date().toISOString() };
    }
    return a;
  });
  return { updated, newlyUnlocked };
}
