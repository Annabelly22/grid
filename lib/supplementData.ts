// ============================================================
// GRID — Supplement, Tea & Movement Data
// Personalized for: Annabel Otutu — 22F, 5'11", 175 lbs
// 4x/week training, IF practitioner, Dallas TX
// ============================================================

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';
export type EnergyLevel = 'low' | 'medium' | 'high';
export type SupplementTiming = 'morning' | 'pre-workout' | 'afternoon' | 'evening' | 'with-meal' | 'anytime';
export type TeaCategory = 'morning' | 'focus' | 'afternoon' | 'evening' | 'fasting' | 'luteal' | 'menstrual';

export interface Supplement {
  id: string;
  name: string;
  dose: string;
  timing: SupplementTiming[];
  purpose: string;
  why: string;
  phases: CyclePhase[] | 'all';
  category: 'foundation' | 'serotonin' | 'amino' | 'adaptogen' | 'performance' | 'recovery';
  energyLevels: EnergyLevel[] | 'all';
  priority: 'critical' | 'high' | 'medium';
  color: string;
  warning?: string;
  cycleNote?: string;
}

export interface SupplementConflict {
  supplements: string[];
  risk: string;
  severity: 'critical' | 'caution';
}

export interface Tea {
  id: string;
  name: string;
  categories: TeaCategory[];
  purpose: string;
  benefit: string;
  notes: string;
  phases: CyclePhase[] | 'all';
  icon: string;
}

export interface Movement {
  id: string;
  name: string;
  tradition: string;
  duration: string;
  purpose: string;
  description: string;
  phases: CyclePhase[] | 'all';
  energyLevels: EnergyLevel[] | 'all';
  tags: string[];
}

// ─── CYCLE PHASE METADATA ────────────────────────────────────
export const CYCLE_PHASES: Record<CyclePhase, {
  label: string; days: string; color: string; bg: string; icon: string;
  headline: string; body: string; training: string; fasting: string; craving: string;
}> = {
  menstrual: {
    label: 'MENSTRUAL', days: 'Days 1–5', color: '#FF4757', bg: 'rgba(255,71,87,0.08)', icon: '🩸',
    headline: 'Reset & Restore',
    body: 'Hormones at their lowest. Day 1 can feel heavy — after day 2, energy starts rebuilding. Your body is shedding and renewing. You lose 18–24mg of iron daily right now. Estrogen is responsible for serotonin production — when it drops, mood and energy follow.',
    training: 'Day 1: rest or gentle mobility. Days 2–5: light-to-moderate. Your pain tolerance is actually higher in this phase — don\'t overthink it. Yoga and walking are your allies.',
    fasting: '16:8 is ideal. Extended fasts (20+ hrs) are harder. Be compassionate — the body is doing real metabolic work during menstruation.',
    craving: 'Cravings here are iron + serotonin driven. Magnesium, iron, and omega-3 supplementation directly address the biological root. These are not willpower failures.',
  },
  follicular: {
    label: 'FOLLICULAR', days: 'Days 6–13', color: '#00FF41', bg: 'rgba(0,255,65,0.06)', icon: '🌱',
    headline: 'Build & Push',
    body: 'Estrogen rising. Your highest-performance window. Insulin sensitivity is optimal, fat burning is elevated, cravings are lowest, energy builds toward peak. High estrogen reduces hunger, boosts muscle growth, and decreases soreness.',
    training: 'Push PRs. Heavy compound lifts. High intensity. Your body is most anabolic right now — this is the window to progress. Dr. Stacy Sims\' research supports maximal intensity here.',
    fasting: 'Best phase for extended fasts — 18:6 or 20:4 are most manageable. Hunger signals are reduced. Body handles caloric restriction most gracefully here.',
    craving: 'Cravings are at their lowest. If they surface, they\'re habit-driven not hormonal. L-Tyrosine and focus protocol handles dopamine.',
  },
  ovulatory: {
    label: 'OVULATORY', days: 'Days 14–16', color: '#FFB800', bg: 'rgba(255,184,0,0.06)', icon: '⚡',
    headline: 'Peak Performance',
    body: 'Estrogen and testosterone peak together. Your peak performance window. Flexibility is enhanced. Confidence elevated. Blood flow optimal. ⚠️ Ligament laxity increases — ACL injury risk is higher. Don\'t skip warmups.',
    training: 'Max effort. High intensity. Compete. ⚠️ Don\'t skip warmups — ACL and tendon injury risk is elevated during this phase due to hormonal ligament laxity.',
    fasting: '16:8 works well. Keep electrolytes high — hormonal fluid shifts require mineral replenishment. Blood plasma peaks, then fluid flux begins.',
    craving: 'Energy is high, cravings are low. If you feel unusually hungry, it\'s the metabolic rate increase — have protein-dense foods ready for breaking the fast.',
  },
  luteal: {
    label: 'LUTEAL', days: 'Days 17–28', color: '#BF00FF', bg: 'rgba(191,0,255,0.06)', icon: '🌙',
    headline: 'Protect & Recover',
    body: 'Progesterone rises, serotonin falls. Metabolism increases 100–200 cal/day but carb utilization drops. Cravings spike — this is biological, not willpower. When serotonin drops, your brain demands carbs to compensate. The supplement stack below intercepts this at the biochemical level.',
    training: 'Moderate intensity. Endurance and steady-state. Reduce HIIT and max strength in late luteal (days 22–28). Protein breakdown increases — prioritize recovery. Yin yoga and mobility are strategic, not lazy.',
    fasting: 'Harder than follicular — body needs more fuel. 16:8 is your target. Extended fasts not recommended late luteal. Break with protein + complex carbs to reduce craving rebound.',
    craving: 'Progesterone lowers insulin sensitivity and depletes serotonin. Your body is demanding carbs to rebuild serotonin. 5-HTP, L-Glutamine, and Magnesium intercept this cascade at the source.',
  },
};

