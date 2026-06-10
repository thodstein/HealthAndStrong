import type { CumulativeLoadAnalysis, LoadTrend } from './cumulative-load.engine';

export type RiskCategory = 'joint' | 'fatigue' | 'overtraining' | 'technique' | 'recovery' | 'intensity' | 'volume';

export interface RiskPoint {
  date: string;
  category: RiskCategory;
  score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  contributingFactors: string[];
  source: string;
}

export interface RiskTrendAnalysis {
  overall: number;
  currentRisk: number;
  riskByCategory: Record<RiskCategory, { current: number; trend: LoadTrend; average: number; peak: number }>;
  trend: LoadTrend;
  earlyWarnings: { category: RiskCategory; message: string; severity: string; daysToCritical: number }[];
  chronicRisks: RiskCategory[];
  correlationMatrix: { categoryA: RiskCategory; categoryB: RiskCategory; correlation: number }[];
  recommendations: string[];
}

const RISK_THRESHOLDS: Record<RiskCategory, { low: number; medium: number; high: number }> = {
  joint: { low: 20, medium: 40, high: 60 },
  fatigue: { low: 25, medium: 45, high: 65 },
  overtraining: { low: 15, medium: 35, high: 55 },
  technique: { low: 10, medium: 25, high: 40 },
  recovery: { low: 20, medium: 40, high: 60 },
  intensity: { low: 20, medium: 40, high: 60 },
  volume: { low: 20, medium: 40, high: 60 },
};

