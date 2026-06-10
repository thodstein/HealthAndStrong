import type { ReadinessScores } from '../core/types';
import type { CycleWeekPlan } from './cycle-types.engine';
import type { CumulativeFatigue, FatigueDomain } from './fatigue.engine';

export interface AutoregulationInput {
  readiness: ReadinessScores;
  trainingLoadRatio: number;
  plannedWeek: CycleWeekPlan;
  plannedExercises: ExercisePlan[];
  goal: string;
  level: string;
  weakPoints: string[];
  injuries?: { joint?: string; severity?: string }[];
  techniqueIssues?: string[];
  lastSessionRPE?: number;
  recentVolumeTrend?: 'up' | 'stable' | 'down';
  strengthTrend?: 'up' | 'stable' | 'down';
  doms: number;
  sleepQuality: number;
  stress: number;
  cumulativeFatigue?: CumulativeFatigue;
  recoveryPct?: number;
  acwr?: number;
}

export interface ExercisePlan {
  exerciseId: string;
  name: string;
  group: string;
  type: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  rir: number;
  isCompound: boolean;
  isWeakGroup: boolean;
  techniqueScore?: number;
}

export interface ExerciseAdjustment {
  exerciseId: string;
  originalSets: number;
  adjustedSets: number;
  originalRir: number;
  adjustedRir: number;
  repRangeMod: number;
  substituted: boolean;
  substituteId?: string;
  rationale: string;
}

export interface AutoregulationAdjustment {
  pri: number;
  priLabel: string;
  priBreakdown: { subScore: string; value: number; weight: number; weighted: number }[];
  adjustmentFactor: number;
  exerciseAdjustments: ExerciseAdjustment[];
  sessionModifications: {
    skipTraining: boolean;
    reduceDuration: boolean;
    changeFocus: string | null;
  };
  recommendations: string[];
  breakdown: { factor: string; impact: number; rationale: string }[];
}

const PRI_ZONES = [
  { min: 0, max: 20, label: 'Критическое', volumeMod: 0.30, rirAdd: 4, skipTraining: true, desc: 'Пропуск тренировки обязателен' },
  { min: 20, max: 40, label: 'Очень низкое', volumeMod: 0.50, rirAdd: 3, skipTraining: true, desc: 'Рекомендуется пропуск или лёгкая активность' },
  { min: 40, max: 55, label: 'Низкое', volumeMod: 0.65, rirAdd: 2, skipTraining: false, desc: 'Восстановительный режим, 60% объёма' },
  { min: 55, max: 65, label: 'Ниже среднего', volumeMod: 0.75, rirAdd: 1.5, skipTraining: false, desc: 'Консервативный режим, 75% объёма' },
  { min: 65, max: 75, label: 'Среднее', volumeMod: 0.85, rirAdd: 1, skipTraining: false, desc: 'Умеренный режим, 85% объёма' },
  { min: 75, max: 85, label: 'Хорошее', volumeMod: 0.95, rirAdd: 0, skipTraining: false, desc: 'Нормальный режим' },
  { min: 85, max: 93, label: 'Высокое', volumeMod: 1.00, rirAdd: -0.5, skipTraining: false, desc: 'Полная интенсивность' },
  { min: 93, max: 101, label: 'Отличное', volumeMod: 1.05, rirAdd: -1, skipTraining: false, desc: 'Пиковая производительность' },
];