// ─── SUPPLEMENTS ─────────────────────────────────────────────
export const SUPPLEMENTS: Supplement[] = [
  // FOUNDATION
  { id: 'vit-d3-k2', name: 'Vitamin D3 + K2', dose: '3,000–5,000 IU D3 / 100mcg K2', timing: ['morning', 'with-meal'], purpose: 'Mood, immunity, muscle recovery, bone density', why: 'Dallas sun doesn\'t guarantee adequate D3. Critical for mood regulation, immune function, and muscle recovery at 22. K2 directs calcium correctly — D3 without K2 is incomplete.', phases: 'all', category: 'foundation', energyLevels: 'all', priority: 'critical', color: '#FFB800' },
  { id: 'omega-3', name: 'Omega-3 (EPA/DHA)', dose: '2–3g daily (increase to 3g menstrual)', timing: ['with-meal'], purpose: 'Brain performance, anti-inflammatory, PMS reduction', why: 'Critical for trading brain — EPA/DHA directly support executive function and pattern recognition. Reduces menstrual cramping significantly. Dose up during menstrual phase.', phases: 'all', category: 'foundation', energyLevels: 'all', priority: 'critical', color: '#00D4FF' },
  { id: 'magnesium', name: 'Magnesium Glycinate', dose: '300–400mg (400mg luteal/menstrual)', timing: ['evening'], purpose: 'Sleep quality, cramp reduction, stress recovery', why: 'Magnesium needs rise in the luteal phase. Low magnesium explains cramps, muscle tension, mood changes, and sleep disruption. Glycinate form is most bioavailable and easiest on digestion. Your most important evening supplement.', phases: 'all', category: 'foundation', energyLevels: 'all', priority: 'critical', color: '#BF00FF' },
  { id: 'zinc', name: 'Zinc Picolinate', dose: '15–25mg', timing: ['with-meal', 'evening'], purpose: 'Hormone regulation, immune support, insulin sensitivity', why: 'Female athletes training 4x/week deplete zinc faster. Supports estrogen/progesterone balance, immune function, and recovery from compound lifts.', phases: 'all', category: 'foundation', energyLevels: 'all', priority: 'high', color: '#00FF41', warning: 'Long-term use >20mg can deplete copper — consider 1–2mg copper alongside. Do not take simultaneously with iron (compete for absorption — space at least 2 hours apart).' },
  { id: 'b-complex', name: 'B-Complex (P5P B6 form)', dose: 'Full spectrum — P5P B6 at 25–50mg', timing: ['morning'], purpose: 'Energy, serotonin conversion, mitochondrial function', why: 'B6 in P5P form is the required cofactor to convert 5-HTP → serotonin. Without it, your serotonin supplements don\'t fully convert. B vitamins power every mitochondria — essential for deep work, trading sessions, and coding.', phases: 'all', category: 'foundation', energyLevels: 'all', priority: 'critical', color: '#FFB800' },
  { id: 'creatine', name: 'Creatine Monohydrate', dose: '3–5g daily (5g follicular/ovulatory)', timing: ['anytime'], purpose: 'Lean muscle, brain energy, cognitive performance', why: 'Creatine is cognitive fuel — not just for muscles. Supports working memory and executive function for trading. Prevents muscle catabolism during IF. Most researched supplement on earth. Load 5g in follicular phase when body is most anabolic.', phases: 'all', category: 'foundation', energyLevels: 'all', priority: 'high', color: '#00FF41' },
  // SEROTONIN
  { id: '5-htp', name: '5-HTP (Griffonia Simplicifolia)', dose: '50mg (early luteal) → 100mg (days 22–28)', timing: ['evening'], purpose: 'Serotonin synthesis, craving control, mood stability', why: 'The direct biochemical answer to luteal cravings. 5-HTP bypasses the blood-brain barrier and goes straight to serotonin synthesis — more efficiently than L-Tryptophan. Start 5–7 days before your period when serotonin naturally crashes.', phases: ['luteal', 'menstrual'], category: 'serotonin', energyLevels: 'all', priority: 'critical', color: '#BF00FF', warning: 'Do NOT combine with SSRIs, antidepressants, or St. John\'s Wort — risk of serotonin syndrome. Do not exceed 100mg without medical guidance.' },
  { id: 'l-tryptophan', name: 'L-Tryptophan', dose: '500mg–1g', timing: ['evening'], purpose: 'Gradual serotonin support, sleep quality, mood baseline', why: 'The slower, gentler serotonin precursor. Most needed in the luteal and menstrual phases when serotonin naturally drops. Take away from protein-heavy meals — it competes with other amino acids for brain entry. Use as a daily baseline through luteal, or as a gentler alternative to 5-HTP during menstruation.', phases: ['luteal', 'menstrual'], category: 'serotonin', energyLevels: 'all', priority: 'medium', color: '#BF00FF' },
  { id: 'vitamin-c', name: 'Vitamin C (Serotonin Cofactor)', dose: '500mg', timing: ['morning', 'with-meal'], purpose: 'Serotonin synthesis cofactor, immune, collagen', why: 'Required cofactor for converting 5-HTP into serotonin alongside B6. Take with your serotonin stack. Also supports collagen synthesis for joint integrity and iron absorption during menstruation.', phases: 'all', category: 'foundation', energyLevels: 'all', priority: 'high', color: '#FF7F50' },
  // AMINO
  { id: 'l-tyrosine', name: 'L-Tyrosine', dose: '500–1,000mg', timing: ['morning'], purpose: 'Dopamine + norepinephrine — focus, drive, clarity', why: 'Your execute amino. Dopamine drives motivation and pattern recognition — critical for trading sessions and deep building work. Don\'t take at night — stimulating. Take before your hardest cognitive work block.', phases: ['follicular', 'ovulatory', 'menstrual', 'luteal'], category: 'amino', energyLevels: ['medium', 'high'], priority: 'high', color: '#00D4FF', warning: 'Do not combine with MAOIs. Use caution if managing thyroid conditions — L-Tyrosine is a precursor to thyroid hormones.' },
  { id: 'l-theanine', name: 'L-Theanine', dose: '100–200mg', timing: ['morning', 'afternoon'], purpose: 'Calm focus, smooth caffeine curve, anxiety reduction', why: 'Pairs with caffeine or matcha to eliminate jitters while extending focus duration. Prevents the anxiety spikes that corrupt trading decisions. Stack with morning coffee for clean, sustained alertness.', phases: 'all', category: 'amino', energyLevels: 'all', priority: 'high', color: '#00D4FF' },
  { id: 'alpha-gpc', name: 'Alpha-GPC', dose: '300–600mg', timing: ['morning'], purpose: 'Acetylcholine — memory, pattern recognition', why: 'Acetylcholine is the learning neurotransmitter. Alpha-GPC boosts it directly — sharper pattern recognition for trading, better mind-muscle connection in training, improved working memory for technical work.', phases: 'all', category: 'amino', energyLevels: ['medium', 'high'], priority: 'high', color: '#00D4FF' },
  { id: 'eaas', name: 'Full EAA Complex', dose: '10g during or around training', timing: ['pre-workout'], purpose: 'Complete muscle protein synthesis, fasted training', why: 'All 9 essential amino acids including tryptophan. Superior to BCAAs alone. Critical during fasted gym sessions to prevent catabolism. Your fasted-training insurance.', phases: 'all', category: 'amino', energyLevels: 'all', priority: 'high', color: '#00FF41' },
  { id: 'l-carnitine', name: 'L-Carnitine L-Tartrate', dose: '1–2g', timing: ['pre-workout', 'with-meal'], purpose: 'Fat transport to mitochondria, fat burning efficiency', why: 'During luteal phase fat is your primary fuel — carnitine makes burning it more efficient. Also blunts exercise-induced muscle damage. Pair with a meal or small carb source for best absorption.', phases: ['luteal', 'menstrual'], category: 'performance', energyLevels: 'all', priority: 'high', color: '#FF4757' },
  { id: 'l-glutamine', name: 'L-Glutamine', dose: '5–10g', timing: ['evening', 'with-meal'], purpose: 'Craving control, gut health, luteal recovery', why: 'One of the most underused craving-control tools. Stabilizes blood glucose, directly reduces sugar cravings. Protects gut lining during extended fasting. Increase to 10g during late luteal — recovery capacity drops this phase.', phases: ['luteal', 'menstrual'], category: 'recovery', energyLevels: 'all', priority: 'high', color: '#BF00FF' },
  { id: 'iron', name: 'Iron Bisglycinate', dose: '18–25mg + Vitamin C 500mg (take together)', timing: ['morning', 'with-meal'], purpose: 'Energy, performance, mood during menstruation', why: 'You lose 18–24mg of iron daily during menstruation. Even sub-clinical loss causes fatigue, mood disturbances, and reduced performance. Bisglycinate form — least digestive disruption. Take away from calcium. Days 1–7 only.', phases: ['menstrual'], category: 'foundation', energyLevels: 'all', priority: 'critical', color: '#FF4757' },
  { id: 'electrolytes', name: 'Electrolytes (Na, K, Mg)', dose: '1 serving', timing: ['morning', 'pre-workout'], purpose: 'Hydration, bloating management, performance', why: 'During luteal, ovulatory, and menstrual phases, hormonal fluid shifts require active electrolyte replenishment. Blood loss during menstruation depletes sodium and potassium. Reduce salt in food, increase electrolyte supplements. Critical during fasting windows to prevent headaches.', phases: ['luteal', 'ovulatory', 'menstrual'], category: 'foundation', energyLevels: 'all', priority: 'high', color: '#00D4FF' },
  { id: 'collagen-c', name: 'Collagen + Vitamin C', dose: '10–15g collagen + 500mg C', timing: ['morning'], purpose: 'Connective tissue integrity, joint support', why: 'Estrogen rises through follicular and peaks at ovulation — both phases increase collagen synthesis. Collagen peptides + Vitamin C directly support tendon, ligament, and joint integrity. Ovulatory phase carries elevated ACL injury risk due to ligament laxity — this is your structural defence. Start in follicular, intensify through ovulatory.', phases: ['ovulatory', 'follicular'], category: 'recovery', energyLevels: 'all', priority: 'high', color: '#FFB800' },
  // ADAPTOGENS
  { id: 'rhodiola', name: 'Rhodiola Rosea', dose: '200–400mg (3% rosavins standardized)', timing: ['morning'], purpose: 'Anti-fatigue, mental performance, cortisol control', why: 'Rhodiola exerts an anti-fatigue effect that increases mental performance and concentration. Take before your trading session or deep work block. Morning only — stimulating if taken late. Cycle 4–6 weeks on, 1–2 weeks off to maintain efficacy and prevent tolerance.', phases: ['follicular', 'ovulatory', 'menstrual'], category: 'adaptogen', energyLevels: ['low', 'medium'], priority: 'high', color: '#00FF41', cycleNote: '4–6 weeks on, 1–2 weeks off' },
  { id: 'ashwagandha', name: 'Ashwagandha (KSM-66)', dose: '300–600mg', timing: ['evening'], purpose: 'Cortisol reduction, sleep quality, stress resilience', why: 'Cortisol runs higher in the luteal phase. KSM-66 studies show significant improvement in sleep onset latency and sleep efficiency after 8 weeks. Your evening cortisol reset — especially during FTMO challenge weeks.', phases: ['luteal', 'menstrual'], category: 'adaptogen', energyLevels: 'all', priority: 'high', color: '#BF00FF', warning: 'May interact with thyroid medications — monitor thyroid levels if on medication. Not for use during pregnancy.', cycleNote: '8 weeks on, 2 weeks off' },
  { id: 'holy-basil', name: 'Holy Basil (Tulsi)', dose: '300–600mg or as tea', timing: ['afternoon'], purpose: 'Daytime calm focus, emotional balance, cortisol', why: 'Randomized trials show measurably lower cortisol in holy basil users. Your 2–4PM ritual. Prevents the late afternoon anxiety spike without caffeine. Excellent on reactive trading days.', phases: 'all', category: 'adaptogen', energyLevels: 'all', priority: 'medium', color: '#00FF41' },
  { id: 'lions-mane', name: 'Lion\'s Mane Mushroom', dose: '500–1,000mg', timing: ['morning'], purpose: 'Neuroplasticity, cognitive clarity, pattern recognition', why: 'Stimulates Nerve Growth Factor (NGF). Sharper pattern recognition, better working memory, clearer thinking. Serious nootropic aligned with your trading edge. 4–6 week ramp before full effect.', phases: 'all', category: 'adaptogen', energyLevels: 'all', priority: 'high', color: '#00D4FF' },
  { id: 'vitex', name: 'Vitex (Chasteberry)', dose: '400mg', timing: ['morning'], purpose: 'Progesterone balance, long-term PMS reduction', why: 'Long-game supplement — needs 2–3 months to show full effect. Supports progesterone balance, directly reducing the intensity of luteal phase cravings, mood shifts, and PMS over time. This is investing in your monthly baseline.', phases: ['luteal'], category: 'adaptogen', energyLevels: 'all', priority: 'medium', color: '#BF00FF', warning: 'Do not take if on hormonal contraceptives — may interfere with efficacy. Not for use during pregnancy or breastfeeding.' },
  { id: 'shatavari', name: 'Shatavari Root', dose: '500–1,000mg', timing: ['morning', 'with-meal'], purpose: 'Female hormone balance, cycle regularity, stress resilience', why: 'Ayurvedic adaptogen specifically for female physiology. Supports reproductive health, hormone balance, and stress resilience across phases. Often called the female equivalent of ashwagandha.', phases: 'all', category: 'adaptogen', energyLevels: 'all', priority: 'medium', color: '#FF7F50' },
  { id: 'maca', name: 'Maca Root (Red Maca)', dose: '1.5–3g in morning smoothie', timing: ['morning'], purpose: 'Hormone balance, energy consistency, bone health', why: 'Red maca is the most researched variety for female hormonal health — specifically shown to support estrogen balance, bone density, and mood stability across phases. Balances hormones without directly acting on estrogen receptors. Mild nutty flavor — add to your morning smoothie.', phases: 'all', category: 'adaptogen', energyLevels: ['low', 'medium'], priority: 'medium', color: '#FFB800' },
  { id: 'reishi', name: 'Reishi Mushroom', dose: '1–2g', timing: ['evening'], purpose: 'Immune support, deep sleep, cortisol reduction', why: 'The calming immune adaptogen. Pairs with ashwagandha in your evening protocol for deep recovery. Immune support is especially important during hard training and high-stress phases.', phases: 'all', category: 'adaptogen', energyLevels: 'all', priority: 'medium', color: '#BF00FF' },
  // NEW ADDITIONS
  { id: 'inositol', name: 'Inositol (Myo-Inositol)', dose: '2–4g', timing: ['evening'], purpose: 'Mood stability, insulin sensitivity, serotonin support', why: 'Myo-inositol acts as a secondary messenger for serotonin and dopamine receptors. Clinically proven to reduce anxiety, improve sleep quality, and enhance insulin sensitivity — particularly beneficial in the luteal phase when insulin resistance naturally rises. Works synergistically with 5-HTP for serotonin pathway support.', phases: 'all', category: 'serotonin', energyLevels: 'all', priority: 'medium', color: '#BF5AF2' },
  { id: 'phosphatidylserine', name: 'Phosphatidylserine', dose: '100–300mg', timing: ['morning'], purpose: 'Cortisol blunting, memory, cognitive performance', why: 'Clinically proven to reduce exercise-induced cortisol and ACTH response. Supports memory consolidation and cognitive performance under stress. Your HPA-axis regulator for high-demand trading sessions and building days. Well-tolerated, no stimulant effect.', phases: 'all', category: 'adaptogen', energyLevels: 'all', priority: 'medium', color: '#00D4FF' },
  { id: 'dim', name: 'DIM (Diindolylmethane)', dose: '200mg', timing: ['evening', 'with-meal'], purpose: 'Estrogen metabolism, luteal hormone balance', why: 'Derived from cruciferous vegetables. Supports healthy estrogen metabolism — converts potent estrogens into safer, weaker metabolites. Reduces luteal phase bloating, breast tenderness, and estrogen-driven mood shifts. Take with a fat-containing meal for optimal absorption.', phases: ['luteal'], category: 'foundation', energyLevels: 'all', priority: 'medium', color: '#BF5AF2', warning: 'Do not use during pregnancy. Avoid if on estrogen-based medications or tamoxifen.' },
  { id: 'melatonin-ld', name: 'Melatonin (Low-dose)', dose: '0.3–0.5mg', timing: ['evening'], purpose: 'Sleep onset, antioxidant, luteal insomnia', why: 'Low-dose (0.3mg) matches physiological levels — more effective than the oversold 5–10mg doses which can suppress natural production. Melatonin synthesis naturally drops in the luteal phase due to progesterone fluctuation. Also a potent antioxidant. Take 30 min before bed.', phases: ['luteal', 'menstrual'], category: 'recovery', energyLevels: 'all', priority: 'medium', color: '#BF5AF2', warning: 'Do not combine with prescription sleep medications or benzodiazepines. Start at 0.3mg — high doses (5–10mg) disrupt natural melatonin production over time.' },
];

