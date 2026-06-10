import type { ExerciseSlot, Exercise } from '../core/types';

export type FatigueDomain = 'cns' | 'muscular' | 'metabolic' | 'connective';

export interface FatigueDomainScore {
  domain: FatigueDomain;
  current: number;
  baseline: number;
  decayRateHours: number;
  hoursToBaseline: number;
}

export interface SessionFatigue {
  totalRPE: number;
  sRPE: number;
  domainLoad: Record<FatigueDomain, number>;
  cnsDemand: number;
  muscularDamage: number;
  metabolicStress: number;
  jointImpact: number;
}

export interface CumulativeFatigue {
  overall: number;
  domains: FatigueDomainScore[];
  acuteLoad: number;
  chronicLoad: number;
  acwr: number;
  acwrRisk: 'low' | 'medium' | 'high' | 'critical';
  trend: 'increasing' | 'stable' | 'decreasing';
  recommendation: string;
}

const DOMAIN_DECAY: Record<FatigueDomain, { decayHours: number; baselineHours: number }> = {
  cns: { decayHours: 24, baselineHours: 48 },
  muscular: { decayHours: 36, baselineHours: 72 },
  metabolic: { decayHours: 12, baselineHours: 24 },
  connective: { decayHours: 48, baselineHours: 96 },
};

const EXERCISE_DOMAIN_LOAD: Record<string, Partial<Record<FatigueDomain, number>>> = {
  squat: { cns: 8, muscular: 8, metabolic: 6, connective: 6 },
  front_squat: { cns: 7, muscular: 8, metabolic: 6, connective: 5 },
  deadlift: { cns: 10, muscular: 9, metabolic: 7, connective: 8 },
  sumo_dl: { cns: 8, muscular: 8, metabolic: 6, connective: 7 },
  rdl: { cns: 5, muscular: 7, metabolic: 5, connective: 5 },
  bench_bar: { cns: 5, muscular: 6, metabolic: 4, connective: 5 },
  bench_db: { cns: 4, muscular: 5, metabolic: 4, connective: 3 },
  incline_bar: { cns: 5, muscular: 6, metabolic: 4, connective: 5 },
  ohp: { cns: 6, muscular: 6, metabolic: 5, connective: 6 },
  pullup: { cns: 4, muscular: 6, metabolic: 5, connective: 4 },
  row_bar: { cns: 4, muscular: 6, metabolic: 4, connective: 4 },
  leg_press: { cns: 3, muscular: 7, metabolic: 5, connective: 4 },
  dips_chest: { cns: 5, muscular: 6, metabolic: 5, connective: 7 },
  hip_thrust: { cns: 3, muscular: 6, metabolic: 4, connective: 3 },
  lateral_raise: { cns: 2, muscular: 3, metabolic: 2, connective: 2 },
  curl_bar: { cns: 2, muscular: 3, metabolic: 2, connective: 2 },
  tricep_push: { cns: 2, muscular: 3, metabolic: 2, connective: 3 },
  face_pull: { cns: 2, muscular: 3, metabolic: 2, connective: 2 },
  plank: { cns: 1, muscular: 3, metabolic: 2, connective: 1 },
};

export function calculateSessionFatigue(
  exercises: { exerciseId: string; sets: number; reps: number; weight?: number }[],
  sessionDurationMin: number,
  sessionRPE: number
): SessionFatigue {
  const domainLoad: Record<FatigueDomain, number> = { cns: 0, muscular: 0, metabolic: 0, connective: 0 };

  for (const ex of exercises) {
    const loads = EXERCISE_DOMAIN_LOAD[ex.exerciseId] || { cns: 3, muscular: 4, metabolic: 3, connective: 3 };
    const volumeFactor = (ex.sets * ex.reps) / 20;
    const intensityFactor = ex.weight ? ex.weight / 100 : 1;

    for (const domain of Object.keys(loads) as FatigueDomain[]) {
      domainLoad[domain] += (loads[domain] || 3) * volumeFactor * intensityFactor;
    }
  }

  const durationMod = sessionDurationMin / 60;
  const rpeMod = sessionRPE / 10;

  const totalRPE = sessionRPE;
  const sRPE = sessionRPE * sessionDurationMin;

  for (const domain of Object.keys(domainLoad) as FatigueDomain[]) {
    domainLoad[domain] = Math.round(domainLoad[domain] * durationMod * rpeMod);
  }

  return {
    totalRPE,
    sRPE,
    domainLoad,
    cnsDemand: domainLoad.cns,
    muscularDamage: domainLoad.muscular,
    metabolicStress: domainLoad.metabolic,
    jointImpact: domainLoad.connective,
  };
}

