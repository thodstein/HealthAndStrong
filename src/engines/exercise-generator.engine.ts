import type { ExerciseSlot, ExerciseSlotRole, MovementPattern } from '../core/types';
import { getRequiredPatterns, getBlockedPatterns } from './exercise-pattern.engine';
import { selectVariation } from './exercise-variation.engine';
import { findSubstitute, scoreEquipmentMatch } from './exercise-substitution.engine';
import { analyzeSessionSynergy } from './muscle-synergy.engine';
import { calculateSessionJointStress } from './joint-stress.engine';
import { evaluateExerciseSafety, getSafetyRecommendations } from './exercise-safety.engine';
import type { SynergyAnalysisResult } from './muscle-synergy.engine';
import type { SessionJointStress } from './joint-stress.engine';
import type { SafetyResult } from './exercise-safety.engine';

export interface ExerciseGeneratorInput {
  sessionFocus: string;
  goal: string;
  equipmentAvailable: string[];
  weakPoints: string[];
  techniqueIssues: string[];
  riskFlags: Record<string, string>;
  injuries: { joint?: string; severity?: string }[];
  jointLimitations: Record<string, string>;
  userLevel: string;
}

export interface ExerciseGeneratorOutput {
  exerciseSlots: ExerciseSlot[];
  substitutions: { original: string; substitute: string; reason: string }[];
  warnings: string[];
  synergy?: SynergyAnalysisResult;
  jointStress?: SessionJointStress;
  safety?: SafetyResult[];
}

export function generateExercises(input: ExerciseGeneratorInput): ExerciseGeneratorOutput {
  const blockedPatterns = getBlockedPatterns(input.injuries, input.jointLimitations);
  const requiredPatterns = getRequiredPatterns(input.sessionFocus, input.goal, input.weakPoints, blockedPatterns);
  const slots: ExerciseSlot[] = [];
  const substitutions: { original: string; substitute: string; reason: string }[] = [];
  const warnings: string[] = [];

  if (blockedPatterns.length > 0) {
    warnings.push(`Исключены паттерны: ${blockedPatterns.join(', ')}`);
  }

  for (const req of requiredPatterns) {
    const variation = selectVariation(
      req.pattern,
      input.weakPoints,
      input.equipmentAvailable,
      input.riskFlags,
      input.techniqueIssues
    );

    const equipScore = scoreEquipmentMatch(
      getDefaultEquipment(req.pattern),
      input.equipmentAvailable
    );

    if (equipScore < 50) {
      const sub = findSubstitute(
        variation.exerciseId,
        req.pattern,
        input.equipmentAvailable,
        getDefaultEquipment(req.pattern)
      );
      if (sub) {
        substitutions.push({ original: variation.exerciseId, substitute: sub.substituteExerciseId, reason: sub.reason });
        slots.push({
          slotType: req.role,
          exerciseId: sub.substituteExerciseId,
          pattern: req.pattern,
          equipment: input.equipmentAvailable,
          riskScore: variation.riskModifier,
          techniqueMatchScore: variation.techniqueModifier,
          targetWeakPoint: variation.targetWeakPoint,
        });
        continue;
      }
    }

    if (variation.score < 30) {
      warnings.push(`Не удалось подобрать вариацию для ${req.pattern}`);
    }

    slots.push({
      slotType: req.role,
      exerciseId: variation.exerciseId,
      variationId: variation.variationTags[0],
      pattern: req.pattern,
      equipment: input.equipmentAvailable,
      riskScore: variation.riskModifier,
      techniqueMatchScore: variation.techniqueModifier,
      targetWeakPoint: variation.targetWeakPoint,
    });
  }

  const synergy = analyzeSessionSynergy(slots);
  if (synergy.warnings.length > 0) {
    synergy.warnings.forEach(w => warnings.push(`[Синергия] ${w}`));
  }

  const jointStress = calculateSessionJointStress(slots, input.riskFlags);
  if (jointStress.warnings.length > 0) {
    jointStress.warnings.forEach(w => warnings.push(`[Суставы] ${w}`));
  }

  const injuriesTyped = input.injuries.map(i => ({
    id: 'auto',
    type: 'joint' as const,
    location: i.joint || 'unknown',
    painLevel: i.severity === 'severe' ? 8 : i.severity === 'moderate' ? 5 : 2,
    movementLimit: (i.severity === 'severe' ? 'severe' : i.severity === 'moderate' ? 'moderate' : 'none') as any,
    side: 'both' as const,
    chronic: false,
  }));

  const safety = getSafetyRecommendations(slots, input.userLevel, injuriesTyped);
  for (const s of safety) {
    if (!s.safeToPerform) {
      warnings.push(`[Безопасность] ${s.warnings[0] || 'Упражнение не рекомендуется'}`);
      s.recommendations.forEach(r => warnings.push(`[Рекомендация] ${r}`));
    }
  }

  return { exerciseSlots: slots, substitutions, warnings, synergy, jointStress, safety };
}

function getDefaultEquipment(pattern: MovementPattern): string[] {
  const map: Record<string, string[]> = {
    squat: ['barbell', 'rack'],
    hinge: ['barbell'],
    horizontal_push: ['barbell', 'bench'],
    horizontal_pull: ['barbell'],
    vertical_push: ['barbell'],
    vertical_pull: ['bodyweight'],
    lunge: ['dumbbell'],
    carry: ['dumbbell'],
    rotation: ['cable'],
    anti_rotation: ['bodyweight'],
    core: ['bodyweight'],
  };
  return map[pattern] || ['bodyweight'];
}
