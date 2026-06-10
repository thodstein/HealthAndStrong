import type { ExerciseSlot, MovementPattern } from '../core/types';

export type JointName = 'neck' | 'shoulder_l' | 'shoulder_r' | 'elbow_l' | 'elbow_r' | 'wrist_l' | 'wrist_r' | 'spine_lumbar' | 'spine_thoracic' | 'hip_l' | 'hip_r' | 'knee_l' | 'knee_r' | 'ankle_l' | 'ankle_r';

export interface JointStressFactor {
  joint: JointName;
  axialLoad: number;
  shearLoad: number;
  romStress: number;
  impactRisk: number;
  cumulativeFactor: number;
}

export interface ExerciseJointProfile {
  exerciseId: string;
  jointFactors: JointStressFactor[];
  overallRisk: number;
  warningJoints: JointName[];
}

export interface SessionJointStress {
  perJoint: Record<JointName, { totalLoad: number; exerciseCount: number; exercises: string[]; risk: 'low' | 'medium' | 'high' | 'critical' }>;
  highestRiskJoint: JointName | null;
  warnings: string[];
  recoveryHoursNeeded: number;
}

export interface WeeklyJointStress {
  sessions: SessionJointStress[];
  perJoint: Record<JointName, { weeklyLoad: number; sessionCount: number; trend: 'stable' | 'increasing' | 'decreasing'; risk: 'low' | 'medium' | 'high' | 'critical' }>;
  criticalJoints: JointName[];
  recommendations: string[];
}