export function calculatePRI(
  readiness: ReadinessScores,
  doms: number,
  sleepQuality: number,
  stress: number,
  cumulativeFatigue?: CumulativeFatigue,
  recoveryPct?: number,
  acwr?: number
): { pri: number; breakdown: { subScore: string; value: number; weight: number; weighted: number }[] } {
  const breakdown: { subScore: string; value: number; weight: number; weighted: number }[] = [];

  const rec = readiness.recovery / 100;
  const recScore = rec * 100;
  breakdown.push({ subScore: 'Восстановление', value: Math.round(recScore), weight: 0.20, weighted: Math.round(recScore * 0.20) });

  const fat = Math.max(0, 1 - readiness.fatigue / 100);
  const fatScore = fat * 100;
  breakdown.push({ subScore: 'Усталость', value: Math.round(fatScore), weight: 0.15, weighted: Math.round(fatScore * 0.15) });

  const dom = Math.max(0, 1 - doms / 10);
  const domScore = dom * 100;
  breakdown.push({ subScore: 'DOMS', value: Math.round(domScore), weight: 0.12, weighted: Math.round(domScore * 0.12) });

  const slp = sleepQuality / 10;
  const slpScore = slp * 100;
  breakdown.push({ subScore: 'Сон', value: Math.round(slpScore), weight: 0.10, weighted: Math.round(slpScore * 0.10) });

  const str = Math.max(0, 1 - stress / 10);
  const strScore = str * 100;
  breakdown.push({ subScore: 'Стресс', value: Math.round(strScore), weight: 0.08, weighted: Math.round(strScore * 0.08) });

  let acwrScore = 100;
  if (acwr !== undefined) {
    if (acwr > 1.5) acwrScore = 20;
    else if (acwr > 1.3) acwrScore = 40;
    else if (acwr > 1.1) acwrScore = 60;
    else if (acwr > 0.8) acwrScore = 90;
    else acwrScore = 80;
    breakdown.push({ subScore: 'ACWR', value: acwrScore, weight: 0.15, weighted: Math.round(acwrScore * 0.15) });
  }

  let recovScore = 100;
  if (recoveryPct !== undefined) {
    recovScore = recoveryPct;
    breakdown.push({ subScore: 'Восстановление %', value: Math.round(recovScore), weight: 0.10, weighted: Math.round(recovScore * 0.10) });
  }

  if (cumulativeFatigue) {
    const cnsFatigue = cumulativeFatigue.domains.find(d => d.domain === 'cns');
    const muscularFatigue = cumulativeFatigue.domains.find(d => d.domain === 'muscular');
    if (cnsFatigue) {
      const cnsScore = Math.max(0, 100 - cnsFatigue.current);
      breakdown.push({ subScore: 'ЦНС утомление', value: cnsScore, weight: 0.05, weighted: Math.round(cnsScore * 0.05) });
    }
    if (muscularFatigue) {
      const muscScore = Math.max(0, 100 - muscularFatigue.current);
      breakdown.push({ subScore: 'Мышечное утомление', value: muscScore, weight: 0.05, weighted: Math.round(muscScore * 0.05) });
    }
  }

  const totalWeight = breakdown.reduce((s, b) => s + b.weight, 0);
  const pri = Math.max(0, Math.min(100, Math.round(
    breakdown.reduce((s, b) => s + b.value * (b.weight / totalWeight), 0)
  )));

  return { pri, breakdown };
}

export function getPRIThreshold(pri: number) {
  for (const t of PRI_ZONES) {
    if (pri >= t.min && pri < t.max) return t;
  }
  return PRI_ZONES[5];
}

