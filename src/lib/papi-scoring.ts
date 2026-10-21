import type { PsychogramData, PapiAspect, JobProfileAspect, AspectPriority } from '../types';

/**
 * Penilaian Fit PAPI yang deterministik (dihitung di kode, bukan oleh AI).
 *
 * Selisih (gap) = jarak skor ke tepi rentang ideal terdekat (0 bila di dalam rentang).
 * Skor DI ATAS rentang dihitung setengah penalti (kelebihan skor biasanya bukan
 * kelemahan, tetapi tetap ditandai), kecuali untuk aspek ber-prioritas "risiko".
 */

export type FitLevel = 1 | 2 | 3 | 4 | 5;
export type Direction = 'within' | 'below' | 'above';
export type DecisionBand = 'disarankan' | 'dipertimbangkan' | 'tidak_disarankan';

export const FIT_LABELS: Record<'id' | 'en', Record<FitLevel, string>> = {
  id: { 1: 'Sangat Sesuai', 2: 'Sesuai', 3: 'Cukup Sesuai', 4: 'Kurang Sesuai', 5: 'Tidak Sesuai' },
  en: { 1: 'Very Suitable', 2: 'Suitable', 3: 'Fairly Suitable', 4: 'Less Suitable', 5: 'Not Suitable' },
};

const PENALTY_PER_GAP = 18;
const MIN_MATCH = 10;
const ABOVE_RANGE_FACTOR = 0.5;
const CLASS_SHARE: Record<AspectPriority, number> = { kritikal: 0.6, pendukung: 0.3, risiko: 0.1 };

export function normalizePriority(value: unknown): AspectPriority | undefined {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (v.startsWith('kritik') || v === 'critical') return 'kritikal';
  if (v.startsWith('pendukung') || v === 'supporting') return 'pendukung';
  if (v.startsWith('risiko') || v === 'risk') return 'risiko';
  return undefined;
}

export function parseScore(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const m = value.match(/-?\d+(?:[.,]\d+)?/);
  return m ? parseFloat(m[0].replace(',', '.')) : null;
}

export function parseRange(value: unknown): [number, number] | null {
  if (typeof value !== 'string') return null;
  const nums = (value.match(/\d+(?:[.,]\d+)?/g) || []).map(n => parseFloat(n.replace(',', '.')));
  if (nums.length === 0) return null;
  if (nums.length === 1) {
    if (/[≥>]|\+|min/i.test(value)) return [nums[0], 9];
    if (/[≤<]|max/i.test(value)) return [1, nums[0]];
    return [nums[0], nums[0]];
  }
  return [Math.min(nums[0], nums[1]), Math.max(nums[0], nums[1])];
}

export function levelFromGap(effGap: number): FitLevel {
  if (effGap <= 0) return 1;
  if (effGap <= 1) return 2;
  if (effGap <= 2) return 3;
  if (effGap <= 3) return 4;
  return 5;
}

export function scoreAspect(score: unknown, ideal: unknown, priority?: AspectPriority) {
  const s = parseScore(score);
  const range = parseRange(ideal);
  if (s === null || !range) return null;
  const [lo, hi] = range;
  let direction: Direction = 'within';
  let gap = 0;
  if (s < lo) { direction = 'below'; gap = lo - s; }
  else if (s > hi) { direction = 'above'; gap = s - hi; }
  const factor = direction === 'above' && priority !== 'risiko' ? ABOVE_RANGE_FACTOR : 1;
  const effGap = gap * factor;
  const match = effGap === 0 ? 100 : Math.max(MIN_MATCH, Math.round(100 - PENALTY_PER_GAP * effGap));
  return { gap, effGap, direction, match, level: levelFromGap(effGap) };
}

/** Bobot per aspek: kritikal 60% / pendukung 30% / risiko 10%; tanpa prioritas = bobot sama. */
export function computeWeights(priorities: (AspectPriority | undefined)[]): number[] {
  const n = priorities.length;
  if (n === 0) return [];
  if (!priorities.some(Boolean)) return priorities.map(() => 1 / n);
  const eff = priorities.map(p => p ?? 'pendukung');
  const present = (Object.keys(CLASS_SHARE) as AspectPriority[]).filter(c => eff.includes(c));
  const total = present.reduce((a, c) => a + CLASS_SHARE[c], 0);
  return eff.map(c => CLASS_SHARE[c] / total / eff.filter(x => x === c).length);
}

