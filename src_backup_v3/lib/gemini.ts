import { GoogleGenAI, Type } from "@google/genai";
import { PsychogramData, CostDetail, JobProfileAspect } from "../types";

// ============================================================
// PRICING CONSTANTS (Gemini 2.5 Flash — April 2026)
// ============================================================
const USD_TO_IDR = 17_500;
const GEMINI_FLASH_INPUT_USD_PER_1M  = 0.30;   // $0.30 per 1M input tokens
const GEMINI_FLASH_OUTPUT_USD_PER_1M = 2.50;   // $2.50 per 1M output tokens (includes thinking)

function calculateGeminiCost(inputTokens: number, outputTokens: number, thinkingTokens: number, task: string = "") {
  // Thinking tokens are billed as output tokens
  const totalOutputTokens = outputTokens + thinkingTokens;
  const inputCostUSD    = (inputTokens      / 1_000_000) * GEMINI_FLASH_INPUT_USD_PER_1M;
  const outputCostUSD   = (totalOutputTokens / 1_000_000) * GEMINI_FLASH_OUTPUT_USD_PER_1M;
  const inputCost  = inputCostUSD  * USD_TO_IDR;
  const outputCost = outputCostUSD * USD_TO_IDR;
  const totalRupiah = inputCost + outputCost;

  console.log(`\n%c[Gemini Cost] ${task}`, 'color: #dc2626; font-weight: bold; font-size: 13px');
  console.log(`  📥 Input tokens:    ${inputTokens.toLocaleString('id-ID')}`);
  console.log(`  📤 Output tokens:   ${outputTokens.toLocaleString('id-ID')}`);
  console.log(`  🧠 Thinking tokens: ${thinkingTokens.toLocaleString('id-ID')}`);
  console.log(`  📊 Total output:    ${totalOutputTokens.toLocaleString('id-ID')} (output + thinking)`);
  console.log(`  💲 Input cost:      $${inputCostUSD.toFixed(6)}  →  Rp ${inputCost.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}  ($${GEMINI_FLASH_INPUT_USD_PER_1M}/1M × ${USD_TO_IDR.toLocaleString('id-ID')})`);
  console.log(`  💲 Output cost:     $${outputCostUSD.toFixed(6)}  →  Rp ${outputCost.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}  ($${GEMINI_FLASH_OUTPUT_USD_PER_1M}/1M × ${USD_TO_IDR.toLocaleString('id-ID')})`);
  console.log(`  %c💰 TOTAL:           Rp ${totalRupiah.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'color: #dc2626; font-weight: bold');
  console.log('');

  return { inputCost, outputCost, totalRupiah, totalOutputTokens };
}

// Only use gemini-2.5-flash — no fallback to Pro
const FALLBACK_MODELS = [
  "gemini-2.5-flash",
];

// Retry helper with exponential backoff and model fallback
async function retryWithFallback<T>(
  fn: (model: string) => Promise<T>,
  primaryModel: string,
  maxRetries: number = 2,
  baseDelay: number = 3000
): Promise<T> {
  // Build model list: primary first, then fallbacks (excluding primary)
  const models = [primaryModel, ...FALLBACK_MODELS.filter(m => m !== primaryModel)];
  
  for (let modelIdx = 0; modelIdx < models.length; modelIdx++) {
    const model = models[modelIdx];
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini] Trying model: ${model} (attempt ${attempt + 1}/${maxRetries + 1})`);
        return await fn(model);
      } catch (error: any) {
        const isRetryable = error.message?.includes('503') || 
                            error.message?.includes('UNAVAILABLE') ||
                            error.message?.includes('high demand') ||
                            error.message?.includes('overloaded') ||
                            error.message?.includes('RESOURCE_EXHAUSTED');
        
        if (isRetryable && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.warn(`[Gemini] Model ${model} unavailable. Retrying in ${delay / 1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        if (isRetryable && modelIdx < models.length - 1) {
          console.warn(`[Gemini] Model ${model} exhausted retries. Falling back to next model...`);
          break; // break inner loop, try next model
        }
        
        // Non-retryable error or last model exhausted
        throw error;
      }
    }
  }
  
  throw new Error("Semua model AI sedang sibuk. Silakan coba lagi dalam beberapa menit.");
}

const schema = {
  type: Type.OBJECT,
  properties: {
    identity: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        position: { type: Type.STRING }
      }
    },
    cognitive: {
      type: Type.OBJECT,
      properties: {
        raw_score: { type: Type.STRING },
        iq: { type: Type.STRING },
        category: { type: Type.STRING },
        description: { type: Type.STRING },
        match_percentage: { type: Type.NUMBER }
      }
    },
    cv_evaluation: {
      type: Type.OBJECT,
      properties: {
        summary: { type: Type.STRING },
        match_percentage: { type: Type.NUMBER },
        pros: { type: Type.ARRAY, items: { type: Type.STRING } },
        cons: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    papi: {
      type: Type.ARRAY,
      description: "Array berisi aspek PAPI Kostick yang paling relevan sesuai standar yang ditentukan.",
      items: {
        type: Type.OBJECT,
        properties: {
          aspect_name: { type: Type.STRING },
          code: { type: Type.STRING },
          score: { type: Type.STRING },
          ideal_score: { type: Type.STRING },
          interpretation: { type: Type.STRING },
          match_percentage: { type: Type.NUMBER },
          fit: { type: Type.STRING },
          relevance_reason: { type: Type.STRING }
        }
      }
    },
    analysis: {
      type: Type.OBJECT,
      properties: {
        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
        risks: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    },
    conclusion: {
      type: Type.OBJECT,
      properties: {
        total_job_fit_percentage: { type: Type.NUMBER },
        status: { type: Type.STRING },
        notes: { type: Type.STRING }
      }
    }
  }
};

export async function generatePapiStandard(
  jobDesc: string | { data: string, mimeType: string },
  aspectCount: number = 10,
  customApiKey?: string,
  selectedModel: string = "gemini-2.5-flash"
): Promise<{ role_summary: string, codes_string: string, papi_aspects: any[] }> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key tidak ditemukan.");

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `Anda adalah Ahli Job Profiling HR Sika Indonesia. Analisis Job Description yang diberikan dan tentukan TEPAT ${aspectCount} Aspek PAPI Kostick (dari 20 aspek: N,G,A,L,P,I,T,V,X,S,B,O,R,D,C,Z,E,K,F,W) yang PALING DIBUTUHKAN untuk kesuksesan di posisi tersebut.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      role_summary: { type: Type.STRING },
      codes_string: { type: Type.STRING },
      papi_aspects: {
        type: Type.ARRAY,
        description: `Array berisi TEPAT ${aspectCount} aspek yang paling dibutuhkan. Dilarang keras memberikan lebih atau kurang dari ${aspectCount}.`,
        items: {
          type: Type.OBJECT,
          properties: {
            code: { type: Type.STRING },
            name: { type: Type.STRING },
            ideal_range: { type: Type.STRING },
            reason: { type: Type.STRING }
          }
        }
      }
    }
  };

  const jobDescPart = typeof jobDesc === 'string' 
    ? { text: `Analisis JD berikut:\n${jobDesc}` }
    : { inlineData: { mimeType: jobDesc.mimeType, data: jobDesc.data } };

  return retryWithFallback(async (modelToUse) => {
    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: [{ role: "user", parts: [jobDescPart] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: schema as any,
        temperature: 0.2,
      }
    });

    if (!response.text) throw new Error("AI memberikan respons kosong.");
    const result = JSON.parse(response.text);
    if (result.papi_aspects && Array.isArray(result.papi_aspects)) {
      result.papi_aspects = result.papi_aspects.slice(0, aspectCount);
      result.codes_string = result.papi_aspects.map((item: any) => item.code).join(', ');
    }
    return result;
  }, selectedModel);
}

