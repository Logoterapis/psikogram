import { PsychogramData, CostDetail } from "../types";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

interface ExtractedRawData {
  identity: {
    name: string;
    position: string;
  };
  cognitive: {
    raw_score: string;
    iq: string;
  };
  papi_scores: Record<string, string>;
  cv_text: string | null;
  job_description: string;
  papi_standard: string;
  costs?: CostDetail[];
}

export async function analyzeWithDeepSeek(
  extractedData: ExtractedRawData,
  deepseekApiKey: string,
  model: string = "deepseek-chat"
): Promise<PsychogramData> {
  if (!deepseekApiKey) throw new Error("DeepSeek API Key tidak ditemukan.");

  const standardCodes = extractedData.papi_standard
    ? extractedData.papi_standard.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const count = standardCodes.length || 10;

  const papiInstruction = extractedData.papi_standard
    ? `ANDA WAJIB MENGEVALUASI DAN HANYA MENGEMBALIKAN TEPAT ${count} ASPEK BERIKUT DALAM ARRAY 'papi': [${extractedData.papi_standard}].
       DILARANG KERAS memasukkan aspek lain di luar daftar tersebut.
       Pastikan jumlah objek dalam array 'papi' ADALAH TEPAT ${count}.`
    : `PILIH TEPAT 10 ASPEK PAPI KOSTICK yang PALING KRUSIAL untuk sukses di posisi tersebut.
       Array 'papi' dalam JSON HARUS berisi tepat 10 objek.`;

  const systemPrompt = `Anda adalah Psikolog Senior HR Sika Indonesia yang ahli dalam analisis Job Fit.
Anda akan menerima DATA HASIL EKSTRAKSI dari dokumen psikotes kandidat yang sudah di-OCR oleh Vision AI.

TUGAS ANDA:
Berdasarkan data mentah yang diberikan, lakukan analisis mendalam dan hasilkan laporan Job Fit yang komprehensif.

DATA YANG DIBERIKAN:
- Identitas kandidat (nama, posisi)
- Skor Kognitif WPT (Raw Score & IQ)
- Skor 20 Aspek PAPI Kostick
- Teks CV kandidat (jika tersedia)
- Job Description posisi yang dilamar
- Standar PAPI untuk posisi tersebut

PANDUAN OUTPUT JSON (SANGAT PENTING):
1. Array 'papi' dalam JSON output HARUS BERISI TEPAT ${count} OBJEK.
2. ${papiInstruction}
3. Untuk setiap aspek dalam array 'papi', berikan 'interpretation' mendalam (minimal 2 kalimat) dan 'relevance_reason' terhadap Job Desc.
4. Hitung 'match_percentage' untuk setiap aspek berdasarkan seberapa dekat skor kandidat dengan skor ideal untuk posisi tersebut (0-100).
5. 'total_job_fit_percentage' adalah rata-rata tertimbang dari Kognitif (40%) dan PAPI (60%).
6. Tentukan 'fit' sebagai: "Sangat Sesuai", "Sesuai", "Cukup Sesuai", atau "Kurang Sesuai".

KUALITAS ANALISIS:
- Jangan memberikan nilai null atau "-" jika data tersedia.
- NARASI & GAYA BAHASA: Sajikan hasil analisis (terutama interpretasi, alasan relevansi, ringkasan CV, kekuatan, risiko, dan catatan akhir) dengan gaya bahasa yang NARATIF, mengalir, deskriptif, dan komprehensif. Gunakan bahasa HR korporat yang sistematis dan praktis agar mudah dipahami oleh manajemen. Jangan gunakan kalimat yang terlalu kaku atau terlalu singkat (robotik). Susun layaknya sebuah laporan dari Assessor/Psikolog Senior yang menceritakan profil kandidat.
- Jika CV tersedia, ceritakan hubungan temuan psikotes dengan pengalaman kerja nyata kandidat secara naratif.

FORMAT OUTPUT HARUS JSON VALID dengan struktur:
{
  "identity": { "name": "string", "position": "string" },
  "cognitive": { "raw_score": "string", "iq": "string", "category": "string", "description": "string", "match_percentage": number },
  "cv_evaluation": { "summary": "string", "match_percentage": number, "pros": ["string"], "cons": ["string"] },
  "papi": [
    {
      "aspect_name": "string",
      "code": "string",
      "score": "string",
      "ideal_score": "string",
      "interpretation": "string",
      "match_percentage": number,
      "fit": "string",
      "relevance_reason": "string"
    }
  ],
  "analysis": { "strengths": ["string"], "risks": ["string"] },
  "conclusion": { "total_job_fit_percentage": number, "status": "string", "notes": "string" }
}

OUTPUT HARUS JSON LENGKAP DENGAN TEPAT ${count} ASPEK PAPI. JANGAN tambahkan teks apapun di luar JSON.`;

  const papiScoresText = Object.entries(extractedData.papi_scores)
    .map(([code, score]) => `${code}: ${score}`)
    .join(', ');

  const userMessage = `Berikut data hasil ekstraksi Vision AI dari dokumen psikotes:

IDENTITAS KANDIDAT:
- Nama: ${extractedData.identity.name}
- Posisi: ${extractedData.identity.position}

SKOR KOGNITIF (WPT):
- Raw Score: ${extractedData.cognitive.raw_score}
- Estimasi IQ: ${extractedData.cognitive.iq}

SKOR PAPI KOSTICK (20 Aspek):
${papiScoresText}

${extractedData.cv_text ? `CV/RESUME KANDIDAT:\n${extractedData.cv_text}` : "CV tidak tersedia."}

JOB DESCRIPTION:
${extractedData.job_description}

STANDAR PAPI UNTUK POSISI INI:
${extractedData.papi_standard || "Tidak ditentukan, pilih 10 aspek paling krusial."}

Silakan analisis dan berikan output JSON sesuai format yang diminta.`;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = (errorData as any)?.error?.message || `HTTP ${response.status}`;
      if (response.status === 401) {
        throw new Error("DeepSeek API Key tidak valid. Silakan periksa kembali.");
      }
      throw new Error(`DeepSeek API Error: ${errorMessage}`);
    }

    const data = await response.json();
    const content = (data as any).choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("DeepSeek memberikan respons kosong.");
    }

    const result = JSON.parse(content) as PsychogramData;

    // Enforce PAPI count
    if (result.papi && Array.isArray(result.papi)) {
      result.papi = result.papi.slice(0, count);
    }

    result.costs = extractedData.costs || [];
    if (data.usage) {
      const inputTokens = data.usage.prompt_tokens || 0;
      const outputTokens = data.usage.completion_tokens || 0;
      // DeepSeek: $0.14/1M in, $0.28/1M out. IDR 17,500 per USD
      const inputCost = (inputTokens / 1_000_000) * 0.14 * 17_500;
      const outputCost = (outputTokens / 1_000_000) * 0.28 * 17_500;
      result.costs.push({
        model: model,
        task: "Analisis Psikologi (DeepSeek)",
        inputTokens,
        outputTokens,
        totalRupiah: inputCost + outputCost
      });
    }

    return result;

  } catch (error: any) {
    console.error("DeepSeek analysis failed:", error);
    if (error instanceof SyntaxError) {
      throw new Error("DeepSeek mengembalikan format JSON yang tidak valid. Silakan coba lagi.");
    }
    throw new Error(error.message || "Terjadi kesalahan saat memproses data dengan DeepSeek.");
  }
}

