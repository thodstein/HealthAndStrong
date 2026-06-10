import type { ExerciseSlot, MovementPattern } from '../core/types';
import type { SessionJointStress } from './joint-stress.engine';

export interface BalanceDimension {
  name: string;
  currentRatio: number;
  targetRatio: number;
  score: number;
  status: 'balanced' | 'slightly_imbalanced' | 'imbalanced' | 'critical';
  recommendation: string;
}

export interface TrainingBalanceInput {
  sessions: { exercises: { exerciseId: string; pattern: string; sets: number; isPush: boolean; isPull: boolean }[] }[];
  weeklyJointStress?: SessionJointStress;
  pushPullRatio?: number;
  quadHamstringRatio?: number;
  agonistAntagonistRatio?: number;
  leftRightBalance?: number;
  weakPoints: string[];
  goals: string[];
  level: string;
}

export interface TrainingBalanceResult {
  overallScore: number;
  dimensions: BalanceDimension[];
  criticalFlags: string[];
  recommendations: string[];
}

const PUSH_EXERCISES = new Set([
  'bench_bar', 'bench_db', 'incline_bar', 'incline_db', 'decline_bar', 'decline_db',
  'dips_chest', 'ohp', 'db_press', 'ohp_seated', 'push_press', 'tricep_push',
  'tricep_cable', 'rope_pushdown', 'overhead_tricep_ext', 'dips_tricep', 'kickback',
  'ohp_lying', 'pec_deck', 'cable_fly', 'cable_fly_low', 'fly_db',
]);

const PULL_EXERCISES = new Set([
  'pullup', 'chinup', 'pullup_neutral', 'pulldown', 'pulldown_rev',
  'row_bar', 'row_db', 'row_tbar', 'seated_row', 'face_pull', 'face_pull_sh',
  'straight_pull', 'curl_bar', 'curl_db', 'hammer_curl', 'preacher_curl',
  'incline_db_curl', 'spider_curl', 'cable_curl', 'deadlift', 'sumo_dl', 'rdl',
  'good_morning',
]);

const QUAD_EXERCISES = new Set([
  'squat', 'front_squat', 'hack_squat', 'leg_press', 'leg_ext',
  'bulgarian_split', 'lunge', 'walking_lunge', 'squat_ssb',
]);

const HAMSTRING_EXERCISES = new Set([
  'rdl', 'rdl_db', 'leg_curl', 'leg_curl_seated', 'leg_curl_standing',
  'good_morning',
]);

const LEFT_RIGHT_UNILATERAL = new Set([
  'bulgarian_split', 'lunge', 'walking_lunge', 'row_db', 'kickback',
  'cable_lateral', 'rear_delt_fly',
]);

