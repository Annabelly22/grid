'use client';
import { useState, useEffect } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────
type TreeId = 'pull' | 'row' | 'push' | 'press' | 'squat' | 'core' | 'post';
type View = 'trees' | '1' | '2' | '3' | '4' | '5' | '6' | '7';

interface ProgNode {
  label: string;
  phase: string;
  sets: string;
  reps: string;
  crit: string;
  note?: string;
}

interface SkillTree {
  id: TreeId;
  label: string;
  icon: string;
  color: string;
  nodes: ProgNode[];
}

interface TieredEx {
  gym: string;
  cali: string;
  tree: TreeId | null;
  t1: string;
  t2: string;
  t3: string;
  sets: string;
  reps: string;
  tip?: string;
}

interface Day {
  label: string;
  focus: string;
  color: string;
  ex: TieredEx[];
}

// ── Skill Tree Data ──────────────────────────────────────────────────────────
const TREES: SkillTree[] = [
  {
    id: 'pull', label: 'PULL', icon: '⬆', color: 'var(--ng-cyan)',
    nodes: [
      { label: 'Dead Hang',          phase: 'P0',    sets: '3', reps: '20–30s',   crit: 'Accumulate 60s total hang time' },
      { label: 'Active Hang',        phase: 'P0',    sets: '3', reps: '15s',      crit: 'Scap retractions 3×10 controlled' },
      { label: 'Slow Negatives',     phase: 'L1',    sets: '3', reps: '5',        crit: '5–8s descent; step or jump up', note: 'Jump or step to bar, lower slow' },
      { label: 'Jumping Pull-Ups',   phase: 'L1',    sets: '3', reps: '8–10',     crit: 'No momentum cheat; controlled top' },
      { label: 'Assisted Pull-Ups',  phase: 'L2',    sets: '3', reps: '6–8',      crit: 'Band-assisted; full dead-hang ROM' },
      { label: 'Full Pull-Up',       phase: 'L2',    sets: '3', reps: '5',        crit: 'Dead-hang start; chin clearly over bar' },
      { label: 'Strict Pull-Up',     phase: 'L3',    sets: '4', reps: '6–10',     crit: 'No kip; 3s pause at top' },
      { label: 'Weighted Pull-Up',   phase: 'L4',    sets: '4', reps: '5',        crit: '+10% bodyweight for 5 clean reps' },
      { label: 'L-Sit Pull-Up',      phase: 'L5',    sets: '3', reps: '5',        crit: 'Hips above 90° throughout pull' },
      { label: 'Archer Pull-Up',     phase: 'L6',    sets: '3', reps: '4 each',   crit: 'Controlled lateral shift at top' },
      { label: 'One-Arm Pull-Up',    phase: 'ELITE', sets: '3', reps: '1–3',      crit: 'The pinnacle of vertical pulling' },
    ],
  },
  {
    id: 'row', label: 'ROW', icon: '↔', color: '#30D158',
    nodes: [
      { label: 'Ring Rows (angled)',  phase: 'P0',    sets: '3', reps: '10–12',    crit: 'Rings at hip height, body 30°' },
      { label: 'Horizontal Rows',    phase: 'P0',    sets: '3', reps: '8–12',     crit: 'Low bar; body parallel to floor' },
      { label: 'Feet-Elevated Rows', phase: 'L1',    sets: '3', reps: '8–10',     crit: 'Chest touches bar every rep' },
      { label: 'Sternum Rows',       phase: 'L2',    sets: '4', reps: '6–8',      crit: 'Sternum taps bar; full retraction' },
      { label: 'Weighted Rows',      phase: 'L3',    sets: '4', reps: '6',        crit: '+10kg plate on chest; controlled' },
      { label: 'Single-Arm Row',     phase: 'L4',    sets: '3', reps: '5 each',   crit: 'Rotate and drive elbow unilateral' },
      { label: 'One-Arm Ring Row',   phase: 'ELITE', sets: '3', reps: '5 each',   crit: 'Free-hanging; horizontal body' },
    ],
  },
  {
    id: 'push', label: 'PUSH', icon: '⬇', color: 'var(--ng-green)',
    nodes: [
      { label: 'Incline Push-Up',    phase: 'P0',    sets: '3', reps: '12–15',    crit: 'Hands elevated; chest to surface' },
      { label: 'Standard Push-Up',   phase: 'P0',    sets: '3', reps: '10–15',    crit: 'Plank form; 3s down, 1s up' },
      { label: 'Diamond Push-Up',    phase: 'L1',    sets: '3', reps: '8–12',     crit: 'Index fingers/thumbs touching' },
      { label: 'Decline Push-Up',    phase: 'L1',    sets: '3', reps: '10–12',    crit: 'Feet elevated to chair height' },
      { label: 'Archer Push-Up',     phase: 'L2',    sets: '3', reps: '6 each',   crit: 'Extend one arm laterally; locked out' },
      { label: 'Planche Lean',       phase: 'L3',    sets: '3', reps: '20–30s',   crit: 'Lean until heels float off ground' },
      { label: 'Ring Push-Up',       phase: 'L4',    sets: '3', reps: '8–10',     crit: 'Rings 10cm off floor; controlled flare' },
      { label: 'One-Arm Negative',   phase: 'L5',    sets: '3', reps: '4 each',   crit: '5s descent one arm; chest to floor' },
      { label: 'One-Arm Push-Up',    phase: 'ELITE', sets: '3', reps: '3 each',   crit: 'The benchmark of push mastery' },
    ],
  },
  {
    id: 'press', label: 'PRESS', icon: '▲', color: 'var(--ng-purple)',
    nodes: [
      { label: 'Pike Push-Up',       phase: 'P0',    sets: '3', reps: '10–12',    crit: 'Hips high; elbows flared out' },
      { label: 'Elevated Pike PU',   phase: 'L1',    sets: '3', reps: '8–10',     crit: 'Feet on chair or box' },
      { label: 'Box Tripod Hold',    phase: 'L1',    sets: '3', reps: '20–30s',   crit: 'Head + hands triangle; balanced' },
      { label: 'Box HSPU',           phase: 'L2',    sets: '3', reps: '5–8',      crit: 'Full ROM box headstand push-ups' },
      { label: 'Wall Headstand',     phase: 'L2',    sets: '3', reps: '30–60s',   crit: 'Chest-to-wall; hold controlled' },
      { label: 'Wall HSPU',          phase: 'L3',    sets: '4', reps: '5',        crit: 'Full ROM at wall; lock out' },
      { label: 'Deficit Wall HSPU',  phase: 'L4',    sets: '4', reps: '5',        crit: 'Head dips below parallette level' },
      { label: 'Free HSPU',          phase: 'ELITE', sets: '3', reps: '3–5',      crit: 'Freestanding handstand press' },
    ],
  },
  {
    id: 'squat', label: 'SQUAT', icon: '↧', color: 'var(--ng-amber)',
    nodes: [
      { label: 'Box Squat',          phase: 'P0',    sets: '3', reps: '12–15',    crit: 'Sit to box then stand; no collapse' },
      { label: 'Goblet Squat',       phase: 'P0',    sets: '3', reps: '12–15',    crit: 'Counterbalance; full ATG depth' },
      { label: 'BW Squat',           phase: 'L1',    sets: '4', reps: '15–20',    crit: 'ATG depth; heels flat throughout' },
      { label: 'Bulgarian Split',    phase: 'L1',    sets: '3', reps: '10 each',  crit: 'Rear foot elevated; vertical torso' },
      { label: 'SL Box Squat',       phase: 'L2',    sets: '3', reps: '6–8 each', crit: 'Single leg, sit to low box' },
      { label: 'Pistol Negative',    phase: 'L3',    sets: '3', reps: '5 each',   crit: '5s controlled descent; one leg' },
      { label: 'Assisted Pistol',    phase: 'L3',    sets: '3', reps: '5 each',   crit: 'Hold TRX or pole for balance' },
      { label: 'Pistol Squat',       phase: 'L4',    sets: '4', reps: '5 each',   crit: 'Unassisted; full ATG depth' },
      { label: 'Weighted Pistol',    phase: 'ELITE', sets: '4', reps: '5 each',   crit: 'Add load; chase mastery' },
    ],
  },
  {
    id: 'core', label: 'CORE', icon: '◎', color: '#FF453A',
    nodes: [
      { label: 'Hollow Hold',        phase: 'P0',    sets: '3', reps: '20–30s',   crit: 'Lower back flat to floor; legs low' },
      { label: 'Hollow Rock',        phase: 'P0',    sets: '3', reps: '10–15',    crit: 'Maintain shape throughout rock' },
      { label: 'Tuck L-Sit Hold',    phase: 'L1',    sets: '3', reps: '10s',      crit: 'Floor or parallettes; knees to chest' },
      { label: 'Hanging Knee Raise', phase: 'L1',    sets: '3', reps: '10–15',    crit: 'Full dead hang; pull knees to chest' },
      { label: 'Hanging Tuck L-Sit', phase: 'L2',    sets: '3', reps: '5–8',      crit: 'Controlled; zero momentum swing' },
      { label: 'L-Sit (bars)',       phase: 'L3',    sets: '3', reps: '10–15s',   crit: 'Legs extended 90° to torso; locked' },
      { label: 'Hanging L-Sit',      phase: 'L4',    sets: '3', reps: '10–15s',   crit: 'Dead-hang then compress up to L' },
      { label: 'V-Sit',              phase: 'L5',    sets: '3', reps: '5–10s',    crit: 'Legs above 90°; torso leaned back' },
      { label: 'Dragon Flag Neg',    phase: 'L5',    sets: '3', reps: '4',        crit: '5s controlled descent; locked body' },
      { label: 'Dragon Flag',        phase: 'ELITE', sets: '3', reps: '5',        crit: 'Horizontal lever; the pinnacle' },
    ],
  },
  {
    id: 'post', label: 'POSTERIOR', icon: '⌁', color: '#FF6B35',
    nodes: [
      { label: 'Hip Hinge Drill',    phase: 'P0',    sets: '3', reps: '15',       crit: 'Dowel on spine; hinge not bend', note: 'Dowel touches: head, upper-back, glutes' },
      { label: 'Single-Leg RDL',     phase: 'P0',    sets: '3', reps: '10 each',  crit: 'BW; no rotation in hips or spine' },
      { label: 'Nordic Negative',    phase: 'L1',    sets: '3', reps: '5',        crit: '5–8s descent; catch with hands' },
      { label: 'Partial Nordic',     phase: 'L2',    sets: '3', reps: '6–8',      crit: 'Lower to 90° and pull back up' },
      { label: 'Full Nordic',        phase: 'L3',    sets: '3', reps: '6–8',      crit: 'Touch floor; hamstrings pull you up' },
      { label: 'Weighted Nordic',    phase: 'L4',    sets: '3', reps: '6–8',      crit: 'Hold plate; full ROM' },
      { label: 'Back Lever Hold',    phase: 'ELITE', sets: '3', reps: '5–10s',    crit: 'Horizontal posterior chain mastery' },
    ],
  },
];

