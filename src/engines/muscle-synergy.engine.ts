import type { ExerciseSlot, MovementPattern } from '../core/types';

export type MuscleGroup =
  | 'quadriceps' | 'hamstrings' | 'glutes' | 'calves'
  | 'chest_upper' | 'chest_lower' | 'chest_whole'
  | 'lats' | 'traps_upper' | 'traps_mid' | 'rhomboids' | 'erectors'
  | 'delts_front' | 'delts_side' | 'delts_rear'
  | 'biceps' | 'triceps' | 'brachialis' | 'forearms'
  | 'abs_upper' | 'abs_lower' | 'obliques' | 'spinal_erectors'
  | 'hip_flexors' | 'adductors' | 'abductors';

export type SynergyType = 'agonist' | 'antagonist' | 'stabilizer' | 'synergist' | 'neutral' | 'redundant';

export interface MuscleSynergyPair {
  primary: MuscleGroup;
  secondary: MuscleGroup;
  type: SynergyType;
  synergyScore: number;
  description: string;
}

export interface ExerciseMuscleActivation {
  exerciseId: string;
  primary: { group: MuscleGroup; activationPct: number }[];
  secondary: { group: MuscleGroup; activationPct: number }[];
  stabilizers: MuscleGroup[];
}

export interface SynergyAnalysisResult {
  pairScores: { exerciseA: string; exerciseB: string; synergyScore: number; type: SynergyType; recommendation: string }[];
  overallScore: number;
  warnings: string[];
  optimalOrdering: string[];
}

const MUSCLE_SYNERGY_MATRIX: Record<string, { synergetic: MuscleGroup[]; antagonistic: MuscleGroup[]; redundant: MuscleGroup[] }> = {
  quadriceps: { synergetic: ['glutes', 'adductors'], antagonistic: ['hamstrings'], redundant: ['hip_flexors'] },
  hamstrings: { synergetic: ['glutes', 'erectors'], antagonistic: ['quadriceps'], redundant: [] },
  glutes: { synergetic: ['hamstrings', 'erectors', 'quadriceps'], antagonistic: ['hip_flexors'], redundant: [] },
  chest_whole: { synergetic: ['delts_front', 'triceps'], antagonistic: ['traps_mid', 'rhomboids'], redundant: ['chest_upper', 'chest_lower'] },
  chest_upper: { synergetic: ['delts_front'], antagonistic: ['traps_mid'], redundant: ['chest_whole'] },
  chest_lower: { synergetic: ['triceps'], antagonistic: ['rhomboids'], redundant: ['chest_whole'] },
  lats: { synergetic: ['biceps', 'rhomboids'], antagonistic: ['chest_whole'], redundant: [] },
  rhomboids: { synergetic: ['traps_mid', 'delts_rear'], antagonistic: ['chest_whole', 'delts_front'], redundant: [] },
  traps_mid: { synergetic: ['rhomboids', 'delts_rear'], antagonistic: ['chest_upper', 'delts_front'], redundant: ['traps_upper'] },
  delts_front: { synergetic: ['chest_whole', 'triceps'], antagonistic: ['delts_rear', 'traps_mid'], redundant: [] },
  delts_side: { synergetic: ['traps_upper'], antagonistic: ['lats'], redundant: [] },
  delts_rear: { synergetic: ['rhomboids', 'traps_mid'], antagonistic: ['delts_front', 'chest_whole'], redundant: [] },
  biceps: { synergetic: ['lats', 'brachialis'], antagonistic: ['triceps'], redundant: ['forearms'] },
  triceps: { synergetic: ['chest_whole', 'delts_front'], antagonistic: ['biceps'], redundant: [] },
  erectors: { synergetic: ['hamstrings', 'glutes'], antagonistic: ['abs_upper'], redundant: ['spinal_erectors'] },
  abs_upper: { synergetic: ['obliques'], antagonistic: ['erectors'], redundant: ['abs_lower'] },
};

