import type { JobProfileAspect, PsychogramData } from '../types';

type JobDescription = string | { data: string; mimeType: string };
type Model = 'gemini-2.0-flash' | 'gemini-2.5-flash' | 'deepseek' | 'claude';

async function requestAI<T>(payload: object): Promise<T> {
  const body = JSON.stringify(payload);
  if (new TextEncoder().encode(body).length > 4_000_000) {
    throw new Error('Ukuran dokumen terlalu besar untuk diproses. Gunakan PDF yang lebih kecil.');
  }
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  if (response.status === 413) {
    throw new Error('Ukuran dokumen terlalu besar untuk diproses. Gunakan PDF yang lebih kecil.');
  }
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof result.error === 'string' ? result.error : 'Layanan AI gagal memproses permintaan.');
  }
  return result as T;
}

export function generatePapiStandard(
  jobDesc: JobDescription,
  aspectCount: number,
  model: Model,
) {
  return requestAI<{ role_summary: string; codes_string: string; papi_aspects: JobProfileAspect[] }>({
    operation: 'standard', jobDesc, aspectCount, model,
  });
}

export function analyzeCandidate(
  psikotesBase64: string,
  cvBase64: string | null,
  jobDesc: JobDescription,
  papiStandard: string,
  model: Model,
  profileAspects?: JobProfileAspect[],
) {
  return requestAI<PsychogramData>({
    operation: 'analyze', psikotesBase64, cvBase64, jobDesc, papiStandard, model, profileAspects,
  });
}

export function translateReport(data: PsychogramData) {
  return requestAI<NonNullable<PsychogramData['translatedData']>['en']>({
    operation: 'translate', data,
  });
}