export function calculateBalance(input: TrainingBalanceInput): TrainingBalanceResult {
  let totalPush = 0, totalPull = 0;
  let totalQuad = 0, totalHamstring = 0;
  let leftSets = 0, rightSets = 0;
  let totalSets = 0;

  for (const session of input.sessions) {
    for (const ex of session.exercises) {
      const sets = ex.sets || 3;
      totalSets += sets;
      if (PUSH_EXERCISES.has(ex.exerciseId)) totalPush += sets;
      if (PULL_EXERCISES.has(ex.exerciseId)) totalPull += sets;
      if (QUAD_EXERCISES.has(ex.exerciseId)) totalQuad += sets;
      if (HAMSTRING_EXERCISES.has(ex.exerciseId)) totalHamstring += sets;
    }
  }

  const dimensions: BalanceDimension[] = [];

  const pushPullRatio = totalPull > 0 ? totalPush / totalPull : totalPush;
  let pushPullScore = 100 - Math.abs(pushPullRatio - 1) * 50;
  const pushPullStatus: BalanceDimension['status'] = pushPullScore >= 80 ? 'balanced'
    : pushPullScore >= 60 ? 'slightly_imbalanced'
    : pushPullScore >= 30 ? 'imbalanced' : 'critical';

  let pushPullRec = '';
  if (pushPullRatio > 1.5) pushPullRec = 'Избыток жимовых движений. Добавьте 1-2 тяговых упражнения';
  else if (pushPullRatio < 0.5) pushPullRec = 'Избыток тяговых движений. Добавьте 1-2 жимовых';

  dimensions.push({
    name: 'Жим/Тяга (Push/Pull)',
    currentRatio: Math.round(pushPullRatio * 100) / 100,
    targetRatio: 1,
    score: Math.max(0, Math.round(pushPullScore)),
    status: pushPullStatus,
    recommendation: pushPullRec || 'Сбалансировано',
  });

  const quadHamstringRatio = totalHamstring > 0 ? totalQuad / totalHamstring : totalQuad;
  let qhScore = 100 - Math.abs(quadHamstringRatio - 1.5) * 40;
  const qhStatus: BalanceDimension['status'] = qhScore >= 80 ? 'balanced'
    : qhScore >= 60 ? 'slightly_imbalanced'
    : qhScore >= 30 ? 'imbalanced' : 'critical';

  let qhRec = '';
  if (quadHamstringRatio > 2.5) qhRec = 'Избыток квадрицепсов. Добавьте RDL/leg curl для баланса задней поверхности';
  else if (quadHamstringRatio < 0.8) qhRec = 'Избыток задней поверхности. Добавьте приседания';

  dimensions.push({
    name: 'Квадрицепс/Бицепс бедра',
    currentRatio: Math.round(quadHamstringRatio * 100) / 100,
    targetRatio: 1.5,
    score: Math.max(0, Math.round(qhScore)),
    status: qhStatus,
    recommendation: qhRec || 'Сбалансировано',
  });

  const agOnRatio = totalPull > 0 ? totalPush / totalPull : 1;
  let aoScore = 100 - Math.abs(agOnRatio - 1) * 50;
  const aoStatus: BalanceDimension['status'] = aoScore >= 80 ? 'balanced'
    : aoScore >= 60 ? 'slightly_imbalanced' : 'imbalanced';

  dimensions.push({
    name: 'Агонист/Антагонист',
    currentRatio: Math.round(agOnRatio * 100) / 100,
    targetRatio: 1,
    score: Math.max(0, Math.round(aoScore)),
    status: aoStatus,
    recommendation: agOnRatio > 1.5 ? 'Баланс агонист-антагонист нарушен — добавьте тяги' : 'Сбалансировано',
  });

  let lrScore = 100;
  let lrRec = '';
  for (const exName of LEFT_RIGHT_UNILATERAL) {
    const unilateralCount = input.sessions.filter(s =>
      s.exercises.some(e => e.exerciseId === exName)
    ).length;
    if (unilateralCount >= 2) lrScore -= 10;
  }
  if (lrScore < 80) {
    lrRec = 'Много односторонних упражнений — следите за симметрией';
    dimensions.push({
      name: 'Правая/Левая симметрия',
      currentRatio: 1,
      targetRatio: 1,
      score: Math.max(0, lrScore),
      status: lrScore >= 80 ? 'balanced' : 'slightly_imbalanced',
      recommendation: lrRec,
    });
  }

  const overallScore = Math.round(
    dimensions.reduce((s, d) => s + d.score, 0) / dimensions.length
  );

  const criticalFlags: string[] = [];
  for (const d of dimensions) {
    if (d.status === 'critical') criticalFlags.push(d.name);
    if (d.status === 'imbalanced') criticalFlags.push(d.name);
  }

  const recommendations = dimensions
    .filter(d => d.recommendation && d.status !== 'balanced')
    .map(d => d.recommendation);

  if (criticalFlags.length > 0) {
    recommendations.unshift(`Критический дисбаланс: ${criticalFlags.join(', ')}`);
  }

  return { overallScore, dimensions, criticalFlags, recommendations };
}
