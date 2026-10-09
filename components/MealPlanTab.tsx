'use client';
import { useState, useEffect, useCallback } from 'react';
import { Storage } from '../lib/storage';
import { getTodayStr } from '../lib/time';

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

// ── 365 Daily Quotes for Mindful Eating ──────────────────────────────────────
const DAILY_QUOTES: string[] = [
  // January (1-31)
  "Your body is a temple, but only if you treat it as one.",
  "Today I choose to nourish my body with intention and love.",
  "Every meal is a chance to honor your health.",
  "Slow down. Taste your food. Feel your body.",
  "You are not your cravings. You are the one who decides.",
  "Hunger is not an emergency. Pause before you eat.",
  "Your stomach is not a trash can for emotions.",
  "The food will taste the same whether you eat it fast or slow.",
  "Eating well is a form of self-respect.",
  "Today I choose foods that make me feel alive.",
  "Your future self will thank you for eating mindfully today.",
  "Nourishment is not punishment. It's self-care.",
  "Breathe before the first bite. Breathe after the last.",
  "Listen to your body. It knows what it needs.",
  "The goal is not perfection. The goal is awareness.",
  "Today I release the need to eat my feelings.",
  "One mindful meal changes everything.",
  "You deserve to feel light and energized.",
  "Emotional hunger cannot be satisfied with food.",
  "The right amount of food is whatever leaves you feeling good.",
  "Your worth is not measured in calories.",
  "Chew your food. Taste your life.",
  "Healing happens one conscious bite at a time.",
  "Stop eating when you're satisfied, not stuffed.",
  "Food is fuel, not therapy.",
  "Today I eat to live, not live to eat.",
  "Your body is listening to every choice you make.",
  "Discipline is choosing what you want most over what you want now.",
  "The pleasure of food lasts minutes. The feeling of health lasts all day.",
  "You can start over at any meal.",
  "Be present with your plate.",

  // February (32-60)
  "Your relationship with food reflects your relationship with yourself.",
  "Hunger comes in waves. Ride it out.",
  "Today I choose energy over lethargy.",
  "The best diet is the one you don't notice you're on.",
  "Respect your hunger. Respect your fullness.",
  "Food cannot fill a void that isn't in your stomach.",
  "What you eat in private shows in public.",
  "Make peace with food. It's not your enemy.",
  "The kitchen closes after dinner. Respect the boundary.",
  "Your body is smart. Trust its signals.",
  "Overeating numbs. Mindful eating heals.",
  "Today I am stronger than my cravings.",
  "Every meal is a fresh start.",
  "The goal is not to be skinny. The goal is to be healthy.",
  "Taste your food like it's the first time.",
  "You are building your body with every meal.",
  "Comfort food doesn't actually comfort you. It just distracts you.",
  "The emptiness you feel isn't hunger.",
  "Your energy is a direct reflection of what you eat.",
  "Stop. Think. Then eat.",
  "You don't need another diet. You need a new relationship with food.",
  "Today I eat with gratitude.",
  "Less on your plate, more in your life.",
  "The best time to stop eating is before you feel full.",
  "Your body deserves better than mindless snacking.",
  "What you repeatedly do becomes who you are.",
  "One healthy choice leads to another.",
  "You're not hungry. You're bored. Go do something.",
  "True hunger builds gradually. Cravings hit suddenly.",

  // March (61-91)
  "Today I choose how food makes me feel over how it tastes.",
  "Your plate is not a battlefield. Approach it with peace.",
  "The scale doesn't define you. Your choices do.",
  "Every healthy meal is an investment in your future.",
  "Mindful eating is a meditation in itself.",
  "You have the power to break any pattern.",
  "Food should energize you, not drain you.",
  "Today I give my body what it needs, not what it craves.",
  "The first bite is the most flavorful. Notice it.",
  "Eating past fullness is self-betrayal.",
  "You are one decision away from a completely different life.",
  "Stop rewarding yourself with food. You're not a dog.",
  "Your body is a reflection of your habits.",
  "Choose foods that love you back.",
  "The dinner table is not a place for stress.",
  "Healthy eating is not deprivation. It's liberation.",
  "Today I break the cycle of emotional eating.",
  "Your energy, mood, and focus all start with food.",
  "Eat for the body you want, not the emotions you have.",
  "Small portions, big satisfaction.",
  "Let go of food guilt. It serves no purpose.",
  "Your hunger is valid. Your fullness is too.",
  "The kitchen is not a therapy room.",
  "Today I am mindful of every bite.",
  "What you eat today walks and talks tomorrow.",
  "Progress happens one meal at a time.",
  "Your body is working for you. Work for it.",
  "Eating mindfully is the ultimate act of self-love.",
  "The discomfort of hunger passes. The regret of overeating lingers.",
  "Choose to feel good over feeling stuffed.",
  "Today I honor my body's signals.",

  // April (92-121)
  "Your cravings do not control you. You control them.",
  "The food will still be there tomorrow. You don't have to eat it all now.",
  "Healing your relationship with food heals your relationship with yourself.",
  "Today I choose presence over distraction.",
  "A moment on the lips doesn't have to mean anything on the hips.",
  "Your stomach is the size of your fist. Respect its limits.",
  "The goal is to feel good, not to feel nothing.",
  "Today I eat for my goals, not my feelings.",
  "Fullness is not the enemy. Overfullness is.",
  "Your future body is being built right now.",
  "Slow eating is a radical act of self-care.",
  "The best meals are the ones you remember.",
  "Food is information for your cells. Send the right message.",
  "Today I practice patience with my plate.",
  "You are allowed to leave food on your plate.",
  "Every time you resist a craving, you build discipline.",
  "Your relationship with food is a lifelong journey.",
  "Nourishment happens when you're present.",
  "The pain of discipline is less than the pain of regret.",
  "Today I choose clarity over brain fog.",
  "Treat every meal as an opportunity to heal.",
  "Your body is a garden, not a garbage disposal.",
  "What you eat in moments of weakness defines your months.",
  "Stop eating when the pleasure fades.",
  "You are building the body you'll live in for decades.",
  "Mindfulness at meals creates mindfulness in life.",
  "Today I trust my body to tell me what it needs.",
  "The empty plate is not the goal. The satisfied body is.",
  "Food should add to your life, not take from it.",
  "One conscious choice at a time.",

  // May (122-152)
  "Your body doesn't need comfort food. Your mind does.",
  "Today I eat with purpose, not habit.",
  "The dinner table is not a race track.",
  "Health is the new wealth.",
  "Stop eating to fill time. Fill time with life instead.",
  "Your diet is not a prison. It's a practice.",
  "Eat to thrive, not just to survive.",
  "Today I am grateful for food that nourishes me.",
  "The joy of eating lasts seconds. The joy of health lasts years.",
  "You don't need to clean your plate. You need to clean your habits.",
  "Every meal is a chance to show yourself love.",
  "Your body responds to what you repeatedly feed it.",
  "Eating without distraction is eating with intention.",
  "Today I choose whole foods over processed emotions.",
  "The binge is a symptom, not the problem.",
  "You're not hungry for food. You're hungry for life.",
  "Put down the fork. Pick up the feeling.",
  "Your health is an ongoing project, not a one-time goal.",
  "Food is meant to sustain life, not replace it.",
  "Today I break up with emotional eating.",
  "The calories you don't eat never have to be burned.",
  "Your body keeps a record of every choice.",
  "Craving is temporary. Regret is not.",
  "Choose foods that build, not foods that bloat.",
  "Today I eat like someone who loves themselves.",
  "Mindful eating is the opposite of mindless suffering.",
  "Your plate is a canvas. Paint it with nutrition.",
  "Hunger is information, not a command.",
  "Today I pause before I indulge.",
  "Less sugar, more sweetness in life.",
  "You are in control of every bite.",

  // June (153-182)
  "Your body is your home. Keep it clean.",
  "Today I eat to feel good, not to feel full.",
  "Every healthy meal makes the next one easier.",
  "The right foods give you the right energy.",
  "Stop eating to numb. Start eating to heal.",
  "You become what you digest.",
  "Today I choose vitality over comfort.",
  "Your plate should look like a garden, not a factory.",
  "Eating well is not about perfection. It's about direction.",
  "The refrigerator is not a medicine cabinet.",
  "Today I respect my body's boundaries.",
  "Food is not entertainment. Life is.",
  "Your energy is precious. Don't waste it on digestion.",
  "The best version of you eats mindfully.",
  "Stop eating when you're no longer hungry, not when you're full.",
  "Today I choose peace over the plate.",
  "Healthy eating is not a sacrifice. It's an upgrade.",
  "Your body doesn't lie. Listen to it.",
  "Every meal is a vote for the person you want to become.",
  "Craving sugar is craving energy. Find it elsewhere.",
  "Today I nourish my body and quiet my mind.",
  "The discomfort of change is temporary. The benefit is permanent.",
  "Put down the snack. Pick up your life.",
  "Your food choices shape your future.",
  "Mindful eating means feeling everything—including fullness.",
  "Today I prioritize how I feel over how it tastes.",
  "You are not too busy to eat well. You're too important not to.",
  "The best meal is the one that leaves you feeling great.",
  "Eating slowly is eating wisely.",
  "Today I let go of diet culture and embrace intuition.",

  // July (183-213)
  "Your body knows what it needs. Your mind often lies.",
  "Today I choose progress over perfection.",
  "The scale is not the goal. How you feel is.",
  "Stop eating to escape. Start eating to engage.",
  "Healthy eating is the foundation of a healthy life.",
  "Today I am present with every bite.",
  "Food is not a reward or a punishment.",
  "Your stomach is not an emotional support animal.",
  "The most important ingredient is awareness.",
  "Today I choose foods that give me life.",
  "Eating well is a daily practice, not a daily struggle.",
  "Your energy levels start with your fork.",
  "Stop eating for taste alone. Eat for the whole experience.",
  "Today I am mindful, not mindless.",
  "The best diet is the one that becomes invisible.",
  "Your health is your greatest asset. Protect it.",
  "Eating past fullness is borrowing energy from tomorrow.",
  "Today I honor my hunger and my fullness equally.",
  "Real food doesn't need a commercial.",
  "Your plate is a reflection of your priorities.",
  "Slow bites, steady progress.",
  "Today I release the need to eat perfectly.",
  "Food cannot solve problems it didn't create.",
  "You are one meal away from feeling better.",
  "Choose satisfaction over indulgence.",
  "Today I trust myself around food.",
  "Your body is not a project to be fixed. It's a home to be cared for.",
  "The goal is not to eat less. It's to eat right.",
  "Mindfulness turns a meal into a meditation.",
  "Today I choose foods my body thanks me for.",
  "Every healthy choice is a step forward.",

  // August (214-244)
  "Your relationship with food starts in your mind.",
  "Today I pause before I plate.",
  "The body you want is built in the kitchen.",
  "Stop eating out of habit. Start eating out of hunger.",
  "Healthy food can taste amazing. Give it a chance.",
  "Today I eat with intention, not impulse.",
  "Your best meals are the ones you're present for.",
  "Food guilt is wasted energy. Let it go.",
  "The empty feeling is not always hunger.",
  "Today I give my body premium fuel.",
  "Mindful eating is the antidote to mindless living.",
  "Your plate is a choice, not a default.",
  "Stop thinking about food. Start experiencing it.",
  "Today I choose energy that lasts.",
  "You are allowed to say no to food.",
  "The pleasure of health outweighs the pleasure of overeating.",
  "Today I break the spell of emotional eating.",
  "Your body deserves your attention, not your food.",
  "Eating is sacred. Treat it that way.",
  "Stop eating to pass time. Start living to fill time.",
  "Today I am conscious of every calorie I invite in.",
  "The refrigerator doesn't have the answers.",
  "Your hunger cues are wisdom. Honor them.",
  "Slow down. Your food isn't going anywhere.",
  "Today I choose feeling great over eating great.",
  "Nourishment is not negotiable.",
  "You control your fork. Your fork doesn't control you.",
  "The best meals leave you lighter, not heavier.",
  "Today I practice the pause between craving and eating.",
  "Food is fuel for the life you want to live.",
  "Every conscious bite is a victory.",

  // September (245-274)
  "Your body changes when your habits change.",
  "Today I release the need to finish everything on my plate.",
  "The right food makes the right mood.",
  "Stop filling your stomach to empty your mind.",
  "Healthy eating is a gift to your future self.",
  "Today I show my body compassion through food.",
  "Craving is not a command. It's a request you can decline.",
  "Your energy is a reflection of what you eat.",
  "The goal is sustainable, not spectacular.",
  "Today I treat my body like it belongs to someone I love.",
  "Food should give you energy, not steal it.",
  "Stop eating to celebrate. Start living to celebrate.",
  "Your plate is a promise to yourself.",
  "Today I choose foods that serve my goals.",
  "The best feeling is not the first bite. It's the lasting energy.",
  "Mindful eating transforms your relationship with yourself.",
  "Your body is a vessel. Fill it wisely.",
  "Today I am patient with my progress.",
  "Stop looking for happiness at the bottom of a bowl.",
  "The key to eating well is eating consciously.",
  "Your best investment is in your health.",
  "Today I honor the food and the body that receives it.",
  "Eating slowly is the ultimate form of self-respect.",
  "Food is meant to enhance life, not replace it.",
  "The cravings will pass. Your goals won't.",
  "Today I choose vibrant health.",
  "Your stomach is not a stress ball.",
  "Each meal is a fresh opportunity.",
  "Stop punishing yourself with food. Start healing yourself with food.",
  "Today I am stronger than the urge to overeat.",

  // October (275-305)
  "Your body speaks. Your job is to listen.",
  "Today I practice gratitude with every bite.",
  "The best control is self-control.",
  "Stop eating to soothe. Start living to heal.",
  "Healthy eating is a marathon, not a sprint.",
  "Today I choose long-term gains over short-term pleasures.",
  "Your health doesn't have a deadline. It has a lifetime.",
  "The meal that matters most is the next one.",
  "Stop eating when the food stops tasting amazing.",
  "Today I give myself the gift of nutrition.",
  "Your body keeps score of every choice.",
  "Mindful eating starts with a mindful moment.",
  "The only diet that works is the one you can sustain.",
  "Today I eat like the person I'm becoming.",
  "Food freedom comes from food awareness.",
  "Your fork is your most powerful tool.",
  "Stop eating for the moment. Eat for the momentum.",
  "Today I align my plate with my purpose.",
  "The answer to boredom is not the pantry.",
  "Your relationship with food is worth the work.",
  "Every meal shapes your story.",
  "Today I choose satisfaction over excess.",
  "Eating well is not about restriction. It's about expansion.",
  "Your body does so much for you. Return the favor.",
  "The pleasure of food is brief. The pleasure of health is eternal.",
  "Today I am mindful of what enters my body.",
  "Stop seeking comfort in calories.",
  "Your best meals happen when you're fully present.",
  "Healing overeating starts with understanding why.",
  "Today I trust the process of mindful eating.",
  "The scale measures weight. Your choices measure character.",

  // November (306-335)
  "Your body is built from the food you eat. Build wisely.",
  "Today I break the habit of eating without thinking.",
  "The less you eat, the more you taste.",
  "Stop eating to silence emotions. Let them speak.",
  "Healthy choices compound. So do unhealthy ones.",
  "Today I choose to feel my feelings instead of feeding them.",
  "Your meals are a mirror of your mindset.",
  "The first step to eating better is noticing how you eat now.",
  "Food cannot fix what isn't broken by hunger.",
  "Today I eat with awareness, not avoidance.",
  "Your body deserves real food, not processed promises.",
  "Mindful eating is medicine for the modern world.",
  "The goal is to feel good in your body, not just about your body.",
  "Today I slow down and savor.",
  "Every bite is a decision. Make it count.",
  "Your hunger is valid. Honor it with good food.",
  "Stop eating to fit in. Eat to feel free.",
  "Today I release the need for perfect eating.",
  "The best meals are the ones that leave you feeling whole.",
  "Your food choices ripple through your entire life.",
  "Eating mindfully means eating joyfully.",
  "Today I trust my body's wisdom.",
  "The answer to loneliness is connection, not consumption.",
  "Your health is a conversation between you and your body.",
  "Stop numbing with food. Start feeling with courage.",
  "Today I choose presence over the pantry.",
  "Every healthy meal is self-love in action.",
  "Your body is always communicating. Are you listening?",
  "The joy of eating well comes from eating with intention.",
  "Today I honor my body with every choice.",

  // December (336-366)
  "Your transformation starts on your plate.",
  "Today I give myself permission to eat peacefully.",
  "The holidays don't mean the habits stop.",
  "Stop eating to cope. Start living to thrive.",
  "Mindful eating is a year-round practice.",
  "Today I choose health over habit.",
  "Your body carries you through life. Fuel it well.",
  "The gift of health is the gift that keeps giving.",
  "Every meal is a celebration when you're present.",
  "Today I trust my body to guide my eating.",
  "Your year ends how your habits end.",
  "Stop eating to avoid feelings. Start eating to embrace them.",
  "The best resolution is the one you practice daily.",
  "Today I close the year with conscious eating.",
  "Your health is the foundation for every other goal.",
  "Mindful eating transforms not just your body, but your life.",
  "The journey of a thousand meals begins with one mindful bite.",
  "Today I reflect on how far I've come.",
  "Your relationship with food is your relationship with yourself.",
  "Every choice matters. Every meal counts.",
  "Stop waiting for motivation. Start building discipline.",
  "Today I honor my body's needs, not my mind's wants.",
  "Your health is your wealth. Invest in it daily.",
  "The end of the year is a chance to begin again.",
  "Mindful eating is the bridge between who you are and who you want to be.",
  "Today I celebrate my progress, not my perfection.",
  "Your body has carried you this far. Thank it with good food.",
  "The best meals are shared with presence.",
  "Every day is a chance to eat with intention.",
  "Today I step into a new chapter of mindful eating.",
  "Your future starts with what you eat today.",
];

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

  // Get day of year (1-365/366)
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const dailyQuote = DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length];

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
          &ldquo;{dailyQuote}&rdquo;
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
