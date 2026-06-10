import type { ExerciseSlot, InjuryRecord } from '../core/types';
import { getExerciseJointProfile } from './joint-stress.engine';
import type { JointName } from './joint-stress.engine';
import { EXERCISE_CATALOG } from '../core/exercise-catalog';

export interface SafetyFactor {
  name: string;
  score: number;
  weight: number;
  details: string;
}

export interface SafetyResult {
  overallScore: number;
  factors: SafetyFactor[];
  contraindications: string[];
  warnings: string[];
  recommendations: string[];
  safeToPerform: boolean;
  modifiedVersion?: string;
}

export interface Contraindication {
  exerciseId: string;
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'absolute';
  alternativeExerciseId?: string;
}

const DIFFICULTY_LEVEL_MAP: Record<string, number> = {
  beginner: 1,
  elementary: 2,
  intermediate: 3,
  advanced: 4,
  elite: 5,
};

const EXERCISE_DIFFICULTY_MAP: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
};

const HIGH_RISK_EXERCISES = new Set([
  'deadlift', 'squat', 'good_morning', 'dips_chest', 'dips_tricep',
  'ohp', 'push_press', 'snatch', 'clean', 'jerk',
]);

const TECHNIQUE_COMPLEX_EXERCISES = new Set([
  'deadlift', 'squat', 'snatch', 'clean', 'jerk', 'sumo_dl',
  'front_squat', 'good_morning', 'ohp',
]);

const JOINT_CONTRAINDICATIONS: Record<string, { severity: string; alternative: string }[]> = {
  shoulder: [
    { severity: 'mild', alternative: 'neutral_grip_press' },
    { severity: 'moderate', alternative: 'machine_press' },
    { severity: 'severe', alternative: 'cable_isolation' },
  ],
  knee: [
    { severity: 'mild', alternative: 'hack_squat' },
    { severity: 'moderate', alternative: 'leg_press' },
    { severity: 'severe', alternative: 'leg_ext' },
  ],
  spine: [
    { severity: 'mild', alternative: 'sumo_dl' },
    { severity: 'moderate', alternative: 'rdl' },
    { severity: 'severe', alternative: 'hip_thrust' },
  ],
  wrist: [
    { severity: 'mild', alternative: 'neutral_grip' },
    { severity: 'moderate', alternative: 'straps' },
    { severity: 'severe', alternative: 'machine' },
  ],
};

function findExerciseInCatalog(exerciseId: string): typeof EXERCISE_CATALOG[0] | undefined {
  return EXERCISE_CATALOG.find(e => e.id === exerciseId);
}