// ── Workout Day Data ─────────────────────────────────────────────────────────
const DAYS: Record<string, Day> = {
  '1': {
    label: 'DAY 01', focus: 'PUSH A — Horizontal + Vertical',
    color: 'var(--ng-green)',
    ex: [
      { gym: 'Bench Press',       cali: 'Push-Up Progression',    tree: 'push',
        t1: 'Standard push-up 3×15 — perfect plank form',
        t2: 'Decline push-up 3×12 — feet elevated chair height',
        t3: 'Ring push-up 3×10 or Archer PU 3×8 each side',
        sets: '3–4', reps: '6–15', tip: 'Full ROM; elbows 45° from torso. Lock out at top.' },
      { gym: 'Overhead Press',    cali: 'Pike Press Progression', tree: 'press',
        t1: 'Pike push-up 3×12 — hips high, elbows flared',
        t2: 'Elevated pike 3×10 — feet on box',
        t3: 'Wall HSPU 4×5 — full range of motion',
        sets: '3–4', reps: '5–12', tip: 'Lock out fully overhead. Head through arms at top.' },
      { gym: 'Dips',              cali: 'Dip Progression',        tree: null,
        t1: 'Chair dip 3×12 — hands on chair, legs forward',
        t2: 'Parallel bar dip 3×10 — full depth to 90°',
        t3: 'Ring dip 3×8 or weighted bar dip 4×6',
        sets: '3–4', reps: '6–12', tip: 'Slight forward lean for chest. Upright for triceps.' },
      { gym: 'Cable Fly',         cali: 'Fly / Flare Variation',  tree: 'push',
        t1: 'Wide-grip push-up 3×12 — hands wide, slow lower',
        t2: 'Archer push-up 3×8 each — arm extends laterally',
        t3: 'Ring flye 3×10 — rings at floor level, wide sweep',
        sets: '3', reps: '8–12', tip: 'Scapular protraction at top. Squeeze chest, not triceps.' },
      { gym: 'Lateral Raise',     cali: 'YTW + Side Reach',       tree: null,
        t1: 'YTW on floor 3×10 — prone, raise arms in Y/T/W',
        t2: 'Side plank reach 3×10 — rotate under and reach',
        t3: 'Handstand shoulder tap 3×8 each',
        sets: '3', reps: '10', tip: 'Slow tempo. Feel rear delt and rotator cuff working.' },
    ],
  },
  '2': {
    label: 'DAY 02', focus: 'PULL A — Vertical Pulling',
    color: 'var(--ng-cyan)',
    ex: [
      { gym: 'Lat Pulldown / Pull-Up', cali: 'Pull-Up Progression', tree: 'pull',
        t1: 'Jumping pull-ups 3×8 — jump, lower in 4s',
        t2: 'Band-assisted pull-ups 3×6 — full dead-hang start',
        t3: 'Strict pull-up 4×6–10 — 3s pause at chin-over-bar',
        sets: '4', reps: '5–10', tip: 'Initiate with scapular depression. Pull elbows to hips.' },
      { gym: 'Bent-Over Row',     cali: 'Row Progression',         tree: 'row',
        t1: 'High bar rows 3×12 — body angled 45°',
        t2: 'Feet-elevated rows 3×10 — chest to bar each rep',
        t3: 'Sternum rows 4×8 — sternum taps bar at top',
        sets: '3–4', reps: '8–12', tip: 'Lead with elbows. Full retraction at top position.' },
      { gym: 'Bicep Curl',        cali: 'Chin-Up + Supinated Row', tree: 'pull',
        t1: 'Supinated ring row 3×12 — palms up, curl to chest',
        t2: 'Slow chin-up negative 3×6 — 5s down from jump',
        t3: 'Chin-up 3×8 — hold 1s at top, feel bicep peak',
        sets: '3', reps: '6–12', tip: 'Supinated grip maximises bicep activation at top.' },
      { gym: 'Face Pull',         cali: 'Band Pull-Apart + YTW',  tree: null,
        t1: 'Band pull-apart 3×15 — straight arms, wide pull',
        t2: 'Wall slide 3×15 — forearms on wall, slide up',
        t3: 'Ring face pull 3×12 — pull to ears, flare elbows',
        sets: '3', reps: '12–15', tip: 'External rotation at finish. Keep elbows high and wide.' },
      { gym: 'Rear Delt Fly',     cali: 'Wide-Grip Inverted Row', tree: 'row',
        t1: 'Wide-grip bar row 3×12 — elbows flared 90°',
        t2: 'Ring row palms-forward 3×10 — pronated grip',
        t3: 'Chest-height single-arm ring row 3×8 each',
        sets: '3', reps: '10–12', tip: 'Pinch scapulas at top. Feel posterior deltoid fire.' },
    ],
  },
  '3': {
    label: 'DAY 03', focus: 'LEGS — Squat Dominant',
    color: 'var(--ng-amber)',
    ex: [
      { gym: 'Back Squat',        cali: 'Squat Progression',      tree: 'squat',
        t1: 'BW squat 4×20 — ATG depth, 3s down, pause, up',
        t2: 'Bulgarian split squat 3×10 each — rear foot elevated',
        t3: 'Pistol squat 4×5 each — full ATG unilateral',
        sets: '4', reps: '5–20', tip: 'ATG depth. Knees track toes. Heels flat throughout.' },
      { gym: 'Romanian Deadlift', cali: 'Posterior Progression',  tree: 'post',
        t1: 'Single-leg RDL 3×10 — BW, hinge not squat',
        t2: 'Nordic negative 3×5 — 5–8s descent, catch',
        t3: 'Full Nordic 3×6 — hamstrings pull you back up',
        sets: '3', reps: '5–10', tip: 'HIP HINGE — not a squat. Feel hamstring stretch, not spine bend.' },
      { gym: 'Leg Press',         cali: 'Step-Up + Paused Squat', tree: 'squat',
        t1: 'Step-up 3×12 each — drive through heel',
        t2: 'Paused squat 4×10 — 3s hold at bottom',
        t3: 'Jump squat 4×8 — explode; land soft',
        sets: '3–4', reps: '8–15', tip: 'Drive through heel on step-up. Full hip extension at top.' },
      { gym: 'Leg Curl',          cali: 'Nordic Hamstring',       tree: 'post',
        t1: 'Nordic negative 3×5 — partner anchors ankles',
        t2: 'Partial nordic 3×8 — lower to 90° only',
        t3: 'Full nordic 3×8 — full range, hamstrings pull',
        sets: '3', reps: '5–8', tip: 'Hardest BW hamstring exercise. Do NOT skip anchor setup.' },
      { gym: 'Calf Raise',        cali: 'Single-Leg Calf Raise',  tree: null,
        t1: 'Two-leg standing 3×20 — heel to floor, up to tip',
        t2: 'Single-leg 3×15 — full ROM each rep',
        t3: 'Single-leg deficit 3×15 — heel drops below step',
        sets: '3', reps: '15–20', tip: 'Full ROM: heel drops fully, rise to maximum tip-toe height.' },
    ],
  },
  '4': {
    label: 'DAY 04', focus: 'CORE + SKILL SESSION',
    color: '#FF453A',
    ex: [
      { gym: 'Plank Variations',  cali: 'Core Compression',       tree: 'core',
        t1: 'Hollow body hold 3×30s — lower back glued to floor',
        t2: 'L-sit holds 3×15s — parallettes or bars',
        t3: 'Dragon flag negative 3×5 — 5s controlled descent',
        sets: '3', reps: '5–30s', tip: 'Every rep starts from reset position. Quality not time.' },
      { gym: 'Ab Wheel / Crunch', cali: 'Hollow Rock Series',     tree: 'core',
        t1: 'Hollow rock 3×15 — maintain shape, no breaking',
        t2: 'Hanging knee raise 3×12 — full hang, no swing',
        t3: 'Hanging L-sit hold 3×10s — compress up fully',
        sets: '3', reps: '10–15', tip: 'Exhale hard at compression peak. Ribcage down always.' },
      { gym: 'Russian Twist',     cali: 'Rotational Compression', tree: 'core',
        t1: 'Dead bug 3×10 each — opposite arm/leg extend slow',
        t2: 'Hanging knee rotate 3×8 each — knees to each side',
        t3: 'Hanging windshield wiper 3×6 each — legs extended',
        sets: '3', reps: '6–10 each', tip: 'Rotate from hip joint, not ankles. Brace full core.' },
      { gym: 'Overhead Press',    cali: 'PRESS Skill Practice',   tree: 'press',
        t1: 'Pike hold 3×30s — feel shoulder alignment',
        t2: 'Box tripod hold 3×30s — head-hand triangle',
        t3: 'Wall handstand hold 3×45s — straight body line',
        sets: '3', reps: '20–60s', tip: 'Daily practice compounds. Quality position over duration.' },
      { gym: 'Mobility Work',     cali: 'Hanging + Shoulder Mob', tree: 'pull',
        t1: 'Dead hang 3×30s — passive decompression',
        t2: 'Active hang + scap shrugs 3×10 — control the move',
        t3: 'Unilateral dead hang 2×20s each — advanced mobility',
        sets: '3', reps: '20–30s', tip: 'Decompress your spine every training day. Non-negotiable.' },
    ],
  },
  '5': {
    label: 'DAY 05', focus: 'PUSH B — Strength Focus',
    color: 'var(--ng-green)',
    ex: [
      { gym: 'Incline Bench',     cali: 'Decline Push-Up Block',  tree: 'push',
        t1: 'Decline push-up 4×12 — feet on chair',
        t2: 'Archer push-up 4×8 each — arm lateral extension',
        t3: 'Ring push-up 4×8 — rings low, controlled flare',
        sets: '4', reps: '8–15', tip: 'Elevate feet higher each phase for more upper chest.' },
      { gym: 'Dips (chest focus)', cali: 'Ring Dip Progression',  tree: null,
        t1: 'Bar dip 4×10 — slight forward lean, deep dip',
        t2: 'Ring dip 4×8 — rings at side, controlled instability',
        t3: 'Weighted ring dip 4×6 — plate or belt weight',
        sets: '4', reps: '6–10', tip: '30° forward lean for max chest. Upright for tricep focus.' },
      { gym: 'Arnold Press',      cali: 'Press Combo Progression', tree: 'press',
        t1: 'Pike PU + 5s hold 3×10 — pause at top of each',
        t2: 'Wall HSPU 3×5 — full depth, lock out',
        t3: 'Deficit HSPU 3×5 — head below parallette level',
        sets: '3', reps: '5–10', tip: 'Rotate grip on pike variations for shoulder variation.' },
      { gym: 'Close-Grip Bench',  cali: 'Tricep Push-Up Flow',    tree: 'push',
        t1: 'Diamond push-up 3×15 — index/thumbs touching',
        t2: 'Slow diamond 3×10 — 4s down, explode up',
        t3: 'One-arm negative 3×4 each — 5s descent, single arm',
        sets: '3', reps: '8–15', tip: 'Elbows brush ribs throughout. Wrists stay neutral.' },
    ],
  },
  '6': {
    label: 'DAY 06', focus: 'LEGS B — Hip Dominant',
    color: 'var(--ng-amber)',
    ex: [
      { gym: 'Deadlift',          cali: 'Posterior Chain Mastery', tree: 'post',
        t1: 'Single-leg RDL 3×10 — BW, perfect hinge pattern',
        t2: 'Nordic negative 4×5 — maximal eccentric load',
        t3: 'Full Nordic 4×8 — hamstrings pull through full ROM',
        sets: '4', reps: '5–10', tip: 'HINGE not squat. Control the eccentric. No rounding.' },
      { gym: 'Hip Thrust',        cali: 'Glute Bridge Progression', tree: null,
        t1: 'Glute bridge 3×15 — 2s hold at top; full extension',
        t2: 'Single-leg bridge 3×12 — one leg, drive through heel',
        t3: 'Elevated SL bridge 3×10 — shoulder on bench',
        sets: '3–4', reps: '10–15', tip: 'Posterior pelvic tilt at top. Ribs stay down.' },
      { gym: 'Bulgarian Split Squat', cali: 'Lunge Progression',  tree: 'squat',
        t1: 'Reverse lunge 3×12 — step back, front shin vertical',
        t2: 'Bulgarian split squat 3×10 — rear foot elevated',
        t3: 'Jump split squat 3×8 — explosive switch in air',
        sets: '3', reps: '8–12', tip: 'Front shin vertical. Drive through heel. Hip extends fully.' },
      { gym: 'Leg Extension',     cali: 'Sissy Squat Progression', tree: 'squat',
        t1: 'Wall sissy squat 3×10 — heels raised, lean back',
        t2: 'Assisted sissy 3×8 — hold pole, lean further',
        t3: 'Full sissy squat 3×8 — no support, quad isolation',
        sets: '3', reps: '8–12', tip: 'Pure quad isolation. Slow controlled descent each rep.' },
      { gym: 'Hamstring Curl',    cali: 'Nordic Hamstring',        tree: 'post',
        t1: 'Nordic negative 3×5 — catch floor; return assisted',
        t2: 'Partial nordic 3×8 — lower to 90°; pull back',
        t3: 'Full nordic 3×10 — world-class hamstring builder',
        sets: '3', reps: '5–10', tip: 'Anchored ankles required. This is the king of hamstring work.' },
    ],
  },
  '7': {
    label: 'DAY 07', focus: 'PULL B + SKILL WORK',
    color: 'var(--ng-cyan)',
    ex: [
      { gym: 'Pull-Up (volume)',  cali: 'Pull-Up Volume Block',    tree: 'pull',
        t1: 'Grease the groove: 5 sets × 50% max — spread over day',
        t2: 'Multiple sets at 60% max — quality reps, no failure',
        t3: 'Weighted 5×5 or L-sit pull-ups 3×5',
        sets: '5+', reps: '50–75% max', tip: 'Leave 2 reps in tank EVERY set. Volume builds strength.' },
      { gym: 'Cable Row (volume)', cali: 'Row Volume Block',        tree: 'row',
        t1: 'High bar rows 4×12 — wide grip, full retraction',
        t2: 'Sternum rows 4×10 — sternum taps bar consistently',
        t3: 'Single-arm rows 4×8 each — rotate and pull hard',
        sets: '4', reps: '8–15', tip: 'Full scapular retraction on every single rep. No cheating.' },
      { gym: 'Trap / Shrug',     cali: 'Scapular Control Drill',  tree: 'pull',
        t1: 'Dead hang scap shrug 3×12 — elevate/depress full',
        t2: 'Active hang 3×10 — scap retract then depress',
        t3: 'Bar muscle-up negative 3×5 — transition practice',
        sets: '3', reps: '10–15', tip: 'Full depression before elevation. Own the scap position.' },
      { gym: 'Skill Practice',   cali: 'Weakest Tree Focus',      tree: null,
        t1: 'Pick your weakest tree. Work that skill 3×3 sets.',
        t2: 'Dedicated 15-min skill block on lagging movement',
        t3: 'Combo sequence: 2 skill trees back-to-back 20 min',
        sets: 'Free', reps: 'Practice', tip: 'Identify your lag. Dedicate this slot to targeted skill gaps.' },
    ],
  },
};