export interface PapiSummary {
  weighted_match: number;
  knockouts: string[]; // kode aspek kritikal yang Kurang/Tidak Sesuai
}

export function summarizePapi(papi: PapiAspect[] | undefined): PapiSummary {
  const list = papi || [];
  if (list.length === 0) return { weighted_match: 0, knockouts: [] };
  const usable = list.filter(p => !p.unreadable && typeof p.match_percentage === 'number');
  if (usable.length === 0) return { weighted_match: 0, knockouts: [] };
  const hasWeights = usable.some(p => typeof p.weight === 'number');
  const weights = hasWeights
    ? (() => { const raw = usable.map(p => p.weight ?? 0); const sum = raw.reduce((a, b) => a + b, 0) || 1; return raw.map(w => w / sum); })()
    : usable.map(() => 1 / usable.length);
  const weighted = usable.reduce((acc, p, i) => acc + p.match_percentage * weights[i], 0);
  const knockouts = list.filter(p => p.priority === 'kritikal' && (p.fit_level ?? 0) >= 4).map(p => p.code);
  return { weighted_match: Math.round(weighted), knockouts };
}

export function decisionBand(total: number, knockouts: string[] = []): DecisionBand {
  let band: DecisionBand = total >= 80 ? 'disarankan' : total >= 65 ? 'dipertimbangkan' : 'tidak_disarankan';
  if (knockouts.length > 0 && band === 'disarankan') band = 'dipertimbangkan';
  return band;
}

/**
 * Hitung ulang fit, fit_level, match_percentage, arah, prioritas dan bobot tiap aspek PAPI,
 * lalu ringkasannya. Aspek yang skornya tidak terbaca dibiarkan apa adanya.
 */
export function applyScoring(data: PsychogramData, profileAspects?: JobProfileAspect[]): PsychogramData {
  if (!data?.papi?.length) return data;
  const priorityByCode = new Map<string, AspectPriority | undefined>(
    (profileAspects || []).map(a => [String(a.code).toUpperCase(), normalizePriority(a.priority)])
  );

  const scored = data.papi.map(p => {
    const priority = normalizePriority(p.priority) ?? priorityByCode.get(String(p.code).toUpperCase());
    const idealFromProfile = (profileAspects || []).find(a => String(a.code).toUpperCase() === String(p.code).toUpperCase())?.ideal_range;
    const r = scoreAspect(p.score, idealFromProfile || p.ideal_score, priority);
    if (!r) {
      // Skor tidak terbaca: jangan dinilai dan jangan ikut dihitung dalam rata-rata.
      return { ...p, priority, unreadable: true, fit: 'Tidak Terbaca', match_percentage: 0, fit_level: undefined, direction: undefined } as PapiAspect;
    }
    return {
      ...p,
      priority,
      ideal_score: idealFromProfile || p.ideal_score,
      match_percentage: r.match,
      fit_level: r.level,
      fit: FIT_LABELS.id[r.level],
      direction: r.direction,
    } as PapiAspect;
  });

  const weights = computeWeights(scored.map(p => p.priority));
  const withWeights = scored.map((p, i) => ({ ...p, weight: weights[i] }));
  const summary = summarizePapi(withWeights);

  const cv = data.cv_evaluation?.match_percentage || 0;
  const cog = data.cognitive?.match_percentage || 0;
  const total = Math.round(cv * 0.34 + cog * 0.33 + summary.weighted_match * 0.33);
  const band = decisionBand(total, summary.knockouts);

  return {
    ...data,
    papi: withWeights,
    papi_summary: summary,
    conclusion: {
      ...data.conclusion,
      total_job_fit_percentage: total,
      status: band === 'disarankan' ? 'DISARANKAN' : band === 'dipertimbangkan' ? 'DAPAT DIPERTIMBANGKAN' : 'TIDAK DISARANKAN',
    },
  };
}
