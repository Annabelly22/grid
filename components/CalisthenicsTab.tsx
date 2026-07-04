'use client';
import { useState, useEffect } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────
type EqType  = 'bar' | 'wall' | 'bw' | 'vest';
type TreeId  = 'pull' | 'row' | 'push' | 'press' | 'squat' | 'core' | 'post';
type DayKey  = '1' | '2' | '3' | '4' | '5' | '6' | '7';
type View    = 'trees' | DayKey;

interface TreeNode { n: string; d: string; elite?: boolean; }
interface SkillTree { id: TreeId; name: string; days: string; color: string; nodes: TreeNode[]; }

interface CaliEx {
  old:   string;
  neu:   string;
  eq:    EqType[];
  tree:  string;
  t1:    string;
  t2:    string;
  t3:    string;
  carry: string;
}
interface CaliDay {
  label:    string;
  focus:    string;
  color:    string;
  brief:    string;
  replaces: string;
  trees:    TreeId[];
  ex:       CaliEx[];
}

// ── Equipment meta ───────────────────────────────────────────────────────────
const EQ_META: Record<EqType, { label: string; color: string }> = {
  bar:  { label: 'BAR',  color: 'var(--ng-cyan)'  },
  wall: { label: 'WALL', color: 'var(--ng-amber)'  },
  bw:   { label: 'BW',   color: 'var(--ng-green)'  },
  vest: { label: 'VEST', color: '#FF2E88'           },
};

// ── Skill Trees ──────────────────────────────────────────────────────────────
const TREES: SkillTree[] = [
  {
    id: 'pull', name: 'PULL — BAR WORK', days: 'Trained: Day 1, Day 5', color: 'var(--ng-cyan)',
    nodes: [
      { n: 'Dead Hang',          d: 'Hang from a bar, full arm extension, 20–30 sec.' },
      { n: 'Scapular Pull',      d: 'Depress shoulder blades without bending the elbows.' },
      { n: 'Negative Pull-Up',   d: 'Jump to chin-over-bar, lower for 3–5 sec.' },
      { n: 'Pull-Up ×5+',        d: 'Full dead-hang to chin-over-bar, strict.' },
      { n: 'Weighted Pull-Up',   d: 'Add a loaded backpack or vest.' },
      { n: 'Archer Pull-Up',     d: 'Pull to one side, other arm stays extended.', elite: true },
      { n: 'One-Arm Pull-Up',    d: 'The bar-work ceiling.', elite: true },
    ],
  },
  {
    id: 'row', name: 'ROW → FRONT LEVER', days: 'Trained: Day 1, Day 5', color: '#30D158',
    nodes: [
      { n: 'Inverted Row (feet down)', d: 'Steep angle under a table or low bar.' },
      { n: 'Inverted Row (flat)',      d: 'Body parallel to floor, full range.' },
      { n: 'Archer Inverted Row',      d: 'Row to one side, building single-arm strength.' },
      { n: 'Tuck Front Lever',         d: 'Hang from bar, knees to chest, body horizontal.' },
      { n: 'Advanced Tuck FL',         d: 'Extend hips, knees still tucked.' },
      { n: 'Straddle Front Lever',     d: 'Legs wide, body fully horizontal.', elite: true },
      { n: 'Full Front Lever',         d: 'Legs together, fully horizontal.', elite: true },
    ],
  },
  {
    id: 'push', name: 'PUSH → PLANCHE', days: 'Trained: Day 2, Day 3', color: 'var(--ng-green)',
    nodes: [
      { n: 'Incline Push-Up',          d: 'Hands elevated on a bench or counter.' },
      { n: 'Push-Up',                  d: 'Full range, chest to floor, standard hand width.' },
      { n: 'Diamond Push-Up',          d: 'Hands together under chest, tricep emphasis.' },
      { n: 'Archer Push-Up',           d: 'Shift weight to one arm, other stays extended.' },
      { n: 'Pseudo Planche Push-Up',   d: 'Hands by hips, lean forward past the wrists.' },
      { n: 'Tuck Planche',             d: 'Knees tucked, feet off floor, weight on hands.', elite: true },
      { n: 'Straddle / Full Planche',  d: 'The push ceiling.', elite: true },
    ],
  },
  {
    id: 'press', name: 'PRESS → HANDSTAND', days: 'Trained: Day 2', color: 'var(--ng-purple)',
    nodes: [
      { n: 'Pike Push-Up',              d: 'Hips high, hands and feet on floor, press through the shoulders.' },
      { n: 'Wall Handstand Hold',       d: 'Chest facing wall or back to wall, build hold time.' },
      { n: 'Chest-to-Wall Handstand',   d: 'Full vertical line, chest close to the wall.' },
      { n: 'Wall Handstand Push-Up',    d: 'Lower head to floor, press back up, wall-supported.' },
      { n: 'Freestanding Handstand',    d: 'No wall, balance entirely self-controlled.', elite: true },
      { n: 'Freestanding HSPU',         d: 'The overhead-press ceiling.', elite: true },
    ],
  },
  {
    id: 'squat', name: 'SQUAT → PISTOL', days: 'Trained: Day 4', color: 'var(--ng-amber)',
    nodes: [
      { n: 'Bodyweight Squat',      d: 'Full depth, controlled tempo.' },
      { n: 'Split Squat',           d: 'Stationary lunge stance, both legs share load.' },
      { n: 'Bulgarian Split Squat', d: 'Rear foot elevated on a bench or chair.' },
      { n: 'Shrimp Squat',          d: 'Single leg, rear foot held behind you.' },
      { n: 'Assisted Pistol Squat', d: 'Single leg, holding a support for balance.' },
      { n: 'Full Pistol Squat',     d: 'Single leg, no assistance, full depth.', elite: true },
      { n: 'Weighted Pistol Squat', d: 'Loaded backpack, single leg, full depth.', elite: true },
    ],
  },
  {
    id: 'core', name: 'CORE → DRAGON FLAG / L-SIT', days: 'Trained: Day 1, Day 3, Day 4, Day 5', color: '#FF453A',
    nodes: [
      { n: 'Hollow Body Hold',         d: 'Lower back pressed flat, arms and legs extended, 20–30 sec.' },
      { n: 'Lying / Hanging Leg Raise', d: 'Progress from lying to hanging from a bar.' },
      { n: 'Tuck L-Sit',               d: 'Knees tucked, hands on floor or parallettes, hips lifted.' },
      { n: 'Full L-Sit',               d: 'Legs fully extended, parallel to floor.' },
      { n: 'Tuck Dragon Flag',          d: 'Shoulders on bench, knees tucked, lower with control.' },
      { n: 'Full Dragon Flag',          d: 'Legs fully extended, body rigid, straight-line lower.', elite: true },
      { n: 'V-Sit',                     d: 'Legs raised above torso — a serious hip-flexor + core test.', elite: true },
    ],
  },
  {
    id: 'post', name: 'POSTERIOR → BACK LEVER', days: 'Trained: Day 6', color: '#FF6B35',
    nodes: [
      { n: 'Glute Bridge',          d: 'Two-leg bridge, full hip extension.' },
      { n: 'Single-Leg Bridge',     d: 'One leg extended, other drives the bridge.' },
      { n: 'Nordic Curl Negative',  d: 'Kneeling, feet anchored, lower slowly under control.' },
      { n: 'Full Nordic Curl',      d: 'Full eccentric-concentric cycle, no assistance.' },
      { n: 'Tuck Back Lever',       d: 'Hang from bar, flip to face the floor, knees tucked.' },
      { n: 'Straddle Back Lever',   d: 'Legs wide, body horizontal, facing the floor.', elite: true },
      { n: 'Full Back Lever',       d: 'Legs together, fully horizontal.', elite: true },
    ],
  },
];