const EXERCISE_JOINT_PROFILES: Record<string, ExerciseJointProfile> = {
  squat: {
    exerciseId: 'squat',
    jointFactors: [
      { joint: 'spine_lumbar', axialLoad: 8, shearLoad: 6, romStress: 4, impactRisk: 2, cumulativeFactor: 6 },
      { joint: 'hip_l', axialLoad: 7, shearLoad: 5, romStress: 7, impactRisk: 2, cumulativeFactor: 6 },
      { joint: 'hip_r', axialLoad: 7, shearLoad: 5, romStress: 7, impactRisk: 2, cumulativeFactor: 6 },
      { joint: 'knee_l', axialLoad: 7, shearLoad: 6, romStress: 8, impactRisk: 3, cumulativeFactor: 7 },
      { joint: 'knee_r', axialLoad: 7, shearLoad: 6, romStress: 8, impactRisk: 3, cumulativeFactor: 7 },
      { joint: 'ankle_l', axialLoad: 5, shearLoad: 3, romStress: 5, impactRisk: 1, cumulativeFactor: 4 },
      { joint: 'ankle_r', axialLoad: 5, shearLoad: 3, romStress: 5, impactRisk: 1, cumulativeFactor: 4 },
    ],
    overallRisk: 6,
    warningJoints: ['spine_lumbar', 'knee_l', 'knee_r'],
  },
  front_squat: {
    exerciseId: 'front_squat',
    jointFactors: [
      { joint: 'spine_lumbar', axialLoad: 5, shearLoad: 4, romStress: 5, impactRisk: 2, cumulativeFactor: 4 },
      { joint: 'knee_l', axialLoad: 8, shearLoad: 6, romStress: 8, impactRisk: 3, cumulativeFactor: 7 },
      { joint: 'knee_r', axialLoad: 8, shearLoad: 6, romStress: 8, impactRisk: 3, cumulativeFactor: 7 },
      { joint: 'wrist_l', axialLoad: 4, shearLoad: 5, romStress: 6, impactRisk: 2, cumulativeFactor: 5 },
      { joint: 'wrist_r', axialLoad: 4, shearLoad: 5, romStress: 6, impactRisk: 2, cumulativeFactor: 5 },
    ],
    overallRisk: 5,
    warningJoints: ['knee_l', 'knee_r', 'wrist_l', 'wrist_r'],
  },
  deadlift: {
    exerciseId: 'deadlift',
    jointFactors: [
      { joint: 'spine_lumbar', axialLoad: 9, shearLoad: 9, romStress: 5, impactRisk: 3, cumulativeFactor: 8 },
      { joint: 'spine_thoracic', axialLoad: 6, shearLoad: 5, romStress: 4, impactRisk: 2, cumulativeFactor: 5 },
      { joint: 'hip_l', axialLoad: 8, shearLoad: 7, romStress: 6, impactRisk: 2, cumulativeFactor: 7 },
      { joint: 'hip_r', axialLoad: 8, shearLoad: 7, romStress: 6, impactRisk: 2, cumulativeFactor: 7 },
      { joint: 'knee_l', axialLoad: 5, shearLoad: 4, romStress: 4, impactRisk: 2, cumulativeFactor: 4 },
      { joint: 'knee_r', axialLoad: 5, shearLoad: 4, romStress: 4, impactRisk: 2, cumulativeFactor: 4 },
      { joint: 'shoulder_l', axialLoad: 3, shearLoad: 4, romStress: 3, impactRisk: 3, cumulativeFactor: 3 },
      { joint: 'shoulder_r', axialLoad: 3, shearLoad: 4, romStress: 3, impactRisk: 3, cumulativeFactor: 3 },
    ],
    overallRisk: 7,
    warningJoints: ['spine_lumbar', 'hip_l', 'hip_r'],
  },
  sumo_dl: {
    exerciseId: 'sumo_dl',
    jointFactors: [
      { joint: 'spine_lumbar', axialLoad: 7, shearLoad: 6, romStress: 4, impactRisk: 2, cumulativeFactor: 6 },
      { joint: 'hip_l', axialLoad: 9, shearLoad: 7, romStress: 8, impactRisk: 2, cumulativeFactor: 8 },
      { joint: 'hip_r', axialLoad: 9, shearLoad: 7, romStress: 8, impactRisk: 2, cumulativeFactor: 8 },
      { joint: 'knee_l', axialLoad: 5, shearLoad: 5, romStress: 5, impactRisk: 2, cumulativeFactor: 5 },
      { joint: 'knee_r', axialLoad: 5, shearLoad: 5, romStress: 5, impactRisk: 2, cumulativeFactor: 5 },
    ],
    overallRisk: 6,
    warningJoints: ['hip_l', 'hip_r'],
  },
  rdl: {
    exerciseId: 'rdl',
    jointFactors: [
      { joint: 'spine_lumbar', axialLoad: 6, shearLoad: 6, romStress: 4, impactRisk: 2, cumulativeFactor: 5 },
      { joint: 'hip_l', axialLoad: 7, shearLoad: 6, romStress: 7, impactRisk: 1, cumulativeFactor: 6 },
      { joint: 'hip_r', axialLoad: 7, shearLoad: 6, romStress: 7, impactRisk: 1, cumulativeFactor: 6 },
    ],
    overallRisk: 5,
    warningJoints: ['spine_lumbar'],
  },
  bench_bar: {
    exerciseId: 'bench_bar',
    jointFactors: [
      { joint: 'shoulder_l', axialLoad: 5, shearLoad: 6, romStress: 6, impactRisk: 3, cumulativeFactor: 6 },
      { joint: 'shoulder_r', axialLoad: 5, shearLoad: 6, romStress: 6, impactRisk: 3, cumulativeFactor: 6 },
      { joint: 'elbow_l', axialLoad: 4, shearLoad: 5, romStress: 6, impactRisk: 2, cumulativeFactor: 5 },
      { joint: 'elbow_r', axialLoad: 4, shearLoad: 5, romStress: 6, impactRisk: 2, cumulativeFactor: 5 },
      { joint: 'wrist_l', axialLoad: 4, shearLoad: 4, romStress: 5, impactRisk: 2, cumulativeFactor: 4 },
      { joint: 'wrist_r', axialLoad: 4, shearLoad: 4, romStress: 5, impactRisk: 2, cumulativeFactor: 4 },
    ],
    overallRisk: 5,
    warningJoints: ['shoulder_l', 'shoulder_r'],
  },
  incline_bar: {
    exerciseId: 'incline_bar',
    jointFactors: [
      { joint: 'shoulder_l', axialLoad: 6, shearLoad: 6, romStress: 5, impactRisk: 3, cumulativeFactor: 5 },
      { joint: 'shoulder_r', axialLoad: 6, shearLoad: 6, romStress: 5, impactRisk: 3, cumulativeFactor: 5 },
    ],
    overallRisk: 5,
    warningJoints: ['shoulder_l', 'shoulder_r'],
  },
  ohp: {
    exerciseId: 'ohp',
    jointFactors: [
      { joint: 'shoulder_l', axialLoad: 7, shearLoad: 7, romStress: 7, impactRisk: 4, cumulativeFactor: 7 },
      { joint: 'shoulder_r', axialLoad: 7, shearLoad: 7, romStress: 7, impactRisk: 4, cumulativeFactor: 7 },
      { joint: 'spine_lumbar', axialLoad: 6, shearLoad: 4, romStress: 3, impactRisk: 2, cumulativeFactor: 4 },
      { joint: 'elbow_l', axialLoad: 5, shearLoad: 4, romStress: 5, impactRisk: 2, cumulativeFactor: 4 },
      { joint: 'elbow_r', axialLoad: 5, shearLoad: 4, romStress: 5, impactRisk: 2, cumulativeFactor: 4 },
    ],
    overallRisk: 6,
    warningJoints: ['shoulder_l', 'shoulder_r'],
  },
  pullup: {
    exerciseId: 'pullup',
    jointFactors: [
      { joint: 'shoulder_l', axialLoad: 3, shearLoad: 5, romStress: 6, impactRisk: 2, cumulativeFactor: 5 },
      { joint: 'shoulder_r', axialLoad: 3, shearLoad: 5, romStress: 6, impactRisk: 2, cumulativeFactor: 5 },
      { joint: 'elbow_l', axialLoad: 3, shearLoad: 4, romStress: 5, impactRisk: 2, cumulativeFactor: 4 },
      { joint: 'elbow_r', axialLoad: 3, shearLoad: 4, romStress: 5, impactRisk: 2, cumulativeFactor: 4 },
      { joint: 'wrist_l', axialLoad: 3, shearLoad: 3, romStress: 3, impactRisk: 1, cumulativeFactor: 3 },
      { joint: 'wrist_r', axialLoad: 3, shearLoad: 3, romStress: 3, impactRisk: 1, cumulativeFactor: 3 },
    ],
    overallRisk: 4,
    warningJoints: ['shoulder_l', 'shoulder_r', 'elbow_l', 'elbow_r'],
  },
  row_bar: {
    exerciseId: 'row_bar',
    jointFactors: [
      { joint: 'spine_lumbar', axialLoad: 5, shearLoad: 5, romStress: 3, impactRisk: 1, cumulativeFactor: 4 },
      { joint: 'shoulder_l', axialLoad: 3, shearLoad: 4, romStress: 5, impactRisk: 2, cumulativeFactor: 4 },
      { joint: 'shoulder_r', axialLoad: 3, shearLoad: 4, romStress: 5, impactRisk: 2, cumulativeFactor: 4 },
      { joint: 'elbow_l', axialLoad: 3, shearLoad: 3, romStress: 5, impactRisk: 1, cumulativeFactor: 3 },
      { joint: 'elbow_r', axialLoad: 3, shearLoad: 3, romStress: 5, impactRisk: 1, cumulativeFactor: 3 },
    ],
    overallRisk: 4,
    warningJoints: ['spine_lumbar'],
  },
  leg_press: {
    exerciseId: 'leg_press',
    jointFactors: [
      { joint: 'knee_l', axialLoad: 8, shearLoad: 6, romStress: 7, impactRisk: 2, cumulativeFactor: 7 },
      { joint: 'knee_r', axialLoad: 8, shearLoad: 6, romStress: 7, impactRisk: 2, cumulativeFactor: 7 },
      { joint: 'hip_l', axialLoad: 6, shearLoad: 4, romStress: 6, impactRisk: 1, cumulativeFactor: 5 },
      { joint: 'hip_r', axialLoad: 6, shearLoad: 4, romStress: 6, impactRisk: 1, cumulativeFactor: 5 },
    ],
    overallRisk: 5,
    warningJoints: ['knee_l', 'knee_r'],
  },
  dips_chest: {
    exerciseId: 'dips_chest',
    jointFactors: [
      { joint: 'shoulder_l', axialLoad: 6, shearLoad: 7, romStress: 8, impactRisk: 5, cumulativeFactor: 8 },
      { joint: 'shoulder_r', axialLoad: 6, shearLoad: 7, romStress: 8, impactRisk: 5, cumulativeFactor: 8 },
      { joint: 'elbow_l', axialLoad: 5, shearLoad: 5, romStress: 7, impactRisk: 4, cumulativeFactor: 6 },
      { joint: 'elbow_r', axialLoad: 5, shearLoad: 5, romStress: 7, impactRisk: 4, cumulativeFactor: 6 },
      { joint: 'wrist_l', axialLoad: 4, shearLoad: 3, romStress: 4, impactRisk: 2, cumulativeFactor: 3 },
      { joint: 'wrist_r', axialLoad: 4, shearLoad: 3, romStress: 4, impactRisk: 2, cumulativeFactor: 3 },
    ],
    overallRisk: 7,
    warningJoints: ['shoulder_l', 'shoulder_r', 'elbow_l', 'elbow_r'],
  },
  hip_thrust: {
    exerciseId: 'hip_thrust',
    jointFactors: [
      { joint: 'hip_l', axialLoad: 6, shearLoad: 3, romStress: 5, impactRisk: 1, cumulativeFactor: 4 },
      { joint: 'hip_r', axialLoad: 6, shearLoad: 3, romStress: 5, impactRisk: 1, cumulativeFactor: 4 },
    ],
    overallRisk: 3,
    warningJoints: [],
  },
  hack_squat: {
    exerciseId: 'hack_squat',
    jointFactors: [
      { joint: 'knee_l', axialLoad: 8, shearLoad: 5, romStress: 7, impactRisk: 2, cumulativeFactor: 7 },
      { joint: 'knee_r', axialLoad: 8, shearLoad: 5, romStress: 7, impactRisk: 2, cumulativeFactor: 7 },
      { joint: 'spine_lumbar', axialLoad: 4, shearLoad: 3, romStress: 3, impactRisk: 1, cumulativeFactor: 3 },
    ],
    overallRisk: 5,
    warningJoints: ['knee_l', 'knee_r'],
  },
  bulgarian_split: {
    exerciseId: 'bulgarian_split',
    jointFactors: [
      { joint: 'knee_l', axialLoad: 6, shearLoad: 5, romStress: 7, impactRisk: 3, cumulativeFactor: 6 },
      { joint: 'knee_r', axialLoad: 6, shearLoad: 5, romStress: 7, impactRisk: 3, cumulativeFactor: 6 },
      { joint: 'hip_l', axialLoad: 5, shearLoad: 4, romStress: 6, impactRisk: 2, cumulativeFactor: 5 },
      { joint: 'hip_r', axialLoad: 5, shearLoad: 4, romStress: 6, impactRisk: 2, cumulativeFactor: 5 },
      { joint: 'ankle_l', axialLoad: 4, shearLoad: 3, romStress: 5, impactRisk: 2, cumulativeFactor: 4 },
      { joint: 'ankle_r', axialLoad: 4, shearLoad: 3, romStress: 5, impactRisk: 2, cumulativeFactor: 4 },
    ],
    overallRisk: 5,
    warningJoints: ['knee_l', 'knee_r'],
  },
};