const EXERCISE_ACTIVATION_DB: Record<string, ExerciseMuscleActivation> = {
  squat: {
    exerciseId: 'squat',
    primary: [{ group: 'quadriceps', activationPct: 85 }, { group: 'glutes', activationPct: 70 }],
    secondary: [{ group: 'erectors', activationPct: 60 }, { group: 'hamstrings', activationPct: 40 }, { group: 'adductors', activationPct: 35 }, { group: 'abs_upper', activationPct: 30 }],
    stabilizers: ['calves', 'spinal_erectors', 'traps_upper'],
  },
  front_squat: {
    exerciseId: 'front_squat',
    primary: [{ group: 'quadriceps', activationPct: 90 }, { group: 'glutes', activationPct: 55 }],
    secondary: [{ group: 'abs_upper', activationPct: 50 }, { group: 'erectors', activationPct: 30 }],
    stabilizers: ['calves', 'spinal_erectors'],
  },
  deadlift: {
    exerciseId: 'deadlift',
    primary: [{ group: 'hamstrings', activationPct: 85 }, { group: 'glutes', activationPct: 80 }, { group: 'erectors', activationPct: 90 }],
    secondary: [{ group: 'traps_upper', activationPct: 60 }, { group: 'lats', activationPct: 50 }, { group: 'forearms', activationPct: 70 }],
    stabilizers: ['abs_upper', 'obliques', 'adductors'],
  },
  sumo_dl: {
    exerciseId: 'sumo_dl',
    primary: [{ group: 'hamstrings', activationPct: 70 }, { group: 'glutes', activationPct: 85 }, { group: 'adductors', activationPct: 80 }],
    secondary: [{ group: 'erectors', activationPct: 70 }, { group: 'traps_upper', activationPct: 50 }],
    stabilizers: ['abs_upper', 'forearms'],
  },
  rdl: {
    exerciseId: 'rdl',
    primary: [{ group: 'hamstrings', activationPct: 90 }, { group: 'glutes', activationPct: 75 }],
    secondary: [{ group: 'erectors', activationPct: 65 }, { group: 'forearms', activationPct: 40 }],
    stabilizers: ['abs_upper'],
  },
  bench_bar: {
    exerciseId: 'bench_bar',
    primary: [{ group: 'chest_whole', activationPct: 85 }],
    secondary: [{ group: 'delts_front', activationPct: 65 }, { group: 'triceps', activationPct: 55 }],
    stabilizers: ['lats', 'rhomboids'],
  },
  bench_db: {
    exerciseId: 'bench_db',
    primary: [{ group: 'chest_whole', activationPct: 80 }],
    secondary: [{ group: 'delts_front', activationPct: 60 }, { group: 'triceps', activationPct: 50 }],
    stabilizers: ['lats', 'rhomboids'],
  },
  incline_bar: {
    exerciseId: 'incline_bar',
    primary: [{ group: 'chest_upper', activationPct: 85 }],
    secondary: [{ group: 'delts_front', activationPct: 75 }, { group: 'triceps', activationPct: 50 }],
    stabilizers: ['lats'],
  },
  ohp: {
    exerciseId: 'ohp',
    primary: [{ group: 'delts_front', activationPct: 85 }, { group: 'delts_side', activationPct: 60 }],
    secondary: [{ group: 'triceps', activationPct: 55 }, { group: 'traps_upper', activationPct: 40 }],
    stabilizers: ['abs_upper', 'erectors'],
  },
  pullup: {
    exerciseId: 'pullup',
    primary: [{ group: 'lats', activationPct: 85 }],
    secondary: [{ group: 'biceps', activationPct: 65 }, { group: 'rhomboids', activationPct: 50 }, { group: 'traps_mid', activationPct: 40 }],
    stabilizers: ['abs_upper', 'forearms'],
  },
  row_bar: {
    exerciseId: 'row_bar',
    primary: [{ group: 'lats', activationPct: 75 }, { group: 'rhomboids', activationPct: 70 }],
    secondary: [{ group: 'biceps', activationPct: 60 }, { group: 'traps_mid', activationPct: 50 }, { group: 'erectors', activationPct: 40 }],
    stabilizers: ['hamstrings', 'abs_upper'],
  },
  pulldown: {
    exerciseId: 'pulldown',
    primary: [{ group: 'lats', activationPct: 80 }],
    secondary: [{ group: 'biceps', activationPct: 55 }, { group: 'rhomboids', activationPct: 45 }],
    stabilizers: ['abs_upper', 'forearms'],
  },
  leg_press: {
    exerciseId: 'leg_press',
    primary: [{ group: 'quadriceps', activationPct: 80 }, { group: 'glutes', activationPct: 65 }],
    secondary: [{ group: 'hamstrings', activationPct: 35 }, { group: 'adductors', activationPct: 30 }],
    stabilizers: [],
  },
  hip_thrust: {
    exerciseId: 'hip_thrust',
    primary: [{ group: 'glutes', activationPct: 90 }],
    secondary: [{ group: 'hamstrings', activationPct: 50 }, { group: 'erectors', activationPct: 25 }],
    stabilizers: ['abs_upper', 'obliques'],
  },
  dips_chest: {
    exerciseId: 'dips_chest',
    primary: [{ group: 'chest_lower', activationPct: 85 }],
    secondary: [{ group: 'triceps', activationPct: 70 }, { group: 'delts_front', activationPct: 55 }],
    stabilizers: ['rhomboids', 'abs_upper'],
  },
  dips_tricep: {
    exerciseId: 'dips_tricep',
    primary: [{ group: 'triceps', activationPct: 90 }],
    secondary: [{ group: 'chest_lower', activationPct: 50 }, { group: 'delts_front', activationPct: 45 }],
    stabilizers: ['rhomboids'],
  },
  curl_bar: {
    exerciseId: 'curl_bar',
    primary: [{ group: 'biceps', activationPct: 85 }],
    secondary: [{ group: 'forearms', activationPct: 40 }],
    stabilizers: ['delts_front', 'abs_upper'],
  },
  tricep_push: {
    exerciseId: 'tricep_push',
    primary: [{ group: 'triceps', activationPct: 90 }],
    secondary: [],
    stabilizers: ['delts_front', 'lats'],
  },
  lateral_raise: {
    exerciseId: 'lateral_raise',
    primary: [{ group: 'delts_side', activationPct: 85 }],
    secondary: [{ group: 'traps_upper', activationPct: 30 }],
    stabilizers: ['abs_upper'],
  },
  face_pull: {
    exerciseId: 'face_pull',
    primary: [{ group: 'delts_rear', activationPct: 80 }, { group: 'traps_mid', activationPct: 70 }],
    secondary: [{ group: 'rhomboids', activationPct: 60 }],
    stabilizers: ['erectors', 'abs_upper'],
  },
  row_db: {
    exerciseId: 'row_db',
    primary: [{ group: 'lats', activationPct: 70 }, { group: 'rhomboids', activationPct: 65 }],
    secondary: [{ group: 'biceps', activationPct: 55 }],
    stabilizers: ['erectors', 'abs_upper'],
  },
  hack_squat: {
    exerciseId: 'hack_squat',
    primary: [{ group: 'quadriceps', activationPct: 85 }, { group: 'glutes', activationPct: 55 }],
    secondary: [{ group: 'adductors', activationPct: 30 }],
    stabilizers: [],
  },
  bulgarian_split: {
    exerciseId: 'bulgarian_split',
    primary: [{ group: 'quadriceps', activationPct: 80 }, { group: 'glutes', activationPct: 70 }],
    secondary: [{ group: 'hamstrings', activationPct: 35 }, { group: 'adductors', activationPct: 25 }],
    stabilizers: ['calves', 'abs_upper'],
  },
  plank: {
    exerciseId: 'plank',
    primary: [{ group: 'abs_upper', activationPct: 70 }, { group: 'abs_lower', activationPct: 60 }],
    secondary: [{ group: 'obliques', activationPct: 40 }, { group: 'erectors', activationPct: 30 }],
    stabilizers: ['delts_front', 'quadriceps'],
  },
  cable_rotation: {
    exerciseId: 'cable_rotation',
    primary: [{ group: 'obliques', activationPct: 85 }],
    secondary: [{ group: 'abs_upper', activationPct: 40 }],
    stabilizers: ['erectors', 'hamstrings'],
  },
  hanging_leg_raise: {
    exerciseId: 'hanging_leg_raise',
    primary: [{ group: 'abs_lower', activationPct: 85 }, { group: 'hip_flexors', activationPct: 60 }],
    secondary: [{ group: 'abs_upper', activationPct: 45 }],
    stabilizers: ['lats', 'forearms'],
  },
};

