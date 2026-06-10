import type { ExerciseSlot } from '../core/types';
import type { ReadinessScores } from '../core/types';
import type { CumulativeLoadAnalysis, LoadSession } from './cumulative-load.engine';
import type { RiskTrendAnalysis, RiskPoint } from './risk-trend.engine';
import type { FatigueDomain, CumulativeFatigue, SessionFatigue } from './fatigue.engine';
import type { RecoveryProfile } from './recovery.engine';
import type { AutoregulationAdjustment } from './autoregulation.engine';
import type { TrainingBalanceResult } from './training-balancer.engine';
import type { SynergyAnalysisResult } from './muscle-synergy.engine';
import type { SessionJointStress } from './joint-stress.engine';
import type { SafetyResult } from './exercise-safety.engine';
import type { LoadDistributionResult } from './load-distribution.engine';
import { analyzeCumulativeLoad } from './cumulative-load.engine';
import { calculateCumulativeFatigue, calculateSessionFatigue } from './fatigue.engine';
import { calculateRecoveryProfile } from './recovery.engine';
import { autoregulate, calculatePRI } from './autoregulation.engine';
import { calculateBalance } from './training-balancer.engine';
import { analyzeSessionSynergy } from './muscle-synergy.engine';
import { calculateSessionJointStress } from './joint-stress.engine';
import { getSafetyRecommendations } from './exercise-safety.engine';
import { distributeLoad } from './load-distribution.engine';
import { analyzeRiskTrends } from './risk-trend.engine';

export interface UnifiedTrainingAnalysis {
  load: CumulativeLoadAnalysis;
  fatigue: CumulativeFatigue;
  recovery: RecoveryProfile | null;
  autoregulation: AutoregulationAdjustment | null;
  balance: TrainingBalanceResult | null;
  synergy: SynergyAnalysisResult | null;
  jointStress: SessionJointStress | null;
  safety: SafetyResult[] | null;
  loadDistribution: LoadDistributionResult | null;
  riskTrends: RiskTrendAnalysis | null;
  overallReadiness: number;
  recommendations: string[];
  criticalFlags: string[];
}

export interface UnifiedAnalysisInput {
  sessionHistory: LoadSession[];
  riskHistory: RiskPoint[];
  currentExercises: { exerciseId: string; sets: number; reps: number; weight?: number; pattern?: string; isPush?: boolean; isPull?: boolean }[];
  currentSlots: ExerciseSlot[];
  readiness: ReadinessScores;
  doms: number;
  sleepQuality: number;
  stress: number;
  hoursSinceLastSession: number;
  recoveryTrend: number[];
  daysPerWeek: number;
  weeklyTotalSets: number;
  weeklyIntensityAvg: number;
  weakPoints: string[];
  goals: string[];
  level: string;
  userLevel: string;
  injuries: { joint?: string; severity?: string }[];
  techniqueIssues: string[];
  jointLimitations: Record<string, string>;
  equipmentAvailable: string[];
}

