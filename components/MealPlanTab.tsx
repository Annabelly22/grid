'use client';
import { useState, useEffect, useCallback } from 'react';
import { Storage, type FastRecord } from '../lib/storage';
import { getTodayStr } from '../lib/time';
import { getTodayQuote } from '../lib/dailyQuotes';

// ── Types ────────────────────────────────────────────────────────────────────
export interface MealItem {
  id: string;
  name: string;
  kcal: number;
}

export interface DayMeals {
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
  snack: MealItem[];
}

export interface MealPlan {
  days: DayMeals[];
  shoppingList: { item: string; checked: boolean }[];
  swaps: { from: string; to: string; kcal: string }[];
  savedMeals?: { id: string; name: string; kcal: number }[];
}

// ── Meal Log Types ──────────────────────────────────────────────────────────
export interface MealLogEntry {
  date: string; // YYYY-MM-DD
  meals: {
    breakfast: { name: string; kcal: number }[];
    lunch: { name: string; kcal: number }[];
    dinner: { name: string; kcal: number }[];
    snack: { name: string; kcal: number }[];
  };
  totalKcal: number;
  isCheatDay: boolean;
  notes?: string;
}

// ── Default 7-Day Plan ───────────────────────────────────────────────────────
const DEFAULT_PLAN: MealPlan = {
  days: [
    { // Day 1
      breakfast: [{ id: 'b1-1', name: '2 fried eggs + cucumber', kcal: 210 }],
      lunch: [{ id: 'l1-1', name: 'Akamu with splash of milk', kcal: 180 }, { id: 'l1-2', name: '1 moin moin', kcal: 200 }],
      dinner: [{ id: 'd1-1', name: '200g boiled yam + egg sauce (1 egg, 1 tbsp oil)', kcal: 440 }],
      snack: [{ id: 's1-1', name: '1 orange', kcal: 60 }],
    },
    { // Day 2
      breakfast: [{ id: 'b2-1', name: '1 fried egg + 1 apple', kcal: 185 }],
      lunch: [{ id: 'l2-1', name: 'Akamu', kcal: 180 }, { id: 'l2-2', name: '3 small akara', kcal: 200 }],
      dinner: [{ id: 'd2-1', name: '200g boiled yam + 100g grilled tilapia + ugu sauce (1 tsp oil)', kcal: 425 }],
      snack: [{ id: 's2-1', name: '20g roasted groundnuts', kcal: 115 }],
    },
    { // Day 3
      breakfast: [{ id: 'b3-1', name: '2 fried eggs + 2 garden eggs', kcal: 205 }],
      lunch: [{ id: 'l3-1', name: 'Akamu', kcal: 180 }, { id: 'l3-2', name: '1 moin moin', kcal: 200 }],
      dinner: [{ id: 'd3-1', name: 'Light yam pottage: 200g yam, 1 tbsp palm oil, spinach, crayfish, 50g smoked fish', kcal: 460 }],
      snack: [{ id: 's3-1', name: '1 cup pawpaw', kcal: 55 }],
    },
    { // Day 4
      breakfast: [{ id: 'b4-1', name: '2 fried eggs + tea with splash of milk', kcal: 200 }],
      lunch: [{ id: 'l4-1', name: 'Akamu', kcal: 180 }, { id: 'l4-2', name: '3 small akara', kcal: 200 }],
      dinner: [{ id: 'd4-1', name: '200g roasted yam + 100g grilled chicken breast + pepper sauce (1 tsp oil)', kcal: 445 }],
      snack: [{ id: 's4-1', name: '1 orange', kcal: 60 }],
    },
    { // Day 5
      breakfast: [{ id: 'b5-1', name: '1 fried egg + 1 banana', kcal: 195 }],
      lunch: [{ id: 'l5-1', name: 'Akamu', kcal: 180 }, { id: 'l5-2', name: '1 moin moin', kcal: 200 }],
      dinner: [{ id: 'd5-1', name: '180g boiled yam + okra soup with 100g fish (1 tsp oil)', kcal: 410 }],
      snack: [{ id: 's5-1', name: '20g roasted groundnuts', kcal: 115 }],
    },
    { // Day 6
      breakfast: [{ id: 'b6-1', name: '2 fried eggs + cucumber', kcal: 210 }],
      lunch: [{ id: 'l6-1', name: 'Akamu', kcal: 180 }, { id: 'l6-2', name: '1 moin moin', kcal: 200 }],
      dinner: [{ id: 'd6-1', name: '200g boiled yam + garden egg sauce with 1 egg (1 tbsp oil)', kcal: 455 }],
      snack: [{ id: 's6-1', name: '1 cup pawpaw', kcal: 55 }],
    },
    { // Day 7
      breakfast: [{ id: 'b7-1', name: '1 fried egg + 1 apple + tea with splash of milk', kcal: 205 }],
      lunch: [{ id: 'l7-1', name: 'Akamu', kcal: 180 }, { id: 'l7-2', name: '3 small akara', kcal: 200 }],
      dinner: [{ id: 'd7-1', name: '200g roasted yam + 100g peppered tilapia + ugu (1 tsp oil)', kcal: 420 }],
      snack: [{ id: 's7-1', name: '1 orange + 1 cup watermelon', kcal: 105 }],
    },
  ],
  shoppingList: [
    { item: 'Akamu/ogi for 7 bowls', checked: false },
    { item: 'Yam, about 1.4kg cooked (roughly 1 medium tuber)', checked: false },
    { item: 'Eggs, 13', checked: false },
    { item: 'Moin moin, 4 wraps (or beans to make them)', checked: false },
    { item: 'Akara, 9 small balls (or beans to make them)', checked: false },
    { item: 'Tilapia, 200g', checked: false },
    { item: 'Fish for okra soup, 100g', checked: false },
    { item: 'Smoked fish, 50g', checked: false },
    { item: 'Chicken breast, 100g', checked: false },
    { item: 'Okra, ugu, spinach, garden eggs (about 8), cucumbers (3)', checked: false },
    { item: 'Tomatoes, peppers, onions, crayfish', checked: false },
    { item: 'Oranges (3), apples (2), 1 banana, pawpaw, watermelon', checked: false },
    { item: 'Roasted groundnuts, 40g', checked: false },
    { item: 'Milk, vegetable oil, palm oil', checked: false },
  ],
  swaps: [
    { from: '1 moin moin', to: '3 small akara', kcal: '200' },
    { from: '100g tilapia', to: '100g chicken breast, skinless', kcal: '130 → 165' },
    { from: '2 fried eggs', to: '1 fried egg + 1 apple', kcal: '180 → 185' },
    { from: '1 orange', to: '1 cup pawpaw or watermelon', kcal: '45–60' },
    { from: '20g groundnuts', to: '1 banana', kcal: '115 → 105' },
  ],
};

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const MEAL_LABELS: Record<typeof MEAL_TYPES[number], string> = {
  breakfast: '🌅 Breakfast',
  lunch: '☀️ Lunch',
  dinner: '🌙 Dinner',
  snack: '🥜 Snack',
};

const DAY_NAMES = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

// ── Fasting & Mindful Tips ───────────────────────────────────────────────────
const FASTING_TIPS = [
  "Consider delaying breakfast by 1-2 hours to extend your overnight fast",
  "16:8 fasting window: Eat between 12pm-8pm for metabolic benefits",
  "Black coffee or tea won't break your fast — use them to manage hunger",
  "Breaking fast with protein helps stabilize blood sugar",
  "If you're not hungry at breakfast time, listen to your body",
];

const MINDFUL_TIPS = [
  "Eat slowly — it takes 20 minutes for fullness signals to reach your brain",
  "Put your fork down between bites",
  "No screens while eating — focus on the food",
  "Chew each bite 20-30 times for better digestion",
  "Ask yourself: Am I hungry or just bored/stressed?",
  "Stop eating when you're 80% full (hara hachi bu)",
];

// Daily quotes are now in lib/dailyQuotes.ts with author attribution