export function checkContraindications(
  exerciseId: string,
  injuries: InjuryRecord[],
  jointLimitations: Record<string, string>
): Contraindication[] {
  const result: Contraindication[] = [];
  const profile = getExerciseJointProfile(exerciseId);
  const exercise = findExerciseInCatalog(exerciseId);

  if (!profile) return [];

  for (const injury of injuries) {
    const jointMap: Record<string, JointName[]> = {
      knee: ['knee_l', 'knee_r'],
      shoulder: ['shoulder_l', 'shoulder_r'],
      spine: ['spine_lumbar', 'spine_thoracic'],
      hip: ['hip_l', 'hip_r'],
      elbow: ['elbow_l', 'elbow_r'],
      wrist: ['wrist_l', 'wrist_r'],
      ankle: ['ankle_l', 'ankle_r'],
    };

    const affectedJoints = jointMap[injury.location] || [];
    for (const aj of affectedJoints) {
      const hasJointLoad = profile.jointFactors.some(jf => jf.joint === aj);
      if (hasJointLoad) {
        const severityMap: Record<string, 'low' | 'medium' | 'high' | 'absolute'> = {
          none: 'low',
          mild: 'low',
          moderate: 'medium',
          severe: 'high',
          full_restriction: 'absolute',
        };
        const sev = severityMap[injury.movementLimit] || 'low';

        const alternatives = JOINT_CONTRAINDICATIONS[injury.location];
        const altId = alternatives?.find(a => {
          const levels = ['mild', 'moderate', 'severe'];
          return levels.indexOf(a.severity) >= levels.indexOf(injury.movementLimit === 'full_restriction' ? 'severe' : injury.movementLimit === 'severe' ? 'severe' : injury.movementLimit === 'moderate' ? 'moderate' : 'mild');
        })?.alternative;

        result.push({
          exerciseId,
          reason: `${injury.location} (${injury.movementLimit}): нагрузка на сустав при упражнении`,
          severity: sev,
          alternativeExerciseId: altId,
        });
      }
    }
  }

  for (const [joint, level] of Object.entries(jointLimitations)) {
    const jointMap: Record<string, JointName[]> = {
      knee: ['knee_l', 'knee_r'],
      shoulder: ['shoulder_l', 'shoulder_r'],
      spine: ['spine_lumbar'],
      wrist: ['wrist_l', 'wrist_r'],
      hip: ['hip_l', 'hip_r'],
    };
    const affectedJoints = jointMap[joint] || [];
    for (const aj of affectedJoints) {
      const hasJointLoad = profile.jointFactors.some(jf => jf.joint === aj);
      if (hasJointLoad && (level === 'severe' || level === 'high')) {
        result.push({
          exerciseId,
          reason: `${joint}: ${level} ограничение. Упражнение нагружает этот сустав`,
          severity: level === 'severe' ? 'high' : 'medium',
        });
      }
    }
  }

  return result;
}