// ── Day Data ─────────────────────────────────────────────────────────────────
const DAYS: Record<DayKey, CaliDay> = {
  '1': {
    label: 'DAY 01', focus: 'BACK', color: 'var(--ng-cyan)',
    brief: 'Bar work replaces machine pulldowns here because a bar makes your back stabilize through a real hanging range — the same range you use climbing, carrying, and hauling. This is where a pull-up bar starts paying for itself.',
    replaces: 'Wide/V-bar lat pulldown, cable rows, row delt machine, face pulls, iso-lateral high row',
    trees: ['pull', 'row', 'core'],
    ex: [
      {
        old: 'Wide bar / V-bar lat pulldown', neu: 'Pull-Up Progression', eq: ['bar'],
        tree: 'PULL — Dead Hang → Weighted Pull-Up',
        t1: 'Dead hangs + scapular pulls, 4×20–30 sec.',
        t2: 'Negative pull-ups, 5×4, 3–5 sec controlled descent.',
        t3: 'Strict pull-ups (8+ clean reps) → weighted pull-ups with a loaded backpack.',
        carry: 'Grip endurance, climbing, lifting your own bodyweight over an edge.',
      },
      {
        old: 'V-bar / wide-bar cable row', neu: 'Inverted Row', eq: ['bar'],
        tree: 'ROW → FRONT LEVER — Inverted Row → Archer Row',
        t1: 'Feet-supported inverted row under a sturdy table or low bar, steep angle.',
        t2: 'Flat inverted row, body parallel to floor.',
        t3: 'Archer inverted row or feet-elevated inverted row.',
        carry: 'Pulling strength that feeds directly into the front lever line above.',
      },
      {
        old: 'Row delt machine', neu: 'Prone Y Raise', eq: ['bw'],
        tree: 'Supportive — feeds ROW posture',
        t1: 'Lying face down, arms in a Y, lift and hold 2 sec, 4×10.',
        t2: 'Add a 1-sec pause at the top of each rep.',
        t3: 'Slow 3-sec lower on every rep, full fatigue set.',
        carry: 'Postural strength that fights the forward hunch from screens and driving.',
      },
      {
        old: 'Face pulls', neu: 'Prone Y-T-W Raise', eq: ['bw'],
        tree: 'Supportive — feeds PULL/ROW shoulder health',
        t1: 'Y-T-W sequence, no pause, 4×6 each letter.',
        t2: 'Add a 2-sec hold at each letter position.',
        t3: 'Full sequence with ankle weights or a light pause superset.',
        carry: 'Shoulder health for pressing and pulling — the maintenance rep of every day.',
      },
      {
        old: 'Iso-lateral high row machine', neu: 'Archer Inverted Row', eq: ['bar'],
        tree: 'ROW → FRONT LEVER — Archer Row node',
        t1: 'Flat inverted row first if archer variation isn\'t clean yet.',
        t2: 'Archer inverted row, both sides.',
        t3: 'Archer row with a 2-sec hold at the top on the working arm.',
        carry: 'Single-arm pulling strength — direct prerequisite for the front lever.',
      },
      {
        old: 'Sit-ups / leg raises / crunches / Russian twists', neu: 'Hanging Knee Raise → Tuck Front Lever', eq: ['bar'],
        tree: 'CORE + ROW crossover — Leg Raise → Tuck FL',
        t1: 'Lying leg raises, 4×12.',
        t2: 'Hanging knee raises from a bar.',
        t3: 'Hanging straight-leg raises, working toward a tuck front lever hold.',
        carry: 'Core control that transfers directly to every lift and to carrying awkward loads.',
      },
    ],
  },
  '2': {
    label: 'DAY 02', focus: 'CHEST & SHOULDERS', color: 'var(--ng-green)',
    brief: 'A push-up done through its full range asks more of your shoulder than a fixed-path machine ever will. This day is the on-ramp to planche and handstand work — two of the more impressive calisthenics skills, built one honest rep at a time.',
    replaces: 'DB chest press, incline fly, shoulder press, front/lateral raise, rear delt fly, squeeze press, side crunch',
    trees: ['push', 'press', 'core'],
    ex: [
      {
        old: 'DB chest press', neu: 'Push-Up Progression', eq: ['bw'],
        tree: 'PUSH → PLANCHE — Incline Push-Up → Push-Up',
        t1: 'Incline push-ups, hands elevated on a bench or counter.',
        t2: 'Standard push-ups, full range, chest to floor.',
        t3: 'Diamond push-ups, working toward archer push-ups.',
        carry: 'Pushing strength for everything from a stuck door to catching yourself in a fall.',
      },
      {
        old: 'Incline DB fly / lateral raise', neu: 'Pseudo Planche Push-Up', eq: ['bw'],
        tree: 'PUSH → PLANCHE — Pseudo Planche node',
        t1: 'Standard push-ups with hands turned slightly inward.',
        t2: 'Pseudo planche push-ups, hands by hips, lean forward past the wrists.',
        t3: 'Tuck planche hold attempts (5–10 sec) between push-up sets.',
        carry: 'Shoulder mobility and straight-arm strength — a genuinely rare capability outside calisthenics.',
      },
      {
        old: 'DB shoulder press / machine', neu: 'Pike Push-Up → Handstand Push-Up', eq: ['wall'],
        tree: 'PRESS → HANDSTAND — Pike Push-Up → Wall HSPU',
        t1: 'Pike push-ups, hips high, hands and feet on floor.',
        t2: 'Wall handstand hold, building time (30–60 sec).',
        t3: 'Wall handstand push-ups, lowering head to floor and pressing back up.',
        carry: 'Overhead strength for lifting things onto shelves, luggage racks, into the truck bed.',
      },
      {
        old: 'DB front raise', neu: 'Wall Handstand Hold', eq: ['wall'],
        tree: 'PRESS → HANDSTAND — Hold node',
        t1: 'Chest-facing-wall handstand kick-up, hold 15–20 sec.',
        t2: 'Back-to-wall handstand, hold 30–45 sec.',
        t3: 'Chest-to-wall handstand, full vertical line, hold 45–60 sec.',
        carry: 'Balance and shoulder stability that transfers to any overhead task.',
      },
      {
        old: 'Cable side lateral raise', neu: 'Handstand Weight Shifts', eq: ['wall'],
        tree: 'PRESS → HANDSTAND — Balance work',
        t1: 'Wall handstand, small controlled weight shifts side to side.',
        t2: 'Lift one hand briefly while balanced.',
        t3: 'Attempt short freestanding handstand holds away from the wall.',
        carry: 'Fine shoulder stabilizer strength most gym machines never touch.',
      },
      {
        old: 'Cable / machine rear delt fly', neu: 'Prone Reverse Fly (arms only)', eq: ['bw'],
        tree: 'Supportive — feeds PULL/PUSH balance',
        t1: 'Lying face down, arms out to sides, lift and hold 2 sec, 4×10.',
        t2: 'Add a 2-sec hold at the top.',
        t3: 'Slow 3-sec lower on every rep.',
        carry: 'Same postural payoff as Day 1 — undoing hours of forward-reaching.',
      },
      {
        old: 'Face pulls', neu: 'Prone Y-T-W Raise', eq: ['bw'],
        tree: 'Supportive',
        t1: 'Y-T-W sequence, no pause, 4×6 each letter.',
        t2: 'Add a 2-sec hold at each letter position.',
        t3: 'Full sequence with ankle weights or a light pause superset.',
        carry: 'Shoulder maintenance.',
      },
      {
        old: 'DB squeeze press', neu: 'Isometric Push-Up Squeeze', eq: ['bw'],
        tree: 'PUSH → PLANCHE — isometric strength',
        t1: 'Hold the bottom of a push-up, elbows tucked, 4×10–15 sec.',
        t2: 'Hold at 90°, mid push-up, 4×15–20 sec.',
        t3: 'Slow 5-sec descent into a full hold at the bottom.',
        carry: 'Inner-chest strength for hugging, bracing, and stabilizing loads against your torso.',
      },
      {
        old: 'KB side crunch / cable crunches', neu: 'Hanging Windshield Wipers', eq: ['bar'],
        tree: 'CORE → DRAGON FLAG — advanced node',
        t1: 'Hanging knee raise with a slow side-to-side sway.',
        t2: 'Hanging leg raise with a controlled twist to each side.',
        t3: 'Full hanging windshield wipers, straight legs, wide arc.',
        carry: 'Rotational core strength for swinging, throwing, and twisting to grab something behind you.',
      },
    ],
  },
  '3': {
    label: 'DAY 03', focus: 'BICEPS / TRICEPS / ABS', color: 'var(--ng-amber)',
    brief: 'There\'s no true bodyweight bicep curl — so this day trades isolation for isometric pulling strength and the dragon flag, one of the clearest "you can actually do that?" calisthenics skills there is.',
    replaces: 'Hammer curl, seated DB curl, overhead tricep extension, weighted crunches, rollbacks, treadmill',
    trees: ['push', 'core', 'pull'],
    ex: [
      {
        old: 'Hammer curl / seated DB curl', neu: 'Flexed-Arm Hang / Chin-Up Hold', eq: ['bar'],
        tree: 'PULL — isometric bicep strength',
        t1: 'Flexed-arm hang, chin over bar, hold as long as possible.',
        t2: 'Chin-up hold at 90° elbow bend, 4×15–20 sec.',
        t3: 'Slow negative chin-ups, 5–6 sec descent, full range.',
        carry: 'Forearm and grip endurance for carrying groceries, tools, luggage.',
      },
      {
        old: 'DB / barbell overhead tricep extension', neu: 'Diamond Push-Up Progression', eq: ['bw'],
        tree: 'PUSH → PLANCHE — Diamond node',
        t1: 'Diamond push-ups on knees.',
        t2: 'Full diamond push-ups.',
        t3: 'Deficit diamond push-ups, hands elevated for extra range.',
        carry: 'Tricep lockout strength for pushing yourself up off the floor unassisted.',
      },
      {
        old: 'Inclined weighted crunches', neu: 'Tuck Dragon Flag', eq: ['bw'],
        tree: 'CORE → DRAGON FLAG — Tuck node',
        t1: 'Shoulders on a bench, knees tucked to chest, lower slowly with control.',
        t2: 'Reduce the tuck slightly each week, keeping the lower controlled.',
        t3: 'Near-straight-leg dragon flag lower, working toward full extension.',
        carry: 'Core strength integrated with hip flexors — real getting-up-off-the-ground strength.',
      },
      {
        old: 'KB / DB side crunch', neu: 'Hanging Oblique Raise', eq: ['bar'],
        tree: 'CORE — oblique branch',
        t1: 'Hanging knee raise with a side-to-side lean.',
        t2: 'Hanging leg raise angled to one side, alternating.',
        t3: 'Full hanging windshield wipers.',
        carry: 'Rotational core strength for swinging, throwing, and twisting.',
      },
      {
        old: 'Rollbacks', neu: 'Dragon Flag Negative', eq: ['bw'],
        tree: 'CORE → DRAGON FLAG — feeds Full Dragon Flag',
        t1: 'Slow tuck dragon flag lower, 4×5.',
        t2: 'Slower tempo, 5–6 sec per rep.',
        t3: 'Straighter legs each week, working toward the full version.',
        carry: 'Anti-extension core strength — the thing that protects your lower back under any load.',
      },
      {
        old: 'KB Russian twists', neu: 'Standing Bodyweight Twist', eq: ['bw'],
        tree: 'CORE — rotational branch',
        t1: 'Slow controlled twist, arms extended, 4×12/side.',
        t2: 'Add a pause at end range.',
        t3: 'Faster controlled tempo, full rotation.',
        carry: 'Rotational power for swings, throws, changing direction.',
      },
      {
        old: 'Leg ups', neu: 'Hanging Leg Raise', eq: ['bar'],
        tree: 'CORE / ROW crossover',
        t1: 'Lying leg raises, lower back flat, 4×12.',
        t2: 'Hanging knee raises from a bar.',
        t3: 'Hanging straight-leg raises, working toward toes-to-bar.',
        carry: 'Core control.',
      },
      {
        old: 'Laying face press', neu: 'Close-Grip / Diamond Push-Up', eq: ['bw'],
        tree: 'PUSH → PLANCHE',
        t1: 'Diamond push-up on knees.',
        t2: 'Full diamond push-up.',
        t3: 'Deficit diamond push-up, hands elevated.',
        carry: 'Tricep lockout for pressing movements.',
      },
      {
        old: 'Treadmill — 1hr @ 3.0', neu: 'Rucking or Jump Rope Intervals', eq: ['bw'],
        tree: 'Conditioning — outside the skill tree',
        t1: 'Brisk 30–45 min walk, light backpack (10–15 lb).',
        t2: 'Rucking with 20–30 lb load, or 15 min jump rope intervals.',
        t3: 'Weighted ruck on an incline/trail, or 25+ min jump rope with double-unders.',
        carry: 'Real-world cardio that loads your legs and spine the way walking with a pack actually does.',
      },
    ],
  },
  '4': {
    label: 'DAY 04', focus: 'LEGS', color: 'var(--ng-purple)',
    brief: 'Every leg machine gets replaced by a single-leg pattern here, because a pistol squat trains balance and strength at the same time — a machine can only ever give you one of those.',
    replaces: 'Leg curl/extension, calf press, leg press, sumo/narrow squats, weighted crunches',
    trees: ['squat', 'post', 'core'],
    ex: [
      {
        old: 'Cable hamstring curl / seated leg curl', neu: 'Nordic Curl Progression', eq: ['bw'],
        tree: 'POSTERIOR → BACK LEVER — Nordic node',
        t1: 'Glute bridge + single-leg bridge, building hip and hamstring base.',
        t2: 'Nordic curl negatives, feet anchored under a couch, partner, or bar.',
        t3: 'Full nordic curl, controlled through the whole range.',
        carry: 'Hamstring strength that protects against pulls during sprinting, hiking, or a sudden slip.',
      },
      {
        old: 'Leg extensions machine', neu: 'Bulgarian Split Squat → Pistol Squat', eq: ['bw'],
        tree: 'SQUAT → PISTOL — main line',
        t1: 'Bodyweight rear-foot-elevated split squat.',
        t2: 'Shrimp squat, single leg, rear foot held behind you.',
        t3: 'Assisted pistol squat, working toward the full unassisted version.',
        carry: 'Single-leg strength for stairs, uneven ground, getting up off the floor one leg at a time.',
      },
      {
        old: 'Calf press / seated calf raise', neu: 'Standing Calf Raise', eq: ['bw'],
        tree: 'Supportive — feeds SQUAT stability',
        t1: 'Two-leg bodyweight calf raise, full range, slow tempo.',
        t2: 'Single-leg calf raise.',
        t3: 'Single-leg calf raise off a step for extra range.',
        carry: 'Ankle and calf resilience for running, hiking, and standing all day.',
      },
      {
        old: 'Inclined / seated leg press', neu: 'Pistol Squat Progression', eq: ['bw'],
        tree: 'SQUAT → PISTOL — core node',
        t1: 'Bodyweight squat, full depth, focus on form.',
        t2: 'Assisted pistol squat, holding a support for balance.',
        t3: 'Full pistol squat, no assistance.',
        carry: 'The single most functional lower-body pattern there is — squatting to pick things up, sit, and stand.',
      },
      {
        old: 'Sumo squats', neu: 'Cossack Squat', eq: ['bw'],
        tree: 'SQUAT → PISTOL — lateral branch',
        t1: 'Bodyweight cossack squat, partial range, holding support.',
        t2: 'Full-depth cossack squat, no support.',
        t3: 'Paused cossack squat, 2 sec at the bottom, each side.',
        carry: 'Hip mobility and adductor strength for lateral movement and getting in/out of cars low to the ground.',
      },
      {
        old: 'Squats inner/narrow quad', neu: 'Shrimp Squat', eq: ['bw'],
        tree: 'SQUAT → PISTOL — feeds Pistol node',
        t1: 'Assisted shrimp squat, holding a support.',
        t2: 'Unassisted shrimp squat, partial depth.',
        t3: 'Full-depth shrimp squat, controlled tempo.',
        carry: 'Lateral hip strength and mobility most gym machines never train at all.',
      },
      {
        old: 'Weighted ab crunches', neu: 'Tuck Dragon Flag', eq: ['bw'],
        tree: 'CORE → DRAGON FLAG',
        t1: 'Shoulders on a bench, knees tucked to chest, lower slowly with control.',
        t2: 'Reduce the tuck slightly each week.',
        t3: 'Near-straight-leg dragon flag lower, working toward full extension.',
        carry: 'Integrated core/hip strength.',
      },
      {
        old: 'Laying KB leg raises', neu: 'Lying → Hanging Leg Raise', eq: ['bw'],
        tree: 'CORE — feeds Tuck Front Lever',
        t1: 'Lying leg raises, lower back flat, 4×12.',
        t2: 'Hanging knee raises from a bar.',
        t3: 'Hanging straight-leg raises, working toward toes-to-bar.',
        carry: 'Core control.',
      },
    ],
  },
  '5': {
    label: 'DAY 05', focus: 'ABS + LOWER TRAP', color: '#FF453A',
    brief: 'Posture work that actually holds up under load — training the muscles between your shoulder blades so a laptop-and-phone life doesn\'t win by default. This is also where the pullover graduates into a real gymnastics skill.',
    replaces: 'Hanging/weighted leg raise, Russian twist, bentover rows, lateral row machine, cable crunch, pullover, cardio',
    trees: ['core', 'row', 'pull'],
    ex: [
      {
        old: 'Weighted Russian hanging leg raise / leg raises', neu: 'Hanging Leg Raise Progression', eq: ['bar'],
        tree: 'CORE — feeds Tuck Front Lever',
        t1: 'Lying leg raises, lower back flat.',
        t2: 'Hanging knee raises from a bar.',
        t3: 'Hanging straight-leg raises, working toward toes-to-bar.',
        carry: 'Core control.',
      },
      {
        old: 'Standing Russian twist', neu: 'Standing Bodyweight Twist', eq: ['bw'],
        tree: 'CORE — rotational branch',
        t1: 'Slow controlled twist, arms extended, 4×12/side.',
        t2: 'Add a pause at end range.',
        t3: 'Faster controlled tempo, full rotation.',
        carry: 'Rotational power.',
      },
      {
        old: 'KB side crunches', neu: 'Hanging Oblique Raise', eq: ['bar'],
        tree: 'CORE — oblique branch',
        t1: 'Hanging knee raise with a side-to-side lean.',
        t2: 'Hanging leg raise angled to one side, alternating.',
        t3: 'Full hanging windshield wipers.',
        carry: 'Rotational core.',
      },
      {
        old: 'Bentover two-arm / single-arm DB rows', neu: 'Inverted Row', eq: ['bar'],
        tree: 'ROW → FRONT LEVER',
        t1: 'Feet-supported inverted row, steep angle.',
        t2: 'Flat inverted row, body parallel to floor.',
        t3: 'Archer inverted row or feet-elevated inverted row.',
        carry: 'Pulling strength.',
      },
      {
        old: 'Machine lateral row', neu: 'Archer Inverted Row', eq: ['bar'],
        tree: 'ROW → FRONT LEVER',
        t1: 'Flat inverted row first if archer variation isn\'t clean yet.',
        t2: 'Archer inverted row, both sides.',
        t3: 'Archer row with a 2-sec hold at the top on the working arm.',
        carry: 'Single-arm pulling strength.',
      },
      {
        old: 'Cable crunch', neu: 'Dragon Flag Negative', eq: ['bw'],
        tree: 'CORE → DRAGON FLAG',
        t1: 'Slow tuck dragon flag lower, 4×5.',
        t2: 'Slower tempo, 5–6 sec per rep.',
        t3: 'Straighter legs each week, working toward the full version.',
        carry: 'Anti-extension core strength.',
      },
      {
        old: 'Weighted inclined sit-ups', neu: 'Decline Sit-Up', eq: ['bw'],
        tree: 'CORE — supportive',
        t1: 'Feet anchored, moderate incline, controlled sit-up.',
        t2: 'Steeper incline, full range.',
        t3: 'Add a 2-sec hold at the top of each rep.',
        carry: 'Hip-flexor and core integration for bending and lifting.',
      },
      {
        old: 'Pullover', neu: 'Skin the Cat', eq: ['bar'],
        tree: 'ROW → FRONT LEVER — mobility branch, feeds muscle-up prep',
        t1: 'Hang from bar, tuck knees, slowly rotate hips through to a light backward lean.',
        t2: 'Full skin-the-cat, rotating all the way through to an inverted hang.',
        t3: 'Skin the cat with a slow, controlled return to the start position.',
        carry: 'Shoulder and lat mobility that directly sets up a future muscle-up — and improves overhead reach and breathing mechanics.',
      },
      {
        old: 'Face pull / reverse fly delts', neu: 'Prone Y-T-W / Reverse Fly', eq: ['bw'],
        tree: 'Supportive',
        t1: 'Y-T-W sequence, no pause, 4×6 each letter.',
        t2: 'Add a 2-sec hold at each letter position.',
        t3: 'Full sequence with ankle weights or a light pause superset.',
        carry: 'Postural shoulder health.',
      },
      {
        old: 'Doorway chest stretch / side toe touches', neu: 'Same — already bodyweight', eq: ['bw'],
        tree: 'Mobility — outside the skill tree',
        t1: 'Hold 20–30 sec per side.',
        t2: 'Hold 45 sec, deeper range.',
        t3: 'Add a light dynamic bounce at end range.',
        carry: 'Keep as-is — genuinely functional mobility work, no replacement needed.',
      },
      {
        old: 'Cardio — 45 min', neu: 'Jump Rope Intervals / Rucking / Stairs', eq: ['bw'],
        tree: 'Conditioning — outside the skill tree',
        t1: 'Brisk 30–45 min walk, light backpack (10–15 lb).',
        t2: 'Rucking with 20–30 lb load, or 15 min jump rope intervals.',
        t3: 'Weighted ruck on incline/trail, or 25+ min jump rope with double-unders.',
        carry: 'Real-world conditioning.',
      },
    ],
  },
  '6': {
    label: 'DAY 06', focus: 'LOWER BACK', color: '#FF6B35',
    brief: 'The lower back is a stabilizer, not a mover — this day already leans functional. The fix is progressing the bridge and hinge patterns toward the back lever, and keeping the bodyweight stability work exactly as is.',
    replaces: 'Deadlifts, hyperextensions, bridges, seated/standing rows',
    trees: ['post', 'row'],
    ex: [
      {
        old: 'Deadlifts', neu: 'Single-Leg Bridge → Nordic Curl', eq: ['bw'],
        tree: 'POSTERIOR → BACK LEVER — main line',
        t1: 'Bodyweight hip hinge drill, then glute bridge, 4×15.',
        t2: 'Single-leg glute bridge, moderate reps.',
        t3: 'Nordic curl negative, feet anchored, slow controlled lower.',
        carry: 'The single most transferable pattern for lifting anything off the ground safely for life.',
      },
      {
        old: 'Hyperextensions', neu: 'Bird-Dog / Superman', eq: ['bw'],
        tree: 'Supportive — feeds POSTERIOR stability',
        t1: 'Bird-dog, slow and controlled, 4×10/side.',
        t2: 'Superman hold, 4×20–30 sec.',
        t3: 'Superman with alternating arm/leg pulses.',
        carry: 'Already the right movement — no replacement needed, just keep progressing hold time and control.',
      },
      {
        old: 'Bridges', neu: 'Glute Bridge → Tuck Back Lever', eq: ['bar'],
        tree: 'POSTERIOR → BACK LEVER — Tuck node',
        t1: 'Bodyweight glute bridge, 4×15.',
        t2: 'Single-leg glute bridge.',
        t3: 'Tuck back lever hold from a bar, 3×5–10 sec.',
        carry: 'Glute and posterior-chain strength that protects the lower back and powers walking, running, and stairs.',
      },
      {
        old: 'Planks', neu: 'Plank Progression', eq: ['bw'],
        tree: 'CORE — supportive',
        t1: 'Front plank, 4×20–30 sec.',
        t2: 'Side plank both sides + plank with shoulder taps.',
        t3: 'Plank with reach/drag, or a long-lever plank (hands further forward).',
        carry: 'Core bracing under static and dynamic load — the base for every other skill on this tree.',
      },
      {
        old: 'Cat-Cow stretch', neu: 'Same — already bodyweight', eq: ['bw'],
        tree: 'Mobility — outside the skill tree',
        t1: 'Slow, 8–10 reps.',
        t2: 'Add a pause at each end range.',
        t3: 'Combine with thoracic rotation reaches.',
        carry: 'Keep as-is — genuine spinal mobility work.',
      },
      {
        old: 'Seated / standing rows', neu: 'Inverted Row', eq: ['bar'],
        tree: 'ROW → FRONT LEVER',
        t1: 'Feet-supported inverted row, steep angle.',
        t2: 'Flat inverted row, body parallel to floor.',
        t3: 'Archer inverted row or feet-elevated inverted row.',
        carry: 'Pulling strength + postural support for the spine.',
      },
    ],
  },
  '7': {
    label: 'DAY 07', focus: 'FULL BODY HIIT', color: '#BF5AF2',
    brief: 'This day is already built the way the body actually moves — sequenced, breathless, multi-planar. Nothing here needs replacing, just re-labeled as the pure bodyweight session it already almost was.',
    replaces: 'Bentover DB row, DB curl-to-press (now fully bodyweight)',
    trees: ['row', 'squat', 'core'],
    ex: [
      {
        old: 'Floor X raise / sit-through / deadbug (warmup)', neu: 'Same — already bodyweight', eq: ['bw'],
        tree: 'Mobility — outside the skill tree',
        t1: 'Slow and controlled, full warmup set.',
        t2: 'Add 1–2 extra rounds.',
        t3: 'Flow between all three with no rest between transitions.',
        carry: 'Keep as-is — exactly the kind of multi-planar prep a machine-based warmup never gives you.',
      },
      {
        old: 'Bentover dumbbell row', neu: 'Inverted Row', eq: ['bar'],
        tree: 'ROW → FRONT LEVER',
        t1: 'Feet-supported inverted row, steep angle.',
        t2: 'Flat inverted row, body parallel to floor.',
        t3: 'Archer inverted row or feet-elevated inverted row.',
        carry: 'Pulling strength inside a conditioning circuit.',
      },
      {
        old: 'DB curl to overhead press', neu: 'Burpee to Pike Push-Up', eq: ['bw'],
        tree: 'PRESS → HANDSTAND — conditioning crossover',
        t1: 'Squat thrust to standing, no push-up.',
        t2: 'Full burpee with a push-up.',
        t3: 'Burpee into a pike push-up at the bottom for shoulder loading under fatigue.',
        carry: 'Full-body power output — the exact quality that separates "gym strong" from "actually athletic."',
      },
      {
        old: 'Plank with reach (both sides)', neu: 'Same — already bodyweight', eq: ['bw'],
        tree: 'CORE — supportive',
        t1: 'Slow controlled reach.',
        t2: 'Faster tempo.',
        t3: 'Add a shoulder tap between reaches.',
        carry: 'Keep as-is.',
      },
      {
        old: 'KB halo', neu: 'Arm Circle / Candlestick Roll', eq: ['bw'],
        tree: 'Mobility — outside the skill tree',
        t1: 'Slow arm circles, both directions.',
        t2: 'Add a candlestick roll (rock back to shoulders, control the return).',
        t3: 'Combine both in a flowing sequence.',
        carry: 'Shoulder mobility under control, no equipment needed.',
      },
      {
        old: 'Lateral lunge touchdown to overhead press', neu: 'Lateral Lunge to Reach-Through', eq: ['bw'],
        tree: 'SQUAT → PISTOL — lateral crossover',
        t1: 'Bodyweight lateral lunge with a light touchdown.',
        t2: 'Add a reach-through under the front leg.',
        t3: 'Full tempo through the circuit, both directions.',
        carry: 'Keep as-is — a genuinely complete athletic movement.',
      },
    ],
  },
};

