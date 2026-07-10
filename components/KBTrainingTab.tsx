'use client';
import { useState, useEffect } from 'react';
import { getTodayStr, getCurrentWeekDays } from '../lib/time';

// ── Types ────────────────────────────────────────────────────────────────────
type EqType = 'kb' | 'db' | 'bw';
type DayKey  = '1' | '2' | '3' | '4' | '5' | '6' | '7';
type View    = 'overview' | DayKey;

interface KBEx {
  old:   string;
  neu:   string;
  eq:    EqType[];
  t1:    string;
  t2:    string;
  t3:    string;
  carry: string;
}

interface KBDay {
  label:    string;
  focus:    string;
  color:    string;
  brief:    string;
  replaces: string;
  ex:       KBEx[];
}

// ── Equipment meta ───────────────────────────────────────────────────────────
const EQ_META: Record<EqType, { label: string; color: string }> = {
  kb: { label: 'KB', color: 'var(--ng-cyan)'  },
  db: { label: 'DB', color: 'var(--ng-amber)' },
  bw: { label: 'BW', color: 'var(--ng-green)' },
};

const TIER_META = [
  { label: 'FOUNDATION', color: '#8E8E93' },
  { label: 'LOAD',       color: 'var(--ng-cyan)'   },
  { label: 'MASTERY',    color: '#BF5AF2' },
];