export function evaluateExerciseSafety(
  exerciseId: string,
  userLevel: string,
  injuries: InjuryRecord[],
  jointLimitations: Record<string, string>,
  techniqueIssues: string[]
): SafetyResult {
  const factors: SafetyFactor[] = [];
  const warnings: string[] = [];
  const recommendations: string[] = [];
  const contraindications = checkContraindications(exerciseId, injuries, jointLimitations);
  const exercise = findExerciseInCatalog(exerciseId);
  const profile = getExerciseJointProfile(exerciseId);

  const userDifficulty = DIFFICULTY_LEVEL_MAP[userLevel] || 2;
  const exerciseDifficulty = exercise ? EXERCISE_DIFFICULTY_MAP[exercise.difficulty] || 2 : 2;

  if (userDifficulty < exerciseDifficulty) {
    const gap = exerciseDifficulty - userDifficulty;
    const score = Math.max(0, 100 - gap * 30);
    factors.push({
      name: 'Соответствие уровню',
      score,
      weight: 0.3,
      details: `Уровень пользователя: ${userLevel} (${userDifficulty}), сложность упражнения: ${exercise?.difficulty} (${exerciseDifficulty})`,
    });
    if (gap >= 2) {
      warnings.push(`Упражнение слишком сложное для уровня ${userLevel}. Рекомендуется освоить более простую вариацию`);
      recommendations.push(`Начните с облегчённой версии: ${getEasierVersion(exerciseId)}`);
    }
  } else {
    factors.push({ name: 'Соответствие уровню', score: 100, weight: 0.3, details: 'Уровень соответствует' });
  }

  if (profile) {
    const absContraindications = contraindications.filter(c => c.severity === 'absolute');
    const highContraindications = contraindications.filter(c => c.severity === 'high');

    let jointScore = 100;
    if (absContraindications.length > 0) {
      jointScore = 0;
      for (const c of absContraindications) {
        warnings.push(`АБСОЛЮТНОЕ ПРОТИВОПОКАЗАНИЕ: ${c.reason}`);
      }
    } else if (highContraindications.length > 0) {
      jointScore = 20;
      for (const c of highContraindications) {
        warnings.push(`Высокий риск: ${c.reason}`);
        if (c.alternativeExerciseId) {
          recommendations.push(`Альтернатива: ${c.alternativeExerciseId}`);
        }
      }
    } else {
      const medContraindications = contraindications.filter(c => c.severity === 'medium');
      if (medContraindications.length > 0) {
        jointScore = 50;
        for (const c of medContraindications) {
          warnings.push(`Умеренный риск: ${c.reason}`);
        }
      }
    }

    factors.push({ name: 'Безопасность суставов', score: jointScore, weight: 0.3, details: `${contraindications.length} противопоказаний` });
  } else {
    factors.push({ name: 'Безопасность суставов', score: 50, weight: 0.3, details: 'Нет данных профиля суставов' });
  }

  if (exercise) {
    let techniqueScore = 100;
    if (TECHNIQUE_COMPLEX_EXERCISES.has(exerciseId)) {
      techniqueScore -= 30;
      if (techniqueIssues.length > 0) {
        const relevantIssues = techniqueIssues.filter(ti =>
          ti === 'form' || ti === 'technique' || ti === 'bracing'
        );
        techniqueScore -= relevantIssues.length * 15;
        recommendations.push(`Освойте технику ${exercise.name} перед увеличением веса`);
      }
    }

    if (HIGH_RISK_EXERCISES.has(exerciseId)) {
      techniqueScore -= 10;
      if (profile && profile.overallRisk >= 6) {
        techniqueScore -= 10;
        warnings.push(`Высокорисковое упражнение. Соблюдайте осторожность`);
      }
    }

    factors.push({ name: 'Техническая сложность', score: Math.max(0, techniqueScore), weight: 0.2, details: `Техника: ${techniqueScore} баллов` });
  } else {
    factors.push({ name: 'Техническая сложность', score: 50, weight: 0.2, details: 'Нет данных упражнения' });
  }

  const hasCriticalContraindications = contraindications.some(c => c.severity === 'absolute');
  const exerciseRiskScore = getExerciseRiskScore(exerciseId);
  factors.push({
    name: 'Исторический риск',
    score: Math.max(0, 100 - exerciseRiskScore * 15),
    weight: 0.2,
    details: `Риск: ${exerciseRiskScore}/10`,
  });

  const weightedScore = Math.round(
    factors.reduce((sum, f) => sum + (f.score * f.weight), 0)
  );

  const safeToPerform = !hasCriticalContraindications && weightedScore >= 30;

  if (!safeToPerform && contraindications.length > 0) {
    const alt = contraindications.find(c => c.alternativeExerciseId);
    if (alt) {
      recommendations.push(`Замените на: ${alt.alternativeExerciseId}`);
    }
  }

  return {
    overallScore: weightedScore,
    factors,
    contraindications: contraindications.map(c => `${c.reason} (${c.severity})`),
    warnings,
    recommendations,
    safeToPerform,
  };
}

function getEasierVersion(exerciseId: string): string {
  const easier: Record<string, string> = {
    deadlift: 'румынская тяга (RDL)',
    squat: 'гакк-приседания или жим ногами',
    pullup: 'тяга верхнего блока',
    bench_bar: 'жим гантелей',
    ohp: 'жим гантелей сидя',
    dips_chest: 'жим на скамье с отрицательным уклоном',
    row_bar: 'тяга гантели одной рукой',
    good_morning: 'румынская тяга',
  };
  return easier[exerciseId] || 'облегчённая вариация';
}

function getExerciseRiskScore(exerciseId: string): number {
  const riskScores: Record<string, number> = {
    deadlift: 8, good_morning: 8, squat: 7, dips_chest: 7,
    ohp: 6, push_press: 7, clean: 9, jerk: 9, snatch: 10,
    sumo_dl: 6, front_squat: 6, bench_bar: 5, row_bar: 4,
    incline_bar: 5, pullup: 4, dips_tricep: 5, rdl: 5,
    leg_press: 4, hack_squat: 4, bulgarian_split: 5,
  };
  return riskScores[exerciseId] || 3;
}

export function getSafetyRecommendations(slots: ExerciseSlot[], userLevel: string, injuries: InjuryRecord[]): SafetyResult[] {
  return slots.map(slot =>
    evaluateExerciseSafety(slot.exerciseId, userLevel, injuries, {}, [])
  );
}