const JOINT_RECOVERY_MAP: Record<JointName, number> = {
  neck: 24, shoulder_l: 48, shoulder_r: 48, elbow_l: 24, elbow_r: 24,
  wrist_l: 12, wrist_r: 12, spine_lumbar: 72, spine_thoracic: 48,
  hip_l: 48, hip_r: 48, knee_l: 48, knee_r: 48, ankle_l: 24, ankle_r: 24,
};

const JOINT_THRESHOLDS: Record<JointName, { low: number; medium: number; high: number }> = {
  neck: { low: 5, medium: 12, high: 20 },
  shoulder_l: { low: 10, medium: 25, high: 40 },
  shoulder_r: { low: 10, medium: 25, high: 40 },
  elbow_l: { low: 8, medium: 20, high: 35 },
  elbow_r: { low: 8, medium: 20, high: 35 },
  wrist_l: { low: 6, medium: 15, high: 25 },
  wrist_r: { low: 6, medium: 15, high: 25 },
  spine_lumbar: { low: 12, medium: 30, high: 50 },
  spine_thoracic: { low: 10, medium: 25, high: 40 },
  hip_l: { low: 10, medium: 25, high: 40 },
  hip_r: { low: 10, medium: 25, high: 40 },
  knee_l: { low: 10, medium: 25, high: 40 },
  knee_r: { low: 10, medium: 25, high: 40 },
  ankle_l: { low: 6, medium: 15, high: 25 },
  ankle_r: { low: 6, medium: 15, high: 25 },
};