// ── Day data ─────────────────────────────────────────────────────────────────
const DAYS: Record<DayKey, KBDay> = {
  '1': {
    label: 'DAY 01', focus: 'BACK', color: 'var(--ng-cyan)',
    brief: 'Machines isolate one pulling path. Free-hanging and single-arm work forces your back to stabilize through a real range — the same range you use climbing, carrying, and hauling. This is where gym-body stiffness starts to leave your shoulders.',
    replaces: 'Wide/V-bar lat pulldown, cable rows, row delt machine, face pulls, iso-lateral high row',
    ex: [
      {
        old: 'Wide bar / V-bar lat pulldown', neu: 'Pull-Up Progression', eq: ['bw'],
        t1: 'Scapular pulls + dead hangs, 4×20–30 sec. Just learning to hang and engage the lats.',
        t2: 'Band-assisted or slow negative pull-ups, 5×4 with a 3–5 sec controlled descent.',
        t3: 'Strict pull-ups, then weighted pull-ups with a loaded backpack once 8+ clean reps are easy.',
        carry: 'Grip endurance, climbing, lifting your own bodyweight over an edge.',
      },
      {
        old: 'V-bar / wide-bar cable row', neu: 'Single-Arm KB Row + Renegade Row', eq: ['kb'],
        t1: 'Bench-supported single-arm KB row, 4×10/side.',
        t2: 'Freestanding bent-over KB row + renegade row from knees.',
        t3: 'Full renegade row-to-push-up combo with heavier bells, standing tall between reps.',
        carry: 'Hip-hinge strength under load — the same pattern as lifting furniture or a suitcase off the ground.',
      },
      {
        old: 'Row delt machine', neu: 'Bent-Over Reverse Fly', eq: ['db'],
        t1: 'Seated, bent-forward, light DBs, 4×10.',
        t2: 'Standing bent-over reverse fly.',
        t3: 'Single-arm reverse fly with a slight rotation to add anti-rotation core work.',
        carry: 'Postural strength that fights the forward hunch from screens and driving.',
      },
      {
        old: 'Face pulls', neu: 'Band Pull-Apart / Prone Y-T-W', eq: ['bw'],
        t1: 'Band pull-aparts, 4×15.',
        t2: 'Prone Y-T-W raises on the floor with light DBs.',
        t3: 'Standing band face pull with a 1-sec pause and external rotation at the end range.',
        carry: 'Shoulder health for pressing and throwing — the maintenance rep of every day.',
      },
      {
        old: 'Iso-lateral high row machine', neu: 'Inverted Row', eq: ['bw'],
        t1: 'Feet-supported inverted row under a sturdy table or low bar, steep angle.',
        t2: 'Flat inverted row, body parallel to floor.',
        t3: 'Feet-elevated or single-arm (archer) inverted row.',
        carry: 'A pulling strength baseline you can test anywhere — no gym required.',
      },
      {
        old: 'Sit-ups / leg raises / crunches / Russian twists', neu: 'Hanging Knee Raise + KB Russian Twist', eq: ['kb', 'bw'],
        t1: 'Lying leg raises + light KB Russian twists, 4×10.',
        t2: 'Hanging knee raises from a bar.',
        t3: 'Hanging straight-leg raises, working toward toes-to-bar.',
        carry: 'Core control that transfers directly to every lift and to carrying awkward loads.',
      },
    ],
  },
  '2': {
    label: 'DAY 02', focus: 'CHEST & SHOULDERS', color: 'var(--ng-green)',
    brief: 'A machine locks your shoulder into one fixed path. Presses and raises done free let the joint find its own arc — which is exactly what keeps shoulders resilient instead of tight and clicky.',
    replaces: 'DB chest press, incline fly, shoulder press, front/lateral raise, rear delt fly, squeeze press, side crunch',
    ex: [
      {
        old: 'DB chest press', neu: 'Push-Up Progression + KB Floor Press', eq: ['bw', 'kb'],
        t1: 'Incline push-ups, hands elevated on a bench or counter.',
        t2: 'Standard push-ups, full range, chest to floor.',
        t3: 'Deficit push-ups (hands below hand level) or one-arm push-up progression.',
        carry: 'Pushing strength for everything from a stuck door to catching yourself in a fall.',
      },
      {
        old: 'Incline DB fly / lateral raise', neu: 'DB Incline Fly + KB Halo', eq: ['db', 'kb'],
        t1: 'Floor DB fly, light weight, controlled.',
        t2: 'Bench incline fly.',
        t3: 'Single-arm fly combined with KB halos for shoulder mobility under light load.',
        carry: 'Shoulder mobility that prevents the "gym stiff" rounded-forward look.',
      },
      {
        old: 'DB shoulder press / machine', neu: 'KB / DB Overhead Press', eq: ['kb', 'db'],
        t1: 'Seated two-arm DB press, light load.',
        t2: 'Standing single-arm KB press, bottoms-up grip optional for stability work.',
        t3: 'Alternating KB push press or split-stance overhead press.',
        carry: 'Overhead strength for lifting things onto shelves, luggage racks, into the truck bed.',
      },
      {
        old: 'DB front raise', neu: 'KB / DB Front Raise', eq: ['db', 'kb'],
        t1: 'Two-arm front raise, light.',
        t2: 'Single-arm front raise with a 1-sec pause at the top.',
        t3: 'Alternating front raise with a heavier bell, slow eccentric.',
        carry: 'Shoulder endurance for holding bags, boxes, or a kid out in front of you.',
      },
      {
        old: 'Cable side lateral raise', neu: 'DB Lateral Raise', eq: ['db'],
        t1: 'Light DB, seated, partial range.',
        t2: 'Standing full-range lateral raise.',
        t3: 'Slow 3-sec eccentric lateral raise, heavier load.',
        carry: 'Shoulder width and stability for overhead and carrying work.',
      },
      {
        old: 'Cable / machine rear delt fly', neu: 'Prone Reverse Fly', eq: ['db', 'bw'],
        t1: 'Bench-supported, light DBs.',
        t2: 'Standing bent-over version.',
        t3: 'Single-arm with rotation.',
        carry: 'Same postural payoff as Day 1 — undoing hours of forward-reaching.',
      },
      {
        old: 'Face pulls', neu: 'Band Pull-Apart', eq: ['bw'],
        t1: 'Band pull-aparts, 4×15.',
        t2: 'Prone Y-T-W raises with light DBs.',
        t3: 'Standing face pull with 1-sec pause + external rotation at end range.',
        carry: 'Shoulder maintenance — non-negotiable every session.',
      },
      {
        old: 'DB squeeze press', neu: 'DB Floor Squeeze Press', eq: ['db'],
        t1: 'Light DBs pressed together, floor press, short range.',
        t2: 'Full range floor squeeze press.',
        t3: 'Slow tempo (3 sec up/down) with heavier DBs.',
        carry: 'Inner-chest strength for hugging, bracing, and stabilizing loads against your torso.',
      },
      {
        old: 'KB side crunch / cable crunches', neu: 'KB Side Bend + Hanging Windshield Wipers', eq: ['kb', 'bw'],
        t1: 'Standing KB side bend, light bell.',
        t2: 'Half-kneeling side bend for more range.',
        t3: 'Hanging windshield wipers from a bar.',
        carry: 'Rotational core strength for swinging, throwing, and twisting to grab something behind you.',
      },
    ],
  },
  '3': {
    label: 'DAY 03', focus: 'BICEPS / TRICEPS / ABS', color: 'var(--ng-amber)',
    brief: 'Arms and abs get built through grip-driven, anti-extension work here instead of machine curls — the kind of strength that shows up when you\'re rucking, climbing, or just holding your own bodyweight up.',
    replaces: 'Hammer curl, seated DB curl, overhead tricep extension, weighted crunches, rollbacks, treadmill',
    ex: [
      {
        old: 'Hammer curl / seated DB curl', neu: 'DB / KB Hammer Curl', eq: ['db', 'kb'],
        t1: 'Light two-arm hammer curl.',
        t2: 'Single-arm hammer curl, slower tempo.',
        t3: 'Heavier bell, 3-sec eccentric, alternating arms.',
        carry: 'Forearm and grip endurance for carrying groceries, tools, luggage.',
      },
      {
        old: 'DB / barbell overhead tricep extension', neu: 'KB Overhead Extension + Diamond Push-Up', eq: ['kb', 'bw'],
        t1: 'Diamond push-ups on knees.',
        t2: 'Full diamond push-ups.',
        t3: 'Deficit diamond push-ups or single-arm KB overhead extension.',
        carry: 'Tricep lockout strength for pushing yourself up off the floor unassisted.',
      },
      {
        old: 'Inclined weighted crunches', neu: 'KB Weighted Sit-Up', eq: ['kb'],
        t1: 'Light KB held at chest, controlled sit-up.',
        t2: 'Heavier KB, full range.',
        t3: 'KB held overhead during the sit-up for an added stability challenge.',
        carry: 'Core strength integrated with hip flexors — real getting-up-off-the-ground strength.',
      },
      {
        old: 'KB / DB side crunch', neu: 'KB Side Bend', eq: ['kb'],
        t1: 'Standing KB side bend, light bell.',
        t2: 'Half-kneeling side bend for more range.',
        t3: 'Heavier bell, full lean at bottom, slow return.',
        carry: 'Rotational core strength for lateral movement and reaching.',
      },
      {
        old: 'Rollbacks', neu: 'KB Core Rollout', eq: ['kb'],
        t1: 'Kneeling rollout, short range, sturdy bell or ab wheel.',
        t2: 'Kneeling rollout, extended range.',
        t3: 'Standing ab rollout.',
        carry: 'Anti-extension core strength — the thing that protects your lower back under any load.',
      },
      {
        old: 'KB Russian twists', neu: 'KB Russian Twist', eq: ['kb'],
        t1: 'Feet down, light bell.',
        t2: 'Feet elevated.',
        t3: 'Heavier bell, feet elevated, full rotation.',
        carry: 'Rotational power for swings, throws, changing direction.',
      },
      {
        old: 'Leg ups', neu: 'Hanging Leg Raise', eq: ['bw'],
        t1: 'Lying leg raises, controlled, lower back flat.',
        t2: 'Hanging knee raises from a bar.',
        t3: 'Hanging straight-leg raises, working toward toes-to-bar.',
        carry: 'Core control from the hip flexors — transfers to every lower-body lift.',
      },
      {
        old: 'Laying face press', neu: 'Close-Grip Floor Press / Diamond Push-Up', eq: ['bw', 'db'],
        t1: 'Diamond push-up on knees.',
        t2: 'Full diamond push-up.',
        t3: 'Close-grip DB floor press for added tricep load.',
        carry: 'Tricep lockout for pressing movements.',
      },
      {
        old: 'Treadmill — 1hr @ 3.0', neu: 'Rucking or Jump Rope Intervals', eq: ['bw'],
        t1: 'Brisk 30–45 min walk, light backpack (10–15 lb).',
        t2: 'Rucking with 20–30 lb load, or 15 min jump rope intervals.',
        t3: 'Weighted ruck on an incline/trail, or 25+ min jump rope with double-unders.',
        carry: 'Real-world cardio that loads your legs and spine the way walking with groceries or a pack actually does — instead of a fixed belt.',
      },
    ],
  },
  '4': {
    label: 'DAY 04', focus: 'LEGS', color: 'var(--ng-purple)',
    brief: 'Machines fix your joint angle for you. Free-standing squats and single-leg work make your legs do their actual job — stabilizing themselves — which is what a machine never asks of them.',
    replaces: 'Leg curl/extension, calf press, leg press, sumo/narrow squats, weighted crunches',
    ex: [
      {
        old: 'Cable hamstring curl / seated leg curl', neu: 'Single-Leg RDL + Nordic Curl Progression', eq: ['kb', 'bw'],
        t1: 'Bodyweight single-leg RDL, focus on balance.',
        t2: 'Single-leg KB RDL, moderate load.',
        t3: 'Nordic curl negatives (partner or anchored feet) for hamstring eccentric strength.',
        carry: 'Hamstring strength that protects against pulls during sprinting, hiking, or a sudden slip.',
      },
      {
        old: 'Leg extensions machine', neu: 'Bulgarian Split Squat', eq: ['bw', 'db'],
        t1: 'Bodyweight rear-foot-elevated split squat.',
        t2: 'DB or KB-loaded Bulgarian split squat.',
        t3: 'Pistol squat progression — box-assisted, working toward full pistol.',
        carry: 'Single-leg strength for stairs, uneven ground, getting up off the floor one leg at a time.',
      },
      {
        old: 'Calf press / seated calf raise', neu: 'Standing Calf Raise', eq: ['bw', 'db'],
        t1: 'Two-leg bodyweight calf raise, full range, slow tempo.',
        t2: 'Single-leg calf raise.',
        t3: 'Single-leg calf raise holding a DB or KB.',
        carry: 'Ankle and calf resilience for running, hiking, and standing all day.',
      },
      {
        old: 'Inclined / seated leg press', neu: 'Goblet Squat', eq: ['kb'],
        t1: 'Bodyweight squat, full depth, focus on form.',
        t2: 'KB goblet squat, front-loaded.',
        t3: 'Front-racked double KB squat.',
        carry: 'The single most functional lower-body pattern there is — squatting to pick things up, sit, and stand.',
      },
      {
        old: 'Sumo squats', neu: 'KB Sumo / Goblet Sumo Squat', eq: ['kb'],
        t1: 'Bodyweight sumo squat.',
        t2: 'KB-loaded sumo squat.',
        t3: 'Heavier bell, paused at the bottom for 2 sec.',
        carry: 'Hip mobility and adductor strength for lateral movement and getting in/out of cars low to the ground.',
      },
      {
        old: 'Squats inner/narrow quad', neu: 'Narrow-Stance Goblet Squat / Cossack Squat', eq: ['kb', 'bw'],
        t1: 'Bodyweight narrow squat.',
        t2: 'Cossack squat, partial range, holding support.',
        t3: 'Full-depth cossack squat, KB held at chest.',
        carry: 'Lateral hip strength and mobility most gym machines never train at all.',
      },
      {
        old: 'Weighted ab crunches', neu: 'KB Weighted Sit-Up', eq: ['kb'],
        t1: 'Light KB held at chest, controlled sit-up.',
        t2: 'Heavier KB, full range.',
        t3: 'KB held overhead during sit-up for stability challenge.',
        carry: 'Integrated core/hip strength.',
      },
      {
        old: 'Laying KB leg raises', neu: 'Lying Leg Raise → Hanging Leg Raise', eq: ['bw'],
        t1: 'Lying leg raises, lower back flat to floor.',
        t2: 'Hanging knee raises from a bar.',
        t3: 'Hanging straight-leg raises, working toward toes-to-bar.',
        carry: 'Core control.',
      },
    ],
  },
  '5': {
    label: 'DAY 05', focus: 'ABS + LOWER TRAP', color: '#FF453A',
    brief: 'Posture work that actually holds up under load — training the muscles between your shoulder blades so a laptop-and-phone life doesn\'t win by default.',
    replaces: 'Hanging/weighted leg raise, Russian twist, bentover rows, lateral row machine, cable crunch, pullover, cardio',
    ex: [
      {
        old: 'Weighted Russian hanging leg raise / leg raises', neu: 'Hanging Leg Raise Progression', eq: ['bw'],
        t1: 'Lying leg raises, lower back flat, controlled.',
        t2: 'Hanging knee raises from a dead hang.',
        t3: 'Hanging straight-leg raises, working toward toes-to-bar.',
        carry: 'Core control that transfers to every lift.',
      },
      {
        old: 'Standing Russian twist', neu: 'Standing KB Twist / Woodchopper', eq: ['kb'],
        t1: 'Light KB, slow controlled twist.',
        t2: 'Moderate load, full rotation.',
        t3: 'Explosive woodchopper pattern, heavier bell.',
        carry: 'Rotational power for swinging a bat, shoveling, or twisting to reach behind you.',
      },
      {
        old: 'KB side crunches', neu: 'KB Side Bend', eq: ['kb'],
        t1: 'Standing KB side bend, light bell.',
        t2: 'Half-kneeling side bend for more range.',
        t3: 'Heavier bell, full lean at bottom, slow return.',
        carry: 'Rotational core for lateral movement and twisting to reach.',
      },
      {
        old: 'Bentover two-arm / single-arm DB rows', neu: 'Bentover DB / KB Row', eq: ['db', 'kb'],
        t1: 'Bench-supported single-arm row, 4×10/side.',
        t2: 'Freestanding bent-over row + renegade row from knees.',
        t3: 'Full renegade row-to-push-up combo, heavier bells.',
        carry: 'Pulling strength under hip-hinge load.',
      },
      {
        old: 'Machine lateral row', neu: 'Renegade Row', eq: ['kb'],
        t1: 'Renegade row from knees, light bells.',
        t2: 'Full renegade row, push-up optional.',
        t3: 'Renegade row-to-push-up combo, heavier bells.',
        carry: 'Anti-rotation core + pulling strength — two for one.',
      },
      {
        old: 'Cable crunch', neu: 'KB Weighted Crunch', eq: ['kb'],
        t1: 'Light KB held at chest, standard crunch.',
        t2: 'Heavier KB, full range.',
        t3: 'KB held overhead during crunch for stability demand.',
        carry: 'Core strength for bending and lifting safely.',
      },
      {
        old: 'Weighted inclined sit-ups', neu: 'KB Weighted Sit-Up', eq: ['kb'],
        t1: 'Light KB held at chest, controlled sit-up.',
        t2: 'Heavier KB, full range.',
        t3: 'KB held overhead during the sit-up.',
        carry: 'Hip-flexor + core integration.',
      },
      {
        old: 'Pullover', neu: 'KB Pullover', eq: ['kb'],
        t1: 'Light bell, floor, controlled range.',
        t2: 'Moderate load, full stretch overhead.',
        t3: 'Heavier bell, slow 3-sec eccentric.',
        carry: 'Lat and rib-cage mobility that helps overhead reaching and breathing mechanics.',
      },
      {
        old: 'Face pull / reverse fly delts', neu: 'Band Pull-Apart / Prone Reverse Fly', eq: ['bw', 'db'],
        t1: 'Band pull-aparts, 4×15.',
        t2: 'Prone Y-T-W raises on the floor with light DBs.',
        t3: 'Standing band face pull, 1-sec pause, external rotation.',
        carry: 'Postural shoulder health — shoulder maintenance for every session.',
      },
      {
        old: 'Doorway chest stretch / side toe touches', neu: 'Same — already bodyweight', eq: ['bw'],
        t1: 'Hold 20–30 sec per side.',
        t2: 'Hold 45 sec, deeper range.',
        t3: 'Add a light dynamic bounce at end range.',
        carry: 'Keep as-is — genuinely functional mobility work, no replacement needed.',
      },
      {
        old: 'Cardio — 45 min', neu: 'Jump Rope Intervals / Rucking / Stairs', eq: ['bw'],
        t1: 'Brisk 30–45 min walk, light backpack (10–15 lb).',
        t2: 'Rucking with 20–30 lb load, or 15 min jump rope intervals.',
        t3: 'Weighted ruck on incline/trail, or 25+ min jump rope with double-unders.',
        carry: 'Real-world conditioning — no fixed belt required.',
      },
    ],
  },
  '6': {
    label: 'DAY 06', focus: 'LOWER BACK', color: '#FF6B35',
    brief: 'The lower back is a stabilizer, not a mover — this day already leans functional. The fix is loading the hinge and bridge patterns with kettlebells instead of a barbell, and keeping the bodyweight stability work exactly as is.',
    replaces: 'Deadlifts, hyperextensions, bridges, seated/standing rows',
    ex: [
      {
        old: 'Deadlifts', neu: 'KB Deadlift + Single-Leg RDL', eq: ['kb'],
        t1: 'Bodyweight hip hinge drill, then light single KB deadlift.',
        t2: 'Double KB deadlift, moderate load.',
        t3: 'Heavy single KB deadlift or single-leg KB RDL for added stability demand.',
        carry: 'The single most transferable pattern for lifting anything off the ground safely for life.',
      },
      {
        old: 'Hyperextensions', neu: 'Bird-Dog / Superman', eq: ['bw'],
        t1: 'Bird-dog, slow and controlled, 4×10/side.',
        t2: 'Superman hold, 4×20–30 sec.',
        t3: 'Superman with alternating arm/leg pulses.',
        carry: 'Already the right movement — no replacement needed, just keep progressing hold time and control.',
      },
      {
        old: 'Bridges', neu: 'Glute Bridge → Hip Thrust', eq: ['bw', 'kb'],
        t1: 'Bodyweight glute bridge, 4×15.',
        t2: 'Single-leg glute bridge.',
        t3: 'KB-loaded hip thrust (bell across hips, shoulders on a bench).',
        carry: 'Glute strength that protects the lower back and powers walking, running, and stairs.',
      },
      {
        old: 'Planks', neu: 'Plank Progression', eq: ['bw', 'kb'],
        t1: 'Front plank, 4×20–30 sec.',
        t2: 'Side plank both sides + plank with shoulder taps.',
        t3: 'Weighted plank (KB on back) or plank with reach/drag.',
        carry: 'Core bracing under static and dynamic load — the base for every other lift.',
      },
      {
        old: 'Cat-Cow stretch', neu: 'Same — already bodyweight', eq: ['bw'],
        t1: 'Slow, 8–10 reps.',
        t2: 'Add a pause at each end range.',
        t3: 'Combine with thoracic rotation reaches.',
        carry: 'Keep as-is — genuine spinal mobility work.',
      },
      {
        old: 'Seated / standing rows', neu: 'Bentover KB Row', eq: ['kb'],
        t1: 'Bench-supported single-arm KB row, 4×10/side.',
        t2: 'Freestanding bent-over row + renegade row from knees.',
        t3: 'Full renegade row-to-push-up combo, heavier bells.',
        carry: 'Pulling strength + postural support for the spine.',
      },
    ],
  },
  '7': {
    label: 'DAY 07', focus: 'FULL BODY HIIT', color: '#BF5AF2',
    brief: 'This day is already built the way the body actually moves — sequenced, breathless, multi-planar. Nothing here needs replacing. Just load the two dumbbell moves with kettlebells for a more natural grip and swing path.',
    replaces: 'Bentover DB row, DB curl-to-press (loaded with kettlebells instead)',
    ex: [
      {
        old: 'Floor X raise / sit-through / deadbug (warmup)', neu: 'Same — already bodyweight', eq: ['bw'],
        t1: 'Slow and controlled, full warmup set.',
        t2: 'Add 1–2 extra rounds.',
        t3: 'Flow between all three with no rest between transitions.',
        carry: 'Keep as-is — this is exactly the kind of multi-planar prep a machine-based warmup never gives you.',
      },
      {
        old: 'Bentover dumbbell row', neu: 'Bentover KB Row', eq: ['kb'],
        t1: 'Bench-supported single-arm KB row, 4×10/side.',
        t2: 'Freestanding bent-over row + renegade row from knees.',
        t3: 'Full renegade row-to-push-up combo, heavier bells.',
        carry: 'Pulling strength inside a conditioning circuit.',
      },
      {
        old: 'DB curl to overhead press', neu: 'KB Clean & Press', eq: ['kb'],
        t1: 'Light bell, two-hand clean to press, focus on technique.',
        t2: 'Single-arm KB clean to press.',
        t3: 'Alternating clean & press for continuous reps under fatigue.',
        carry: 'Full-body power output — the exact quality that separates "gym strong" from "actually athletic."',
      },
      {
        old: 'Plank with reach (both sides)', neu: 'Same — already bodyweight', eq: ['bw'],
        t1: 'Slow controlled reach.',
        t2: 'Faster tempo.',
        t3: 'Add a light KB drag under the plank.',
        carry: 'Keep as-is — anti-rotation core under dynamic load.',
      },
      {
        old: 'KB halo', neu: 'Same — already kettlebell', eq: ['kb'],
        t1: 'Light bell, slow circles.',
        t2: 'Moderate bell.',
        t3: 'Heavier bell, both directions without pause.',
        carry: 'Keep as-is — shoulder mobility under light load.',
      },
      {
        old: 'Lateral lunge touchdown to overhead press', neu: 'KB Lateral Lunge to Press', eq: ['kb'],
        t1: 'Bodyweight lateral lunge with a light touchdown.',
        t2: 'Add a light KB press at the top.',
        t3: 'Heavier bell, full tempo through the circuit.',
        carry: 'Keep as-is — a genuinely complete athletic movement.',
      },
    ],
  },
};

