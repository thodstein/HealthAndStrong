import type { FatigueDomain } from './fatigue.engine';

export interface LoadSession {
  date: string;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  avgIntensity: number;
  durationMin: number;
  exerciseCount: number;
  compoundRatio: number;
  domainLoad: Record<FatigueDomain, number>;
  sessionRPE: number;
}

export interface LoadTrend {
  slope: number;
  direction: 'increasing' | 'stable' | 'decreasing' | 'volatile';
  volatility: number;
  acceleration: number;
}

export interface LoadByPeriod {
  weekly: { week: number; volume: number; intensity: number; frequency: number; density: number }[];
  monthly: { month: number; volume: number; intensity: number; frequency: number; density: number }[];
  totalWeeks: number;
}

export interface CumulativeLoadAnalysis {
  totalSessions: number;
  totalVolume: number;
  avgWeeklyVolume: number;
  avgSessionVolume: number;
  avgIntensity: number;
  volumeTrend: LoadTrend;
  intensityTrend: LoadTrend;
  frequencyTrend: LoadTrend;
  loadByPeriod: LoadByPeriod;
  peakVolume: number;
  peakIntensity: number;
  loadToRecoveryRatio: number;
  warnings: string[];
  recommendations: string[];
}

export function analyzeCumulativeLoad(sessions: LoadSession[]): CumulativeLoadAnalysis {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (sessions.length === 0) {
    return {
      totalSessions: 0, totalVolume: 0, avgWeeklyVolume: 0, avgSessionVolume: 0, avgIntensity: 0,
      volumeTrend: { slope: 0, direction: 'stable', volatility: 0, acceleration: 0 },
      intensityTrend: { slope: 0, direction: 'stable', volatility: 0, acceleration: 0 },
      frequencyTrend: { slope: 0, direction: 'stable', volatility: 0, acceleration: 0 },
      loadByPeriod: { weekly: [], monthly: [], totalWeeks: 0 },
      peakVolume: 0, peakIntensity: 0, loadToRecoveryRatio: 0,
      warnings: [], recommendations: ['Нет данных тренировок для анализа'],
    };
  }

  const totalVolume = sessions.reduce((s, se) => s + se.totalVolume, 0);
  const totalSets = sessions.reduce((s, se) => s + se.totalSets, 0);
  const avgIntensity = sessions.reduce((s, se) => s + se.avgIntensity, 0) / sessions.length;
  const avgSessionVolume = totalVolume / sessions.length;

  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const dateRange = sorted.length >= 2
    ? (new Date(sorted[sorted.length - 1].date).getTime() - new Date(sorted[0].date).getTime()) / (1000 * 60 * 60 * 24 * 7)
    : 1;
  const totalWeeks = Math.max(1, Math.round(dateRange));
  const avgWeeklyVolume = totalVolume / totalWeeks;
  const avgFrequency = sessions.length / totalWeeks;

  const volumes = sorted.map(s => s.totalVolume);
  const intensities = sorted.map(s => s.avgIntensity);
  const freqs = buildWeeklyFreq(sorted);

  const volumeTrend = calcTrend(volumes);
  const intensityTrend = calcTrend(intensities);
  const frequencyTrend = calcTrend(freqs.map(f => f.count));

  const weekly = buildWeeklyBuckets(sorted);
  const monthly = buildMonthlyBuckets(sorted);

  const peakVolume = Math.max(...volumes, 0);
  const peakIntensity = Math.max(...intensities, 0);

  const avgDomainLoad: Record<string, number> = {};
  for (const session of sessions) {
    for (const [domain, load] of Object.entries(session.domainLoad)) {
      avgDomainLoad[domain] = (avgDomainLoad[domain] || 0) + load;
    }
  }
  for (const domain of Object.keys(avgDomainLoad)) {
    avgDomainLoad[domain] = avgDomainLoad[domain] / sessions.length;
  }

  const totalLoad = Object.values(avgDomainLoad).reduce((s, v) => s + v, 0);
  const loadToRecoveryRatio = totalWeeks > 0
    ? Math.round((totalLoad / totalWeeks) * 100) / 100
    : 0;

  if (volumeTrend.direction === 'increasing' && volumeTrend.acceleration > 0.3) {
    warnings.push('Объём растёт с ускорением — риск перетренированности');
    recommendations.push('Снизьте темп прогрессии объёма на 20%');
  }
  if (avgWeeklyVolume > 100) {
    warnings.push(`Высокая недельная нагрузка: ${Math.round(avgWeeklyVolume)}`);
    recommendations.push('Рассмотрите неделю разгрузки через 3-4 недели');
  }
  if (intensityTrend.direction === 'increasing' && volumeTrend.direction === 'increasing') {
    warnings.push('Одновременный рост объёма и интенсивности — конфликт адаптации');
    recommendations.push('Чередуйте тяжёлые и лёгкие недели');
  }
  if (avgFrequency < 2) {
    recommendations.push('Частота тренировок < 2/нед — рассмотрите увеличение до 3-4');
  }
  if (volumeTrend.volatility > 0.4) {
    warnings.push('Высокая волатильность объёма — нарушение последовательности нагрузки');
    recommendations.push('Стабилизируйте недельный объём (разброс < 30%)');
  }

  return {
    totalSessions: sessions.length,
    totalVolume,
    avgWeeklyVolume: Math.round(avgWeeklyVolume),
    avgSessionVolume: Math.round(avgSessionVolume),
    avgIntensity: Math.round(avgIntensity * 100) / 100,
    volumeTrend, intensityTrend, frequencyTrend,
    loadByPeriod: { weekly, monthly, totalWeeks },
    peakVolume, peakIntensity,
    loadToRecoveryRatio,
    warnings, recommendations,
  };
}