// ── Constants ────────────────────────────────────────────────────────────────
const LEVELS_KEY = 'grid_cali_levels';
const DONE_KEY   = 'grid_cali_done';

const PHASE_META: Record<string, { label: string; color: string }> = {
  'P0':    { label: 'FOUNDATION', color: '#8E8E93' },
  'L1':    { label: 'LVL 1',      color: 'var(--ng-cyan)' },
  'L2':    { label: 'LVL 2',      color: '#30D158' },
  'L3':    { label: 'LVL 3',      color: 'var(--ng-green)' },
  'L4':    { label: 'LVL 4',      color: 'var(--ng-amber)' },
  'L5':    { label: 'LVL 5',      color: '#FF9500' },
  'L6':    { label: 'LVL 6',      color: '#FF453A' },
  'ELITE': { label: 'ELITE',      color: '#BF5AF2' },
};

const TIER_META = [
  { label: 'FOUNDATION', color: '#8E8E93' },
  { label: 'LOAD',       color: 'var(--ng-amber)' },
  { label: 'MASTERY',    color: '#BF5AF2' },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function CalisthenicsTab() {
  const [view,         setView]         = useState<View>('trees');
  const [levels,       setLevels]       = useState<Partial<Record<TreeId, number>>>({});
  const [done,         setDone]         = useState<Record<string, boolean>>({});
  const [expandedEx,   setExpandedEx]   = useState<string | null>(null);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LEVELS_KEY);
      if (raw) setLevels(JSON.parse(raw));
    } catch {}
    try {
      const raw = localStorage.getItem(DONE_KEY);
      if (raw) setDone(JSON.parse(raw));
    } catch {}
  }, []);

  const saveLevel = (treeId: TreeId, lvl: number) => {
    const next = { ...levels, [treeId]: lvl };
    setLevels(next);
    try { localStorage.setItem(LEVELS_KEY, JSON.stringify(next)); } catch {}
  };

  const toggleDone = (key: string) => {
    const next = { ...done, [key]: !done[key] };
    setDone(next);
    try { localStorage.setItem(DONE_KEY, JSON.stringify(next)); } catch {}
  };

  const getLvl = (id: TreeId) => levels[id] ?? 0;

  const resetAllTrees = () => {
    setLevels({});
    setConfirmReset(false);
    try { localStorage.removeItem(LEVELS_KEY); } catch {}
  };

  // Total XP across all trees
  const totalXP = TREES.reduce((sum, t) => sum + getLvl(t.id), 0);
  const maxXP   = TREES.reduce((sum, t) => sum + t.nodes.length - 1, 0);
  const xpPct   = Math.round((totalXP / maxXP) * 100);

  // Days completed this week (Mon–Sun)
  const weekDays: string[] = [];
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDays.push(d.toISOString().split('T')[0]);
  }
  const weekDone = weekDays.filter(d => {
    for (let i = 1; i <= 7; i++) {
      if (done[`d${i}_${d}`]) return true;
    }
    return false;
  }).length;

  // ── Header pill tabs ─────────────────────────────────────────────
  const TABS: { id: View; label: string }[] = [
    { id: 'trees', label: '⬡ TREES' },
    { id: '1', label: 'D1' }, { id: '2', label: 'D2' },
    { id: '3', label: 'D3' }, { id: '4', label: 'D4' },
    { id: '5', label: 'D5' }, { id: '6', label: 'D6' },
    { id: '7', label: 'D7' },
  ];

  const currentDay = view !== 'trees' ? DAYS[view] : null;
  const dayDoneKey = view !== 'trees' ? `d${view}_${today}` : '';
  const isDayDone  = done[dayDoneKey] ?? false;

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div style={{ paddingBottom: 20 }}>

      {/* ── Banner ── */}
      <div style={{ padding: '14px 0 16px', borderBottom: '0.5px solid var(--ng-border)' }}>
        <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-purple)', letterSpacing: '3px', marginBottom: 8 }}>
          CALISTHENICS PROGRESSION SYSTEM
        </div>

        {/* XP bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ flex: 1, height: 6, background: 'var(--ng-surface)', borderRadius: 3, overflow: 'hidden', border: '0.5px solid var(--ng-border)' }}>
            <div style={{ height: '100%', width: `${xpPct}%`, background: 'linear-gradient(90deg, var(--ng-cyan), var(--ng-purple))', borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
          <span className="font-mono" style={{ fontSize: 10, color: 'var(--ng-cyan)', flexShrink: 0 }}>{totalXP}/{maxXP} XP</span>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'WEEK', value: `${weekDone}/7`, color: 'var(--ng-green)' },
            { label: 'TREES', value: `${TREES.filter(t => getLvl(t.id) >= t.nodes.length - 1).length}/${TREES.length}`, color: 'var(--ng-purple)' },
            { label: 'OVERALL', value: `${xpPct}%`, color: 'var(--ng-cyan)' },
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
          const isDone = tab.id !== 'trees' && done[`d${tab.id}_${today}`];
          return (
            <button key={tab.id} onClick={() => { setView(tab.id); setExpandedEx(null); setExpandedNode(null); }}
              style={{
                flexShrink: 0, padding: '6px 12px',
                background: isCurrent ? (tab.id === 'trees' ? 'rgba(191,90,242,0.15)' : `${DAYS[tab.id]?.color ?? 'var(--ng-cyan)'}18`) : 'var(--ng-surface)',
                border: isCurrent ? `1px solid ${tab.id === 'trees' ? 'var(--ng-purple)' : (DAYS[tab.id]?.color ?? 'var(--ng-cyan)')}` : '1px solid var(--ng-border)',
                borderRadius: 20, cursor: 'pointer',
                color: isCurrent ? (tab.id === 'trees' ? 'var(--ng-purple)' : (DAYS[tab.id]?.color ?? 'var(--ng-cyan)')) : (isDone ? 'var(--ng-green)' : 'var(--ng-muted)'),
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

      {/* ═══════════════════ SKILL TREES VIEW ══════════════════════ */}
      {view === 'trees' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 4 }}>
            <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)' }}>
              Tap a tree to expand. Advance when you meet the criteria.
            </div>
            {confirmReset ? (
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => setConfirmReset(false)}
                  style={{ padding: '4px 8px', background: 'transparent', border: '0.5px solid var(--ng-border)', borderRadius: 6, color: 'var(--ng-muted)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <span className="font-orbitron" style={{ fontSize: 7 }}>CANCEL</span>
                </button>
                <button onClick={resetAllTrees}
                  style={{ padding: '4px 8px', background: 'rgba(255,71,87,0.12)', border: '1px solid var(--ng-red)', borderRadius: 6, color: 'var(--ng-red)', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <span className="font-orbitron" style={{ fontSize: 7, letterSpacing: '0.5px' }}>CONFIRM</span>
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmReset(true)}
                style={{ flexShrink: 0, padding: '4px 10px', background: 'transparent', border: '0.5px solid var(--ng-border)', borderRadius: 6, color: 'var(--ng-dimmer)', cursor: 'pointer', fontFamily: 'inherit' }}>
                <span className="font-orbitron" style={{ fontSize: 7, letterSpacing: '0.5px' }}>RESET ALL</span>
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
              <div key={tree.id}
                style={{ background: 'var(--ng-surface)', border: `0.5px solid ${isExpanded ? tree.color : 'var(--ng-border)'}`, borderLeft: `3px solid ${tree.color}`, borderRadius: 12, overflow: 'hidden', boxShadow: isExpanded ? `0 2px 12px ${tree.color}20` : 'none' }}>

                {/* Tree header — always visible */}
                <button onClick={() => setExpandedNode(isExpanded ? null : tree.id)}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 14px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Icon */}
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${tree.color}18`, border: `1px solid ${tree.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, color: tree.color }}>
                      {tree.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span className="font-orbitron font-bold" style={{ fontSize: 11, color: tree.color, letterSpacing: '1px' }}>{tree.label}</span>
                        {maxed && <span className="font-orbitron" style={{ fontSize: 7, color: '#BF5AF2', border: '1px solid #BF5AF2', padding: '1px 5px', letterSpacing: '1px' }}>ELITE</span>}
                      </div>
                      <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-text)', marginBottom: 4 }}>{current.label}</div>
                      {/* Progress bar */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ flex: 1, height: 3, background: 'var(--ng-border)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: tree.color, borderRadius: 2, transition: 'width 0.4s' }} />
                        </div>
                        <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', flexShrink: 0 }}>{lvl}/{tree.nodes.length - 1}</span>
                      </div>
                    </div>
                    {/* Phase badge */}
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <div className="font-orbitron" style={{ fontSize: 8, color: PHASE_META[current.phase]?.color ?? 'var(--ng-muted)', letterSpacing: '1px', marginBottom: 4 }}>
                        {PHASE_META[current.phase]?.label}
                      </div>
                      <div style={{ color: 'var(--ng-muted)', fontSize: 14 }}>{isExpanded ? '▲' : '▼'}</div>
                    </div>
                  </div>
                </button>

                {/* Expanded: node chain */}
                {isExpanded && (
                  <div style={{ borderTop: '0.5px solid var(--ng-border)', padding: '12px 14px' }}>
                    {/* Current node details */}
                    <div style={{ background: `${tree.color}10`, border: `1px solid ${tree.color}40`, borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                      <div className="font-orbitron" style={{ fontSize: 9, color: tree.color, letterSpacing: '1px', marginBottom: 4 }}>CURRENT — {current.label}</div>
                      <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-text)', marginBottom: 6 }}>
                        {current.sets} sets × {current.reps}
                      </div>
                      {current.note && (
                        <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', marginBottom: 6, fontStyle: 'italic' }}>{current.note}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '8px 10px', background: 'rgba(0,212,255,0.06)', border: '0.5px solid rgba(0,212,255,0.2)', borderRadius: 8 }}>
                        <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>🔓</span>
                        <div>
                          <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-cyan)', letterSpacing: '1px', marginBottom: 2 }}>UNLOCK CRITERIA</div>
                          <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-text)', lineHeight: 1.5 }}>{current.crit}</div>
                        </div>
                      </div>
                      {!maxed && (
                        <button onClick={() => saveLevel(tree.id, lvl + 1)}
                          style={{ marginTop: 10, width: '100%', padding: '9px', background: `${tree.color}18`, border: `1px solid ${tree.color}`, borderRadius: 8, color: tree.color, cursor: 'pointer', fontFamily: 'inherit' }}>
                          <span className="font-orbitron" style={{ fontSize: 9, letterSpacing: '1px' }}>⬆ ADVANCE TO NEXT NODE</span>
                        </button>
                      )}
                      {maxed && (
                        <div className="font-orbitron" style={{ marginTop: 10, textAlign: 'center', fontSize: 9, color: '#BF5AF2', letterSpacing: '2px' }}>◆ ELITE UNLOCKED ◆</div>
                      )}
                    </div>

                    {/* Node chain */}
                    <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1px', marginBottom: 8 }}>PROGRESSION CHAIN</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {tree.nodes.map((node, idx) => {
                        const isCurrentNode = idx === lvl;
                        const isUnlocked = idx <= lvl;
                        const pm = PHASE_META[node.phase] ?? { label: node.phase, color: 'var(--ng-muted)' };
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
                            {/* Spine */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 20, flexShrink: 0 }}>
                              <div style={{
                                width: 14, height: 14, borderRadius: '50%', flexShrink: 0, marginTop: 8,
                                background: isCurrentNode ? tree.color : isUnlocked ? `${tree.color}60` : 'var(--ng-border)',
                                border: isCurrentNode ? `2px solid ${tree.color}` : 'none',
                                boxShadow: isCurrentNode ? `0 0 8px ${tree.color}80` : 'none',
                              }} />
                              {idx < tree.nodes.length - 1 && (
                                <div style={{ width: 2, flex: 1, minHeight: 8, background: isUnlocked ? `${tree.color}40` : 'var(--ng-border)', margin: '2px 0' }} />
                              )}
                            </div>
                            {/* Node content */}
                            <div style={{ flex: 1, paddingBottom: idx < tree.nodes.length - 1 ? 4 : 0, paddingTop: 5 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="font-mono" style={{ fontSize: 10, color: isCurrentNode ? tree.color : isUnlocked ? 'var(--ng-text)' : 'var(--ng-dimmer)', fontWeight: isCurrentNode ? 700 : 400 }}>
                                  {node.label}
                                </span>
                                <span className="font-orbitron" style={{ fontSize: 7, color: pm.color, letterSpacing: '0.5px' }}>{pm.label}</span>
                                {isCurrentNode && <span style={{ fontSize: 8, color: tree.color }}>← HERE</span>}
                              </div>
                              {isCurrentNode && (
                                <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)', marginTop: 1 }}>
                                  {node.sets}×{node.reps}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {lvl > 0 && (
                      <button onClick={() => saveLevel(tree.id, lvl - 1)}
                        style={{ marginTop: 12, padding: '6px 12px', background: 'transparent', border: '0.5px solid var(--ng-border)', borderRadius: 8, color: 'var(--ng-dimmer)', cursor: 'pointer', fontFamily: 'inherit' }}>
                        <span className="font-mono" style={{ fontSize: 9 }}>↓ step back</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════ DAY VIEW ═══════════════════════════════ */}
      {view !== 'trees' && currentDay && (
        <div>
          {/* Day header */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div>
                <span className="font-orbitron font-bold" style={{ fontSize: 13, color: currentDay.color, letterSpacing: '1px' }}>{currentDay.label}</span>
                <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-muted)', marginTop: 2 }}>{currentDay.focus}</div>
              </div>
              <button onClick={() => toggleDone(dayDoneKey)}
                style={{ padding: '8px 14px', background: isDayDone ? 'rgba(48,209,88,0.12)' : 'transparent', border: `1px solid ${isDayDone ? 'var(--ng-green)' : 'var(--ng-border)'}`, borderRadius: 20, color: isDayDone ? 'var(--ng-green)' : 'var(--ng-muted)', cursor: 'pointer', transition: 'all 0.15s' }}>
                <span className="font-orbitron" style={{ fontSize: 8, letterSpacing: '1px' }}>{isDayDone ? '✓ DONE' : 'MARK DONE'}</span>
              </button>
            </div>

            {/* Skill tree indicators for this day */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {currentDay.ex.filter(e => e.tree).map((e, i) => {
                const tree = TREES.find(t => t.id === e.tree)!;
                const lvl = getLvl(tree.id);
                const tier = lvl < 4 ? 0 : lvl < 7 ? 1 : 2;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: `${tree.color}10`, border: `0.5px solid ${tree.color}40`, borderRadius: 12 }}>
                    <span style={{ fontSize: 10, color: tree.color }}>{tree.icon}</span>
                    <span className="font-orbitron" style={{ fontSize: 7, color: tree.color, letterSpacing: '0.5px' }}>{tree.label}</span>
                    <span className="font-mono" style={{ fontSize: 7, color: TIER_META[tier].color }}>T{tier + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exercise cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {currentDay.ex.map((ex, i) => {
              const exKey = `${view}_${i}_${today}`;
              const exDone = done[exKey] ?? false;
              const isExpanded = expandedEx === exKey;
              const tree = ex.tree ? TREES.find(t => t.id === ex.tree) : null;
              const lvl = tree ? getLvl(tree.id) : 0;

              // Determine which tier to highlight based on current level
              let activeTier = 0;
              if (lvl >= 7) activeTier = 2;
              else if (lvl >= 4) activeTier = 1;
              const tiers = [ex.t1, ex.t2, ex.t3];

              return (
                <div key={i}
                  style={{ background: 'var(--ng-surface)', border: `0.5px solid ${isExpanded ? (tree?.color ?? currentDay.color) : 'var(--ng-border)'}`, borderLeft: `3px solid ${exDone ? 'var(--ng-green)' : (tree?.color ?? currentDay.color)}`, borderRadius: 12, overflow: 'hidden', transition: 'all 0.15s' }}>

                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    {/* Expand button */}
                    <button onClick={() => setExpandedEx(isExpanded ? null : exKey)}
                      style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '12px 14px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                            <span className="font-orbitron font-bold" style={{ fontSize: 10, color: exDone ? 'var(--ng-green)' : 'var(--ng-text)', letterSpacing: '0.5px' }}>
                              {ex.cali}
                            </span>
                            {tree && (
                              <span style={{ fontSize: 7, color: tree.color, border: `0.5px solid ${tree.color}50`, padding: '1px 5px', borderRadius: 4 }} className="font-orbitron">
                                {tree.icon} {tree.label}
                              </span>
                            )}
                          </div>
                          <div className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>
                            ↳ {ex.gym} &nbsp;·&nbsp; {ex.sets} sets × {ex.reps}
                          </div>
                          {/* Active tier preview */}
                          <div className="font-mono" style={{ fontSize: 9, color: TIER_META[activeTier].color, marginTop: 4 }}>
                            [{TIER_META[activeTier].label}] {tiers[activeTier].split(' — ')[0]}
                          </div>
                        </div>
                        <div style={{ color: 'var(--ng-muted)', fontSize: 14, flexShrink: 0, paddingTop: 2 }}>{isExpanded ? '▲' : '▼'}</div>
                      </div>
                    </button>

                    {/* Done toggle */}
                    <button onClick={() => toggleDone(exKey)}
                      style={{ padding: '0 14px', background: exDone ? 'rgba(48,209,88,0.08)' : 'transparent', border: 'none', borderLeft: `0.5px solid ${exDone ? 'rgba(48,209,88,0.3)' : 'var(--ng-border)'}`, color: exDone ? 'var(--ng-green)' : 'var(--ng-dimmer)', cursor: 'pointer', fontSize: 16, flexShrink: 0, transition: 'all 0.15s' }}>
                      {exDone ? '✓' : '○'}
                    </button>
                  </div>

                  {/* Expanded: 3 tiers + form tip */}
                  {isExpanded && (
                    <div style={{ borderTop: '0.5px solid var(--ng-border)', padding: '12px 14px' }}>
                      {/* 3 tiers */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                        {tiers.map((tier, ti) => {
                          const isActive = ti === activeTier;
                          const tm = TIER_META[ti];
                          return (
                            <div key={ti} style={{ padding: '8px 10px', background: isActive ? `${tm.color}10` : 'transparent', border: `0.5px solid ${isActive ? tm.color : 'var(--ng-border)'}`, borderLeft: `3px solid ${isActive ? tm.color : 'transparent'}`, borderRadius: 8 }}>
                              <div className="font-orbitron" style={{ fontSize: 7, color: tm.color, letterSpacing: '1px', marginBottom: 3 }}>
                                T{ti + 1} — {tm.label} {isActive ? '← YOU ARE HERE' : ''}
                              </div>
                              <div className="font-mono" style={{ fontSize: 10, color: isActive ? 'var(--ng-text)' : 'var(--ng-muted)', lineHeight: 1.5 }}>{tier}</div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Form tip */}
                      {ex.tip && (
                        <div style={{ padding: '8px 10px', background: 'rgba(0,212,255,0.05)', border: '0.5px solid rgba(0,212,255,0.2)', borderRadius: 8 }}>
                          <div className="font-orbitron" style={{ fontSize: 7, color: 'var(--ng-cyan)', letterSpacing: '1px', marginBottom: 2 }}>FORM CUE</div>
                          <div className="font-mono" style={{ fontSize: 10, color: 'var(--ng-text)', lineHeight: 1.5 }}>{ex.tip}</div>
                        </div>
                      )}

                      {/* Tree level link */}
                      {tree && (
                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>
                            {tree.label} tree: node {lvl + 1}/{tree.nodes.length} — {tree.nodes[lvl]?.label}
                          </span>
                          <button onClick={() => { setView('trees'); setExpandedNode(tree.id); }}
                            style={{ padding: '3px 8px', background: 'transparent', border: `0.5px solid ${tree.color}50`, borderRadius: 6, color: tree.color, cursor: 'pointer', fontFamily: 'inherit' }}>
                            <span className="font-orbitron" style={{ fontSize: 7, letterSpacing: '0.5px' }}>VIEW TREE</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Phase reference */}
          <div style={{ marginTop: 20, padding: '12px 14px', background: 'var(--ng-surface)', border: '0.5px solid var(--ng-border)', borderRadius: 12 }}>
            <div className="font-orbitron" style={{ fontSize: 8, color: 'var(--ng-muted)', letterSpacing: '1.5px', marginBottom: 8 }}>TIER GUIDE</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TIER_META.map((tm, i) => (
                <div key={i} style={{ padding: '4px 10px', border: `0.5px solid ${tm.color}50`, borderRadius: 8 }}>
                  <span className="font-orbitron" style={{ fontSize: 7, color: tm.color, letterSpacing: '0.5px' }}>T{i + 1} {tm.label}</span>
                </div>
              ))}
              <div style={{ padding: '4px 10px', border: '0.5px solid var(--ng-border)', borderRadius: 8 }}>
                <span className="font-mono" style={{ fontSize: 9, color: 'var(--ng-muted)' }}>Tier auto-selects from skill tree level</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