// ─── TEAS ─────────────────────────────────────────────────────
export const TEAS: Tea[] = [
  { id: 'matcha', name: 'Matcha', categories: ['morning', 'focus'], purpose: 'Smooth energy, fat oxidation, sustained focus', benefit: 'L-Theanine + caffeine naturally combined. Supports fat metabolism. Superior to coffee for sustained mental work — no crash. EGCG enhances fat burning during fasting windows.', notes: 'Whisk 1 tsp ceremonial grade into 70°C water (not boiling — preserves L-Theanine). Drink within 15 min of waking. Superior to coffee for clean, sustained alertness.', phases: 'all', icon: '🍵' },
  { id: 'ginger-lemon', name: 'Ginger + Lemon', categories: ['morning', 'fasting'], purpose: 'Digestive activation, anti-inflammatory, blood flow', benefit: 'Wakes the gut while preserving the fast (zero calories). Reduces inflammation. Improves circulation for morning training.', notes: 'Steep fresh ginger slices 5 min. Add half a lemon. No honey during fasting window. This is your fasting-compatible morning ritual.', phases: 'all', icon: '🫚' },
  { id: 'tulsi', name: 'Tulsi (Holy Basil)', categories: ['focus', 'afternoon'], purpose: 'Calm focus, cortisol reduction, emotional balance', benefit: 'Measurably lowers cortisol. Your 2–4PM ritual — provides a relaxing pause without sedation. Excellent before reactive trading sessions.', notes: 'Steep 1 tbsp dried tulsi for 7–10 min, cover while steeping. Add local honey if desired. Make this a non-negotiable afternoon ritual.', phases: 'all', icon: '🌿' },
  { id: 'peppermint', name: 'Peppermint', categories: ['focus', 'fasting'], purpose: 'Mental alertness, appetite suppression, no caffeine', benefit: 'Vasodilatory — increases alertness and oxygen delivery. Reduces appetite during fasting windows. Clean focus without stimulant.', notes: 'Steep 1–2 tsp dried peppermint for 5 min. Safe during fasting. Drink cold or hot as a mid-morning fast support.', phases: 'all', icon: '🌱' },
  { id: 'chamomile-lavender', name: 'Chamomile + Lavender', categories: ['evening'], purpose: 'GABA activation, cortisol reduction, deep sleep', benefit: 'Natural GABA agonist — same calming pathways as anti-anxiety compounds. Your evening shutdown protocol after screens off.', notes: 'Steep combined for 7 min. Add magnesium glycinate powder directly to the cup for a compounded sleep effect. Screens off 30 min after.', phases: 'all', icon: '💜' },
  { id: 'ashwagandha-milk', name: 'Ashwagandha Golden Milk', categories: ['evening', 'luteal'], purpose: 'Hormone support, anti-inflammatory, deep restoration', benefit: 'Ashwagandha + turmeric + black pepper + coconut milk. Anti-inflammatory, hormone-supportive, deeply calming. Your luteal phase evening ritual.', notes: 'Warm coconut milk. Add ½ tsp turmeric, ¼ tsp ashwagandha, pinch black pepper (activates turmeric). Honey to taste. Most powerful on luteal days 22–28.', phases: ['luteal', 'menstrual'], icon: '✨' },
  { id: 'lemon-balm', name: 'Lemon Balm', categories: ['evening'], purpose: 'Anxiety relief, GABA support, sleep quality', benefit: 'Mild anxiolytic with GABA-supporting properties. Excellent during high-stress periods — FTMO challenges, deadlines, late-night building sessions.', notes: 'Steep 2 tsp dried lemon balm for 10 min. Mild, bright flavor. Combine with chamomile for stronger effect on hard nights.', phases: 'all', icon: '🍋' },
  { id: 'raspberry-leaf', name: 'Raspberry Leaf', categories: ['menstrual', 'luteal'], purpose: 'Uterine tonic, cramp reduction, hormone support', benefit: 'Traditional uterine tonic — reduces cramping intensity. Rich in magnesium and iron. Start drinking 5–7 days before your period.', notes: 'Steep 1 tbsp for 10–15 min (longer = stronger). Drink 1–2 cups daily from days 22 onward through days 1–3 of period.', phases: ['luteal', 'menstrual'], icon: '🫐' },
  { id: 'cinnamon', name: 'Cinnamon Bark (Ceylon)', categories: ['fasting', 'morning'], purpose: 'Blood sugar stabilization, craving reduction', benefit: 'Stabilizes blood glucose and reduces hunger signaling during fasting windows. Ceylon cinnamon is the quality, safe form (not cassia).', notes: 'Steep a Ceylon cinnamon stick for 10 min or add ¼ tsp ground to hot water. Safe during fasting. Use as a craving-control tool.', phases: 'all', icon: '🍂' },
  { id: 'spearmint', name: 'Spearmint', categories: ['fasting', 'focus'], purpose: 'Hormone balance, craving suppression', benefit: 'Slightly anti-androgenic — supports balanced hormone ratios. Reduces cravings and food noise. Good mid-morning fasting ritual.', notes: 'Steep fresh or dried spearmint 5–7 min. Cool and mild flavor. Drink 1–2 cups during fasting window.', phases: 'all', icon: '🌿' },
  { id: 'pu-erh', name: 'Pu-erh (Aged Black Tea)', categories: ['morning', 'fasting'], purpose: 'Fat metabolism, gut health, sustained energy', benefit: 'Fermented — supports gut microbiome and fat oxidation. Shown to enhance fat burning while fasting. Earthy, rich flavor. Moderate caffeine.', notes: 'Rinse the leaves first (discard first steep). Then steep 3–5 min in boiling water. Can re-steep 3–4 times.', phases: 'all', icon: '🍫' },
  { id: 'blue-lotus', name: 'Blue Lotus', categories: ['evening'], purpose: 'Mood elevation, spiritual grounding, relaxation', benefit: 'Ancient Egyptian botanical. Mild natural euphoriant, deeply relaxing without sedation. Excellent for evening spiritual practices and reflection rituals.', notes: 'Steep 2–3 dried flowers in hot water 10–15 min. Occasional use — a sacred evening ritual, not daily. Best during new or full moon rituals.', phases: 'all', icon: '🌸' },
];

