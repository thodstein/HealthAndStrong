import type { FatigueDomain } from './fatigue.engine';

export interface RecoveryDomainCurve {
  domain: FatigueDomain;
  recoveryPct: number;
  hoursToFull: number;
  hoursElapsed: number;
  supercompensationStart: number;
  supercompensationEnd: number;
  quality: 'optimal' | 'good' | 'delayed' | 'poor';
}

export interface RecoveryProfile {
  overall: number;
  domains: RecoveryDomainCurve[];
  hoursToFullRecovery: number;
  supercompensationWindow: { startHour: number; endHour: number } | null;
  trainingReadiness: 'ready' | 'mostly_ready' | 'partial' | 'not_ready';
  recommendations: string[];
}

const DOMAIN_RECOVERY: Record<FatigueDomain, {
  baseHours: number;
  qualityMod: { optimal: number; good: number; delayed: number; poor: number };
}> = {
  cns: { baseHours: 48, qualityMod: { optimal: 0.7, good: 1.0, delayed: 1.3, poor: 1.8 } },
  muscular: { baseHours: 72, qualityMod: { optimal: 0.7, good: 1.0, delayed: 1.3, poor: 1.8 } },
  metabolic: { baseHours: 24, qualityMod: { optimal: 0.6, good: 1.0, delayed: 1.4, poor: 2.0 } },
  connective: { baseHours: 96, qualityMod: { optimal: 0.7, good: 1.0, delayed: 1.3, poor: 1.8 } },
};

export function calculateRecoveryCurve(
  domain: FatigueDomain,
  currentFatigue: number,
  hoursElapsed: number,
  sleepQuality: number,
  nutritionQuality: number,
  stressLevel: number
): RecoveryDomainCurve {
  const config = DOMAIN_RECOVERY[domain];

  const qualityFactors = [sleepQuality / 10, nutritionQuality / 10, 1 - stressLevel / 10];
  const avgFactor = qualityFactors.reduce((s, f) => s + f, 0) / qualityFactors.length;

  let quality: 'optimal' | 'good' | 'delayed' | 'poor';
  if (avgFactor >= 0.85) quality = 'optimal';
  else if (avgFactor >= 0.65) quality = 'good';
  else if (avgFactor >= 0.45) quality = 'delayed';
  else quality = 'poor';

  const effectiveHoursNeeded = config.baseHours * config.qualityMod[quality];
  const fatigueRatio = currentFatigue / 100;
  const hoursToFull = Math.round(effectiveHoursNeeded * fatigueRatio);
  const recoveryPct = hoursElapsed >= hoursToFull
    ? 100
    : Math.round((hoursElapsed / hoursToFull) * 100);

  const supercompensationStart = hoursToFull;
  const supercompensationEnd = hoursToFull + Math.round(effectiveHoursNeeded * 0.3);

  return {
    domain,
    recoveryPct: Math.min(100, recoveryPct),
    hoursToFull: Math.max(0, hoursToFull - hoursElapsed),
    hoursElapsed,
    supercompensationStart,
    supercompensationEnd,
    quality,
  };
}

export function calculateRecoveryProfile(
  domainFatigue: { domain: FatigueDomain; current: number }[],
  hoursSinceLastSession: number,
  sleepQuality: number,
  nutritionQuality: number,
  stressLevel: number
): RecoveryProfile {
  const domains: RecoveryDomainCurve[] = domainFatigue.map(df =>
    calculateRecoveryCurve(df.domain, df.current, hoursSinceLastSession, sleepQuality, nutritionQuality, stressLevel)
  );

  const overall = Math.round(
    domains.reduce((s, d) => s + d.recoveryPct, 0) / domains.length
  );

  const hoursToFullRecovery = Math.max(...domains.map(d => d.hoursToFull));

  const maxSuperComp = domains.reduce((best, d) => {
    if (d.recoveryPct >= 100 && d.supercompensationStart <= hoursSinceLastSession) return best;
    const windowStart = d.supercompensationStart;
    const windowEnd = d.supercompensationEnd;
    if (hoursSinceLastSession >= windowStart && hoursSinceLastSession <= windowEnd) return best;
    return { startHour: windowStart, endHour: windowEnd };
  }, { startHour: 0, endHour: 0 });

  const supercompensationWindow = maxSuperComp.startHour > 0
    ? maxSuperComp
    : domains.some(d => d.recoveryPct < 100)
    ? null
    : { startHour: hoursSinceLastSession, endHour: hoursSinceLastSession + 12 };

  let trainingReadiness: RecoveryProfile['trainingReadiness'];
  if (overall >= 90 && domains.every(d => d.recoveryPct >= 85)) trainingReadiness = 'ready';
  else if (overall >= 70) trainingReadiness = 'mostly_ready';
  else if (overall >= 40) trainingReadiness = 'partial';
  else trainingReadiness = 'not_ready';

  const recommendations: string[] = [];
  if (trainingReadiness === 'not_ready') {
    recommendations.push('Восстановление < 40% — пропустите тренировку');
  } else if (trainingReadiness === 'partial') {
    const slowest = domains.reduce((a, b) => a.recoveryPct < b.recoveryPct ? a : b);
    recommendations.push(`${slowest.domain} отстаёт (${slowest.recoveryPct}%). Ещё ${slowest.hoursToFull}ч до полного`);
  }

  if (supercompensationWindow && trainingReadiness !== 'not_ready') {
    recommendations.push(`Окно суперкомпенсации: ${supercompensationWindow.startHour}-${supercompensationWindow.endHour}ч`);
  }

  return { overall, domains, hoursToFullRecovery, supercompensationWindow, trainingReadiness, recommendations };
}