export async function generatePapiStandardWithDeepSeek(
  jobDesc: string | { data: string, mimeType: string },
  aspectCount: number = 10,
  deepseekApiKey: string,
  model: string = "deepseek-chat"
): Promise<{ role_summary: string, codes_string: string, papi_aspects: any[] }> {
  if (!deepseekApiKey) throw new Error("DeepSeek API Key tidak ditemukan.");

  const jobDescText = typeof jobDesc === 'string' ? jobDesc : jobDesc.data;
  
  const systemPrompt = `Anda adalah Ahli Job Profiling HR Sika Indonesia. Analisis Job Description yang diberikan dan tentukan TEPAT ${aspectCount} Aspek PAPI Kostick (dari 20 aspek: N,G,A,L,P,I,T,V,X,S,B,O,R,D,C,Z,E,K,F,W) yang PALING DIBUTUHKAN untuk kesuksesan di posisi tersebut. 
  
OUTPUT TEPAT HARUS JSON DENGAN FORMAT:
{
  "role_summary": "string ringkasan profil jabatan",
  "papi_aspects": [
    {
      "code": "huruf PAPI (misal: L)",
      "name": "nama aspek",
      "ideal_range": "rentang ideal (misal: 7-9)",
      "reason": "alasan spesifik HR"
    }
  ]
}

Array 'papi_aspects' HARUS berjumlah TEPAT ${aspectCount} elemen.`;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${deepseekApiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analisis JD berikut:\n${jobDescText}` }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = (errorData as any)?.error?.message || `HTTP ${response.status}`;
      if (response.status === 401) {
        throw new Error("DeepSeek API Key tidak valid. Silakan periksa kembali.");
      }
      throw new Error(`DeepSeek API Error: ${errorMessage}`);
    }

    const data = await response.json();
    const content = (data as any).choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("DeepSeek memberikan respons kosong.");
    }

    const result = JSON.parse(content);
    if (result.papi_aspects && Array.isArray(result.papi_aspects)) {
      result.papi_aspects = result.papi_aspects.slice(0, aspectCount);
      result.codes_string = result.papi_aspects.map((item: any) => item.code).join(', ');
    }
    
    return result;

  } catch (error: any) {
    console.error("DeepSeek PAPI generation failed:", error);
    if (error instanceof SyntaxError) {
      throw new Error("DeepSeek mengembalikan format JSON yang tidak valid. Silakan coba lagi.");
    }
    throw new Error(error.message || "Gagal merumuskan standar dengan DeepSeek.");
  }
}
