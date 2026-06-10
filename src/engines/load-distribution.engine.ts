import type { ExerciseSlot, MovementPattern } from '../core/types';

export interface DayCapacity {
  dayIndex: number;
  name: string;
  freshnessPct: number;
  availableVolume: number;
  allocatedVolume: number;
  priority: 'high' | 'medium' | 'low';
}

export interface LoadDistributionInput {
  daysPerWeek: number;
  weeklyTotalSets: number;
  weeklyIntensityAvg: number;
  exercises: { exerciseId: string; sets: number; priority: number; isMainLift: boolean; pattern: MovementPattern }[];
  recoveryCapacity: number;
  fatigueState: number;
  weakPoints: string[];
  preferredPattern?: 'even' | 'heavy_light' | 'accumulation' | 'peak';
}

export interface DistributedDay {
  dayIndex: number;
  name: string;
  volumeSets: number;
  intensityMod: number;
  exercises: { exerciseId: string; sets: number; priority: number }[];
  freshnessAfter: number;
  loadType: 'heavy' | 'light' | 'moderate' | 'recovery';
}

export interface LoadDistributionResult {
  days: DistributedDay[];
  weeklyVolume: number;
  evennessScore: number;
  warnings: string[];
  rationale: string;
}

const DAY_NAMES = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

export function distributeLoad(input: LoadDistributionInput): LoadDistributionResult {
  const days: DistributedDay[] = [];
  const warnings: string[] = [];
  const pattern = input.preferredPattern || 'heavy_light';

  const capacityPerDay = input.recoveryCapacity > 70 ? 1.0
    : input.recoveryCapacity > 50 ? 0.85
    : input.recoveryCapacity > 30 ? 0.65
    : 0.45;

  const fatigueMod = 1 - (input.fatigueState / 100) * 0.3;

  const mainLifts = input.exercises.filter(e => e.isMainLift);
  const accessoryLifts = input.exercises.filter(e => !e.isMainLift);

  const heavyDays = Math.ceil(input.daysPerWeek * (pattern === 'heavy_light' ? 0.4 : pattern === 'peak' ? 0.3 : pattern === 'accumulation' ? 0.6 : 0.5));

  let remainingVolume = input.weeklyTotalSets * capacityPerDay * fatigueMod;
  const volumePerDay = remainingVolume / input.daysPerWeek;

  for (let i = 0; i < input.daysPerWeek; i++) {
    const isHeavy = pattern === 'heavy_light'
      ? (i % 2 === 0 && i < heavyDays)
      : i < heavyDays;

    const loadType = isHeavy ? 'heavy' : (pattern === 'accumulation' ? 'moderate' : 'light');
    const intensityMod = loadType === 'heavy' ? 1.0 : loadType === 'light' ? 0.7 : 0.85;

    const dayMainLifts = mainLifts.filter((_, mi) => mi % input.daysPerWeek === i);
    const dayAccessory = accessoryLifts.filter((_, ai) => ai % input.daysPerWeek === i);
    const dayExercises = [...dayMainLifts, ...dayAccessory];

    const dayVolume = Math.round(volumePerDay * intensityMod);
    remainingVolume -= dayVolume;

    days.push({
      dayIndex: i,
      name: DAY_NAMES[i] || `День ${i + 1}`,
      volumeSets: dayVolume,
      intensityMod,
      exercises: dayExercises.map(e => ({ exerciseId: e.exerciseId, sets: Math.round(e.sets * intensityMod), priority: e.priority })),
      freshnessAfter: 100 - (dayVolume / (volumePerDay || 1)) * 30,
      loadType,
    });
  }

  const volumes = days.map(d => d.volumeSets);
  const avgVol = volumes.reduce((s, v) => s + v, 0) / volumes.length;
  const variance = volumes.reduce((s, v) => s + Math.pow(v - avgVol, 2), 0) / volumes.length;
  const evennessScore = Math.max(0, Math.min(100, Math.round(100 - variance / (avgVol || 1) * 10)));

  if (evennessScore < 40) {
    warnings.push('Неравномерное распределение объёма — риск перегрузки в тяжёлые дни');
  }
  if (input.recoveryCapacity < 40 && input.daysPerWeek >= 5) {
    warnings.push('Низкое восстановление при 5+ днях — рассмотрите сокращение дней');
  }

  const rationale = pattern === 'heavy_light'
    ? 'Чередование тяжёлых/лёгких дней для оптимального восстановления'
    : pattern === 'even'
    ? 'Равномерное распределение нагрузки'
    : pattern === 'peak'
    ? 'Акцент на качество с низким объёмом'
    : 'Постепенное накопление объёма';

  return {
    days,
    weeklyVolume: days.reduce((s, d) => s + d.volumeSets, 0),
    evennessScore,
    warnings,
    rationale,
  };
}