export function analyzeRiskTrends(
  riskHistory: RiskPoint[],
  loadAnalysis: CumulativeLoadAnalysis,
  recoveryTrend: number[],
  fatigueCurrent: number
): RiskTrendAnalysis {
  const riskByCategory: Record<RiskCategory, { current: number; trend: LoadTrend; average: number; peak: number; values: number[] }> = {
    joint: { current: 0, trend: { slope: 0, direction: 'stable', volatility: 0, acceleration: 0 }, average: 0, peak: 0, values: [] },
    fatigue: { current: 0, trend: { slope: 0, direction: 'stable', volatility: 0, acceleration: 0 }, average: 0, peak: 0, values: [] },
    overtraining: { current: 0, trend: { slope: 0, direction: 'stable', volatility: 0, acceleration: 0 }, average: 0, peak: 0, values: [] },
    technique: { current: 0, trend: { slope: 0, direction: 'stable', volatility: 0, acceleration: 0 }, average: 0, peak: 0, values: [] },
    recovery: { current: 0, trend: { slope: 0, direction: 'stable', volatility: 0, acceleration: 0 }, average: 0, peak: 0, values: [] },
    intensity: { current: 0, trend: { slope: 0, direction: 'stable', volatility: 0, acceleration: 0 }, average: 0, peak: 0, values: [] },
    volume: { current: 0, trend: { slope: 0, direction: 'stable', volatility: 0, acceleration: 0 }, average: 0, peak: 0, values: [] },
  };

  const sorted = [...riskHistory].sort((a, b) => a.date.localeCompare(b.date));

  for (const point of sorted) {
    const cat = riskByCategory[point.category];
    if (cat) {
      cat.values.push(point.score);
      if (point.score > cat.peak) cat.peak = point.score;
    }
  }

  const earlyWarnings: RiskTrendAnalysis['earlyWarnings'] = [];
  const chronicRisks: RiskCategory[] = [];
  const recommendations: string[] = [];
  const correlations: { categoryA: RiskCategory; categoryB: RiskCategory; correlation: number }[] = [];

  for (const [cat, data] of Object.entries(riskByCategory)) {
    const category = cat as RiskCategory;
    const values = data.values;
    data.average = values.length > 0 ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : 0;
    data.current = values.length > 0 ? values[values.length - 1] : 0;

    if (values.length >= 3) {
      const n = values.length;
      const indices = values.map((_, i) => i);
      const meanX = indices.reduce((s, x) => s + x, 0) / n;
      const meanY = values.reduce((s, y) => s + y, 0) / n;
      const num = indices.reduce((s, x, i) => s + (x - meanX) * (values[i] - meanY), 0);
      const den = indices.reduce((s, x) => s + (x - meanX) ** 2, 0);
      const slope = den > 0 ? num / den : 0;
      const volatility = Math.sqrt(values.reduce((s, v) => s + (v - meanY) ** 2, 0) / n) / (meanY || 1);

      data.trend = {
        slope: Math.round(slope * 100) / 100,
        direction: Math.abs(slope) < data.average * 0.05 ? 'stable' : slope > 0 ? 'increasing' : 'decreasing',
        volatility: Math.round(volatility * 100) / 100,
        acceleration: 0,
      };
    }

    if (data.trend.direction === 'increasing') {
      const thresholds = RISK_THRESHOLDS[category];
      let severity = 'low';
      if (data.current >= thresholds.high) severity = 'critical';
      else if (data.current >= thresholds.medium) severity = 'high';

      const slopePerDay = data.trend.slope;
      const daysToCritical = slopePerDay > 0
        ? Math.max(0, Math.ceil((thresholds.high - data.current) / (slopePerDay * 30)))
        : 999;

      if (data.trend.slope > 0) {
        earlyWarnings.push({
          category,
          message: `${category} риск растёт (${data.current})`,
          severity,
          daysToCritical,
        });
      }
    }

    if (data.current >= RISK_THRESHOLDS[category].high) {
      chronicRisks.push(category);
    }
  }

  const cats = Object.keys(riskByCategory) as RiskCategory[];
  for (let i = 0; i < cats.length; i++) {
    for (let j = i + 1; j < cats.length; j++) {
      const ca = riskByCategory[cats[i]].values;
      const cb = riskByCategory[cats[j]].values;
      if (ca.length >= 5 && cb.length >= 5) {
        const minLen = Math.min(ca.length, cb.length);
        const aSlice = ca.slice(-minLen);
        const bSlice = cb.slice(-minLen);
        const meanA = aSlice.reduce((s, v) => s + v, 0) / minLen;
        const meanB = bSlice.reduce((s, v) => s + v, 0) / minLen;
        const numC = aSlice.reduce((s, v, i) => s + (v - meanA) * (bSlice[i] - meanB), 0);
        const denA = Math.sqrt(aSlice.reduce((s, v) => s + (v - meanA) ** 2, 0));
        const denB = Math.sqrt(bSlice.reduce((s, v) => s + (bSlice[i] - meanB) ** 2, 0));
        const corr = denA > 0 && denB > 0 ? numC / (denA * denB) : 0;
        if (Math.abs(corr) > 0.5) {
          correlations.push({ categoryA: cats[i], categoryB: cats[j], correlation: Math.round(corr * 100) / 100 });
        }
      }
    }
  }

  const sortedCatValues = Object.values(riskByCategory).map(d => d.current);
  const overall = sortedCatValues.length > 0
    ? Math.round(sortedCatValues.reduce((s, v) => s + v, 0) / sortedCatValues.length)
    : 0;
  const currentRisk = sortedCatValues.length > 0 ? Math.max(...sortedCatValues) : 0;

  const trendValues = Object.values(riskByCategory).map(d => d.trend.slope);
  const avgSlope = trendValues.length > 0 ? trendValues.reduce((s, v) => s + v, 0) / trendValues.length : 0;
  const overallTrend: LoadTrend = {
    slope: Math.round(avgSlope * 100) / 100,
    direction: Math.abs(avgSlope) < 0.5 ? 'stable' : avgSlope > 0 ? 'increasing' : 'decreasing',
    volatility: 0,
    acceleration: 0,
  };

  if (chronicRisks.length > 0) {
    recommendations.push(`Хронические риски: ${chronicRisks.join(', ')}. Требуется коррекция программы`);
  }
  if (earlyWarnings.some(e => e.severity === 'critical')) {
    recommendations.push('Критические предупреждения — необходима неделя отдыха');
  }
  if (correlations.length > 0) {
    for (const c of correlations) {
      recommendations.push(`Корреляция ${c.categoryA}-${c.categoryB}: ${c.correlation > 0 ? 'положительная' : 'отрицательная'} (${c.correlation})`);
    }
  }
  if (loadAnalysis.volumeTrend.direction === 'increasing' && riskByCategory.overtraining.current > 40) {
    recommendations.push('Рост объёма + риск перетренированности — запланируйте разгрузку');
  }
  if (recoveryTrend.length >= 3) {
    const avgRecovery = recoveryTrend.slice(-3).reduce((s, v) => s + v, 0) / 3;
    if (avgRecovery < 40) {
      recommendations.push('Низкое восстановление (< 40%) в последних 3 сессиях');
    }
  }

  const result: RiskTrendAnalysis = {
    overall,
    currentRisk,
    riskByCategory: {} as any,
    trend: overallTrend,
    earlyWarnings,
    chronicRisks,
    correlationMatrix: correlations,
    recommendations,
  };

  for (const [cat, data] of Object.entries(riskByCategory)) {
    result.riskByCategory[cat as RiskCategory] = {
      current: data.current,
      trend: data.trend,
      average: data.average,
      peak: data.peak,
    };
  }

  return result;
}