export function calculateCumulativeFatigue(
  sessionHistory: SessionFatigue[],
  hoursSinceLastSession: number
): CumulativeFatigue {
  const now = Date.now();
  const domainAccum: Record<FatigueDomain, { current: number; baseline: number; decayRateHours: number }> = {
    cns: { current: 0, baseline: 0, decayRateHours: DOMAIN_DECAY.cns.decayHours },
    muscular: { current: 0, baseline: 0, decayRateHours: DOMAIN_DECAY.muscular.decayHours },
    metabolic: { current: 0, baseline: 0, decayRateHours: DOMAIN_DECAY.metabolic.decayHours },
    connective: { current: 0, baseline: 0, decayRateHours: DOMAIN_DECAY.connective.decayHours },
  };

  const recentSessions = sessionHistory.slice(-10);
  const acuteSessions = sessionHistory.slice(-7);
  const chronicSessions = sessionHistory;

  for (const domain of ['cns', 'muscular', 'metabolic', 'connective'] as FatigueDomain[]) {
    for (const session of chronicSessions) {
      const load = session.domainLoad[domain] || 0;
      domainAccum[domain].baseline += load;
    }
    domainAccum[domain].baseline = chronicSessions.length > 0
      ? domainAccum[domain].baseline / chronicSessions.length
      : 10;

    for (const session of recentSessions) {
      const load = session.domainLoad[domain] || 0;
      const decayFactor = Math.exp(-hoursSinceLastSession / DOMAIN_DECAY[domain].decayHours);
      domainAccum[domain].current = domainAccum[domain].current * decayFactor + load;
    }
  }

  const acuteLoad = acuteSessions.reduce((sum, s) => sum + s.sRPE, 0);
  const chronicLoad = chronicSessions.length > 0
    ? chronicSessions.slice(-28).reduce((sum, s) => sum + s.sRPE, 0) / Math.min(28, chronicSessions.length)
    : 100;
  const acwr = chronicLoad > 0 ? acuteLoad / chronicLoad : 1;

  let acwrRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (acwr > 1.5) acwrRisk = 'critical';
  else if (acwr > 1.3) acwrRisk = 'high';
  else if (acwr > 0.8) acwrRisk = 'medium';

  const trend = sessionHistory.length >= 3
    ? (() => {
        const recent = sessionHistory.slice(-3).reduce((s, f) => s + f.sRPE, 0) / 3;
        const older = sessionHistory.slice(-6, -3).reduce((s, f) => s + f.sRPE, 0) / 3;
        if (recent > older * 1.15) return 'increasing';
        if (recent < older * 0.85) return 'decreasing';
        return 'stable';
      })()
    : 'stable';

  const avgCurrent = Object.values(domainAccum).reduce((s, d) => s + d.current, 0) / 4;
  const overall = Math.min(100, Math.max(0, Math.round(avgCurrent)));

  const domains: FatigueDomainScore[] = (Object.keys(domainAccum) as FatigueDomain[]).map(domain => {
    const d = domainAccum[domain];
    const hoursToBaseline = d.current > 0
      ? Math.round(-DOMAIN_DECAY[domain].decayHours * Math.log(1 / d.current))
      : 0;
    return {
      domain,
      current: Math.round(d.current),
      baseline: Math.round(d.baseline),
      decayRateHours: d.decayRateHours,
      hoursToBaseline: Math.max(0, hoursToBaseline),
    };
  });

  let recommendation = '';
  if (acwrRisk === 'critical') {
    recommendation = 'ACWR > 1.5: критический риск перетренированности. Рекомендуется неделя отдыха';
  } else if (acwrRisk === 'high') {
    recommendation = 'ACWR > 1.3: высокий риск. Снизьте объём на 20-30% в ближайшие дни';
  } else if (overall > 70) {
    recommendation = 'Кумулятивная усталость высокая. Рассмотрите восстановительную неделю';
  } else if (domains.some(d => d.hoursToBaseline > 48)) {
    const high = domains.filter(d => d.hoursToBaseline > 48);
    recommendation = `${high.map(d => d.domain).join(', ')} требуется >48ч восстановления`;
  } else {
    recommendation = 'Уровень усталости в норме';
  }

  return { overall, domains, acuteLoad, chronicLoad: Math.round(chronicLoad), acwr: Math.round(acwr * 100) / 100, acwrRisk, trend, recommendation };
}