export function generateUnifiedAnalysis(input: UnifiedAnalysisInput): UnifiedTrainingAnalysis {
  const recommendations: string[] = [];
  const criticalFlags: string[] = [];

  const load = analyzeCumulativeLoad(input.sessionHistory);
  if (load.warnings.length > 0) recommendations.push(...load.warnings);
  if (load.recommendations.length > 0) recommendations.push(...load.recommendations);

  const cumulativeFatigue = calculateCumulativeFatigue(
    input.sessionHistory.map(s => calculateSessionFatigue(
      [],
      s.durationMin,
      s.sessionRPE
    )),
    input.hoursSinceLastSession
  );
  recommendations.push(cumulativeFatigue.recommendation);

  const recovery = input.hoursSinceLastSession > 0
    ? calculateRecoveryProfile(
        cumulativeFatigue.domains.map(d => ({ domain: d.domain, current: d.current })),
        input.hoursSinceLastSession,
        input.sleepQuality,
        input.readiness.nutrition / 100,
        input.stress
      )
    : null;

  if (recovery && recovery.trainingReadiness === 'not_ready') {
    criticalFlags.push('Восстановление: тренировку следует пропустить');
  }

  const autoreg = input.readiness
    ? autoregulate({
        readiness: input.readiness,
        trainingLoadRatio: load.avgWeeklyVolume / 100,
        plannedWeek: {} as any,
        plannedExercises: input.currentExercises.map(e => ({
          exerciseId: e.exerciseId,
          name: e.exerciseId,
          group: 'auto',
          type: 'compound',
          sets: e.sets,
          repsMin: e.reps || 8,
          repsMax: (e.reps || 8) + 2,
          rir: 2,
          isCompound: true,
          isWeakGroup: input.weakPoints.some(wp => e.exerciseId.includes(wp)),
        })),
        goal: input.goals[0] || 'maintenance',
        level: input.level,
        weakPoints: input.weakPoints,
        injuries: input.injuries,
        techniqueIssues: input.techniqueIssues,
        doms: input.doms,
        sleepQuality: input.sleepQuality,
        stress: input.stress,
        cumulativeFatigue,
        recoveryPct: recovery?.overall,
        acwr: cumulativeFatigue.acwr,
      })
    : null;

  if (autoreg?.sessionModifications.skipTraining) {
    criticalFlags.push(`PRI ${autoreg.pri}: рекомендуется пропуск тренировки`);
  }

  const balance = input.currentExercises.length > 0
    ? calculateBalance({
        sessions: [{ exercises: input.currentExercises.map(e => ({
          exerciseId: e.exerciseId,
          pattern: e.pattern || 'core',
          sets: e.sets,
          isPush: e.isPush || false,
          isPull: e.isPull || false,
        })) }],
        weakPoints: input.weakPoints,
        goals: input.goals,
        level: input.level,
      })
    : null;

  if (balance && balance.criticalFlags.length > 0) {
    criticalFlags.push(...balance.criticalFlags.map(f => `Дисбаланс: ${f}`));
  }

  const synergy = input.currentSlots.length > 0
    ? analyzeSessionSynergy(input.currentSlots)
    : null;

  const jointStress = input.currentSlots.length > 0
    ? calculateSessionJointStress(input.currentSlots)
    : null;

  if (jointStress?.warnings.length) {
    recommendations.push(...jointStress.warnings);
  }

  const injuriesTyped = input.injuries.map(i => ({
    id: 'auto', type: 'joint' as const, location: i.joint || 'unknown',
    painLevel: i.severity === 'severe' ? 8 : i.severity === 'moderate' ? 5 : 2,
    movementLimit: (i.severity === 'severe' ? 'severe' : i.severity === 'moderate' ? 'moderate' : 'none') as any,
    side: 'both' as const, chronic: false,
  }));
  const safety = input.currentSlots.length > 0
    ? getSafetyRecommendations(input.currentSlots, input.userLevel, injuriesTyped)
    : null;

  const loadDistribution = distributeLoad({
    daysPerWeek: input.daysPerWeek,
    weeklyTotalSets: input.weeklyTotalSets,
    weeklyIntensityAvg: input.weeklyIntensityAvg,
    exercises: input.currentExercises.map(e => ({
      exerciseId: e.exerciseId, sets: e.sets, priority: 5,
      isMainLift: e.sets >= 4, pattern: (e.pattern || 'core') as any,
    })),
    recoveryCapacity: recovery?.overall || 50,
    fatigueState: cumulativeFatigue.overall,
    weakPoints: input.weakPoints,
  });

  const riskTrends = input.riskHistory.length > 0
    ? analyzeRiskTrends(input.riskHistory, load, input.recoveryTrend, cumulativeFatigue.overall)
    : null;

  const overallReadiness = autoreg?.pri || 50;

  return {
    load, fatigue: cumulativeFatigue, recovery,
    autoregulation: autoreg, balance, synergy, jointStress, safety,
    loadDistribution, riskTrends,
    overallReadiness,
    recommendations: [...new Set(recommendations)],
    criticalFlags: [...new Set(criticalFlags)],
  };
}