export function getMuscleActivation(exerciseId: string): ExerciseMuscleActivation | null {
  return EXERCISE_ACTIVATION_DB[exerciseId] || null;
}

export function calculatePairSynergy(
  exerciseA: string,
  exerciseB: string
): { synergyScore: number; type: SynergyType; recommendation: string } {
  const actA = EXERCISE_ACTIVATION_DB[exerciseA];
  const actB = EXERCISE_ACTIVATION_DB[exerciseB];

  if (!actA || !actB) {
    return { synergyScore: 50, type: 'neutral', recommendation: 'Нет данных для анализа синергии' };
  }

  const primaryA = new Set(actA.primary.map(m => m.group));
  const primaryB = new Set(actB.primary.map(m => m.group));
  const allPrimary = [...new Set([...actA.primary, ...actB.primary])];

  const overlap = allPrimary.filter(m =>
    (actA.primary.some(p => p.group === m.group) && actB.primary.some(p => p.group === m.group))
  ).length;

  const antagonistPairs = findAntagonistPairs([...primaryA], [...primaryB]);
  const agonistPairs = findAgonistPairs([...primaryA], [...primaryB]);

  if (antagonistPairs > 0 && overlap === 0) {
    return {
      synergyScore: 85,
      type: 'antagonist',
      recommendation: `Отличная антагонистическая пара — ${formatMuscleList([...primaryA])} и ${formatMuscleList([...primaryB])} работают в противофазе`,
    };
  }

  if (overlap >= 2) {
    const fatigueWarn = overlap >= 3 ? 'Высокая утомляемость' : 'Умеренная нагрузка';
    return {
      synergyScore: 30,
      type: 'redundant',
      recommendation: `Избыточное перекрытие: ${overlap} общих групп. ${fatigueWarn}. Рекомендуется разделить на разные дни`,
    };
  }

  if (agonistPairs > 0) {
    return {
      synergyScore: 60,
      type: 'synergist',
      recommendation: `Комплементарные группы — ${formatMuscleList([...primaryA])} и ${formatMuscleList([...primaryB])} дополняют друг друга`,
    };
  }

  return {
    synergyScore: 50,
    type: 'neutral',
    recommendation: 'Нейтральная пара — разные группы, нет перекрытия',
  };
}