// ── Storage keys ──────────────────────────────────────────────────────────────
const DONE_KEY  = 'grid_kb_done';
const TIERS_KEY = 'grid_kb_tiers';

// ── Component ─────────────────────────────────────────────────────────────────
export default function KBTrainingTab() {
  const [view,       setView]       = useState<View>('overview');
  const [done,       setDone]       = useState<Record<string, boolean>>({});
  const [tiers,      setTiers]      = useState<Record<string, 0 | 1 | 2>>({});
  const [expandedEx, setExpandedEx] = useState<string | null>(null);

  const today = getTodayStr();

  useEffect(() => {
    try { const r = localStorage.getItem(DONE_KEY);  if (r) setDone(JSON.parse(r));  } catch {}
    try { const r = localStorage.getItem(TIERS_KEY); if (r) setTiers(JSON.parse(r)); } catch {}
  }, []);

  const toggleDone = (key: string) => {
    const next = { ...done, [key]: !done[key] };
    setDone(next);
    try { localStorage.setItem(DONE_KEY, JSON.stringify(next)); } catch {}
  };

  const setTier = (key: string, tier: 0 | 1 | 2) => {
    const next = { ...tiers, [key]: tier };
    setTiers(next);
    try { localStorage.setItem(TIERS_KEY, JSON.stringify(next)); } catch {}
  };

  // ── Weekly progress ──────────────────────────────────────────────
  const weekDays = getCurrentWeekDays();
  const weekDone = weekDays.filter(d =>
    (['1','2','3','4','5','6','7'] as DayKey[]).some(k => done[`day${k}_${d}`])
  ).length;

  // ── Tab bar ──────────────────────────────────────────────────────
  const TABS: { id: View; label: string; color: string }[] = [
    { id: 'overview', label: '⬡ OVERVIEW', color: 'var(--ng-cyan)' },
    ...(['1','2','3','4','5','6','7'] as DayKey[]).map(k => ({
      id: k as View,
      label: `D${k}`,
      color: DAYS[k].color,
    })),
  ];

  const currentDay  = view !== 'overview' ? DAYS[view as DayKey] : null;
  const dayDoneKey  = view !== 'overview' ? `day${view}_${today}` : '';
  const isDayDone   = done[dayDoneKey] ?? false;

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: 20 }}>

      {/* ── Banner ── */}
      <div style={{ padding: '14px 0 16px', borderBottom: '0.5px solid var(--ng-border)' }}>
        <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-cyan)', letterSpacing: '3px', marginBottom: 8 }}>
          KB + DB FUNCTIONAL REPLACEMENT SYSTEM
        </div>

        {/* Weekly bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1, height: 6, background: 'var(--ng-surface)', borderRadius: 3, overflow: 'hidden', border: '0.5px solid var(--ng-border)' }}>
            <div style={{ height: '100%', width: `${Math.round((weekDone / 7) * 100)}%`, background: 'linear-gradient(90deg, var(--ng-cyan), var(--ng-green))', borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--ng-cyan)', flexShrink: 0 }}>{weekDone}/7 this week</span>
        </div>

        {/* Equipment legend */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['kb','db','bw'] as EqType[]).map(eq => (
            <div key={eq} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', background: `${EQ_META[eq].color}10`, border: `0.5px solid ${EQ_META[eq].color}40`, borderRadius: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: 2, background: EQ_META[eq].color, flexShrink: 0 }} />
              <span className="font-orbitron" style={{ fontSize: 8, color: EQ_META[eq].color, letterSpacing: '1px' }}>{EQ_META[eq].label}</span>
            </div>
          ))}
          <div style={{ flex: 1 }} />
          <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', alignSelf: 'center' }}>gym → functional</div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 0', scrollbarWidth: 'none' }}>
        {TABS.map(tab => {
          const isCurrent = view === tab.id;
          const isDone = tab.id !== 'overview' && done[`day${tab.id}_${today}`];
          return (
            <button key={tab.id} onClick={() => { setView(tab.id); setExpandedEx(null); }}
              style={{
                flexShrink: 0, padding: '6px 12px',
                background: isCurrent ? `${tab.color}18` : 'var(--ng-surface)',
                border: isCurrent ? `1px solid ${tab.color}` : '1px solid var(--ng-border)',
                borderRadius: 20, cursor: 'pointer',
                color: isCurrent ? tab.color : (isDone ? 'var(--ng-green)' : 'var(--ng-muted)'),
                transition: 'all 0.15s', position: 'relative',
              }}>
              <span className="font-orbitron" style={{ fontSize: 9, letterSpacing: '1px' }}>{tab.label}</span>
              {isDone && !isCurrent && (
                <span style={{ position: 'absolute', top: -3, right: -3, fontSize: 8, background: 'var(--ng-green)', color: '#000', borderRadius: '50%', width: 12, height: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══════════════ OVERVIEW ═══════════════════════════════════ */}
      {view === 'overview' && (
        <div>
          <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', marginBottom: 16 }}>
            Tap a day to view the session. Each exercise shows your current tier.
          </div>

          {/* Day overview cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(['1','2','3','4','5','6','7'] as DayKey[]).map(k => {
              const d = DAYS[k];
              const dayComplete = done[`day${k}_${today}`];
              return (
                <button key={k} onClick={() => setView(k)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: 'var(--ng-surface)', border: `0.5px solid ${dayComplete ? 'rgba(48,209,88,0.3)' : 'var(--ng-border)'}`, borderLeft: `3px solid ${dayComplete ? 'var(--ng-green)' : d.color}`, borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: `${d.color}15`, border: `1px solid ${d.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="font-orbitron font-bold" style={{ fontSize: 10, color: d.color }}>{k}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="font-orbitron font-bold" style={{ fontSize: 10, color: dayComplete ? 'var(--ng-green)' : 'var(--ng-text)', letterSpacing: '0.5px', marginBottom: 2 }}>{d.focus}</div>
                    <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.ex.length} exercises — {d.replaces.split(',').length} machines replaced</div>
                  </div>
                  {/* Eq badges */}
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    {Array.from(new Set(d.ex.flatMap(e => e.eq))).map(eq => (
                      <span key={eq} style={{ fontSize: 7, padding: '2px 5px', border: `0.5px solid ${EQ_META[eq].color}60`, borderRadius: 4, color: EQ_META[eq].color }} className="font-orbitron">{EQ_META[eq].label}</span>
                    ))}
                  </div>
                  <span style={{ color: 'var(--ng-muted)', fontSize: 14, flexShrink: 0 }}>›</span>
                </button>
              );
            })}
          </div>

          {/* System note */}
          <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--ng-surface)', border: '0.5px solid var(--ng-border)', borderRadius: 10 }}>
            <div className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-muted)', letterSpacing: '1.5px', marginBottom: 4 }}>SYSTEM NOTE</div>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', lineHeight: 1.6 }}>
              Tiers progress left → right. Stay at a tier until movement is clean for full volume before loading the next. Each exercise tracks your tier independently.
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ DAY VIEW ═══════════════════════════════════ */}
      {view !== 'overview' && currentDay && (
        <div>
          {/* Day header */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="font-orbitron font-bold" style={{ fontSize: 13, color: currentDay.color, letterSpacing: '1px', marginBottom: 2 }}>
                  {currentDay.label} — {currentDay.focus}
                </div>
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
            <div style={{ padding: '7px 10px', background: 'var(--ng-surface)', border: '0.5px solid var(--ng-border)', borderRadius: 8 }}>
              <span className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-muted)', letterSpacing: '1px' }}>REPLACING: </span>
              <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-cyan)' }}>{currentDay.replaces}</span>
            </div>
          </div>

          {/* Exercise cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentDay.ex.map((ex, i) => {
              const exKey    = `d${view}_ex${i}`;
              const exDone   = done[`${exKey}_${today}`] ?? false;
              const exTier   = tiers[exKey] ?? 0;
              const isExpand = expandedEx === exKey;
              const tArr     = [ex.t1, ex.t2, ex.t3];

              return (
                <div key={i}
                  style={{ background: 'var(--ng-surface)', border: `0.5px solid ${isExpand ? currentDay.color : 'var(--ng-border)'}`, borderLeft: `3px solid ${exDone ? 'var(--ng-green)' : currentDay.color}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.15s' }}>

                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    {/* Expand button */}
                    <button onClick={() => setExpandedEx(isExpand ? null : exKey)}
                      style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '12px 14px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          {/* old → new flow */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                            <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-dimmer)', textDecoration: 'line-through' }}>{ex.old}</span>
                            <span style={{ color: 'var(--ng-red)', fontSize: 10 }}>→</span>
                            <span className="font-orbitron font-bold" style={{ fontSize: 10, color: exDone ? 'var(--ng-green)' : 'var(--ng-text)', letterSpacing: '0.3px' }}>{ex.neu}</span>
                          </div>
                          {/* Equipment badges */}
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 4 }}>
                            {ex.eq.map(eq => (
                              <span key={eq} className="font-orbitron" style={{ fontSize: 7, color: EQ_META[eq].color, border: `0.5px solid ${EQ_META[eq].color}60`, padding: '1px 5px', borderRadius: 4, letterSpacing: '0.5px' }}>{EQ_META[eq].label}</span>
                            ))}
                          </div>
                          {/* Current tier preview */}
                          <div className="font-mono" style={{ fontSize: 9, color: TIER_META[exTier].color }}>
                            [T{exTier + 1}] {tArr[exTier].length > 55 ? tArr[exTier].slice(0, 55) + '…' : tArr[exTier]}
                          </div>
                        </div>
                        <div style={{ color: 'var(--ng-muted)', fontSize: 14, flexShrink: 0, paddingTop: 2 }}>{isExpand ? '▲' : '▼'}</div>
                      </div>
                    </button>

                    {/* Done toggle */}
                    <button onClick={() => toggleDone(`${exKey}_${today}`)}
                      style={{ padding: '0 14px', background: exDone ? 'rgba(48,209,88,0.08)' : 'transparent', border: 'none', borderLeft: `0.5px solid ${exDone ? 'rgba(48,209,88,0.3)' : 'var(--ng-border)'}`, color: exDone ? 'var(--ng-green)' : 'var(--ng-dimmer)', cursor: 'pointer', fontSize: 16, flexShrink: 0, transition: 'all 0.15s' }}>
                      {exDone ? '✓' : '○'}
                    </button>
                  </div>

                  {/* Expanded: 3 tiers + carryover */}
                  {isExpand && (
                    <div style={{ borderTop: '0.5px solid var(--ng-border)', padding: '12px 14px' }}>
                      {/* Tier selector */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                        {tArr.map((tierText, ti) => {
                          const isActive = ti === exTier;
                          const tm = TIER_META[ti];
                          return (
                            <button key={ti} onClick={() => setTier(exKey, ti as 0 | 1 | 2)}
                              style={{ width: '100%', textAlign: 'left', background: isActive ? `${tm.color}10` : 'transparent', border: `0.5px solid ${isActive ? tm.color : 'var(--ng-border)'}`, borderLeft: `3px solid ${isActive ? tm.color : 'transparent'}`, borderRadius: 8, padding: '8px 10px', cursor: 'pointer', transition: 'all 0.15s' }}>
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

          {/* Tier guide */}
          <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--ng-surface)', border: '0.5px solid var(--ng-border)', borderRadius: 10, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-muted)', letterSpacing: '1px', marginRight: 4 }}>TIER:</span>
            {TIER_META.map((tm, i) => (
              <span key={i} className="font-orbitron" style={{ fontSize: 7, color: tm.color, border: `0.5px solid ${tm.color}50`, padding: '2px 7px', borderRadius: 6 }}>T{i + 1} {tm.label}</span>
            ))}
            <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', marginLeft: 4 }}>tap tier to set current</span>
          </div>
        </div>
      )}
    </div>
  );
}