export async function analyzePsychogram(
  psikotesBase64: string,
  cvBase64: string | null,
  jobDesc: string | { data: string, mimeType: string },
  papiStandard: string,
  customApiKey?: string,
  selectedModel: string = "gemini-2.5-flash",
  profileAspects?: JobProfileAspect[]
): Promise<PsychogramData> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key tidak ditemukan. Silakan masukkan API Key di kolom yang tersedia.");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const standardCodes = papiStandard ? papiStandard.split(',').map(s => s.trim()).filter(Boolean) : [];
    const count = standardCodes.length || 10;

    // Build rich standard description with ideal ranges if profile is available
    let papiInstruction: string;
    let idealRangeAnchor = '';
    if (profileAspects && profileAspects.length > 0) {
      const aspectDetails = profileAspects.map(a => 
        `- ${a.code} (${a.name}): Skor Ideal = ${a.ideal_range}. Alasan: ${a.reason}`
      ).join('\n');
      papiInstruction = `SAYA TELAH MENETAPKAN STANDAR PROFIL JABATAN INI. ANDA WAJIB MENGEVALUASI DAN HANYA MENGEMBALIKAN TEPAT ${count} ASPEK BERIKUT DALAM ARRAY 'papi': [${papiStandard}].
DILARANG KERAS memasukkan aspek lain di luar daftar tersebut.
Pastikan jumlah objek dalam array 'papi' ADALAH TEPAT ${count}.`;
      idealRangeAnchor = `\n\nPROFIL STANDAR JABATAN (WAJIB DIIKUTI):\nBerikut adalah skor ideal yang SUDAH DITETAPKAN untuk setiap aspek. Anda WAJIB menggunakan nilai 'ideal_score' yang sesuai dengan rentang di bawah ini. DILARANG mengarang skor ideal sendiri.\n${aspectDetails}`;
    } else if (papiStandard) {
      papiInstruction = `SAYA TELAH MENETAPKAN STANDAR UNTUK JABATAN INI. ANDA WAJIB MENGEVALUASI DAN HANYA MENGEMBALIKAN TEPAT ${count} ASPEK BERIKUT DALAM ARRAY 'papi': [${papiStandard}]. 
         DILARANG KERAS memasukkan aspek lain di luar daftar tersebut. 
         Pastikan jumlah objek dalam array 'papi' ADALAH TEPAT ${count}.`;
    } else {
      papiInstruction = `PILIH TEPAT 10 ASPEK PAPI KOSTICK yang PALING KRUSIAL untuk sukses di posisi tersebut. 
         Array 'papi' dalam JSON HARUS berisi tepat 10 objek.`;
    }

    const narrativeTemplate = `
TEMPLATE NARASI (WAJIB DIIKUTI untuk setiap aspek PAPI):
Gunakan pola narasi berikut agar KONSISTEN di setiap laporan:
- 'interpretation': "Kandidat memperoleh skor [skor] pada aspek [nama aspek] ([kode]). [Penjelasan mendalam 2-3 kalimat tentang apa yang ditunjukkan skor tersebut terhadap perilaku kerja kandidat]. Dalam konteks posisi yang dilamar, [analisis implikasi skor terhadap tuntutan jabatan]."
- 'relevance_reason': "Aspek [nama aspek] menjadi krusial untuk posisi ini karena [alasan spesifik terkait job description]. [Penjelasan hubungan aspek dengan keberhasilan di jabatan tersebut]."
- 'fit': Tentukan berdasarkan jarak skor dengan ideal: gap 0-1 = "Sangat Sesuai", gap 2-3 = "Sesuai", gap 4-5 = "Cukup Sesuai", gap >5 = "Kurang Sesuai".
- 'match_percentage': Hitung secara konsisten: jika skor kandidat berada dalam rentang ideal = 90-100%, gap 1-2 = 70-89%, gap 3-4 = 50-69%, gap >4 = 20-49%.`;

    const systemPrompt = `Anda adalah Ahli Ekstraksi Dokumen Vision AI dan Psikolog Senior HR Sika Indonesia.
TUGAS UTAMA ANDA ADALAH MELAKUKAN OCR VISUAL PADA DOKUMEN PDF YANG DIBERIKAN DAN MEMBERIKAN ANALISIS JOB FIT.

PANDUAN EKSTRAKSI DOKUMEN (HASIL PSIKOTES):
1. CARI TEKS "Raw Score (RS)" -> Ambil angka di sebelahnya (0-50).
2. CARI TEKS "Estimasi IQ" -> Ambil angka di sebelahnya (misal: 110).
3. CARI TABEL "PAPI KOSTICK" -> Ekstrak data skor untuk 20 aspek sebagai referensi internal Anda.

PANDUAN OUTPUT JSON (SANGAT PENTING):
1. Array 'papi' dalam JSON output HARUS BERISI TEPAT ${count} OBJEK.
2. ${papiInstruction}
3. Untuk setiap aspek dalam array 'papi', berikan interpretasi mendalam (minimal 2 kalimat) dan alasan relevansinya terhadap Job Desc.
4. Hitung 'match_percentage' untuk setiap aspek berdasarkan seberapa dekat skor kandidat dengan skor ideal untuk posisi tersebut.
5. 'total_job_fit_percentage' adalah rata-rata tertimbang dari Evaluasi CV (34%), Kognitif (33%), dan PAPI (33%).
${idealRangeAnchor}
${narrativeTemplate}

KUALITAS ANALISIS:
- Jangan memberikan nilai null atau "-" jika angka terlihat di dokumen.
- NARASI & GAYA BAHASA: Sajikan hasil analisis (terutama interpretasi, alasan relevansi, ringkasan CV, kekuatan, risiko, dan catatan akhir) dengan gaya bahasa yang NARATIF, mengalir, deskriptif, dan komprehensif. Gunakan bahasa HR korporat yang sistematis dan praktis agar mudah dipahami oleh manajemen. Jangan gunakan kalimat yang terlalu kaku atau terlalu singkat (robotik). Susun layaknya sebuah laporan dari Assessor/Psikolog Senior yang menceritakan profil kandidat.
- Jika CV tersedia, ceritakan hubungan temuan psikotes dengan pengalaman kerja nyata kandidat secara naratif.

OUTPUT HARUS JSON LENGKAP SESUAI SCHEMA DENGAN TEPAT ${count} ASPEK PAPI.`;

    const jobDescPart = typeof jobDesc === 'string' 
      ? { text: `JOB DESCRIPTION:\n${jobDesc}` }
      : { inlineData: { mimeType: jobDesc.mimeType, data: jobDesc.data } };

    // Build detailed standard text for the prompt
    let standardText = `STANDAR PAPI (JIKA ADA):\n${papiStandard}`;
    if (profileAspects && profileAspects.length > 0) {
      const detailLines = profileAspects.map(a => 
        `${a.code} (${a.name}): Skor Ideal = ${a.ideal_range} | Alasan: ${a.reason}`
      ).join('\n');
      standardText = `STANDAR PAPI YANG SUDAH DITETAPKAN (WAJIB DIIKUTI):\nKode: ${papiStandard}\n\nDetail per Aspek:\n${detailLines}`;
    }

    const contents = [
      {
        role: "user",
        parts: [
          { text: "Tolong analisis dokumen ini secara mendalam. Ekstrak skor WPT dan PAPI dengan teliti. Bandingkan dengan Job Desc untuk menentukan Job Fit." },
          { inlineData: { mimeType: "application/pdf", data: psikotesBase64 } },
          ...(cvBase64 ? [
            { inlineData: { mimeType: "application/pdf", data: cvBase64 } }
          ] : []),
          jobDescPart,
          { text: standardText }
        ]
      }
    ];

    return retryWithFallback(async (modelToUse) => {
      const response = await ai.models.generateContent({
        model: modelToUse,
        contents,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: schema as any,
          temperature: 0.1,
        }
      });

      if (!response.text) throw new Error("AI memberikan respons kosong. Pastikan file PDF terbaca dengan jelas.");
      const result = JSON.parse(response.text) as PsychogramData;
      if (result.papi && Array.isArray(result.papi)) {
        result.papi = result.papi.slice(0, count);
      }
      
      if (response.usageMetadata) {
        const inputTokens = response.usageMetadata.promptTokenCount || 0;
        const outputTokens = response.usageMetadata.candidatesTokenCount || 0;
        const thinkingTokens = (response.usageMetadata as any).thoughtsTokenCount || 0;
        const { totalRupiah, totalOutputTokens } = calculateGeminiCost(inputTokens, outputTokens, thinkingTokens, "Analisis Penuh");
        result.costs = [{
          model: modelToUse,
          task: "Analisis Penuh",
          inputTokens,
          outputTokens: totalOutputTokens,
          totalRupiah
        }];
      }

      return result;
    }, selectedModel);

  } catch (error: any) {
    console.error(`Analysis failed with model ${selectedModel}:`, error);
    if (error.message?.includes('API_KEY_INVALID')) {
      throw new Error("API Key tidak valid. Silakan periksa kembali kode API Anda.");
    }
    throw new Error(error.message || "Terjadi kesalahan saat memproses data. Silakan coba lagi.");
  }
}