// ── Storage keys ──────────────────────────────────────────────────────────────
const LEVELS_KEY = 'grid_cali_levels';
const DONE_KEY   = 'grid_cali_done';

// ── Component ─────────────────────────────────────────────────────────────────
export default function CalisthenicsTab() {
  const [view,         setView]         = useState<View>('trees');
  const [levels,       setLevels]       = useState<Partial<Record<TreeId, number>>>({});
  const [done,         setDone]         = useState<Record<string, boolean>>({});
  const [expandedEx,   setExpandedEx]   = useState<string | null>(null);
  const [expandedNode, setExpandedNode] = useState<TreeId | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [exTiers,      setExTiers]      = useState<Record<string, 0 | 1 | 2>>({});

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    try { const r = localStorage.getItem(LEVELS_KEY); if (r) setLevels(JSON.parse(r)); } catch {}
    try { const r = localStorage.getItem(DONE_KEY);   if (r) setDone(JSON.parse(r));   } catch {}
    try { const r = localStorage.getItem('grid_cali_tiers'); if (r) setExTiers(JSON.parse(r)); } catch {}
  }, []);

  const saveLevel = (id: TreeId, lvl: number) => {
    const next = { ...levels, [id]: lvl };
    setLevels(next);
    try { localStorage.setItem(LEVELS_KEY, JSON.stringify(next)); } catch {}
  };

  const toggleDone = (key: string) => {
    const next = { ...done, [key]: !done[key] };
    setDone(next);
    try { localStorage.setItem(DONE_KEY, JSON.stringify(next)); } catch {}
  };

  const saveExTier = (key: string, tier: 0 | 1 | 2) => {
    const next = { ...exTiers, [key]: tier };
    setExTiers(next);
    try { localStorage.setItem('grid_cali_tiers', JSON.stringify(next)); } catch {}
  };

  const resetAllTrees = () => {
    setLevels({}); setConfirmReset(false);
    try { localStorage.removeItem(LEVELS_KEY); } catch {}
  };

  const getLvl = (id: TreeId) => levels[id] ?? 0;

  // XP
  const totalXP = TREES.reduce((s, t) => s + getLvl(t.id), 0);
  const maxXP   = TREES.reduce((s, t) => s + t.nodes.length - 1, 0);
  const xpPct   = Math.round((totalXP / maxXP) * 100);

  // Weekly sessions done
  const now = new Date(); const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(monday.getDate() + i);
    return d.toISOString().split('T')[0];
  });
  const weekDone = weekDays.filter(d =>
    (['1','2','3','4','5','6','7'] as DayKey[]).some(k => done[`day${k}_${d}`])
  ).length;

  const TIER_META = [
    { label: 'FOUNDATION', color: '#8E8E93' },
    { label: 'LOAD',       color: 'var(--ng-cyan)' },
    { label: 'MASTERY',    color: '#FF2E88' },
  ];

  const TABS = [
    { id: 'trees' as View, label: '◈ TREES', color: 'var(--ng-green)' },
    ...(['1','2','3','4','5','6','7'] as DayKey[]).map(k => ({
      id: k as View, label: `D${k}`, color: DAYS[k].color,
    })),
  ];

  const currentDay = view !== 'trees' ? DAYS[view as DayKey] : null;
  const dayDoneKey = view !== 'trees' ? `day${view}_${today}` : '';
  const isDayDone  = done[dayDoneKey] ?? false;

  return (
    <div style={{ paddingBottom: 20 }}>

      {/* ── Banner ── */}
      <div style={{ padding: '14px 0 16px', borderBottom: '0.5px solid var(--ng-border)' }}>
        <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-green)', letterSpacing: '3px', marginBottom: 8 }}>
          CALI PROTOCOL — GYM SPLIT → PURE BODYWEIGHT
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1, height: 6, background: 'var(--ng-surface)', borderRadius: 3, overflow: 'hidden', border: '0.5px solid var(--ng-border)' }}>
            <div style={{ height: '100%', width: `${xpPct}%`, background: 'linear-gradient(90deg, var(--ng-green), var(--ng-purple))', borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--ng-green)', flexShrink: 0 }}>{totalXP}/{maxXP} XP</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'WEEK', value: `${weekDone}/7`, color: 'var(--ng-cyan)' },
            { label: 'TREES', value: `${TREES.filter(t => getLvl(t.id) >= t.nodes.length - 1).length}/${TREES.length}`, color: 'var(--ng-purple)' },
            { label: 'OVERALL', value: `${xpPct}%`, color: 'var(--ng-green)' },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: 'var(--ng-surface)', border: `0.5px solid ${s.color}30`, borderRadius: 8, padding: '7px 8px', textAlign: 'center' }}>
              <div className="font-mono" style={{ fontSize: 14, color: s.color, fontWeight: 700 }}>{s.value}</div>
              <div className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-muted)', letterSpacing: '1px', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 0', scrollbarWidth: 'none' }}>
        {TABS.map(tab => {
          const isCurrent = view === tab.id;
          const isDone = tab.id !== 'trees' && done[`day${tab.id}_${today}`];
          return (
            <button key={tab.id} onClick={() => { setView(tab.id); setExpandedEx(null); setExpandedNode(null); }}
              style={{ flexShrink: 0, padding: '6px 12px', background: isCurrent ? `${tab.color}18` : 'var(--ng-surface)', border: isCurrent ? `1px solid ${tab.color}` : '1px solid var(--ng-border)', borderRadius: 20, cursor: 'pointer', color: isCurrent ? tab.color : (isDone ? 'var(--ng-green)' : 'var(--ng-muted)'), transition: 'all 0.15s', position: 'relative' }}>
              <span className="font-orbitron" style={{ fontSize: 9, letterSpacing: '1px' }}>{tab.label}</span>
              {isDone && !isCurrent && (
                <span style={{ position: 'absolute', top: -3, right: -3, fontSize: 8, background: 'var(--ng-green)', color: '#000', borderRadius: '50%', width: 12, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══════════════ SKILL TREES ════════════════════════════════ */}
      {view === 'trees' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Header row with reset */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4 }}>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>
              The daily tabs are what you train. This is where that training is headed.
            </div>
            {confirmReset ? (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => setConfirmReset(false)} style={{ padding: '4px 8px', background: 'transparent', border: '0.5px solid var(--ng-border)', borderRadius: 6, color: 'var(--ng-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <span className="font-orbitron" style={{ fontSize: 7 }}>CANCEL</span>
                </button>
                <button onClick={resetAllTrees} style={{ padding: '4px 8px', background: 'rgba(255,71,87,0.12)', border: '1px solid var(--ng-red)', borderRadius: 6, color: 'var(--ng-red)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <span className="font-orbitron" style={{ fontSize: 7 }}>CONFIRM</span>
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmReset(true)} style={{ flexShrink: 0, padding: '4px 10px', background: 'transparent', border: '0.5px solid var(--ng-border)', borderRadius: 6, color: 'var(--ng-dimmer)', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span className="font-orbitron" style={{ fontSize: 7 }}>RESET ALL</span>
              </button>
            )}
          </div>

          {TREES.map(tree => {
            const lvl = getLvl(tree.id);
            const current = tree.nodes[lvl];
            const maxed = lvl >= tree.nodes.length - 1;
            const isExpanded = expandedNode === tree.id;
            const pct = Math.round((lvl / (tree.nodes.length - 1)) * 100);

            return (
              <div key={tree.id} style={{ background: 'var(--ng-surface)', border: `0.5px solid ${isExpanded ? tree.color : 'var(--ng-border)'}`, borderLeft: `3px solid ${tree.color}`, borderRadius: 12, overflow: 'hidden', boxShadow: isExpanded ? `0 2px 12px ${tree.color}20` : 'none' }}>
                <button onClick={() => setExpandedNode(isExpanded ? null : tree.id)} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 14px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${tree.color}18`, border: `1px solid ${tree.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, color: tree.color, fontWeight: 700, fontFamily: 'monospace' }}>
                      {lvl}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span className="font-orbitron font-bold" style={{ fontSize: 10, color: tree.color, letterSpacing: '0.5px' }}>{tree.name}</span>
                        {maxed && <span className="font-orbitron" style={{ fontSize: 7, color: '#FF2E88', border: '1px solid #FF2E88', padding: '1px 5px' }}>ELITE</span>}
                      </div>
                      <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-text)', marginBottom: 3 }}>{current.n}{current.elite ? ' ★' : ''}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 3, background: 'var(--ng-border)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: current.elite ? '#FF2E88' : tree.color, borderRadius: 2, transition: 'width 0.4s' }} />
                        </div>
                        <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', flexShrink: 0 }}>{lvl}/{tree.nodes.length - 1}</span>
                      </div>
                    </div>
                    <div style={{ color: 'var(--ng-muted)', fontSize: 14, flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</div>
                  </div>
                </button>

                {isExpanded && (
                  <div style={{ borderTop: '0.5px solid var(--ng-border)', padding: '12px 14px' }}>
                    {/* Days trained */}
                    <div className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-muted)', letterSpacing: '1px', marginBottom: 10 }}>{tree.days}</div>

                    {/* Current node detail */}
                    <div style={{ background: `${tree.color}10`, border: `1px solid ${tree.color}40`, borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                      <div className="font-orbitron" style={{ fontSize: 9, color: current.elite ? '#FF2E88' : tree.color, letterSpacing: '1px', marginBottom: 4 }}>
                        CURRENT NODE — {current.n}
                      </div>
                      <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-text)', lineHeight: 1.5, marginBottom: 8 }}>{current.d}</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {!maxed && (
                          <button onClick={() => saveLevel(tree.id, lvl + 1)} style={{ flex: 1, padding: '8px', background: `${tree.color}18`, border: `1px solid ${tree.color}`, borderRadius: 8, color: tree.color, cursor: 'pointer', fontFamily: 'inherit' }}>
                            <span className="font-orbitron" style={{ fontSize: 9, letterSpacing: '1px' }}>⬆ ADVANCE</span>
                          </button>
                        )}
                        {lvl > 0 && (
                          <button onClick={() => saveLevel(tree.id, lvl - 1)} style={{ padding: '8px 12px', background: 'transparent', border: '0.5px solid var(--ng-border)', borderRadius: 8, color: 'var(--ng-dimmer)', cursor: 'pointer', fontFamily: 'inherit' }}>
                            <span className="font-mono" style={{ fontSize: 9 }}>↓</span>
                          </button>
                        )}
                      </div>
                      {maxed && <div className="font-orbitron" style={{ textAlign: 'center', fontSize: 9, color: '#FF2E88', letterSpacing: '2px', marginTop: 4 }}>★ ELITE UNLOCKED ★</div>}
                    </div>

                    {/* Node chain */}
                    <div className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-muted)', letterSpacing: '1px', marginBottom: 8 }}>PROGRESSION CHAIN</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {tree.nodes.map((node, idx) => {
                        const isCur = idx === lvl;
                        const isUnlocked = idx <= lvl;
                        const dotColor = node.elite ? '#FF2E88' : tree.color;
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
                              <div style={{ width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 8, background: isCur ? dotColor : isUnlocked ? `${dotColor}60` : 'var(--ng-border)', border: isCur ? `2px solid ${dotColor}` : 'none', boxShadow: isCur ? `0 0 8px ${dotColor}80` : 'none' }} />
                              {idx < tree.nodes.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 8, background: isUnlocked ? `${dotColor}40` : 'var(--ng-border)', margin: '2px 0' }} />}
                            </div>
                            <div style={{ flex: 1, paddingBottom: idx < tree.nodes.length - 1 ? 4 : 0, paddingTop: 5 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="font-mono" style={{ fontSize: 10, color: isCur ? dotColor : isUnlocked ? 'var(--ng-text)' : 'var(--ng-dimmer)', fontWeight: isCur ? 700 : 400 }}>
                                  {node.n}
                                </span>
                                {node.elite && <span style={{ fontSize: 8, color: '#FF2E88' }}>★</span>}
                                {isCur && <span style={{ fontSize: 8, color: dotColor }}>← HERE</span>}
                              </div>
                              {isCur && <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', marginTop: 1, lineHeight: 1.4 }}>{node.d}</div>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════ DAY VIEW ═══════════════════════════════════ */}
      {view !== 'trees' && currentDay && (
        <div>
          {/* Day header */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
              <div>
                <span className="font-orbitron font-bold" style={{ fontSize: 13, color: currentDay.color, letterSpacing: '1px' }}>{currentDay.label} — {currentDay.focus}</span>
              </div>
              <button onClick={() => toggleDone(dayDoneKey)}
                style={{ flexShrink: 0, padding: '7px 12px', background: isDayDone ? 'rgba(48,209,88,0.12)' : 'transparent', border: `1px solid ${isDayDone ? 'var(--ng-green)' : 'var(--ng-border)'}`, borderRadius: 20, color: isDayDone ? 'var(--ng-green)' : 'var(--ng-muted)', cursor: 'pointer', transition: 'all 0.15s' }}>
                <span className="font-orbitron" style={{ fontSize: 8, letterSpacing: '1px' }}>{isDayDone ? '✓ DONE' : 'MARK DONE'}</span>
              </button>
            </div>

            {/* Brief */}
            <div style={{ padding: '10px 12px', background: `${currentDay.color}08`, border: `0.5px solid ${currentDay.color}30`, borderLeft: `3px solid ${currentDay.color}`, borderRadius: 10, marginBottom: 8 }}>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-text)', lineHeight: 1.6 }}>{currentDay.brief}</div>
            </div>

            {/* Replaces */}
            <div style={{ padding: '6px 10px', background: 'var(--ng-surface)', border: '0.5px solid var(--ng-border)', borderRadius: 8, marginBottom: 8 }}>
              <span className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-muted)', letterSpacing: '1px' }}>REPLACING: </span>
              <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-cyan)' }}>{currentDay.replaces}</span>
            </div>

            {/* Tree chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {currentDay.trees.map(tid => {
                const tree = TREES.find(t => t.id === tid)!;
                return (
                  <button key={tid} onClick={() => setView('trees')}
                    style={{ padding: '3px 10px', background: `${tree.color}10`, border: `1px solid ${tree.color}50`, borderRadius: 12, color: tree.color, cursor: 'pointer', fontFamily: 'inherit' }}>
                    <span className="font-orbitron" style={{ fontSize: 8, letterSpacing: '0.5px' }}>{tree.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exercise cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentDay.ex.map((ex, i) => {
              const exKey    = `cali_d${view}_ex${i}`;
              const exDone   = done[`${exKey}_${today}`] ?? false;
              const exTier   = exTiers[exKey] ?? 0;
              const isExpand = expandedEx === exKey;
              const tArr     = [ex.t1, ex.t2, ex.t3];

              return (
                <div key={i} style={{ background: 'var(--ng-surface)', border: `0.5px solid ${isExpand ? currentDay.color : 'var(--ng-border)'}`, borderLeft: `3px solid ${exDone ? 'var(--ng-green)' : currentDay.color}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <button onClick={() => setExpandedEx(isExpand ? null : exKey)} style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '12px 14px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                            <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-dimmer)', textDecoration: 'line-through' }}>{ex.old}</span>
                            <span style={{ color: '#FF2E88', fontSize: 10 }}>→</span>
                            <span className="font-orbitron font-bold" style={{ fontSize: 10, color: exDone ? 'var(--ng-green)' : 'var(--ng-text)', letterSpacing: '0.3px' }}>{ex.neu}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                            {ex.eq.map(eq => (
                              <span key={eq} className="font-orbitron" style={{ fontSize: 7, color: EQ_META[eq].color, border: `0.5px solid ${EQ_META[eq].color}60`, padding: '1px 5px', borderRadius: 4 }}>{EQ_META[eq].label}</span>
                            ))}
                          </div>
                          <div className="font-mono" style={{ fontSize: 9, color: TIER_META[exTier].color }}>
                            [T{exTier + 1}] {tArr[exTier].length > 55 ? tArr[exTier].slice(0, 55) + '…' : tArr[exTier]}
                          </div>
                        </div>
                        <div style={{ color: 'var(--ng-muted)', fontSize: 14, flexShrink: 0 }}>{isExpand ? '▲' : '▼'}</div>
                      </div>
                    </button>
                    <button onClick={() => toggleDone(`${exKey}_${today}`)}
                      style={{ padding: '0 14px', background: exDone ? 'rgba(48,209,88,0.08)' : 'transparent', border: 'none', borderLeft: `0.5px solid ${exDone ? 'rgba(48,209,88,0.3)' : 'var(--ng-border)'}`, color: exDone ? 'var(--ng-green)' : 'var(--ng-dimmer)', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>
                      {exDone ? '✓' : '○'}
                    </button>
                  </div>

                  {isExpand && (
                    <div style={{ borderTop: '0.5px solid var(--ng-border)', padding: '12px 14px' }}>
                      {/* Tree reference */}
                      <div style={{ padding: '5px 8px', background: 'rgba(57,255,136,0.05)', border: '0.5px solid rgba(57,255,136,0.2)', borderRadius: 6, marginBottom: 10 }}>
                        <span className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-green)', letterSpacing: '0.5px' }}>TREE: </span>
                        <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-cyan)' }}>{ex.tree}</span>
                      </div>

                      {/* 3 tiers */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                        {tArr.map((tierText, ti) => {
                          const isActive = ti === exTier;
                          const tm = TIER_META[ti];
                          return (
                            <button key={ti} onClick={() => saveExTier(exKey, ti as 0 | 1 | 2)}
                              style={{ width: '100%', textAlign: 'left', background: isActive ? `${tm.color}10` : 'transparent', border: `0.5px solid ${isActive ? tm.color : 'var(--ng-border)'}`, borderLeft: `3px solid ${isActive ? tm.color : 'transparent'}`, borderRadius: 8, padding: '8px 10px', cursor: 'pointer' }}>
                              <div className="font-orbitron" style={{ fontSize: 7, color: tm.color, letterSpacing: '1px', marginBottom: 3 }}>
                                T{ti + 1} — {tm.label}{isActive ? ' ← CURRENT' : ''}
                              </div>
                              <div className="font-mono" style={{ fontSize: 10, color: isActive ? 'var(--ng-text)' : 'var(--ng-muted)', lineHeight: 1.5 }}>{tierText}</div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Carryover */}
                      <div style={{ padding: '8px 10px', background: 'rgba(255,176,32,0.06)', border: '0.5px solid rgba(255,176,32,0.25)', borderRadius: 8 }}>
                        <div className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-amber)', letterSpacing: '1px', marginBottom: 2 }}>CARRYOVER</div>
                        <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-text)', lineHeight: 1.5 }}>{ex.carry}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ marginTop: 14, padding: '8px 12px', background: 'var(--ng-surface)', border: '0.5px solid var(--ng-border)', borderRadius: 10, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {Object.entries(EQ_META).map(([k, v]) => (
              <span key={k} className="font-orbitron" style={{ fontSize: 7, color: v.color, border: `0.5px solid ${v.color}50`, padding: '2px 7px', borderRadius: 5 }}>{v.label}</span>
            ))}
            <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>· tap tier to set current</span>
          </div>
        </div>
      )}
    </div>
  );
}
