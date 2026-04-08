export interface GymExercise {
  id: string;
  name: string;
  weight?: string;
  reps?: string;
  sets?: number;
  priority?: boolean;
  section?: string; // for HIIT day section grouping
  note?: string;
  kcal?: number; // estimated kcal for full prescribed sets (MET × 57kg × active time)
}

export interface GymDayVariant {
  label: string;
  exercises: GymExercise[];
}

export interface GymDay {
  id: string;
  dayNum: number;
  label: string;
  focus: string;
  icon: string;
  color: string;
  quote?: string;
  exercises: GymExercise[];
  alt?: GymDayVariant;
}

export const GYM_DAYS: GymDay[] = [
  {
    id: 'day1',
    dayNum: 1,
    label: 'DAY 1',
    focus: 'BACK',
    icon: '🏋️',
    color: '#FF453A',
    exercises: [
      { id: 'd1-1',  name: 'Wide bar lat pull down',           weight: '115–120lb', reps: '8',  sets: 4, kcal: 11 },
      { id: 'd1-2',  name: 'V bar pull-down',                  weight: '120–115lb', reps: '8',  sets: 4, priority: true, kcal: 11 },
      { id: 'd1-3',  name: 'V bar cable row',                  weight: '100lb',     reps: '8',  sets: 4, priority: true, kcal: 13 },
      { id: 'd1-4',  name: 'Wide bar cable row',               weight: '100lb',     reps: '8',  sets: 4, kcal: 13 },
      { id: 'd1-5',  name: 'Row delt machine',                 weight: '60lb',      reps: '8',  sets: 4, kcal: 10 },
      { id: 'd1-6',  name: 'Face pulls',                       weight: '110lb',     reps: '10', sets: 4, priority: true, kcal: 10 },
      { id: 'd1-7',  name: 'Dumbbell / Machine fly delt',      weight: '70lb',      reps: '8',  sets: 4, kcal: 10 },
      { id: 'd1-8',  name: 'Iso lateral high row machine',     weight: '55lb',      reps: '10', sets: 4, priority: true, kcal: 11 },
      { id: 'd1-9',  name: 'Sit-ups',                          kcal: 7 },
      { id: 'd1-10', name: 'Leg raises',                       kcal: 7 },
      { id: 'd1-11', name: 'Crunches',                         kcal: 7 },
      { id: 'd1-12', name: 'Russian twists',                   weight: '15lb',      reps: '10', sets: 4, kcal: 9 },
    ],
    alt: {
      label: 'ALTERNATIVE',
      exercises: [
        { id: 'd1a-1', name: 'Bentover two arm dumbbell rows', weight: '55lb',  reps: '10', sets: 4, kcal: 13 },
        { id: 'd1a-2', name: 'Single arm dumbbell row',        weight: '50lb',  reps: '8',  sets: 4, kcal: 13 },
        { id: 'd1a-3', name: 'Dumbbell deadlifts neutral grip', weight: '55lb', reps: '10', sets: 4, kcal: 14 },
        { id: 'd1a-4', name: 'Dumbbell reverse fly',           weight: '45lb',  reps: '10', sets: 4, kcal: 10 },
        { id: 'd1a-5', name: 'Dumbbell pullover',              weight: '55lb',  reps: '10', sets: 4, kcal: 10 },
        { id: 'd1a-6', name: 'Lat pulldown',                   weight: '90lb',  reps: '10', sets: 4, kcal: 11 },
        { id: 'd1a-7', name: 'Face pulls',                     weight: '90lb',  reps: '10', sets: 4, kcal: 10 },
        { id: 'd1a-8', name: 'Crunches',                       weight: '70lb',  reps: '10', sets: 4, kcal: 9 },
      ],
    },
  },
  {
    id: 'day2',
    dayNum: 2,
    label: 'DAY 2',
    focus: 'CHEST & SHOULDERS',
    icon: '💪',
    color: '#FF9F0A',
    exercises: [
      { id: 'd2-1',  name: 'Dumbbell chest press',             weight: '35lb',     reps: '8',  sets: 4, priority: true, kcal: 11 },
      { id: 'd2-2',  name: 'Inclined dumbbell fly / lateral raise', weight: '35–70lb', reps: '10', sets: 4, kcal: 11 },
      { id: 'd2-3',  name: 'Dumbbell shoulder press / machine', weight: '25lb',    reps: '10', sets: 4, kcal: 11 },
      { id: 'd2-4',  name: 'Dumbbell front raise',                                              priority: true, kcal: 10 },
      { id: 'd2-5',  name: 'Cable side lateral raises',        weight: '40lb',     reps: '10', sets: 4, priority: true, kcal: 10 },
      { id: 'd2-6',  name: 'Cable / Machine rear delt fly',    weight: '70–85lb',  reps: '10', sets: 4, priority: true, kcal: 10 },
      { id: 'd2-7',  name: 'Face pulls',                       weight: '100lb',    reps: '10', sets: 4, priority: true, kcal: 10 },
      { id: 'd2-8',  name: 'Dumbbell squeeze press',           weight: '25lb',     reps: '10', sets: 4, priority: true, kcal: 11 },
      { id: 'd2-9',  name: 'Kettlebell side crunch',           weight: '60lb',     reps: '10', sets: 4, priority: true, kcal: 9 },
      { id: 'd2-10', name: 'Cable crunches',                   weight: '75–132lb', reps: '10', sets: 4, priority: true, kcal: 9 },
    ],
  },
  {
    id: 'day3',
    dayNum: 3,
    label: 'DAY 3',
    focus: 'BICEPS / TRICEP / ABS',
    icon: '💥',
    color: '#30D158',
    exercises: [
      { id: 'd3-1',  name: 'Hammer curl',                               weight: '90lb',  reps: '10', sets: 4, priority: true, kcal: 10 },
      { id: 'd3-2',  name: 'Seated dumbbell curl short head',           weight: '20–25lb', reps: '10', sets: 4, kcal: 10 },
      { id: 'd3-3',  name: 'Dumbbell overhead tricep',                  weight: '40lb',  reps: '8',  sets: 4, priority: true, kcal: 10 },
      { id: 'd3-4',  name: 'Inclined crunches weighted',                weight: '35lb',  reps: '10', sets: 4, kcal: 9 },
      { id: 'd3-5',  name: 'Overhead tricep extension barbell / cable', weight: '50lb',  reps: '10', sets: 4, priority: true, kcal: 10 },
      { id: 'd3-6',  name: 'Side crunch dumbbell / kettlebell',         weight: '60lb',  reps: '10', sets: 4, kcal: 9 },
      { id: 'd3-7',  name: 'Rollbacks',                                 weight: '20lb',  reps: '10', sets: 4, kcal: 9 },
      { id: 'd3-8',  name: 'Kettlebell Russian twists',                 weight: '30lb',  reps: '12', sets: 4, kcal: 9 },
      { id: 'd3-9',  name: 'Leg ups',                                   weight: '10lb',  reps: '10', sets: 4, priority: true, kcal: 9 },
      { id: 'd3-10', name: 'Laying face press',                         weight: '40lb',  reps: '10', sets: 4, priority: true, kcal: 10 },
      { id: 'd3-11', name: 'Treadmill',                                 note: '1hr · 3.0 speed', kcal: 200 },
    ],
  },
  {
    id: 'day4',
    dayNum: 4,
    label: 'DAY 4',
    focus: 'LEGS',
    icon: '🦵',
    color: '#64D2FF',
    exercises: [
      { id: 'd4-1',  name: 'Cable hamstring curl',               weight: '25lb',      reps: '8',  sets: 4, kcal: 11 },
      { id: 'd4-2',  name: 'Leg extensions machine',             weight: '165lb',     reps: '8',  sets: 4, priority: true, kcal: 11 },
      { id: 'd4-3',  name: 'Calf press',                         weight: '110lb',     reps: '8',  sets: 4, priority: true, kcal: 10 },
      { id: 'd4-4',  name: 'Seated leg curl',                    weight: '90lb',      reps: '8',  sets: 4, kcal: 11 },
      { id: 'd4-5',  name: 'Inclined leg press machine',         weight: '230lb',     reps: '8',  sets: 4, priority: true, kcal: 14 },
      { id: 'd4-6',  name: 'Seated leg press outer quad',        weight: '250–270lb', reps: '10', sets: 4, priority: true, kcal: 14 },
      { id: 'd4-7',  name: 'Sumo squats',                        weight: '20lb',      reps: '10', sets: 4, kcal: 16 },
      { id: 'd4-8',  name: 'Squats inner quad',                  kcal: 16 },
      { id: 'd4-9',  name: 'Squats narrow full quad',            kcal: 16 },
      { id: 'd4-10', name: 'Weighted ab crunches',               weight: '72.5lb',    reps: '10', sets: 4, kcal: 9 },
      { id: 'd4-11', name: 'Laying kettlebell leg raises',       kcal: 7 },
    ],
    alt: {
      label: 'ALTERNATIVE',
      exercises: [
        { id: 'd4a-1', name: 'Squats',                           weight: '25lb',  reps: '10', sets: 4, kcal: 16 },
        { id: 'd4a-2', name: 'Dumbbell Romanian deadlifts',      weight: '55lb',  reps: '10', sets: 4, kcal: 14 },
        { id: 'd4a-3', name: 'Dumbbell goblet squats',           weight: '25lb',  reps: '10', sets: 4, kcal: 14 },
        { id: 'd4a-4', name: 'Dumbbell calf raises',             weight: '20lb',  reps: '40',          kcal: 10 },
        { id: 'd4a-5', name: 'Neutral deadlifts',                weight: '30lb',  reps: '10', sets: 4, kcal: 14 },
        { id: 'd4a-6', name: 'Dumbbell leg extensions',          weight: '100lb', reps: '10', sets: 4, kcal: 11 },
      ],
    },
  },
  {
    id: 'day5',
    dayNum: 5,
    label: 'DAY 5',
    focus: 'ABS + LOWER TRAP',
    icon: '🎯',
    color: '#BF5AF2',
    exercises: [
      { id: 'd5-1',  name: 'Weighted Russian hanging leg raise', weight: '15lb', reps: '10', sets: 4, kcal: 9 },
      { id: 'd5-2',  name: 'Weighted leg raises',                weight: '10lb', reps: '8',  sets: 4, priority: true, kcal: 9 },
      { id: 'd5-3',  name: 'Standing Russian twist',             kcal: 7 },
      { id: 'd5-4',  name: 'Kettlebell side crunches',           weight: '62lb', reps: '10', sets: 4, priority: true, kcal: 9 },
      { id: 'd5-5',  name: 'Bentover two arm dumbbell rows',     weight: '55lb', reps: '10', sets: 4, priority: true, kcal: 13 },
      { id: 'd5-6',  name: 'Machine lateral row',                weight: '45lb', reps: '10', sets: 4, priority: true, kcal: 11 },
      { id: 'd5-7',  name: 'Cable crunch',                       weight: '75lb', reps: '10', sets: 4, kcal: 9 },
      { id: 'd5-8',  name: 'Weighted inclined sit ups',          reps: '10', sets: 4, kcal: 9 },
      { id: 'd5-9',  name: 'Pullover',                           weight: '45lb', reps: '10', sets: 4, priority: true, kcal: 10 },
      { id: 'd5-10', name: 'Single arm dumbbell row',                                         priority: true, kcal: 13 },
      { id: 'd5-11', name: 'Face pull',                                                       priority: true, kcal: 10 },
      { id: 'd5-12', name: 'Reverse fly delts',                                               priority: true, kcal: 10 },
      { id: 'd5-13', name: 'Doorway chest stretch',              kcal: 4 },
      { id: 'd5-14', name: 'Side toe touches',                   kcal: 4 },
      { id: 'd5-15', name: 'Cardio',                             note: '45 mins', kcal: 214 },
    ],
  },
  {
    id: 'day6',
    dayNum: 6,
    label: 'DAY 6',
    focus: 'LOWER BACK',
    icon: '🔱',
    color: '#FF6B2B',
    exercises: [
      { id: 'd6-1', name: 'Deadlifts',            kcal: 14 },
      { id: 'd6-2', name: 'Hyperextensions',       kcal: 10 },
      { id: 'd6-3', name: 'Bird-Dog',              kcal: 7 },
      { id: 'd6-4', name: 'Superman exercise',     kcal: 7 },
      { id: 'd6-5', name: 'Bridges',               kcal: 9 },
      { id: 'd6-6', name: 'Planks',                kcal: 9 },
      { id: 'd6-7', name: 'Cat-Cow stretch',       kcal: 4 },
      { id: 'd6-8', name: 'Seated / Standing rows', kcal: 13 },
    ],
  },
  {
    id: 'day7',
    dayNum: 7,
    label: 'DAY 7',
    focus: 'FULL BODY HIIT',
    icon: '⚡',
    color: '#FFD60A',
    exercises: [
      { id: 'd7-w1', name: 'Floor X raise',                          reps: '12', sets: 4, section: 'WARMUP',    kcal: 8 },
      { id: 'd7-w2', name: 'Sit through',                            reps: '20', sets: 4, section: 'WARMUP',    kcal: 14 },
      { id: 'd7-w3', name: 'Deadbug',                                reps: '20', sets: 4, section: 'WARMUP',    kcal: 9 },
      { id: 'd7-c1', name: 'Bentover dumbbell row',                  weight: '20lb', reps: '20', sets: 4, section: 'CIRCUIT 1', kcal: 13 },
      { id: 'd7-c2', name: 'Dumbbell curl to overhead press',        reps: '12', sets: 4, section: 'CIRCUIT 1', kcal: 17 },
      { id: 'd7-c3', name: 'Plank with reach (both sides)',          reps: '5',  sets: 4, section: 'CIRCUIT 2', kcal: 10 },
      { id: 'd7-c4', name: 'Kettlebell halo',                        reps: '20', sets: 4, section: 'CIRCUIT 2', kcal: 11 },
      { id: 'd7-c5', name: 'Lateral lunge touchdown to overhead press', reps: '10', sets: 4, section: 'CIRCUIT 2', kcal: 16 },
    ],
  },
];

// Maps JS day-of-week (0=Sun) to gym day index
// Mon=Day1, Tue=Day2, Wed=Day3, Thu=Day4, Fri=Day5, Sat=Day6, Sun=Day7
export function getTodayGymDay(): GymDay | null {
  const dow = new Date().getDay(); // 0=Sun
  const map: Record<number, number> = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 0: 6 };
  return GYM_DAYS[map[dow]] ?? null;
}
