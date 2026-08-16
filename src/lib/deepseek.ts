import { PsychogramData, CostDetail, JobProfileAspect } from "../types";
import { buildPapiStandardSystemPrompt, buildPapiInterpretationGuide } from "./papi-constants";

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
  model: string = "deepseek-chat",
  profileAspects?: JobProfileAspect[]
): Promise<PsychogramData> {
  if (!deepseekApiKey) throw new Error("DeepSeek API Key tidak ditemukan.");

  const standardCodes = extractedData.papi_standard
    ? extractedData.papi_standard.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const count = (profileAspects && profileAspects.length > 0)
    ? profileAspects.length
    : (standardCodes.length >= 5 ? standardCodes.length : 10);

  // Build rich standard description with ideal ranges if profile is available
  let papiInstruction: string;
  let idealRangeAnchor = '';
  if (profileAspects && profileAspects.length > 0) {
    const aspectDetails = profileAspects.map(a => 
      `- ${a.code} (${a.name}): Skor Ideal = ${a.ideal_range}. Alasan: ${a.reason}`
    ).join('\n');
    papiInstruction = `SAYA TELAH MENETAPKAN STANDAR PROFIL JABATAN INI (${count} ASPEK). ANDA WAJIB MENGEVALUASI DAN HANYA MENGEMBALIKAN TEPAT ${count} ASPEK BERIKUT DALAM ARRAY 'papi': [${extractedData.papi_standard}].
DILARANG KERAS memasukkan aspek lain di luar daftar tersebut.
Pastikan jumlah objek dalam array 'papi' ADALAH TEPAT ${count}.`;
    idealRangeAnchor = `\n\nPROFIL STANDAR JABATAN (WAJIB DIIKUTI):\nBerikut adalah skor ideal yang SUDAH DITETAPKAN untuk setiap aspek. Anda WAJIB menggunakan nilai 'ideal_score' yang sesuai dengan rentang di bawah ini. DILARANG mengarang skor ideal sendiri.\n${aspectDetails}`;
  } else if (standardCodes.length >= 5) {
    papiInstruction = `ANDA WAJIB MENGEVALUASI DAN HANYA MENGEMBALIKAN TEPAT ${count} ASPEK BERIKUT DALAM ARRAY 'papi': [${extractedData.papi_standard}].
       DILARANG KERAS memasukkan aspek lain di luar daftar tersebut.
       Pastikan jumlah objek dalam array 'papi' ADALAH TEPAT ${count}.`;
  } else {
    papiInstruction = `PILIH TEPAT 10 ASPEK PAPI KOSTICK (seperti N, G, A, L, P, I, T, V, S, R) yang PALING KRUSIAL untuk sukses di posisi tersebut.
       Array 'papi' dalam JSON HARUS berisi tepat 10 objek.`;
  }

  const papiKnowledgeBase = buildPapiInterpretationGuide();

  const narrativeTemplate = `
TEMPLATE NARASI (WAJIB DIIKUTI untuk setiap aspek PAPI):
Gunakan pola narasi berikut agar KONSISTEN di setiap laporan:
- 'interpretation': "Kandidat memperoleh skor [skor] pada aspek [nama aspek] ([kode]). [Penjelasan mendalam 2-3 kalimat tentang apa yang ditunjukkan skor tersebut terhadap perilaku kerja kandidat, dengan mempertimbangkan DIMENSI yang relevan dan KOMBINASI POLA antar aspek]. Dalam konteks posisi yang dilamar, [analisis implikasi skor terhadap tuntutan jabatan, termasuk potensi RISIKO jika skor terlalu tinggi/rendah]."
- 'relevance_reason': "Aspek [nama aspek] menjadi krusial untuk posisi ini karena [alasan spesifik terkait job description]. [Penjelasan hubungan aspek dengan keberhasilan di jabatan tersebut, merujuk pada standar ideal untuk jenis jabatan ini]."
- 'fit': Tentukan berdasarkan jarak skor dengan ideal: gap 0-1 = "Sangat Sesuai", gap 2-3 = "Sesuai", gap 4-5 = "Cukup Sesuai", gap >5 = "Kurang Sesuai".
- 'match_percentage': Hitung secara konsisten: jika skor kandidat berada dalam rentang ideal = 90-100%, gap 1-2 = 70-89%, gap 3-4 = 50-69%, gap >4 = 20-49%.

ATURAN KETAT UNTUK KOGNITIF (IQ) MATCH RATE & DESKRIPSI:
Berdasarkan "Posisi" yang dilamar (Kategori 1: Staff/Manajerial/Analis ATAU Kategori 2: Operator/Helper/Driver), Anda WAJIB menggunakan pedoman berikut untuk menentukan 'match_percentage' dan menulis 'description' kognitif:

KATEGORI 1 (Staff/Manajerial/Analis):
- IQ >= 120: Match Rate 90-100% (Interpretasi: Sangat ideal. Mampu menganalisa masalah kompleks dengan cepat.)
- IQ 100-119: Match Rate 70-89% (Interpretasi: Cukup. Mampu menyelesaikan pekerjaan sehari-hari, namun butuh waktu lebih untuk analisis strategis yang rumit.)
- IQ 90-99: Match Rate 50-69% (Interpretasi: Kurang disarankan. Akan kesulitan menghadapi dinamika pekerjaan analitis.)
- IQ < 90: Match Rate 20-49% (Interpretasi: Sangat tidak sesuai untuk posisi manajerial/analis.)

KATEGORI 2 (Non-Staff/Operator/Helper/Driver):
- IQ >= 100: Match Rate 90-100% (Interpretasi: Sangat ideal. Mampu memahami instruksi SOP dan beradaptasi dengan baik.)
- IQ 85-99: Match Rate 55-89% (Interpretasi: Sesuai. Masih sangat mampu melakukan pekerjaan operasional yang rutin dan diawasi.)
- IQ < 85: Match Rate 10-55% (Interpretasi: Kurang disarankan. Ada potensi kesulitan memahami instruksi yang sedikit berubah atau mesin baru.)`;

  const systemPrompt = `Anda adalah Psikolog Industri & Organisasi Senior HR Sika Indonesia yang ahli dalam analisis Job Fit.
Anda akan menerima DATA HASIL EKSTRAKSI dari dokumen psikotes kandidat yang sudah di-OCR oleh Vision AI.

TUGAS ANDA:
Berdasarkan data mentah yang diberikan, lakukan analisis mendalam dan hasilkan laporan Job Fit yang komprehensif.

=== BASIS PENGETAHUAN PAPI KOSTICK PROFESIONAL ===
${papiKnowledgeBase}
=== AKHIR BASIS PENGETAHUAN ===

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
3. Untuk setiap aspek dalam array 'papi', berikan interpretasi mendalam yang MENGACU PADA DIMENSI PAPI (Work Direction, Leadership, Activity, Social Nature, Work Style, Temperament, Followership) dan KOMBINASI POLA antar aspek.
4. Hitung 'match_percentage' untuk setiap aspek berdasarkan seberapa dekat skor kandidat dengan skor ideal untuk posisi tersebut (0-100).
5. 'total_job_fit_percentage' adalah rata-rata tertimbang dari Evaluasi CV (34%), Kognitif (33%), dan PAPI (33%).
6. Tentukan 'fit' sebagai: "Sangat Sesuai", "Sesuai", "Cukup Sesuai", atau "Kurang Sesuai".
7. WAJIB identifikasi RISIKO skor TINGGI (bukan hanya skor rendah) berdasarkan tabel risiko di basis pengetahuan.
8. Dalam analysis.strengths dan analysis.risks, gunakan pendekatan DIMENSI — kelompokkan temuan berdasarkan dimensi PAPI.
${idealRangeAnchor}
${narrativeTemplate}

KUALITAS ANALISIS:
- Jangan memberikan nilai null atau "-" jika data tersedia.
- NARASI & GAYA BAHASA: Sajikan hasil analisis (terutama interpretasi, alasan relevansi, ringkasan CV, kekuatan, risiko, dan catatan akhir) dengan gaya bahasa yang NARATIF, mengalir, deskriptif, dan komprehensif. Gunakan bahasa HR korporat yang sistematis dan praktis agar mudah dipahami oleh manajemen. Jangan gunakan kalimat yang terlalu kaku atau terlalu singkat (robotik). Susun layaknya sebuah laporan dari Assessor/Psikolog Senior yang menceritakan profil kandidat.
- Jika CV tersedia, ceritakan hubungan temuan psikotes dengan pengalaman kerja nyata kandidat secara naratif.
- INGAT: Skor tinggi BUKAN selalu bagus. Baca skor berdasarkan konteks jabatan. Jangan memberi label negatif pada kandidat.

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
${(() => {
  if (profileAspects && profileAspects.length > 0) {
    const detailLines = profileAspects.map(a => 
      `${a.code} (${a.name}): Skor Ideal = ${a.ideal_range} | Alasan: ${a.reason}`
    ).join('\n');
    return `Kode: ${extractedData.papi_standard}\n\nDetail per Aspek (WAJIB DIIKUTI):\n${detailLines}`;
  }
  return extractedData.papi_standard || "Tidak ditentukan, pilih 10 aspek paling krusial.";
})()}

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

export async function translateWithDeepSeek(
  data: PsychogramData,
  targetLang: string = 'English',
  customApiKey?: string
): Promise<PsychogramData['translatedData']['en']> {
  const apiKey = customApiKey || (process.env as any).DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error("DeepSeek API Key tidak ditemukan.");

  const payloadToTranslate = {
    cognitive: {
      description: data.cognitive.description
    },
    cv_evaluation: {
      summary: data.cv_evaluation.summary,
      pros: data.cv_evaluation.pros,
      cons: data.cv_evaluation.cons
    },
    papi: data.papi.map(p => ({
      aspect_name: p.aspect_name,
      code: p.code,
      interpretation: p.interpretation,
      relevance_reason: p.relevance_reason,
      fit: p.fit
    })),
    analysis: data.analysis,
    conclusion: {
      notes: data.conclusion.notes
    }
  };

  const systemPrompt = `You are a professional HR translator at Sika Indonesia.
Translate all string values in the provided JSON object to ${targetLang}.
Keep the EXACT same JSON structure and keys, only translate the values.
Use professional corporate HR language. Do not change the meaning.
Ensure arrays (like pros, cons, strengths, risks) remain arrays of translated strings. Do not omit any array items.

CRITICAL: Return ONLY valid JSON format. Do not include markdown code block syntax like \`\`\`json. Return the pure JSON string so it can be parsed.`;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: JSON.stringify(payloadToTranslate) },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error("Translation request failed.");
    }

    const responseData = await response.json();
    const content = (responseData as any).choices?.[0]?.message?.content;
    
    if (!content) throw new Error("Translation empty response.");

    const result = JSON.parse(content);

    const translatedData = {
      cognitive: { ...data.cognitive, ...result.cognitive },
      cv_evaluation: { ...data.cv_evaluation, ...result.cv_evaluation },
      papi: data.papi.map((p, i) => ({ ...p, ...(result.papi && result.papi[i] ? result.papi[i] : {}) })),
      analysis: {
        strengths: result.analysis?.strengths || data.analysis.strengths,
        risks: result.analysis?.risks || data.analysis.risks
      },
      conclusion: { ...data.conclusion, ...(result.conclusion || {}) }
    };

    return translatedData as any;
  } catch (error: any) {
    console.error("DeepSeek translation failed:", error);
    throw new Error(error.message || "Failed to translate report.");
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
  
  const systemPrompt = buildPapiStandardSystemPrompt(aspectCount) + `
  
OUTPUT TEPAT HARUS JSON DENGAN FORMAT:
{
  "role_summary": "string ringkasan profil jabatan (termasuk jenis jabatan, profil ideal, dan red flag)",
  "papi_aspects": [
    {
      "code": "huruf PAPI (misal: L)",
      "name": "nama aspek",
      "ideal_range": "rentang ideal (misal: 7-9)",
      "reason": "alasan spesifik HR berdasarkan JD"
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