// ============================================================
// VISION OCR EXTRACTION ONLY (for Hybrid Mode with DeepSeek)
// ============================================================

const extractionSchema = {
  type: Type.OBJECT,
  properties: {
    identity: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: "Nama lengkap kandidat" },
        position: { type: Type.STRING, description: "Posisi yang dilamar" }
      }
    },
    cognitive: {
      type: Type.OBJECT,
      properties: {
        raw_score: { type: Type.STRING, description: "Raw Score WPT (0-50)" },
        iq: { type: Type.STRING, description: "Estimasi IQ" }
      }
    },
    papi_scores: {
      type: Type.OBJECT,
      description: "Skor 20 aspek PAPI Kostick. Key = kode huruf (N,G,A,L,P,I,T,V,X,S,B,O,R,D,C,Z,E,K,F,W), Value = angka skor.",
      properties: {
        N: { type: Type.STRING }, G: { type: Type.STRING }, A: { type: Type.STRING },
        L: { type: Type.STRING }, P: { type: Type.STRING }, I: { type: Type.STRING },
        T: { type: Type.STRING }, V: { type: Type.STRING }, X: { type: Type.STRING },
        S: { type: Type.STRING }, B: { type: Type.STRING }, O: { type: Type.STRING },
        R: { type: Type.STRING }, D: { type: Type.STRING }, C: { type: Type.STRING },
        Z: { type: Type.STRING }, E: { type: Type.STRING }, K: { type: Type.STRING },
        F: { type: Type.STRING }, W: { type: Type.STRING }
      }
    },
    cv_text: {
      type: Type.STRING,
      description: "Ringkasan teks CV kandidat yang berhasil diekstrak. Kosongkan jika tidak ada CV."
    }
  }
};

