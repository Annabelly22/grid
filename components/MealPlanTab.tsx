'use client';
import { useState, useEffect, useCallback } from 'react';
import { Storage } from '../lib/storage';
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

  // Load from storage on mount
  useEffect(() => {
    const saved = Storage.getMealPlan?.() as MealPlan | null;
    if (saved && saved.days) setPlan(saved);
    const fh = Storage.getFastingHours?.();
    if (typeof fh === 'number') setFastingHours(fh);
  }, []);

  // Save to storage on change
  const savePlan = useCallback((newPlan: MealPlan) => {
    setPlan(newPlan);
    Storage.setMealPlan?.(newPlan);
  }, []);

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
    const newPlan = { ...plan, days: [...plan.days] };
    const dayObj = { ...newPlan.days[day] };
    dayObj[type] = [...dayObj[type], {
      id: `${type[0]}${day}-${Date.now()}`,
      name: 'New item',
      kcal: 100
    }];
    newPlan.days[day] = dayObj;
    savePlan(newPlan);
  };

  // Toggle shopping item
  const toggleShopping = (idx: number) => {
    const newPlan = { ...plan, shoppingList: [...plan.shoppingList] };
    newPlan.shoppingList[idx] = { ...newPlan.shoppingList[idx], checked: !newPlan.shoppingList[idx].checked };
    savePlan(newPlan);
  };

  // Reset to default
  const resetPlan = () => {
    if (confirm('Reset meal plan to default? This will lose any customizations.')) {
      savePlan(DEFAULT_PLAN);
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

  return (
    <div style={{ padding: '0 0 100px' }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div className="font-orbitron" style={{ fontSize: 10, color: 'var(--ng-cyan)', letterSpacing: '2px', marginBottom: 4 }}>
          🍽️ 7-DAY MEAL PLAN
        </div>
        <div className="font-mono" style={{ fontSize: 11, color: 'var(--ng-muted)' }}>
          1,100 kcal daily · Akamu & yam based
        </div>
      </div>

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
    </div>
  );
}