// ─── MOVEMENTS ────────────────────────────────────────────────
export const MOVEMENTS: Movement[] = [
  { id: 'morning-walk', name: 'Morning Sunlight Walk', tradition: 'Circadian Biology', duration: '20–30 min', purpose: 'Serotonin synthesis, cortisol regulation, circadian reset', description: 'Sunlight on the eyes within 30–60 minutes of waking triggers serotonin synthesis and sets your cortisol rhythm for the day. The single most evidence-backed, underrated serotonin activator. Dallas morning walks at 6–7AM are a free pharmaceutical. This single practice, done consistently, raises baseline serotonin more reliably than many supplements.', phases: 'all', energyLevels: 'all', tags: ['serotonin', 'free', 'daily', 'non-negotiable'] },
  { id: 'sun-salutations', name: 'Sun Salutations (Surya Namaskar)', tradition: 'Hatha Yoga', duration: '5–15 min (5–10 rounds)', purpose: 'Spinal activation, nervous system priming, lymphatic flow', description: 'The original morning protocol. Each of the 12 postures activates a different spinal nerve. Done in a flow with breath, it activates the sympathetic system and primes cognitive performance without depleting glycogen. Do before any day requiring sharp mental output.', phases: 'all', energyLevels: ['medium', 'high'], tags: ['morning', 'energy', 'yoga', 'nervous-system'] },
  { id: 'nadi-shodhana', name: 'Nadi Shodhana (Alternate Nostril)', tradition: 'Pranayama / Hatha Yoga', duration: '5 min', purpose: 'Brain hemisphere balance, pattern recognition, cortisol drop', description: 'Balances left and right brain hemispheres. Measurably reduces cortisol and improves pattern recognition. Do this before opening your trading charts. 5 minutes changes the quality of every decision in the session.', phases: 'all', energyLevels: 'all', tags: ['trading', 'focus', 'breathwork', 'pre-session'] },
  { id: 'vinyasa', name: 'Vinyasa Flow Yoga', tradition: 'Yoga', duration: '30–45 min', purpose: 'Dynamic strength, flexibility, cardiovascular', description: 'Challenging, dynamic, heat-building. Matches your follicular and ovulatory energy windows perfectly. More than flexibility — builds functional strength, breath capacity, and mental focus simultaneously.', phases: ['follicular', 'ovulatory'], energyLevels: ['medium', 'high'], tags: ['strength', 'cardio', 'flexibility', 'flow'] },
  { id: 'yin-yoga', name: 'Yin Yoga', tradition: 'Yoga', duration: '30–60 min', purpose: 'Deep fascia release, parasympathetic activation, recovery', description: 'Long-held passive stretches (3–5 min per pose). Activates the parasympathetic nervous system — the direct counterbalance to the catabolic pressure of the luteal phase. The practice for your body\'s most depleted days. This is strategic recovery, not giving up.', phases: ['luteal', 'menstrual'], energyLevels: ['low', 'medium'], tags: ['recovery', 'luteal', 'deep-rest', 'fascia'] },
  { id: 'qi-gong', name: 'Qi Gong (Morning Flow)', tradition: 'Traditional Chinese Medicine', duration: '10–20 min', purpose: 'Life force cultivation, nervous system regulation, clarity', description: 'Slow, intentional movement. Regulates the nervous system, improves proprioception, and has been historically used for mental clarity. Works at any energy level — gentle enough for menstrual phase, grounding enough for high-output days.', phases: 'all', energyLevels: 'all', tags: ['TCM', 'energy', 'grounding', 'all-phases'] },
  { id: 'earthing', name: 'Earthing / Grounding', tradition: 'Bioelectric Medicine', duration: '15–20 min', purpose: 'Inflammation reduction, cortisol normalization, sleep', description: 'Barefoot on grass or soil. Peer-reviewed studies show reduction in inflammatory markers, improved sleep quality, and cortisol reduction. Dallas has parks. 15 minutes barefoot in the morning or evening. Looks like nothing, does a lot.', phases: 'all', energyLevels: 'all', tags: ['inflammation', 'sleep', 'cortisol', 'free'] },
  { id: 'bhramari', name: 'Bhramari (Humming Bee Breath)', tradition: 'Pranayama', duration: '5 min', purpose: 'Vagus nerve activation, anxiety reduction, reset', description: 'Activates the vagus nerve through vibration. Use on high-stress FTMO days or when emotionally reactive before a trading session. Cover ears, close eyes, inhale deep, exhale with a sustained hum. 5 rounds is enough to shift your state entirely.', phases: 'all', energyLevels: 'all', tags: ['vagus-nerve', 'anxiety', 'trading', 'reset'] },
];