export interface ExtractedRawData {
  identity: { name: string; position: string };
  cognitive: { raw_score: string; iq: string };
  papi_scores: Record<string, string>;
  cv_text: string | null;
  job_description: string;
  papi_standard: string;
  costs?: CostDetail[];
}

export async function extractRawDataFromPdf(
  psikotesBase64: string,
  cvBase64: string | null,
  jobDesc: string | { data: string, mimeType: string },
  papiStandard: string,
  customApiKey?: string,
  selectedModel: string = "gemini-2.5-flash"
): Promise<ExtractedRawData> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key tidak ditemukan.");

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `Anda adalah Ahli Ekstraksi Dokumen Vision AI.
TUGAS ANDA HANYA MELAKUKAN OCR VISUAL — BUKAN ANALISIS.

PANDUAN EKSTRAKSI:
1. CARI TEKS "Raw Score (RS)" → Ambil angka di sebelahnya (0-50).
2. CARI TEKS "Estimasi IQ" → Ambil angka di sebelahnya.
3. CARI nama kandidat dan posisi yang dilamar.
4. CARI TABEL "PAPI KOSTICK" → Ekstrak skor untuk SEMUA 20 aspek: N, G, A, L, P, I, T, V, X, S, B, O, R, D, C, Z, E, K, F, W.
5. Jika ada dokumen CV, ringkas isinya menjadi teks deskriptif (pengalaman kerja, pendidikan, keahlian).

ATURAN KETAT:
- JANGAN melakukan analisis psikologis apapun.
- JANGAN memberikan interpretasi atau evaluasi.
- HANYA ekstrak angka dan teks yang TERLIHAT di dokumen.
- Jika suatu nilai tidak terbaca, isi dengan "0" atau "Tidak Terbaca".
- Output HARUS berupa JSON sesuai schema.`;

  const jobDescText = typeof jobDesc === 'string'
    ? jobDesc
    : "(Job Description dalam format PDF)";

  const contents = [
    {
      role: "user" as const,
      parts: [
        { text: "Tolong ekstrak semua data angka dan teks dari dokumen PDF berikut. HANYA EKSTRAKSI, TANPA ANALISIS." },
        { inlineData: { mimeType: "application/pdf", data: psikotesBase64 } },
        ...(cvBase64 ? [
          { text: "Berikut dokumen CV kandidat, tolong ringkas isinya:" },
          { inlineData: { mimeType: "application/pdf", data: cvBase64 } }
        ] : []),
      ]
    }
  ];

  try {
    return await retryWithFallback(async (modelToUse) => {
      const response = await ai.models.generateContent({
        model: modelToUse,
        contents,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          responseSchema: extractionSchema as any,
          temperature: 0.05,
        }
      });

      if (!response.text) throw new Error("Gemini Vision memberikan respons kosong. Pastikan PDF terbaca dengan jelas.");

      const extracted = JSON.parse(response.text);

      // Build the result with job description and papi standard appended
      const result: ExtractedRawData = {
        identity: extracted.identity || { name: "Tidak Terbaca", position: "Tidak Terbaca" },
        cognitive: extracted.cognitive || { raw_score: "0", iq: "0" },
        papi_scores: extracted.papi_scores || {},
        cv_text: extracted.cv_text || null,
        job_description: jobDescText,
        papi_standard: papiStandard,
        costs: []
      };

      if (response.usageMetadata) {
        const inputTokens = response.usageMetadata.promptTokenCount || 0;
        const outputTokens = response.usageMetadata.candidatesTokenCount || 0;
        const thinkingTokens = (response.usageMetadata as any).thoughtsTokenCount || 0;
        const { totalRupiah, totalOutputTokens } = calculateGeminiCost(inputTokens, outputTokens, thinkingTokens, "Vision OCR");
        result.costs!.push({
          model: modelToUse,
          task: "Vision OCR",
          inputTokens,
          outputTokens: totalOutputTokens,
          totalRupiah
        });
      }

      // If JD was a file, we need the text from it too
      if (typeof jobDesc !== 'string' && jobDesc.data) {
        // Extract JD text via a second quick Gemini call
        try {
          const jdResponse = await ai.models.generateContent({
            model: modelToUse,
            contents: [{
              role: "user",
              parts: [
                { text: "Ekstrak seluruh teks dari dokumen PDF berikut. Kembalikan HANYA teks mentah tanpa format." },
                { inlineData: { mimeType: jobDesc.mimeType, data: jobDesc.data } }
              ]
            }],
            config: { temperature: 0.05 }
          });
          if (jdResponse.text) {
            result.job_description = jdResponse.text;
          }
          if (jdResponse.usageMetadata) {
            const inputTokens = jdResponse.usageMetadata.promptTokenCount || 0;
            const outputTokens = jdResponse.usageMetadata.candidatesTokenCount || 0;
            const thinkingTokens = (jdResponse.usageMetadata as any).thoughtsTokenCount || 0;
            const { totalRupiah, totalOutputTokens } = calculateGeminiCost(inputTokens, outputTokens, thinkingTokens, "Ekstrak Teks JD");
            result.costs!.push({
              model: modelToUse,
              task: "Ekstrak Teks JD",
              inputTokens,
              outputTokens: totalOutputTokens,
              totalRupiah
            });
          }
        } catch (e) {
          console.warn("Failed to extract JD text from PDF, proceeding with placeholder.", e);
        }
      }

      return result;
    }, selectedModel);

  } catch (error: any) {
    console.error("Gemini Vision extraction failed:", error);
    if (error.message?.includes('API_KEY_INVALID')) {
      throw new Error("Gemini API Key tidak valid.");
    }
    throw new Error(error.message || "Gagal mengekstrak data dari PDF.");
  }
}