export function autoregulate(input: AutoregulationInput): AutoregulationAdjustment {
  const { pri, breakdown: priBreakdown } = calculatePRI(
    input.readiness, input.doms, input.sleepQuality, input.stress,
    input.cumulativeFatigue, input.recoveryPct, input.acwr
  );
  const threshold = getPRIThreshold(pri);
  const breakdown: { factor: string; impact: number; rationale: string }[] = [];

  const recImpact = threshold.volumeMod;
  breakdown.push({
    factor: 'PRI',
    impact: Math.round((1 - recImpact) * -100),
    rationale: `PRI ${pri} (${threshold.label}): ${threshold.desc}`,
  });

  let loadMod = 1.0;
  if (input.trainingLoadRatio > 1.2) {
    loadMod = 0.85;
    breakdown.push({ factor: 'Перегрузка', impact: -15, rationale: `TrainingLoadRatio ${input.trainingLoadRatio.toFixed(2)} > 1.2` });
  } else if (input.trainingLoadRatio < 0.5) {
    breakdown.push({ factor: 'Недогрузка', impact: 5, rationale: `TrainingLoadRatio ${input.trainingLoadRatio.toFixed(2)} < 0.5` });
  }

  let perfMod = 1.0;
  if (input.lastSessionRPE !== undefined) {
    if (input.lastSessionRPE >= 9) {
      perfMod = 0.90;
      breakdown.push({ factor: 'Высокий RPE', impact: -10, rationale: `RPE ${input.lastSessionRPE} ≥ 9` });
    } else if (input.lastSessionRPE <= 4) {
      perfMod = 1.10;
      breakdown.push({ factor: 'Низкий RPE', impact: 10, rationale: `RPE ${input.lastSessionRPE} ≤ 4` });
    }
  }

  if (input.strengthTrend === 'down') {
    perfMod *= 0.90;
    breakdown.push({ factor: 'Спад силы', impact: -10, rationale: 'Тренд силы вниз' });
  }

  let techniqueMod = 1.0;
  if (input.techniqueIssues && input.techniqueIssues.length > 0) {
    techniqueMod = Math.max(0.75, 1.0 - input.techniqueIssues.length * 0.05);
    breakdown.push({ factor: 'Техника', impact: Math.round((techniqueMod - 1) * 100), rationale: `${input.techniqueIssues.length} проблем с техникой` });
  }

  if (input.injuries && input.injuries.length > 0) {
    const sevMap: Record<string, number> = { mild: 0.05, moderate: 0.15, severe: 0.25 };
    let injuryPenalty = 0;
    for (const inj of input.injuries) injuryPenalty += sevMap[inj.severity || 'mild'] || 0.05;
    injuryPenalty = Math.min(0.4, injuryPenalty);
    breakdown.push({ factor: 'Травмы', impact: Math.round(-injuryPenalty * 100), rationale: `${input.injuries.length} травм` });
  }

  const adjustmentFactor = Math.max(0.3, Math.min(1.0, recImpact * loadMod * perfMod * techniqueMod));

  const exerciseAdjustments: ExerciseAdjustment[] = [];
  for (const ex of input.plannedExercises) {
    let adjustedSets = Math.max(1, Math.round(ex.sets * adjustmentFactor));
    let adjustedRir = Math.max(0, Math.round(ex.rir + threshold.rirAdd));
    let repRangeMod = 0;

    if (ex.isWeakGroup) adjustedSets = Math.max(2, adjustedSets + 1);
    if (ex.type === 'compound' && adjustmentFactor < 0.7) adjustedSets = Math.max(1, adjustedSets - 1);

    let substituted = false;
    let substituteId: string | undefined;
    let rationale = `${ex.name}: сеты ${ex.sets}→${adjustedSets}, RIR ${ex.rir}→${adjustedRir}`;
    if (ex.techniqueScore !== undefined && ex.techniqueScore < 5 && input.level !== 'beginner') {
      substituted = true;
      substituteId = ex.exerciseId + '_variant';
      rationale += `. Техника ${ex.techniqueScore}/10 → замена`;
    }

    exerciseAdjustments.push({ exerciseId: ex.exerciseId, originalSets: ex.sets, adjustedSets, originalRir: ex.rir, adjustedRir, repRangeMod, substituted, substituteId, rationale });
  }

  const sessionModifications = {
    skipTraining: threshold.skipTraining || adjustmentFactor < 0.35,
    reduceDuration: adjustmentFactor < 0.7 && !threshold.skipTraining,
    changeFocus: null as string | null,
  };

  if (input.weakPoints.length > 0 && pri >= 70) {
    sessionModifications.changeFocus = input.weakPoints[0];
  }

  const recommendations: string[] = [];
  if (sessionModifications.skipTraining) {
    recommendations.push(`PRI ${pri} — пропуск тренировки`);
  } else if (adjustmentFactor < 0.6) {
    recommendations.push(`Объём снижен на ${Math.round((1 - adjustmentFactor) * 100)}%. Без отказов`);
  }
  if (input.strengthTrend === 'down' && pri > 60) {
    recommendations.push('Тренд силы вниз при хорошем PRI — проверьте восстановление');
  }
  if (input.techniqueIssues && input.techniqueIssues.length > 0) {
    recommendations.push(`Техника: ${input.techniqueIssues.join(', ')}`);
  }

  return { pri, priLabel: threshold.label, priBreakdown, adjustmentFactor, exerciseAdjustments, sessionModifications, recommendations, breakdown };
}

export function getAutoregulationRecommendation(adjustment: AutoregulationAdjustment): string {
  const parts: string[] = [];
  if (adjustment.sessionModifications.skipTraining) parts.push('Пропустить тренировку');
  else {
    parts.push(`PRI ${adjustment.pri} (${adjustment.priLabel})`);
    parts.push(`Фактор: ${(adjustment.adjustmentFactor * 100).toFixed(0)}%`);
    if (adjustment.adjustmentFactor < 0.7) parts.push('Консервативный');
    else if (adjustment.adjustmentFactor > 0.95) parts.push('Полная интенсивность');
  }
  return parts.join(' · ');
}