// ─── HELPERS ──────────────────────────────────────────────────
export function getCyclePhase(cycleStartDate: string | null): CyclePhase | null {
  if (!cycleStartDate) return null;
  const start = new Date(cycleStartDate);
  const today = new Date();
  const dayOfCycle = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (dayOfCycle <= 0 || dayOfCycle > 35) return null;
  if (dayOfCycle <= 5) return 'menstrual';
  if (dayOfCycle <= 13) return 'follicular';
  if (dayOfCycle <= 16) return 'ovulatory';
  return 'luteal';
}

export function getDayOfCycle(cycleStartDate: string | null): number | null {
  if (!cycleStartDate) return null;
  const start = new Date(cycleStartDate);
  const today = new Date();
  const day = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (day <= 0 || day > 35) return null;
  return day;
}

export function getSupplementsForContext(phase: CyclePhase | null, energyLevel: EnergyLevel): Supplement[] {
  return SUPPLEMENTS.filter(s => {
    const phaseMatch = s.phases === 'all' || (phase && (s.phases as CyclePhase[]).includes(phase));
    const energyMatch = s.energyLevels === 'all' || (s.energyLevels as EnergyLevel[]).includes(energyLevel);
    return phaseMatch && energyMatch;
  });
}

export function getMovementsForContext(phase: CyclePhase | null, energyLevel: EnergyLevel): Movement[] {
  return MOVEMENTS.filter(m => {
    const phaseMatch = m.phases === 'all' || (phase && (m.phases as CyclePhase[]).includes(phase));
    const energyMatch = m.energyLevels === 'all' || (m.energyLevels as EnergyLevel[]).includes(energyLevel);
    return phaseMatch && energyMatch;
  });
}