function calcTrend(values: number[]): LoadTrend {
  if (values.length < 3) {
    return { slope: 0, direction: 'stable', volatility: 0, acceleration: 0 };
  }

  const n = values.length;
  const indices = values.map((_, i) => i);
  const meanX = indices.reduce((s, x) => s + x, 0) / n;
  const meanY = values.reduce((s, y) => s + y, 0) / n;
  const num = indices.reduce((s, x, i) => s + (x - meanX) * (values[i] - meanY), 0);
  const den = indices.reduce((s, x) => s + (x - meanX) ** 2, 0);
  const slope = den > 0 ? num / den : 0;

  const mean = values.reduce((s, v) => s + v, 0) / n;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const volatility = Math.sqrt(variance) / (mean || 1);

  const firstHalf = values.slice(0, Math.floor(n / 2)).reduce((s, v) => s + v, 0) / Math.floor(n / 2);
  const secondHalf = values.slice(Math.floor(n / 2)).reduce((s, v) => s + v, 0) / (n - Math.floor(n / 2));
  const acceleration = secondHalf - firstHalf;

  let direction: LoadTrend['direction'] = 'stable';
  if (Math.abs(slope) < mean * 0.05) direction = 'stable';
  else if (slope > 0) direction = 'increasing';
  else direction = 'decreasing';
  if (volatility > 0.5) direction = 'volatile';

  return { slope: Math.round(slope * 100) / 100, direction, volatility: Math.round(volatility * 100) / 100, acceleration: Math.round(acceleration * 100) / 100 };
}

function buildWeeklyFreq(sorted: LoadSession[]): { week: number; count: number }[] {
  if (sorted.length === 0) return [];
  const start = new Date(sorted[0].date);
  const weekMap = new Map<number, number>();
  for (const s of sorted) {
    const weekNum = Math.floor((new Date(s.date).getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
    weekMap.set(weekNum, (weekMap.get(weekNum) || 0) + 1);
  }
  return Array.from(weekMap.entries()).map(([week, count]) => ({ week, count }));
}

function buildWeeklyBuckets(sorted: LoadSession[]): LoadByPeriod['weekly'] {
  if (sorted.length === 0) return [];
  const start = new Date(sorted[0].date);
  const weekMap = new Map<number, { volume: number; intensity: number; frequency: number; density: number; count: number }>();
  for (const s of sorted) {
    const weekNum = Math.floor((new Date(s.date).getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const existing = weekMap.get(weekNum) || { volume: 0, intensity: 0, frequency: 0, density: 0, count: 0 };
    existing.volume += s.totalVolume;
    existing.intensity += s.avgIntensity;
    existing.frequency++;
    existing.density += s.durationMin;
    existing.count++;
    weekMap.set(weekNum, existing);
  }
  return Array.from(weekMap.entries()).map(([week, data]) => ({
    week,
    volume: Math.round(data.volume),
    intensity: Math.round((data.intensity / data.count) * 100) / 100,
    frequency: data.frequency,
    density: Math.round(data.density / data.count),
  }));
}

function buildMonthlyBuckets(sorted: LoadSession[]): LoadByPeriod['monthly'] {
  if (sorted.length === 0) return [];
  const monthMap = new Map<string, { volume: number; intensity: number; frequency: number; density: number; count: number }>();
  for (const s of sorted) {
    const key = s.date.slice(0, 7);
    const existing = monthMap.get(key) || { volume: 0, intensity: 0, frequency: 0, density: 0, count: 0 };
    existing.volume += s.totalVolume;
    existing.intensity += s.avgIntensity;
    existing.frequency++;
    existing.density += s.durationMin;
    existing.count++;
    monthMap.set(key, existing);
  }
  return Array.from(monthMap.entries()).map(([key, data], idx) => ({
    month: idx,
    volume: Math.round(data.volume),
    intensity: Math.round((data.intensity / data.count) * 100) / 100,
    frequency: data.frequency,
    density: Math.round(data.density / data.count),
  }));
}