// ── Component ────────────────────────────────────────────────────────────────
export default function MealPlanTab() {
  const [plan, setPlan] = useState<MealPlan>(DEFAULT_PLAN);
  const [selectedDay, setSelectedDay] = useState(0);
  const [editingMeal, setEditingMeal] = useState<{ day: number; type: typeof MEAL_TYPES[number]; idx: number } | null>(null);
  const [editName, setEditName] = useState('');
  const [editKcal, setEditKcal] = useState('');
  const [showShopping, setShowShopping] = useState(false);
  const [showSwaps, setShowSwaps] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [dragItem, setDragItem] = useState<{ day: number; type: typeof MEAL_TYPES[number]; idx: number } | null>(null);
  const [fastingHours, setFastingHours] = useState(0);
  const [addingSavedMeal, setAddingSavedMeal] = useState(false);
  const [newMealName, setNewMealName] = useState('');
  const [newMealKcal, setNewMealKcal] = useState('');
  const [addToMealType, setAddToMealType] = useState<typeof MEAL_TYPES[number] | null>(null);
  const [mealChecks, setMealChecks] = useState<Record<string, boolean>>({});
  const [addingToSlot, setAddingToSlot] = useState<{ day: number; type: typeof MEAL_TYPES[number] } | null>(null);
  const [customMealName, setCustomMealName] = useState('');
  const [customMealKcal, setCustomMealKcal] = useState('');

  // Meal log state
  const [viewMode, setViewMode] = useState<'plan' | 'log'>('plan');
  const [mealLog, setMealLog] = useState<Record<string, MealLogEntry>>({});
  const [selectedLogMonth, setSelectedLogMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [logNotes, setLogNotes] = useState('');
  const [showLogPrompt, setShowLogPrompt] = useState(false);
  const [logPromptNote, setLogPromptNote] = useState('');

  // Habits data for log view
  const [habits, setHabits] = useState<{ id: string; name: string; icon: string }[]>([]);
  const [habitTimes, setHabitTimes] = useState<Record<string, Record<string, string>>>({});

  // Edit log entry state
  const [editingLogDate, setEditingLogDate] = useState<string | null>(null);
  const [editLogKcal, setEditLogKcal] = useState('');
  const [editLogCheat, setEditLogCheat] = useState(false);
  const [editLogNotes, setEditLogNotes] = useState('');

  // Body stats and fasting for TDEE/deficit calculations
  const [bodyStats, setBodyStats] = useState<{
    age: number;
    heightFt: number;
    heightIn: number;
    weight: number;
    goalWeight: number;
    sex: 'female' | 'male';
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'veryActive';
  } | null>(null);
  const [fastHistory, setFastHistory] = useState<FastRecord[]>([]);

  // Load from storage on mount
  useEffect(() => {
    const saved = Storage.getMealPlan?.() as MealPlan | null;
    if (saved && saved.days) setPlan(saved);
    const fh = Storage.getFastingHours?.();
    if (typeof fh === 'number') setFastingHours(fh);
    // Load meal checks for today
    const today = getTodayStr();
    const allChecks = Storage.getMealChecks?.() || {};
    setMealChecks(allChecks[today] || {});
    // Load meal log
    const savedLog = Storage.getMealLog?.() as Record<string, MealLogEntry> | null;
    if (savedLog) setMealLog(savedLog);
    // Load habits data for log view
    const savedHabits = Storage.getHabits?.([]) as { id: string; name: string; icon: string }[];
    if (savedHabits) setHabits(savedHabits);
    const savedHabitTimes = Storage.getHabitTimes?.() || {};
    setHabitTimes(savedHabitTimes);
    // Load body stats for TDEE calculation
    const savedBodyStats = Storage.getBodyStats?.();
    if (savedBodyStats) setBodyStats(savedBodyStats);
    // Load fasting history for deficit calculations
    const savedFastHistory = Storage.getFastHistory?.() || [];
    setFastHistory(savedFastHistory);
  }, []);

  // Save to storage on change
  const savePlan = useCallback((newPlan: MealPlan) => {
    setPlan(newPlan);
    Storage.setMealPlan?.(newPlan);
  }, []);

  // Save meal log
  const saveMealLog = useCallback((newLog: Record<string, MealLogEntry>) => {
    setMealLog(newLog);
    Storage.setMealLog?.(newLog);
  }, []);

  // Log today's meals from plan (only checked meals)
  const logTodayMeals = useCallback((isCheatDay: boolean = false, notes: string = '', checkedMeals?: Record<string, boolean>) => {
    const today = getTodayStr();
    const dow = new Date().getDay();
    const dayMap: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };
    const todayIdx = dayMap[dow];
    const todayMeals = plan.days[todayIdx];

    // If checkedMeals provided, only include checked ones
    const meals = {
      breakfast: (checkedMeals?.breakfast !== false && (!checkedMeals || checkedMeals.breakfast))
        ? todayMeals.breakfast.map(m => ({ name: m.name, kcal: m.kcal })) : [],
      lunch: (checkedMeals?.lunch !== false && (!checkedMeals || checkedMeals.lunch))
        ? todayMeals.lunch.map(m => ({ name: m.name, kcal: m.kcal })) : [],
      dinner: (checkedMeals?.dinner !== false && (!checkedMeals || checkedMeals.dinner))
        ? todayMeals.dinner.map(m => ({ name: m.name, kcal: m.kcal })) : [],
      snack: todayMeals.snack.map(m => ({ name: m.name, kcal: m.kcal })), // Always include snacks
    };

    const totalKcal = meals.breakfast.reduce((s, m) => s + m.kcal, 0) +
                      meals.lunch.reduce((s, m) => s + m.kcal, 0) +
                      meals.dinner.reduce((s, m) => s + m.kcal, 0) +
                      meals.snack.reduce((s, m) => s + m.kcal, 0);

    const entry: MealLogEntry = {
      date: today,
      meals,
      totalKcal,
      isCheatDay,
      notes: notes || undefined,
    };

    saveMealLog({ ...mealLog, [today]: entry });
  }, [plan, mealLog, saveMealLog]);

  // Calculate TDEE from body stats (Mifflin-St Jeor formula)
  const calculateTDEE = useCallback(() => {
    if (!bodyStats) return 1800; // fallback
    const heightCm = (bodyStats.heightFt * 12 + bodyStats.heightIn) * 2.54;
    const weightKg = bodyStats.weight * 0.453592;
    const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * bodyStats.age + (bodyStats.sex === 'male' ? 5 : -161));
    const activityMultipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, veryActive: 1.9 };
    return Math.round(bmr * activityMultipliers[bodyStats.activityLevel]);
  }, [bodyStats]);

  // Get fasting stats for the logged period
  const getFastingStats = useCallback(() => {
    const entries = Object.values(mealLog).filter(e => e && typeof e === 'object');
    if (entries.length === 0 || fastHistory.length === 0) {
      return { totalFastingHours: 0, avgFastDuration: 0, fastCount: 0, fastingBonus: 0 };
    }

    // Get date range from meal log
    const dates = entries.map(e => e?.date).filter(Boolean) as string[];
    const minDate = dates.sort()[0];
    const maxDate = dates.sort().reverse()[0];

    // Filter fasting records within the meal log period
    const periodFasts = fastHistory.filter(f => {
      const fastDate = new Date(f.startTime).toISOString().split('T')[0];
      return fastDate >= minDate && fastDate <= maxDate;
    });

    const totalFastingHours = periodFasts.reduce((sum, f) => sum + f.durationH, 0);
    const avgFastDuration = periodFasts.length > 0
      ? Math.round((totalFastingHours / periodFasts.length) * 10) / 10
      : 0;

    // Fasting bonus: estimate ~50 extra calories burned per hour of fasting beyond 12h
    // due to metabolic shift to fat burning
    const fastingBonus = periodFasts.reduce((sum, f) => {
      const extraHours = Math.max(0, f.durationH - 12);
      return sum + (extraHours * 50);
    }, 0);

    return {
      totalFastingHours: Math.round(totalFastingHours * 10) / 10,
      avgFastDuration,
      fastCount: periodFasts.length,
      fastingBonus: Math.round(fastingBonus),
    };
  }, [mealLog, fastHistory]);

  // Get stats for meal log
  const getLogStats = useCallback(() => {
    const entries = Object.values(mealLog).filter(e => e && typeof e === 'object');
    if (entries.length === 0) return {
      avgKcal: 0, totalDays: 0, cheatDays: 0, daysSinceCheat: 0, expectedLoss: 0,
      tdee: calculateTDEE(), fastingStats: { totalFastingHours: 0, avgFastDuration: 0, fastCount: 0, fastingBonus: 0 }
    };

    const sorted = entries.sort((a, b) => (b?.date ?? '').localeCompare(a?.date ?? ''));
    const lastCheat = sorted.find(e => e?.isCheatDay);
    const daysSinceCheat = lastCheat?.date
      ? Math.floor((Date.now() - new Date(lastCheat.date).getTime()) / 86400000)
      : entries.length;

    const nonCheatDays = entries.filter(e => !e?.isCheatDay);
    const avgKcal = nonCheatDays.length > 0
      ? Math.round(nonCheatDays.reduce((s, e) => s + (e?.totalKcal ?? 0), 0) / nonCheatDays.length)
      : 0;

    // Calculate TDEE from actual body stats
    const tdee = calculateTDEE();
    const fastingStats = getFastingStats();

    // Expected loss: (TDEE - avgKcal) * days / 3500 lbs + fasting bonus
    const totalDeficit = nonCheatDays.reduce((s, e) => s + Math.max(0, tdee - (e?.totalKcal ?? 0)), 0);
    const totalDeficitWithFasting = totalDeficit + fastingStats.fastingBonus;
    const expectedLoss = totalDeficitWithFasting / 3500; // lbs

    return {
      avgKcal,
      totalDays: entries.length,
      cheatDays: entries.filter(e => e?.isCheatDay).length,
      daysSinceCheat,
      expectedLoss: Math.round(expectedLoss * 10) / 10,
      tdee,
      fastingStats,
    };
  }, [mealLog, calculateTDEE, getFastingStats]);

  // Toggle meal check for today
  const toggleMealCheck = useCallback((mealType: string) => {
    const today = getTodayStr();
    const allChecks = Storage.getMealChecks?.() || {};
    const todayChecks = { ...(allChecks[today] || {}) };
    todayChecks[mealType] = !todayChecks[mealType];
    allChecks[today] = todayChecks;
    Storage.setMealChecks?.(allChecks);
    setMealChecks(todayChecks);
  }, []);

  // Start editing a log entry
  const startEditLog = (date: string) => {
    const entry = mealLog[date];
    if (!entry) return;
    setEditingLogDate(date);
    setEditLogKcal(String(entry.totalKcal ?? 0));
    setEditLogCheat(entry.isCheatDay ?? false);
    setEditLogNotes(entry.notes ?? '');
  };

  // Save edited log entry
  const saveEditLog = () => {
    if (!editingLogDate) return;
    const entry = mealLog[editingLogDate];
    if (!entry) return;

    const updatedEntry: MealLogEntry = {
      ...entry,
      totalKcal: parseInt(editLogKcal) || 0,
      isCheatDay: editLogCheat,
      notes: editLogNotes || undefined,
    };

    saveMealLog({ ...mealLog, [editingLogDate]: updatedEntry });
    setEditingLogDate(null);
  };

  // Delete a log entry
  const deleteLogEntry = (date: string) => {
    if (!confirm('Delete this log entry?')) return;
    const newLog = { ...mealLog };
    delete newLog[date];
    saveMealLog(newLog);
  };

  // Calculate totals for a day
  const getDayTotal = (dayIdx: number) => {
    const day = plan.days[dayIdx];
    return MEAL_TYPES.reduce((sum, type) =>
      sum + day[type].reduce((s, m) => s + m.kcal, 0), 0);
  };

  // Handle drag start
  const handleDragStart = (day: number, type: typeof MEAL_TYPES[number], idx: number) => {
    setDragItem({ day, type, idx });
  };

  // Handle drop
  const handleDrop = (targetDay: number, targetType: typeof MEAL_TYPES[number]) => {
    if (!dragItem) return;
    if (dragItem.day === targetDay && dragItem.type === targetType) {
      setDragItem(null);
      return;
    }

    const newPlan = { ...plan, days: [...plan.days] };
    const sourceDay = { ...newPlan.days[dragItem.day] };
    const targetDayObj = { ...newPlan.days[targetDay] };

    // Remove from source
    const [item] = sourceDay[dragItem.type].splice(dragItem.idx, 1);
    // Add to target
    targetDayObj[targetType] = [...targetDayObj[targetType], item];

    newPlan.days[dragItem.day] = sourceDay;
    newPlan.days[targetDay] = targetDayObj;

    savePlan(newPlan);
    setDragItem(null);
  };

  // Edit meal
  const startEdit = (day: number, type: typeof MEAL_TYPES[number], idx: number) => {
    const meal = plan.days[day][type][idx];
    setEditingMeal({ day, type, idx });
    setEditName(meal.name);
    setEditKcal(String(meal.kcal));
  };

  const saveEdit = () => {
    if (!editingMeal) return;
    const newPlan = { ...plan, days: [...plan.days] };
    const day = { ...newPlan.days[editingMeal.day] };
    day[editingMeal.type] = [...day[editingMeal.type]];
    day[editingMeal.type][editingMeal.idx] = {
      ...day[editingMeal.type][editingMeal.idx],
      name: editName,
      kcal: parseInt(editKcal) || 0,
    };
    newPlan.days[editingMeal.day] = day;
    savePlan(newPlan);
    setEditingMeal(null);
  };

  // Delete meal
  const deleteMeal = (day: number, type: typeof MEAL_TYPES[number], idx: number) => {
    const newPlan = { ...plan, days: [...plan.days] };
    const dayObj = { ...newPlan.days[day] };
    dayObj[type] = dayObj[type].filter((_, i) => i !== idx);
    newPlan.days[day] = dayObj;
    savePlan(newPlan);
  };

  // Add meal
  const addMeal = (day: number, type: typeof MEAL_TYPES[number]) => {
    // Open the meal picker instead of directly adding
    setAddingToSlot({ day, type });
    setCustomMealName('');
    setCustomMealKcal('');
  };

  // Add a custom meal to a slot
  const addCustomMealToSlot = () => {
    if (!addingToSlot || !customMealName.trim()) return;
    const { day, type } = addingToSlot;
    const newPlan = { ...plan, days: [...plan.days] };
    const dayObj = { ...newPlan.days[day] };
    dayObj[type] = [...dayObj[type], {
      id: `${type[0]}${day}-${Date.now()}`,
      name: customMealName.trim(),
      kcal: parseInt(customMealKcal) || 100
    }];
    newPlan.days[day] = dayObj;
    savePlan(newPlan);
    setAddingToSlot(null);
    setCustomMealName('');
    setCustomMealKcal('');
  };

  // Add a saved meal to the currently open slot
  const addSavedMealToSlot = (meal: { id: string; name: string; kcal: number }) => {
    if (!addingToSlot) return;
    const { day, type } = addingToSlot;
    const newPlan = { ...plan, days: [...plan.days] };
    const dayObj = { ...newPlan.days[day] };
    dayObj[type] = [...dayObj[type], {
      id: `${type[0]}${day}-${Date.now()}`,
      name: meal.name,
      kcal: meal.kcal
    }];
    newPlan.days[day] = dayObj;
    savePlan(newPlan);
    setAddingToSlot(null);
  };

  // Toggle shopping item
  const toggleShopping = (idx: number) => {
    const newPlan = { ...plan, shoppingList: [...plan.shoppingList] };
    newPlan.shoppingList[idx] = { ...newPlan.shoppingList[idx], checked: !newPlan.shoppingList[idx].checked };
    savePlan(newPlan);
  };

  // Add saved meal to library
  const addSavedMeal = () => {
    if (!newMealName.trim() || !newMealKcal.trim()) return;
    const newPlan = { ...plan };
    const savedMeals = [...(newPlan.savedMeals || [])];
    savedMeals.push({
      id: `sm-${Date.now()}`,
      name: newMealName.trim(),
      kcal: parseInt(newMealKcal) || 0,
    });
    newPlan.savedMeals = savedMeals;
    savePlan(newPlan);
    setNewMealName('');
    setNewMealKcal('');
    setAddingSavedMeal(false);
  };

  // Delete saved meal from library
  const deleteSavedMeal = (id: string) => {
    const newPlan = { ...plan };
    newPlan.savedMeals = (newPlan.savedMeals || []).filter(m => m.id !== id);
    savePlan(newPlan);
  };

  // Add saved meal to a day's meal type
  const addSavedMealToDay = (meal: { id: string; name: string; kcal: number }, mealType: typeof MEAL_TYPES[number]) => {
    const newPlan = { ...plan, days: [...plan.days] };
    const dayObj = { ...newPlan.days[selectedDay] };
    dayObj[mealType] = [...dayObj[mealType], {
      id: `${mealType[0]}${selectedDay}-${Date.now()}`,
      name: meal.name,
      kcal: meal.kcal
    }];
    newPlan.days[selectedDay] = dayObj;
    savePlan(newPlan);
    setAddToMealType(null);
  };

  // Reset to default (preserves saved meals)
  const resetPlan = () => {
    if (confirm('Reset meal plan to default? Your saved meals library will be kept.')) {
      const preservedSavedMeals = plan.savedMeals || [];
      savePlan({ ...DEFAULT_PLAN, savedMeals: preservedSavedMeals });
    }
  };

  const todayTotal = getDayTotal(selectedDay);
  const randomTip = FASTING_TIPS[Math.floor(Date.now() / 86400000) % FASTING_TIPS.length];
  const randomMindful = MINDFUL_TIPS[Math.floor(Date.now() / 43200000) % MINDFUL_TIPS.length];

  // Get day of year and today's quote
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const dailyQuote = getTodayQuote();

  // Get today's date for log
  const today = getTodayStr();
  const isTodayLogged = !!mealLog[today];
  const logStats = getLogStats();

  return (
    <div style={{ padding: '0 0 100px' }}>
      {/* Header with view toggle */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div className="font-orbitron" style={{ fontSize: 10, color: 'var(--ng-cyan)', letterSpacing: '2px' }}>
            🍽️ MEALS
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setViewMode('plan')}
              className="font-orbitron"
              style={{
                padding: '6px 12px',
                fontSize: 8,
                letterSpacing: '1px',
                background: viewMode === 'plan' ? 'var(--ng-cyan)' : 'transparent',
                color: viewMode === 'plan' ? '#000' : 'var(--ng-muted)',
                border: '1px solid var(--ng-border)',
                borderRadius: '6px 0 0 6px',
                cursor: 'pointer',
              }}
            >
              PLAN
            </button>
            <button
              onClick={() => setViewMode('log')}
              className="font-orbitron"
              style={{
                padding: '6px 12px',
                fontSize: 8,
                letterSpacing: '1px',
                background: viewMode === 'log' ? 'var(--ng-green)' : 'transparent',
                color: viewMode === 'log' ? '#000' : 'var(--ng-muted)',
                border: '1px solid var(--ng-border)',
                borderRadius: '0 6px 6px 0',
                cursor: 'pointer',
              }}
            >
              LOG
            </button>
          </div>
        </div>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ng-muted)' }}>
          {viewMode === 'plan' ? '1,100 kcal daily · Akamu & yam based' : `${Object.keys(mealLog).length} days logged`}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          LOG VIEW
          ══════════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'log' && (
        <div>
          {/* Stats Banner */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,255,65,0.08), rgba(0,212,255,0.05))',
            border: '1px solid rgba(0,255,65,0.2)',
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
          }}>
            <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
              <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-green)', letterSpacing: '2px' }}>
                📊 TRACKING STATS
              </div>
              <div className="font-mono" style={{ fontSize: 8, color: 'var(--ng-muted)' }}>
                TDEE: {logStats.tdee} kcal
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <div style={{ textAlign: 'center' }}>
                <div className="font-orbitron" style={{ fontSize: 18, color: 'var(--ng-amber)' }}>{logStats.avgKcal}</div>
                <div className="font-mono" style={{ fontSize: 8, color: 'var(--ng-muted)' }}>AVG KCAL</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="font-orbitron" style={{ fontSize: 18, color: 'var(--ng-cyan)' }}>{logStats.daysSinceCheat}</div>
                <div className="font-mono" style={{ fontSize: 8, color: 'var(--ng-muted)' }}>DAYS NO CHEAT</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="font-orbitron" style={{ fontSize: 18, color: 'var(--ng-green)' }}>{logStats.expectedLoss}</div>
                <div className="font-mono" style={{ fontSize: 8, color: 'var(--ng-muted)' }}>LBS DEFICIT</div>
              </div>
            </div>

            {/* Fasting Contribution */}
            {logStats.fastingStats && logStats.fastingStats.fastCount > 0 && (
              <div style={{
                marginTop: 12,
                paddingTop: 10,
                borderTop: '1px solid var(--ng-border)',
              }}>
                <div className="font-mono" style={{ fontSize: 8, color: 'var(--ng-purple)', marginBottom: 6 }}>
                  🕐 FASTING CONTRIBUTION
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div className="font-orbitron" style={{ fontSize: 14, color: 'var(--ng-purple)' }}>
                      {logStats.fastingStats.fastCount}
                    </div>
                    <div className="font-mono" style={{ fontSize: 7, color: 'var(--ng-muted)' }}>FASTS</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div className="font-orbitron" style={{ fontSize: 14, color: 'var(--ng-purple)' }}>
                      {logStats.fastingStats.avgFastDuration}h
                    </div>
                    <div className="font-mono" style={{ fontSize: 7, color: 'var(--ng-muted)' }}>AVG DURATION</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div className="font-orbitron" style={{ fontSize: 14, color: 'var(--ng-purple)' }}>
                      +{logStats.fastingStats.fastingBonus}
                    </div>
                    <div className="font-mono" style={{ fontSize: 7, color: 'var(--ng-muted)' }}>BONUS CAL</div>
                  </div>
                </div>
                <div className="font-mono" style={{ fontSize: 7, color: 'var(--ng-dimmer)', textAlign: 'center', marginTop: 6 }}>
                  ~50 extra cal burned per hour fasting beyond 12h
                </div>
              </div>
            )}

            {logStats.daysSinceCheat >= 7 && (
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-amber)', textAlign: 'center', marginTop: 10 }}>
                🎉 {logStats.daysSinceCheat} days clean! You&apos;ve earned a cheat meal.
              </div>
            )}
          </div>

          {/* Log Today Button */}
          {!isTodayLogged ? (
            <div style={{
              background: 'var(--ng-surface)',
              border: '1px solid var(--ng-border)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
            }}>
              <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-cyan)', letterSpacing: '2px', marginBottom: 10 }}>
                📝 LOG TODAY&apos;S MEALS
              </div>
              <input
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                placeholder="Notes (optional)..."
                className="ng-input"
                style={{ width: '100%', marginBottom: 10, fontSize: 11, padding: '8px 10px' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { logTodayMeals(false, logNotes); setLogNotes(''); }}
                  className="font-orbitron"
                  style={{
                    flex: 1,
                    padding: '10px',
                    fontSize: 9,
                    letterSpacing: '1px',
                    background: 'var(--ng-green)',
                    color: '#000',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  LOG AS PLANNED
                </button>
                <button
                  onClick={() => { logTodayMeals(true, logNotes); setLogNotes(''); }}
                  className="font-orbitron"
                  style={{
                    padding: '10px 16px',
                    fontSize: 9,
                    letterSpacing: '1px',
                    background: 'transparent',
                    color: 'var(--ng-amber)',
                    border: '1px solid var(--ng-amber)',
                    borderRadius: 8,
                    cursor: 'pointer',
                  }}
                >
                  🍔 CHEAT DAY
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'rgba(0,255,65,0.05)',
              border: '1px solid rgba(0,255,65,0.2)',
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
              textAlign: 'center',
            }}>
              <span style={{ fontSize: 20 }}>✓</span>
              <div className="font-mono" style={{ fontSize: 11, color: 'var(--ng-green)', marginTop: 4 }}>
                Today logged: {mealLog[today]?.totalKcal ?? 0} kcal {mealLog[today]?.isCheatDay && '🍔'}
              </div>
            </div>
          )}

          {/* Month Selector */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <button
              onClick={() => {
                const [y, m] = selectedLogMonth.split('-').map(Number);
                const prev = new Date(y, m - 2, 1);
                setSelectedLogMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
              }}
              style={{ background: 'none', border: 'none', color: 'var(--ng-muted)', fontSize: 16, cursor: 'pointer', padding: 8 }}
            >
              ←
            </button>
            <div className="font-orbitron" style={{ fontSize: 11, color: 'var(--ng-text)', letterSpacing: '2px' }}>
              {new Date(selectedLogMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
            </div>
            <button
              onClick={() => {
                const [y, m] = selectedLogMonth.split('-').map(Number);
                const next = new Date(y, m, 1);
                setSelectedLogMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
              }}
              style={{ background: 'none', border: 'none', color: 'var(--ng-muted)', fontSize: 16, cursor: 'pointer', padding: 8 }}
            >
              →
            </button>
          </div>

          {/* Calendar Grid */}
          <div style={{
            background: 'var(--ng-surface)',
            border: '1px solid var(--ng-border)',
            borderRadius: 12,
            padding: 12,
            marginBottom: 16,
          }}>
            {/* Day headers */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', textAlign: 'center' }}>{d}</div>
              ))}
            </div>
            {/* Calendar days */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {(() => {
                const [year, month] = selectedLogMonth.split('-').map(Number);
                const firstDay = new Date(year, month - 1, 1).getDay();
                const daysInMonth = new Date(year, month, 0).getDate();
                const cells = [];

                // Empty cells before first day
                for (let i = 0; i < firstDay; i++) {
                  cells.push(<div key={`empty-${i}`} />);
                }

                // Day cells
                for (let day = 1; day <= daysInMonth; day++) {
                  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const entry = mealLog[dateStr];
                  const isToday = dateStr === today;

                  // Get habits completed for this day
                  const dayHabitTimes = habitTimes[dateStr] || {};
                  const habitsCount = Object.keys(dayHabitTimes).length;
                  const completedHabitNames = habits
                    .filter(h => dayHabitTimes[h.id])
                    .map(h => h.name)
                    .join(', ');

                  let bgColor = 'transparent';
                  let borderColor = 'var(--ng-border)';
                  if (entry) {
                    if (entry?.isCheatDay) {
                      bgColor = 'rgba(255,184,0,0.2)';
                      borderColor = 'var(--ng-amber)';
                    } else if ((entry?.totalKcal ?? 0) <= 1150) {
                      bgColor = 'rgba(0,255,65,0.15)';
                      borderColor = 'var(--ng-green)';
                    } else if ((entry?.totalKcal ?? 0) <= 1400) {
                      bgColor = 'rgba(0,212,255,0.15)';
                      borderColor = 'var(--ng-cyan)';
                    } else {
                      bgColor = 'rgba(255,71,87,0.15)';
                      borderColor = 'var(--ng-red)';
                    }
                  }

                  // Build tooltip
                  const tooltipParts = [];
                  if (entry) {
                    tooltipParts.push(`${entry?.totalKcal ?? 0} kcal${entry?.isCheatDay ? ' (cheat)' : ''}`);
                    if (entry?.notes) tooltipParts.push(entry.notes);
                  }
                  if (habitsCount > 0) {
                    tooltipParts.push(`Habits: ${completedHabitNames}`);
                  }

                  cells.push(
                    <div
                      key={day}
                      style={{
                        aspectRatio: '1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: bgColor,
                        border: `1px solid ${isToday ? 'var(--ng-cyan)' : borderColor}`,
                        borderRadius: 6,
                        cursor: (entry || habitsCount > 0) ? 'pointer' : 'default',
                        position: 'relative',
                      }}
                      title={tooltipParts.join(' • ')}
                    >
                      <div className="font-mono" style={{ fontSize: 10, color: isToday ? 'var(--ng-cyan)' : 'var(--ng-text)' }}>{day}</div>
                      {entry && (
                        <div className="font-mono" style={{ fontSize: 7, color: 'var(--ng-muted)' }}>
                          {entry?.isCheatDay ? '🍔' : entry?.totalKcal ?? 0}
                        </div>
                      )}
                      {/* Habits indicator dot */}
                      {habitsCount > 0 && (
                        <div style={{
                          position: 'absolute',
                          top: 2,
                          right: 2,
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'var(--ng-green)',
                          fontSize: 5,
                        }} />
                      )}
                    </div>
                  );
                }

                return cells;
              })()}
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, background: 'rgba(0,255,65,0.15)', border: '1px solid var(--ng-green)', borderRadius: 3 }} />
              ≤1150
            </div>
            <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, background: 'rgba(0,212,255,0.15)', border: '1px solid var(--ng-cyan)', borderRadius: 3 }} />
              ≤1400
            </div>
            <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, background: 'rgba(255,71,87,0.15)', border: '1px solid var(--ng-red)', borderRadius: 3 }} />
              &gt;1400
            </div>
            <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 12, height: 12, background: 'rgba(255,184,0,0.2)', border: '1px solid var(--ng-amber)', borderRadius: 3 }} />
              Cheat
            </div>
            <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, background: 'var(--ng-green)', borderRadius: '50%' }} />
              Habits
            </div>
          </div>

          {/* Recent Logs */}
          <div style={{ marginTop: 20 }}>
            <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-cyan)', letterSpacing: '2px', marginBottom: 10 }}>
              📅 RECENT ENTRIES
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {Object.entries(mealLog)
                .sort(([a], [b]) => b.localeCompare(a))
                .slice(0, 10)
                .map(([date, entry]) => {
                  // Get completed habits for this date
                  const dayHabitTimes = habitTimes[date] || {};
                  const completedHabitIds = Object.keys(dayHabitTimes);
                  const completedHabits = habits.filter(h => completedHabitIds.includes(h.id));
                  const isEditing = editingLogDate === date;

                  return (
                    <div
                      key={date}
                      style={{
                        padding: '10px 12px',
                        marginBottom: 6,
                        background: isEditing ? 'var(--ng-bg)' : 'var(--ng-surface)',
                        border: `1px solid ${isEditing ? 'var(--ng-cyan)' : 'var(--ng-border)'}`,
                        borderRadius: 8,
                      }}
                    >
                      {isEditing ? (
                        /* Edit Mode */
                        <div>
                          <div className="font-mono" style={{ fontSize: 11, color: 'var(--ng-cyan)', marginBottom: 10 }}>
                            ✏️ Editing {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {/* Calories */}
                            <div>
                              <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', marginBottom: 4 }}>TOTAL CALORIES</div>
                              <input
                                type="number"
                                value={editLogKcal}
                                onChange={e => setEditLogKcal(e.target.value)}
                                className="ng-input"
                                style={{ width: '100%', fontSize: 14, padding: '8px 10px' }}
                              />
                            </div>
                            {/* Cheat day toggle */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <button
                                onClick={() => setEditLogCheat(!editLogCheat)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: 11,
                                  background: editLogCheat ? 'rgba(255,184,0,0.15)' : 'transparent',
                                  border: `1px solid ${editLogCheat ? 'var(--ng-amber)' : 'var(--ng-border)'}`,
                                  color: editLogCheat ? 'var(--ng-amber)' : 'var(--ng-muted)',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                }}
                              >
                                {editLogCheat ? '🍔 CHEAT DAY' : '🥗 NORMAL DAY'}
                              </button>
                            </div>
                            {/* Notes */}
                            <div>
                              <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', marginBottom: 4 }}>NOTES</div>
                              <input
                                type="text"
                                value={editLogNotes}
                                onChange={e => setEditLogNotes(e.target.value)}
                                placeholder="Optional notes..."
                                className="ng-input"
                                style={{ width: '100%', fontSize: 11, padding: '8px 10px' }}
                              />
                            </div>
                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                onClick={saveEditLog}
                                className="font-orbitron"
                                style={{
                                  flex: 1,
                                  padding: '10px',
                                  fontSize: 10,
                                  background: 'var(--ng-green)',
                                  color: '#000',
                                  border: 'none',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                }}
                              >
                                SAVE
                              </button>
                              <button
                                onClick={() => setEditingLogDate(null)}
                                style={{
                                  padding: '10px 14px',
                                  fontSize: 10,
                                  background: 'transparent',
                                  color: 'var(--ng-muted)',
                                  border: '1px solid var(--ng-border)',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                }}
                              >
                                CANCEL
                              </button>
                              <button
                                onClick={() => { deleteLogEntry(date); setEditingLogDate(null); }}
                                style={{
                                  padding: '10px 14px',
                                  fontSize: 10,
                                  background: 'transparent',
                                  color: 'var(--ng-red)',
                                  border: '1px solid var(--ng-red)',
                                  borderRadius: 6,
                                  cursor: 'pointer',
                                }}
                              >
                                DELETE
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* View Mode */
                        <>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <div className="font-mono" style={{ fontSize: 11, color: 'var(--ng-text)' }}>
                                {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                {entry?.isCheatDay && ' 🍔'}
                              </div>
                              {entry?.notes && (
                                <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>{entry.notes}</div>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="font-orbitron" style={{
                                fontSize: 12,
                                color: entry?.isCheatDay ? 'var(--ng-amber)' : (entry?.totalKcal ?? 0) <= 1150 ? 'var(--ng-green)' : (entry?.totalKcal ?? 0) <= 1400 ? 'var(--ng-cyan)' : 'var(--ng-red)',
                              }}>
                                {entry?.totalKcal ?? 0} kcal
                              </div>
                              <button
                                onClick={() => startEditLog(date)}
                                style={{
                                  padding: '4px 8px',
                                  fontSize: 10,
                                  background: 'transparent',
                                  color: 'var(--ng-muted)',
                                  border: '1px solid var(--ng-border)',
                                  borderRadius: 4,
                                  cursor: 'pointer',
                                }}
                              >
                                ✏️
                              </button>
                            </div>
                          </div>
                          {/* Completed habits for this day */}
                          {completedHabits.length > 0 && (
                            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--ng-border)' }}>
                              <div className="font-mono" style={{ fontSize: 8, color: 'var(--ng-muted)', marginBottom: 4 }}>
                                HABITS COMPLETED ({completedHabits.length})
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {completedHabits.map(habit => (
                                  <div
                                    key={habit.id}
                                    title={habit.name}
                                    style={{
                                      padding: '3px 6px',
                                      background: 'rgba(0,255,65,0.1)',
                                      border: '1px solid rgba(0,255,65,0.2)',
                                      borderRadius: 4,
                                      fontSize: 10,
                                    }}
                                  >
                                    {habit.icon}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              {Object.keys(mealLog).length === 0 && (
                <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', textAlign: 'center', padding: 20 }}>
                  No entries yet. Start logging your meals!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          PLAN VIEW
          ══════════════════════════════════════════════════════════════════════════ */}
      {viewMode === 'plan' && (
        <>
      {/* Fasting encouragement banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(255,184,0,0.08), rgba(0,212,255,0.05))',
        border: '1px solid rgba(255,184,0,0.2)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>⏰</span>
          <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-amber)', letterSpacing: '2px' }}>
            FASTING WINDOW
          </div>
        </div>
        <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-text)', lineHeight: 1.6, marginBottom: 8 }}>
          {randomTip}
        </div>
        <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', fontStyle: 'italic' }}>
          💡 {randomMindful}
        </div>
      </div>

      {/* Daily mindful quote */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,255,65,0.06), rgba(0,212,255,0.04))',
        border: '1px solid rgba(0,255,65,0.15)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 18 }}>🌿</span>
          <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-green)', letterSpacing: '2px' }}>
            TODAY&apos;S WISDOM • DAY {dayOfYear}
          </div>
        </div>
        <div className="font-mono" style={{
          fontSize: 11,
          color: 'var(--ng-text)',
          lineHeight: 1.6,
          fontStyle: 'italic',
        }}>
          &ldquo;{dailyQuote.text}&rdquo;
        </div>
        <div className="font-mono" style={{
          fontSize: 9,
          color: 'var(--ng-cyan)',
          marginTop: 6,
          textAlign: 'right',
        }}>
          — {dailyQuote.author}
        </div>
      </div>

      {/* Today's Meals Checklist */}
      {(() => {
        // Get today's day index (Mon=0, Tue=1, ... Sun=6)
        const dow = new Date().getDay();
        const dayMap: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };
        const todayIdx = dayMap[dow];
        const todayMeals = plan.days[todayIdx];
        const todayName = DAY_NAMES[todayIdx];
        const todayDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        const mealSlots = [
          { key: 'breakfast', label: '🌅 BREAKFAST', time: '9:00 AM', items: todayMeals?.breakfast || [] },
          { key: 'lunch', label: '☀️ LUNCH', time: '3:00 PM', items: todayMeals?.lunch || [] },
          { key: 'dinner', label: '🌙 DINNER', time: '10:00 PM', items: todayMeals?.dinner || [] },
          { key: 'snack', label: '🥜 SNACK', time: 'Anytime', items: todayMeals?.snack || [] },
        ];

        const mainMeals = mealSlots.slice(0, 3);
        const completedCount = mainMeals.filter(s => mealChecks[s.key]).length;
        const totalKcalToday = mealSlots.reduce((sum, slot) => sum + slot.items.reduce((s, m) => s + m.kcal, 0), 0);

        return (
          <div style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.08), rgba(191,0,255,0.05))',
            border: '1px solid rgba(0,212,255,0.2)',
            borderRadius: 12,
            padding: 14,
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>✅</span>
                <div>
                  <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-cyan)', letterSpacing: '2px' }}>
                    TODAY&apos;S MEALS • {todayName}
                  </div>
                  <div className="font-mono" style={{ fontSize: 8, color: 'var(--ng-muted)' }}>
                    {todayDate} • {totalKcalToday} kcal planned
                  </div>
                </div>
              </div>
              <div className="font-mono" style={{
                fontSize: 10,
                color: completedCount === 3 ? 'var(--ng-green)' : 'var(--ng-amber)',
              }}>
                {completedCount}/3 done
              </div>
            </div>

            {mealSlots.map((slot) => {
              const isChecked = mealChecks[slot.key] || false;
              const mealText = slot.items.length > 0
                ? slot.items.map(m => m.name).join(', ')
                : 'No meal planned';
              const totalKcal = slot.items.reduce((sum, m) => sum + m.kcal, 0);

              return (
                <div
                  key={slot.key}
                  onClick={() => toggleMealCheck(slot.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    padding: '12px 10px',
                    marginBottom: 8,
                    background: isChecked ? 'rgba(0,255,65,0.08)' : 'rgba(0,0,0,0.2)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    border: `1px solid ${isChecked ? 'rgba(0,255,65,0.3)' : 'var(--ng-border)'}`,
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Checkbox */}
                  <div style={{
                    width: 22,
                    height: 22,
                    border: `2px solid ${isChecked ? 'var(--ng-green)' : 'var(--ng-muted)'}`,
                    borderRadius: 4,
                    background: isChecked ? 'var(--ng-green)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}>
                    {isChecked && <span style={{ color: '#000', fontSize: 12, fontWeight: 900 }}>✓</span>}
                  </div>

                  {/* Meal info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div className="font-orbitron" style={{
                        fontSize: 9,
                        color: isChecked ? 'var(--ng-green)' : 'var(--ng-text)',
                        letterSpacing: '1px',
                        textDecoration: isChecked ? 'line-through' : 'none',
                        opacity: isChecked ? 0.7 : 1,
                      }}>
                        {slot.label}
                      </div>
                      <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>
                        {slot.time}
                      </div>
                    </div>
                    <div className="font-mono" style={{
                      fontSize: 11,
                      color: isChecked ? 'var(--ng-muted)' : 'var(--ng-text)',
                      lineHeight: 1.5,
                      textDecoration: isChecked ? 'line-through' : 'none',
                      opacity: isChecked ? 0.6 : 1,
                    }}>
                      {mealText}
                    </div>
                    {totalKcal > 0 && (
                      <div className="font-mono" style={{
                        fontSize: 9,
                        color: 'var(--ng-amber)',
                        marginTop: 4,
                        opacity: isChecked ? 0.5 : 1,
                      }}>
                        {totalKcal} kcal
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {completedCount === 3 && (
              <div className="font-mono" style={{
                textAlign: 'center',
                fontSize: 10,
                color: 'var(--ng-green)',
                marginTop: 8,
                padding: 8,
                background: 'rgba(0,255,65,0.1)',
                borderRadius: 6,
              }}>
                🎉 All meals completed! Great job staying on plan.
              </div>
            )}

            {/* Log Meal Button */}
            {!showLogPrompt ? (
              <button
                onClick={() => setShowLogPrompt(true)}
                className="font-orbitron"
                style={{
                  width: '100%',
                  marginTop: 12,
                  padding: '12px',
                  fontSize: 10,
                  letterSpacing: '1px',
                  background: mealLog[today] ? 'transparent' : 'transparent',
                  color: mealLog[today] ? 'var(--ng-cyan)' : 'var(--ng-green)',
                  border: `1px solid ${mealLog[today] ? 'var(--ng-cyan)' : 'var(--ng-green)'}`,
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                {mealLog[today] ? (
                  <>✓ Logged: {mealLog[today]?.totalKcal ?? 0} kcal {mealLog[today]?.isCheatDay && '🍔'} • TAP TO UPDATE</>
                ) : (
                  <>📝 LOG MEAL</>
                )}
              </button>
            ) : (
              <div style={{ marginTop: 12, background: 'var(--ng-bg)', borderRadius: 8, padding: 12 }}>
                <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', marginBottom: 8 }}>
                  {mealLog[today] ? 'Updating: ' : 'Logging: '}{Object.entries(mealChecks).filter(([, v]) => v).map(([k]) => k).join(', ') || 'All meals'} + snacks
                </div>
                <input
                  value={logPromptNote}
                  onChange={(e) => setLogPromptNote(e.target.value)}
                  placeholder="Add a note (optional)..."
                  className="ng-input"
                  style={{ width: '100%', fontSize: 11, padding: '8px 10px', marginBottom: 8 }}
                  autoFocus
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => {
                      logTodayMeals(false, logPromptNote, mealChecks);
                      setShowLogPrompt(false);
                      setLogPromptNote('');
                    }}
                    className="font-orbitron"
                    style={{
                      flex: 1,
                      padding: '10px',
                      fontSize: 9,
                      background: 'var(--ng-green)',
                      color: '#000',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    {mealLog[today] ? 'UPDATE LOG' : 'SAVE LOG'}
                  </button>
                  <button
                    onClick={() => {
                      logTodayMeals(true, logPromptNote, mealChecks);
                      setShowLogPrompt(false);
                      setLogPromptNote('');
                    }}
                    className="font-orbitron"
                    style={{
                      padding: '10px 12px',
                      fontSize: 9,
                      background: 'transparent',
                      color: 'var(--ng-amber)',
                      border: '1px solid var(--ng-amber)',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    🍔 CHEAT
                  </button>
                  <button
                    onClick={() => { setShowLogPrompt(false); setLogPromptNote(''); }}
                    style={{
                      padding: '10px 12px',
                      fontSize: 9,
                      background: 'transparent',
                      color: 'var(--ng-muted)',
                      border: '1px solid var(--ng-border)',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Day selector */}
      <div style={{
        display: 'flex',
        gap: 4,
        marginBottom: 16,
        overflowX: 'auto',
        paddingBottom: 4,
      }}>
        {DAY_NAMES.map((name, i) => {
          const total = getDayTotal(i);
          const isSelected = selectedDay === i;
          return (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className="font-orbitron"
              style={{
                flex: '1 0 auto',
                minWidth: 44,
                padding: '8px 6px',
                fontSize: 8,
                letterSpacing: '1px',
                background: isSelected ? 'var(--ng-cyan)' : 'var(--ng-surface)',
                color: isSelected ? '#000' : 'var(--ng-muted)',
                border: `1px solid ${isSelected ? 'var(--ng-cyan)' : 'var(--ng-border)'}`,
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              <div>{name}</div>
              <div style={{
                fontSize: 7,
                marginTop: 2,
                color: isSelected ? '#000' : (total > 1150 ? '#FF6B6B' : total < 1050 ? 'var(--ng-amber)' : 'var(--ng-green)'),
              }}>
                {total}
              </div>
            </button>
          );
        })}
      </div>

      {/* Day total */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 14px',
        background: todayTotal > 1150 ? 'rgba(255,107,107,0.1)' : todayTotal < 1050 ? 'rgba(255,184,0,0.1)' : 'rgba(0,255,65,0.05)',
        borderRadius: 8,
        marginBottom: 16,
      }}>
        <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-text)', letterSpacing: '2px' }}>
          DAY {selectedDay + 1} TOTAL
        </div>
        <div className="font-orbitron" style={{
          fontSize: 14,
          color: todayTotal > 1150 ? '#FF6B6B' : todayTotal < 1050 ? 'var(--ng-amber)' : 'var(--ng-green)',
          letterSpacing: '1px',
        }}>
          {todayTotal} kcal
        </div>
      </div>

      {/* Meals for selected day */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {MEAL_TYPES.map((type) => {
          const meals = plan.days[selectedDay][type];
          const mealTotal = meals.reduce((s, m) => s + m.kcal, 0);

          return (
            <div
              key={type}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(selectedDay, type)}
              style={{
                background: 'var(--ng-surface)',
                border: `1px solid ${dragItem && dragItem.type !== type ? 'var(--ng-cyan)' : 'var(--ng-border)'}`,
                borderRadius: 12,
                overflow: 'hidden',
              }}
            >
              {/* Meal type header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: 'rgba(0,0,0,0.2)',
                borderBottom: '1px solid var(--ng-border)',
              }}>
                <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-text)', letterSpacing: '1px' }}>
                  {MEAL_LABELS[type]}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="font-mono" style={{ fontSize: 10, color: 'var(--ng-amber)' }}>
                    {mealTotal} kcal
                  </span>
                  <button
                    onClick={() => addMeal(selectedDay, type)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--ng-cyan)',
                      fontSize: 16,
                      cursor: 'pointer',
                      padding: '0 4px',
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Meal items */}
              <div style={{ padding: meals.length > 0 ? '8px' : 0 }}>
                {meals.map((meal, idx) => (
                  <div
                    key={meal.id}
                    draggable
                    onDragStart={() => handleDragStart(selectedDay, type, idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 8px',
                      background: dragItem?.day === selectedDay && dragItem?.type === type && dragItem?.idx === idx
                        ? 'rgba(0,212,255,0.1)'
                        : 'transparent',
                      borderRadius: 6,
                      cursor: 'grab',
                      marginBottom: idx < meals.length - 1 ? 4 : 0,
                    }}
                  >
                    <span style={{ fontSize: 12, color: 'var(--ng-muted)', cursor: 'grab' }}>⋮⋮</span>

                    {editingMeal?.day === selectedDay && editingMeal?.type === type && editingMeal?.idx === idx ? (
                      <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="ng-input"
                          style={{ flex: 1, fontSize: 11, padding: '6px 8px' }}
                          autoFocus
                        />
                        <input
                          value={editKcal}
                          onChange={(e) => setEditKcal(e.target.value)}
                          className="ng-input"
                          style={{ width: 60, fontSize: 11, padding: '6px 8px', textAlign: 'right' }}
                          type="number"
                        />
                        <button onClick={saveEdit} style={{ background: 'var(--ng-green)', color: '#000', border: 'none', borderRadius: 4, padding: '0 8px', fontSize: 10, cursor: 'pointer' }}>✓</button>
                        <button onClick={() => setEditingMeal(null)} style={{ background: 'var(--ng-surface)', color: 'var(--ng-muted)', border: '1px solid var(--ng-border)', borderRadius: 4, padding: '0 8px', fontSize: 10, cursor: 'pointer' }}>✕</button>
                      </div>
                    ) : (
                      <>
                        <div
                          style={{ flex: 1, cursor: 'pointer' }}
                          onClick={() => startEdit(selectedDay, type, idx)}
                        >
                          <div className="font-mono" style={{ fontSize: 11, color: 'var(--ng-text)', lineHeight: 1.4 }}>
                            {meal.name}
                          </div>
                        </div>
                        <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-amber)', flexShrink: 0 }}>
                          {meal.kcal}
                        </div>
                        <button
                          onClick={() => deleteMeal(selectedDay, type, idx)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--ng-muted)',
                            fontSize: 12,
                            cursor: 'pointer',
                            padding: '0 4px',
                            opacity: 0.5,
                          }}
                        >
                          ×
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {meals.length === 0 && (
                  <div style={{ padding: '16px 8px', textAlign: 'center' }}>
                    <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>
                      Drag items here or tap + to add
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Meal Picker Modal */}
      {addingToSlot && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setAddingToSlot(null)}
        >
          <div
            style={{
              background: 'var(--ng-bg)',
              border: '1px solid var(--ng-border)',
              borderRadius: 16,
              padding: 20,
              width: '100%',
              maxWidth: 400,
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="font-orbitron" style={{ fontSize: 11, color: 'var(--ng-cyan)', letterSpacing: '2px' }}>
                ADD TO {MEAL_LABELS[addingToSlot.type].toUpperCase()} • {DAY_NAMES[addingToSlot.day]}
              </div>
              <button
                onClick={() => setAddingToSlot(null)}
                style={{ background: 'none', border: 'none', color: 'var(--ng-muted)', fontSize: 18, cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Saved meals section */}
            {(plan.savedMeals || []).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-green)', letterSpacing: '1px', marginBottom: 10 }}>
                  ⭐ MY SAVED MEALS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(plan.savedMeals || []).map((meal) => (
                    <button
                      key={meal.id}
                      onClick={() => addSavedMealToSlot(meal)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 14px',
                        background: 'var(--ng-surface)',
                        border: '1px solid var(--ng-border)',
                        borderRadius: 8,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <span className="font-mono" style={{ fontSize: 12, color: 'var(--ng-text)' }}>{meal.name}</span>
                      <span className="font-mono" style={{ fontSize: 11, color: 'var(--ng-amber)' }}>{meal.kcal} kcal</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom meal input */}
            <div>
              <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-muted)', letterSpacing: '1px', marginBottom: 10 }}>
                ✏️ ADD CUSTOM
              </div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input
                  value={customMealName}
                  onChange={(e) => setCustomMealName(e.target.value)}
                  placeholder="Meal name..."
                  className="ng-input"
                  style={{ flex: 2, fontSize: 12, padding: '10px 12px' }}
                  autoFocus
                />
                <input
                  value={customMealKcal}
                  onChange={(e) => setCustomMealKcal(e.target.value.replace(/\D/g, ''))}
                  placeholder="kcal"
                  className="ng-input"
                  style={{ flex: 1, fontSize: 12, padding: '10px 12px' }}
                  type="number"
                />
              </div>
              <button
                onClick={addCustomMealToSlot}
                disabled={!customMealName.trim()}
                className="font-orbitron"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: 10,
                  letterSpacing: '1px',
                  background: customMealName.trim() ? 'var(--ng-cyan)' : 'var(--ng-surface)',
                  color: customMealName.trim() ? '#000' : 'var(--ng-muted)',
                  border: 'none',
                  borderRadius: 8,
                  cursor: customMealName.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                ADD CUSTOM MEAL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button
          onClick={() => setShowShopping(!showShopping)}
          className="font-orbitron"
          style={{
            flex: 1,
            padding: '10px',
            fontSize: 8,
            letterSpacing: '1px',
            background: showShopping ? 'var(--ng-green)' : 'var(--ng-surface)',
            color: showShopping ? '#000' : 'var(--ng-text)',
            border: '1px solid var(--ng-border)',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          🛒 SHOPPING LIST
        </button>
        <button
          onClick={() => setShowSwaps(!showSwaps)}
          className="font-orbitron"
          style={{
            flex: 1,
            padding: '10px',
            fontSize: 8,
            letterSpacing: '1px',
            background: showSwaps ? 'var(--ng-amber)' : 'var(--ng-surface)',
            color: showSwaps ? '#000' : 'var(--ng-text)',
            border: '1px solid var(--ng-border)',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          🔄 SWAPS
        </button>
        <button
          onClick={() => setShowTips(!showTips)}
          className="font-orbitron"
          style={{
            flex: 1,
            padding: '10px',
            fontSize: 8,
            letterSpacing: '1px',
            background: showTips ? 'var(--ng-cyan)' : 'var(--ng-surface)',
            color: showTips ? '#000' : 'var(--ng-text)',
            border: '1px solid var(--ng-border)',
            borderRadius: 8,
            cursor: 'pointer',
          }}
        >
          💡 TIPS
        </button>
      </div>

      {/* Shopping List Panel */}
      {showShopping && (
        <div style={{ marginTop: 16, background: 'var(--ng-surface)', border: '1px solid var(--ng-border)', borderRadius: 12, padding: 14 }}>
          <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-green)', letterSpacing: '2px', marginBottom: 12 }}>
            🛒 WEEKLY SHOPPING LIST
          </div>
          {plan.shoppingList.map((item, idx) => (
            <div
              key={idx}
              onClick={() => toggleShopping(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                borderBottom: idx < plan.shoppingList.length - 1 ? '1px solid var(--ng-border)' : 'none',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 18,
                height: 18,
                border: `1.5px solid ${item.checked ? 'var(--ng-green)' : 'var(--ng-muted)'}`,
                borderRadius: 3,
                background: item.checked ? 'var(--ng-green)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                {item.checked && <span style={{ color: '#000', fontSize: 10, fontWeight: 900 }}>✓</span>}
              </div>
              <span className="font-mono" style={{
                fontSize: 11,
                color: item.checked ? 'var(--ng-muted)' : 'var(--ng-text)',
                textDecoration: item.checked ? 'line-through' : 'none',
              }}>
                {item.item}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Swaps Panel */}
      {showSwaps && (
        <div style={{ marginTop: 16, background: 'var(--ng-surface)', border: '1px solid var(--ng-border)', borderRadius: 12, padding: 14 }}>
          <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-amber)', letterSpacing: '2px', marginBottom: 12 }}>
            🔄 CALORIE-EQUIVALENT SWAPS
          </div>
          <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', marginBottom: 12 }}>
            Any swap keeps the day within ~30 kcal of the plan
          </div>
          {plan.swaps.map((swap, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 0',
                borderBottom: idx < plan.swaps.length - 1 ? '1px solid var(--ng-border)' : 'none',
              }}
            >
              <span className="font-mono" style={{ fontSize: 10, color: 'var(--ng-text)', flex: 1 }}>{swap.from}</span>
              <span style={{ color: 'var(--ng-amber)' }}>→</span>
              <span className="font-mono" style={{ fontSize: 10, color: 'var(--ng-text)', flex: 1 }}>{swap.to}</span>
              <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', width: 70, textAlign: 'right' }}>{swap.kcal}</span>
            </div>
          ))}

          {/* Saved Meals Section */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--ng-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-green)', letterSpacing: '2px' }}>
                📋 MY SAVED MEALS
              </div>
              <button
                onClick={() => setAddingSavedMeal(!addingSavedMeal)}
                style={{
                  background: addingSavedMeal ? 'var(--ng-green)' : 'transparent',
                  border: '1px solid var(--ng-green)',
                  color: addingSavedMeal ? '#000' : 'var(--ng-green)',
                  borderRadius: 4,
                  padding: '4px 8px',
                  fontSize: 9,
                  cursor: 'pointer',
                }}
              >
                {addingSavedMeal ? '✕ CANCEL' : '+ ADD MEAL'}
              </button>
            </div>

            {/* Add new meal form */}
            {addingSavedMeal && (
              <div style={{ background: 'rgba(0,255,65,0.05)', border: '1px solid rgba(0,255,65,0.2)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <input
                    value={newMealName}
                    onChange={(e) => setNewMealName(e.target.value)}
                    placeholder="Meal name (e.g., Jollof rice)"
                    className="ng-input"
                    style={{ flex: 1, fontSize: 11, padding: '8px 10px' }}
                    autoFocus
                  />
                  <input
                    value={newMealKcal}
                    onChange={(e) => setNewMealKcal(e.target.value)}
                    placeholder="kcal"
                    type="number"
                    className="ng-input"
                    style={{ width: 70, fontSize: 11, padding: '8px 10px', textAlign: 'right' }}
                  />
                </div>
                <button
                  onClick={addSavedMeal}
                  disabled={!newMealName.trim() || !newMealKcal.trim()}
                  className="font-orbitron"
                  style={{
                    width: '100%',
                    padding: '8px',
                    fontSize: 9,
                    letterSpacing: '1px',
                    background: newMealName.trim() && newMealKcal.trim() ? 'var(--ng-green)' : 'var(--ng-surface)',
                    color: newMealName.trim() && newMealKcal.trim() ? '#000' : 'var(--ng-muted)',
                    border: '1px solid var(--ng-border)',
                    borderRadius: 6,
                    cursor: newMealName.trim() && newMealKcal.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  SAVE TO LIBRARY
                </button>
              </div>
            )}

            <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', marginBottom: 10 }}>
              Tap a meal to add it to {DAY_NAMES[selectedDay]}&apos;s plan
            </div>

            {/* Saved meals list - scrollable */}
            {(plan.savedMeals || []).length === 0 ? (
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', textAlign: 'center', padding: 16, opacity: 0.6 }}>
                No saved meals yet. Add your favorites above!
              </div>
            ) : (
              <div style={{ maxHeight: 240, overflowY: 'auto', paddingRight: 4 }}>
              {(plan.savedMeals || []).map((meal) => (
                <div
                  key={meal.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 8px',
                    marginBottom: 4,
                    background: addToMealType && addToMealType === meal.id ? 'rgba(0,255,65,0.1)' : 'transparent',
                    borderRadius: 6,
                    border: '1px solid var(--ng-border)',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div className="font-mono" style={{ fontSize: 11, color: 'var(--ng-text)' }}>{meal.name}</div>
                    <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-amber)' }}>{meal.kcal} kcal</div>
                  </div>

                  {/* Quick add buttons */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {MEAL_TYPES.map((type) => (
                      <button
                        key={type}
                        onClick={() => addSavedMealToDay(meal, type)}
                        title={`Add to ${type}`}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--ng-border)',
                          color: 'var(--ng-cyan)',
                          borderRadius: 4,
                          padding: '4px 6px',
                          fontSize: 10,
                          cursor: 'pointer',
                        }}
                      >
                        {type === 'breakfast' ? '🌅' : type === 'lunch' ? '☀️' : type === 'dinner' ? '🌙' : '🥜'}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => deleteSavedMeal(meal.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--ng-muted)',
                      fontSize: 14,
                      cursor: 'pointer',
                      padding: '0 4px',
                      opacity: 0.5,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tips Panel */}
      {showTips && (
        <div style={{ marginTop: 16, background: 'var(--ng-surface)', border: '1px solid var(--ng-border)', borderRadius: 12, padding: 14 }}>
          <div className="font-orbitron" style={{ fontSize: 9, color: 'var(--ng-cyan)', letterSpacing: '2px', marginBottom: 12 }}>
            💡 ACCURACY & MINDFUL EATING TIPS
          </div>
          <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-text)', lineHeight: 1.8 }}>
            <div style={{ marginBottom: 12 }}>
              <strong style={{ color: 'var(--ng-amber)' }}>Measure oil.</strong> Each tablespoon is ~120 kcal — the biggest swing in any day.
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong style={{ color: 'var(--ng-amber)' }}>Weigh yam</strong> for the first few days until you can judge 200g by eye.
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong style={{ color: 'var(--ng-amber)' }}>Watch akamu add-ins.</strong> Sugar, milk powder and evaporated milk add up fast.
            </div>
            <div style={{ marginBottom: 16 }}>
              <strong style={{ color: 'var(--ng-amber)' }}>Stews and soups</strong> made in a big pot carry more oil per serving than you think. Skim the top before serving.
            </div>
            <div style={{ padding: 12, background: 'rgba(0,212,255,0.1)', borderRadius: 8, borderLeft: '3px solid var(--ng-cyan)' }}>
              <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-cyan)', letterSpacing: '2px', marginBottom: 6 }}>MINDFUL EATING</div>
              <div style={{ color: 'var(--ng-muted)', lineHeight: 1.7 }}>
                • Eat without distractions — no phone or TV<br />
                • Chew thoroughly, savor each bite<br />
                • Stop at 80% full (hara hachi bu)<br />
                • Wait 20 mins before seconds<br />
                • Drink water before meals
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset button */}
      <button
        onClick={resetPlan}
        className="font-orbitron w-full"
        style={{
          marginTop: 16,
          padding: '10px',
          fontSize: 8,
          letterSpacing: '2px',
          background: 'transparent',
          color: 'var(--ng-muted)',
          border: '1px solid var(--ng-border)',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        ↺ RESET TO DEFAULT PLAN
      </button>
        </>
      )}
    </div>
  );
}