export const CATEGORY_META: Record<string, { label: string; color: string; icon: string }> = {
  foundation: { label: 'FOUNDATION', color: '#00D4FF', icon: '⬡' },
  serotonin:  { label: 'SEROTONIN',  color: '#BF00FF', icon: '◈' },
  amino:      { label: 'AMINOS',     color: '#00FF41', icon: '◆' },
  adaptogen:  { label: 'ADAPTOGENS', color: '#FFB800', icon: '❋' },
  performance: { label: 'PERFORMANCE', color: '#FF4757', icon: '⚡' },
  recovery:   { label: 'RECOVERY',   color: '#00FF41', icon: '↺' },
};

export const SUPPLEMENT_CONFLICTS: SupplementConflict[] = [
  { supplements: ['Zinc', 'Iron'], risk: 'Compete for the same absorption receptors. Space at least 2 hours apart — take one with breakfast, one with lunch.', severity: 'caution' },
  { supplements: ['5-HTP', 'SSRIs / Antidepressants'], risk: 'Serotonin syndrome risk — dangerous excess serotonin signalling. Do NOT combine under any circumstances.', severity: 'critical' },
  { supplements: ['5-HTP', "St. John's Wort"], risk: 'Both raise serotonin via different mechanisms — combining risks serotonin syndrome. Do NOT combine.', severity: 'critical' },
  { supplements: ['Vitex', 'Hormonal Contraceptives'], risk: 'Vitex acts on progesterone receptors and may reduce contraceptive efficacy. Consult your doctor before combining.', severity: 'caution' },
  { supplements: ['L-Tyrosine', 'MAOIs'], risk: 'L-Tyrosine + monoamine oxidase inhibitors can cause a dangerous hypertensive crisis. Do NOT combine.', severity: 'critical' },
  { supplements: ['Ashwagandha', 'Thyroid Medication'], risk: 'Ashwagandha may alter thyroid hormone levels. If on levothyroxine or similar, monitor thyroid panel closely.', severity: 'caution' },
  { supplements: ['Melatonin', 'Benzodiazepines'], risk: 'Additive CNS sedation. Do not combine melatonin with prescription sleep aids or benzodiazepines.', severity: 'caution' },
];

export const TIMING_META: Record<SupplementTiming, { label: string; icon: string }> = {
  morning:      { label: 'MORNING',     icon: '🌅' },
  'pre-workout': { label: 'PRE-WORKOUT', icon: '💪' },
  afternoon:    { label: 'AFTERNOON',   icon: '☀️' },
  evening:      { label: 'EVENING',     icon: '🌙' },
  'with-meal':  { label: 'WITH MEAL',   icon: '🍽️' },
  anytime:      { label: 'ANYTIME',     icon: '◈' },
};
