import { analyzePsychogram, extractRawDataFromPdf, generatePapiStandard } from '../server/gemini.js';
import { analyzeWithDeepSeek, generatePapiStandardWithDeepSeek, translateWithDeepSeek } from '../server/deepseek.js';
import { analyzeWithClaude, generatePapiStandardWithClaude } from '../server/claude.js';
import type { JobProfileAspect } from '../src/types.js';

const headers = { 'Cache-Control': 'no-store' };
type Model = 'gemini-2.0-flash' | 'gemini-2.5-flash' | 'deepseek' | 'claude';

function fail(status: number, error: string) {
  return Response.json({ error }, { status, headers });
}

function isJobDescription(value: unknown): value is string | { data: string; mimeType: string } {
  return (typeof value === 'string' && value.trim().length > 0) ||
    (typeof value === 'object' && value !== null &&
      typeof (value as { data?: unknown }).data === 'string' &&
      (value as { mimeType?: unknown }).mimeType === 'application/pdf');
}

function isModel(value: unknown): value is Model {
  return value === 'gemini-2.0-flash' || value === 'gemini-2.5-flash' || value === 'deepseek' || value === 'claude';
}

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return fail(403, 'Permintaan ditolak.');
  if (request.headers.get('sec-fetch-site') === 'cross-site') return fail(403, 'Permintaan ditolak.');

  let input: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, 'utf8') > 4_000_000) {
      return fail(413, 'Ukuran dokumen terlalu besar untuk diproses.');
    }
    input = JSON.parse(raw);
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid body');
  } catch {
    return fail(400, 'Format permintaan tidak valid.');
  }

  const operation = input.operation;
  if (operation !== 'standard' && operation !== 'analyze' && operation !== 'translate') {
    return fail(400, 'Operasi tidak dikenal.');
  }
  if (operation !== 'translate' && (!isModel(input.model) || !isJobDescription(input.jobDesc))) {
    return fail(400, 'Model atau deskripsi pekerjaan tidak valid.');
  }

  try {
    if (operation === 'standard') {
      if (!Number.isInteger(input.aspectCount) || (input.aspectCount as number) < 5 || (input.aspectCount as number) > 10) {
        return fail(400, 'Jumlah aspek harus 5 sampai 10.');
      }
      const jobDesc = input.jobDesc as string | { data: string; mimeType: string };
      const count = input.aspectCount as number;
      const model = input.model as Model;
      if (model === 'deepseek') {
        if (!process.env.DEEPSEEK_API_KEY) return fail(503, 'Kunci DeepSeek belum dikonfigurasi di server.');
        return Response.json(await generatePapiStandardWithDeepSeek(jobDesc, count, process.env.DEEPSEEK_API_KEY), { headers });
      }
      if (model === 'claude') {
        if (!process.env.CLAUDE_API_KEY) return fail(503, 'Kunci Claude belum dikonfigurasi di server.');
        return Response.json(await generatePapiStandardWithClaude(jobDesc, count, process.env.CLAUDE_API_KEY), { headers });
      }
      if (!process.env.GEMINI_API_KEY) return fail(503, 'Kunci Gemini belum dikonfigurasi di server.');
      return Response.json(await generatePapiStandard(jobDesc, count), { headers });
    }

    if (operation === 'analyze') {
      if (!process.env.GEMINI_API_KEY) return fail(503, 'Kunci Gemini belum dikonfigurasi di server.');
      if (typeof input.psikotesBase64 !== 'string' || !input.psikotesBase64 ||
          (input.cvBase64 !== null && typeof input.cvBase64 !== 'string') ||
          typeof input.papiStandard !== 'string') {
        return fail(400, 'Data asesmen tidak valid.');
      }
      const psikotes = input.psikotesBase64;
      const cv = input.cvBase64 as string | null;
      const jobDesc = input.jobDesc as string | { data: string; mimeType: string };
      const standard = input.papiStandard;
      const model = input.model as Model;
      const aspects = Array.isArray(input.profileAspects) ? input.profileAspects as JobProfileAspect[] : undefined;
      if (model === 'gemini-2.0-flash' || model === 'gemini-2.5-flash') {
        return Response.json(await analyzePsychogram(psikotes, cv, jobDesc, standard, undefined, 'gemini-2.5-flash', aspects), { headers });
      }
      if (model === 'deepseek' && !process.env.DEEPSEEK_API_KEY) return fail(503, 'Kunci DeepSeek belum dikonfigurasi di server.');
      if (model === 'claude' && !process.env.CLAUDE_API_KEY) return fail(503, 'Kunci Claude belum dikonfigurasi di server.');
      const extracted = await extractRawDataFromPdf(psikotes, cv, jobDesc, standard);
      if (model === 'deepseek') {
        return Response.json(await analyzeWithDeepSeek(extracted, process.env.DEEPSEEK_API_KEY!, 'deepseek-chat', aspects), { headers });
      }
      return Response.json(await analyzeWithClaude(extracted, process.env.CLAUDE_API_KEY!, 'claude-sonnet-4-20250514', aspects), { headers });
    }

    if (!process.env.DEEPSEEK_API_KEY) return fail(503, 'Kunci DeepSeek belum dikonfigurasi di server.');
    if (!input.data || typeof input.data !== 'object') return fail(400, 'Data laporan tidak valid.');
    return Response.json(await translateWithDeepSeek(input.data as Parameters<typeof translateWithDeepSeek>[0]), { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('CONSUMER_SUSPENDED')) return fail(503, 'Kunci Gemini ditangguhkan oleh Google. Buat kunci baru dan perbarui konfigurasi server.');
    if (message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED')) return fail(503, 'Kunci API ditolak oleh penyedia AI. Periksa konfigurasi server.');
    if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) return fail(429, 'Batas penggunaan layanan AI tercapai. Coba lagi nanti.');
    console.error('AI operation failed:', operation, error instanceof Error ? error.name : 'Unknown error');
    return fail(502, 'Layanan AI gagal memproses permintaan. Silakan coba lagi.');
  }
}