export function getExerciseJointProfile(exerciseId: string): ExerciseJointProfile | null {
  return EXERCISE_JOINT_PROFILES[exerciseId] || null;
}

export function calculateExerciseJointStress(
  exerciseId: string,
  sets: number,
  reps: number,
  weightPct: number = 1
): { profile: ExerciseJointProfile | null; perJoint: Record<JointName, number>; totalStress: number } {
  const profile = EXERCISE_JOINT_PROFILES[exerciseId];
  if (!profile) return { profile: null, perJoint: {} as Record<JointName, number>, totalStress: 0 };

  const volumeMultiplier = (sets * reps) / 15;
  const perJoint: Partial<Record<JointName, number>> = {};

  let totalStress = 0;
  for (const factor of profile.jointFactors) {
    const stress = Math.round(factor.cumulativeFactor * volumeMultiplier * weightPct);
    perJoint[factor.joint] = stress;
    totalStress += stress;
  }

  return { profile, perJoint: perJoint as Record<JointName, number>, totalStress };
}

export function calculateSessionJointStress(
  slots: ExerciseSlot[],
  userRiskProfile?: Record<string, string>
): SessionJointStress {
  const perJoint: Record<string, { totalLoad: number; exerciseCount: number; exercises: string[] }> = {};

  for (const slot of slots) {
    const profile = EXERCISE_JOINT_PROFILES[slot.exerciseId];
    if (!profile) continue;

    for (const factor of profile.jointFactors) {
      if (!perJoint[factor.joint]) {
        perJoint[factor.joint] = { totalLoad: 0, exerciseCount: 0, exercises: [] };
      }
      perJoint[factor.joint].totalLoad += factor.cumulativeFactor;
      perJoint[factor.joint].exerciseCount++;
      perJoint[factor.joint].exercises.push(slot.exerciseId);
    }
  }

  const jointRiskMap: Record<string, { totalLoad: number; exerciseCount: number; exercises: string[]; risk: 'low' | 'medium' | 'high' | 'critical' }> = {};
  const warnings: string[] = [];
  let maxRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
  let highestRiskJoint: JointName | null = null;
  let maxRecovery = 0;

  for (const [joint, data] of Object.entries(perJoint)) {
    const thresholds = JOINT_THRESHOLDS[joint as JointName];
    let risk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (thresholds) {
      if (data.totalLoad >= thresholds.high) risk = 'critical';
      else if (data.totalLoad >= thresholds.medium) risk = 'high';
      else if (data.totalLoad >= thresholds.low) risk = 'medium';
    }

    const riskOrder = ['low', 'medium', 'high', 'critical'];
    if (riskOrder.indexOf(risk) > riskOrder.indexOf(maxRisk)) {
      maxRisk = risk;
      highestRiskJoint = joint as JointName;
    }

    jointRiskMap[joint] = { ...data, risk };

    if (risk === 'high') {
      warnings.push(`${joint}: высокая нагрузка (${data.totalLoad}). Рекомендуется снизить объём`);
    } else if (risk === 'critical') {
      warnings.push(`${joint}: КРИТИЧЕСКАЯ нагрузка (${data.totalLoad}). Исключите упражнения на этот сустав`);
    }

    const recovery = JOINT_RECOVERY_MAP[joint as JointName] || 24;
    if (recovery > maxRecovery) maxRecovery = recovery;
  }

  if (userRiskProfile) {
    for (const [joint, level] of Object.entries(userRiskProfile)) {
      if (level === 'high' || level === 'severe') {
        const jointData = perJoint[joint];
        if (jointData && jointData.totalLoad > 0) {
          warnings.push(`${joint}: проблемный сустав с нагрузкой ${jointData.totalLoad}. Рекомендуется замена`);
        }
      }
    }
  }

  const recoveryHoursNeeded = maxRecovery;

  return {
    perJoint: jointRiskMap as Record<JointName, SessionJointStress['perJoint'][JointName]>,
    highestRiskJoint,
    warnings,
    recoveryHoursNeeded,
  };
}