export function analyzeSessionSynergy(slots: ExerciseSlot[]): SynergyAnalysisResult {
  const pairScores: SynergyAnalysisResult['pairScores'] = [];
  const warnings: string[] = [];

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const result = calculatePairSynergy(slots[i].exerciseId, slots[j].exerciseId);
      pairScores.push({
        exerciseA: slots[i].exerciseId,
        exerciseB: slots[j].exerciseId,
        ...result,
      });
      if (result.type === 'redundant') {
        warnings.push(`${slots[i].exerciseId} и ${slots[j].exerciseId}: ${result.recommendation}`);
      }
    }
  }

  const negativePairs = pairScores.filter(p => p.synergyScore < 40).length;
  const positivePairs = pairScores.filter(p => p.synergyScore > 70).length;
  const total = pairScores.length || 1;
  const overallScore = Math.round((positivePairs / total) * 50 + ((total - negativePairs) / total) * 50);

  const optimalOrdering = slots
    .sort((a, b) => {
      const actA = EXERCISE_ACTIVATION_DB[a.exerciseId];
      const actB = EXERCISE_ACTIVATION_DB[b.exerciseId];
      const fatigueA = actA ? actA.primary.reduce((s, m) => s + m.activationPct, 0) / actA.primary.length : 50;
      const fatigueB = actB ? actB.primary.reduce((s, m) => s + m.activationPct, 0) / actB.primary.length : 50;
      return fatigueB - fatigueA;
    })
    .map(s => s.exerciseId);

  return { pairScores, overallScore, warnings, optimalOrdering };
}

function findAntagonistPairs(groupsA: MuscleGroup[], groupsB: MuscleGroup[]): number {
  let pairs = 0;
  for (const gA of groupsA) {
    for (const gB of groupsB) {
      const synergy = MUSCLE_SYNERGY_MATRIX[gA];
      if (synergy && synergy.antagonistic.includes(gB)) pairs++;
    }
  }
  return pairs;
}

function findAgonistPairs(groupsA: MuscleGroup[], groupsB: MuscleGroup[]): number {
  let pairs = 0;
  for (const gA of groupsA) {
    for (const gB of groupsB) {
      const synergy = MUSCLE_SYNERGY_MATRIX[gA];
      if (synergy && synergy.synergetic.includes(gB) && !synergy.redundant.includes(gB)) pairs++;
    }
  }
  return pairs;
}

function formatMuscleList(groups: MuscleGroup[]): string {
  const labels: Partial<Record<MuscleGroup, string>> = {
    quadriceps: 'квадрицепсы', hamstrings: 'бицепс бедра', glutes: 'ягодицы',
    chest_whole: 'грудь', lats: 'широчайшие', rhomboids: 'ромбовидные',
    delts_front: 'передняя дельта', delts_side: 'средняя дельта', delts_rear: 'задняя дельта',
    biceps: 'бицепс', triceps: 'трицепс', erectors: 'разгибатели',
    abs_upper: 'верх пресса', abs_lower: 'низ пресса', obliques: 'косые',
    traps_mid: 'средняя трапеция', traps_upper: 'верхняя трапеция',
  };
  return groups.map(g => labels[g] || g).join(', ');
}