export function calculateWeeklyJointStress(sessions: ExerciseSlot[][]): WeeklyJointStress {
  const weeklyAccum: Record<string, { weeklyLoad: number; sessionCount: number; loadHistory: number[] }> = {};

  for (const session of sessions) {
    const sessionStress = calculateSessionJointStress(session);
    for (const [joint, data] of Object.entries(sessionStress.perJoint)) {
      if (!weeklyAccum[joint]) {
        weeklyAccum[joint] = { weeklyLoad: 0, sessionCount: 0, loadHistory: [] };
      }
      weeklyAccum[joint].weeklyLoad += data.totalLoad;
      weeklyAccum[joint].sessionCount++;
      weeklyAccum[joint].loadHistory.push(data.totalLoad);
    }
  }

  const perJoint: WeeklyJointStress['perJoint'] = {} as any;
  const criticalJoints: JointName[] = [];
  const recommendations: string[] = [];

  for (const [joint, data] of Object.entries(weeklyAccum)) {
    const thresholds = JOINT_THRESHOLDS[joint as JointName];
    let risk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (thresholds) {
      if (data.weeklyLoad >= thresholds.high * 3) risk = 'critical';
      else if (data.weeklyLoad >= thresholds.medium * 3) risk = 'high';
      else if (data.weeklyLoad >= thresholds.low * 3) risk = 'medium';
    }

    const loadHistory = data.loadHistory;
    let trend: 'stable' | 'increasing' | 'decreasing' = 'stable';
    if (loadHistory.length >= 3) {
      const firstHalf = loadHistory.slice(0, Math.floor(loadHistory.length / 2)).reduce((a, b) => a + b, 0);
      const secondHalf = loadHistory.slice(Math.floor(loadHistory.length / 2)).reduce((a, b) => a + b, 0);
      if (secondHalf > firstHalf * 1.3) trend = 'increasing';
      else if (secondHalf < firstHalf * 0.7) trend = 'decreasing';
    }

    perJoint[joint as JointName] = { weeklyLoad: data.weeklyLoad, sessionCount: data.sessionCount, trend, risk };

    if (risk === 'critical') {
      criticalJoints.push(joint as JointName);
      recommendations.push(`${joint}: критическая недельная нагрузка (${data.weeklyLoad}). Требуется неделя отдыха`);
    } else if (risk === 'high' && trend === 'increasing') {
      recommendations.push(`${joint}: высокая нагрузка с восходящим трендом. Снизьте объём на 20%`);
    }
  }

  return {
    sessions: [],
    perJoint,
    criticalJoints,
    recommendations,
  };
}
