import { PsychogramData, CostDetail, JobProfileAspect } from "../types";
import { buildPapiStandardSystemPrompt, buildPapiInterpretationGuide } from "./papi-constants";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-5";

// Pricing: Claude Sonnet 4 — $3/1M input, $15/1M output
const CLAUDE_INPUT_USD_PER_1M = 3.0;
const CLAUDE_OUTPUT_USD_PER_1M = 15.0;
const USD_TO_IDR = 17_500;

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

export async function analyzeWithClaude(
  extractedData: ExtractedRawData,
  claudeApiKey: string,
  model: string = CLAUDE_MODEL,
  profileAspects?: JobProfileAspect[]
): Promise<PsychogramData> {
  if (!claudeApiKey) throw new Error("Claude API Key tidak ditemukan.");

  const standardCodes = extractedData.papi_standard
    ? extractedData.papi_standard.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const count = standardCodes.length || 10;

  // Build rich standard description with ideal ranges if profile is available
  let papiInstruction: string;
  let idealRangeAnchor = '';
  if (profileAspects && profileAspects.length > 0) {
    const aspectDetails = profileAspects.map(a => 
      `- ${a.code} (${a.name}): Skor Ideal = ${a.ideal_range}. Alasan: ${a.reason}`
    ).join('\n');
    papiInstruction = `SAYA TELAH MENETAPKAN STANDAR PROFIL JABATAN INI. ANDA WAJIB MENGEVALUASI DAN HANYA MENGEMBALIKAN TEPAT ${count} ASPEK BERIKUT DALAM ARRAY 'papi': [${extractedData.papi_standard}].
DILARANG KERAS memasukkan aspek lain di luar daftar tersebut.
Pastikan jumlah objek dalam array 'papi' ADALAH TEPAT ${count}.`;
    idealRangeAnchor = `\n\nPROFIL STANDAR JABATAN (WAJIB DIIKUTI):\nBerikut adalah skor ideal yang SUDAH DITETAPKAN untuk setiap aspek. Anda WAJIB menggunakan nilai 'ideal_score' yang sesuai dengan rentang di bawah ini. DILARANG mengarang skor ideal sendiri.\n${aspectDetails}`;
  } else if (extractedData.papi_standard) {
    papiInstruction = `ANDA WAJIB MENGEVALUASI DAN HANYA MENGEMBALIKAN TEPAT ${count} ASPEK BERIKUT DALAM ARRAY 'papi': [${extractedData.papi_standard}].
       DILARANG KERAS memasukkan aspek lain di luar daftar tersebut.
       Pastikan jumlah objek dalam array 'papi' ADALAH TEPAT ${count}.`;
  } else {
    papiInstruction = `PILIH TEPAT 10 ASPEK PAPI KOSTICK yang PALING KRUSIAL untuk sukses di posisi tersebut.
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
    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": claudeApiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 8192,
        system: systemPrompt,
        messages: [
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = (errorData as any)?.error?.message || `HTTP ${response.status}`;
      if (response.status === 401) {
        throw new Error("Claude API Key tidak valid. Silakan periksa kembali.");
      }
      throw new Error(`Claude API Error: ${errorMessage}`);
    }

    const data = await response.json() as any;
    const textBlock = data.content?.find((block: any) => block.type === 'text');
    const content = textBlock?.text || data.content?.map((b: any) => b.text).filter(Boolean).join('\n');

    if (!content) {
      console.error("Claude raw response data:", data);
      throw new Error("Claude memberikan respons kosong.");
    }

    // Robust JSON extraction from Claude response
    let result: PsychogramData;
    try {
      result = JSON.parse(content) as PsychogramData;
    } catch {
      // Strategy 1: Strip markdown code block wrappers
      const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
      if (codeBlockMatch) {
        try {
          result = JSON.parse(codeBlockMatch[1].trim()) as PsychogramData;
        } catch {
          result = null as any;
        }
      }

      // Strategy 2: Find the first { ... } JSON object in the text
      if (!result) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            result = JSON.parse(jsonMatch[0]) as PsychogramData;
          } catch {
            result = null as any;
          }
        }
      }

      if (!result) {
        console.error("Claude raw content that failed JSON parse:", content.substring(0, 500));
        throw new SyntaxError("Invalid JSON");
      }
    }

    // Enforce PAPI count
    if (result.papi && Array.isArray(result.papi)) {
      result.papi = result.papi.slice(0, count);
    }

    // Cost tracking
    result.costs = extractedData.costs || [];
    if (data.usage) {
      const inputTokens = data.usage.input_tokens || 0;
      const outputTokens = data.usage.output_tokens || 0;
      const inputCost = (inputTokens / 1_000_000) * CLAUDE_INPUT_USD_PER_1M * USD_TO_IDR;
      const outputCost = (outputTokens / 1_000_000) * CLAUDE_OUTPUT_USD_PER_1M * USD_TO_IDR;

      console.log(`\n%c[Claude Cost] Analisis Psikologi`, 'color: #7c3aed; font-weight: bold; font-size: 13px');
      console.log(`  📥 Input tokens:    ${inputTokens.toLocaleString('id-ID')}`);
      console.log(`  📤 Output tokens:   ${outputTokens.toLocaleString('id-ID')}`);
      console.log(`  💲 Input cost:      Rp ${inputCost.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`  💲 Output cost:     Rp ${outputCost.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      console.log(`  %c💰 TOTAL:           Rp ${(inputCost + outputCost).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'color: #7c3aed; font-weight: bold');
      console.log('');

      result.costs.push({
        model: model,
        task: "Analisis Psikologi (Claude)",
        inputTokens,
        outputTokens,
        totalRupiah: inputCost + outputCost
      });
    }

    return result;

  } catch (error: any) {
    console.error("Claude analysis failed:", error);
    if (error instanceof SyntaxError) {
      throw new Error("Claude mengembalikan format JSON yang tidak valid. Silakan coba lagi.");
    }
    throw new Error(error.message || "Terjadi kesalahan saat memproses data dengan Claude.");
  }
}

export async function translateWithClaude(
  data: PsychogramData,
  targetLang: string = 'English',
  customApiKey?: string
): Promise<PsychogramData['translatedData']['en']> {
  const apiKey = customApiKey || (process.env as any).CLAUDE_API_KEY;
  if (!apiKey) throw new Error("Claude API Key tidak ditemukan.");

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
    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: "user", content: JSON.stringify(payloadToTranslate) },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error("Translation request failed.");
    }

    const responseData = await response.json() as any;
    const textBlock = responseData.content?.find((block: any) => block.type === 'text');
    const content = textBlock?.text || responseData.content?.map((b: any) => b.text).filter(Boolean).join('\n');
    
    if (!content) throw new Error("Translation empty response.");

    // Robust JSON extraction
    let result: any;
    try {
      result = JSON.parse(content);
    } catch {
      const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
      if (codeBlockMatch) {
        try { result = JSON.parse(codeBlockMatch[1].trim()); } catch { result = null; }
      }
      if (!result) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { result = JSON.parse(jsonMatch[0]); } catch { result = null; }
        }
      }
      if (!result) throw new SyntaxError("Translation JSON invalid");
    }

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
    console.error("Claude translation failed:", error);
    throw new Error(error.message || "Failed to translate report.");
  }
}

export async function generatePapiStandardWithClaude(
  jobDesc: string | { data: string, mimeType: string },
  aspectCount: number = 10,
  claudeApiKey: string,
  model: string = CLAUDE_MODEL
): Promise<{ role_summary: string, codes_string: string, papi_aspects: any[] }> {
  if (!claudeApiKey) throw new Error("Claude API Key tidak ditemukan.");

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

Array 'papi_aspects' HARUS berjumlah TEPAT ${aspectCount} elemen.
CRITICAL: Return ONLY valid JSON. Do not include markdown code blocks.`;

  try {
    const response = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": claudeApiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: "user", content: `Analisis JD berikut:\n${jobDescText}` }
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = (errorData as any)?.error?.message || `HTTP ${response.status}`;
      if (response.status === 401) {
        throw new Error("Claude API Key tidak valid. Silakan periksa kembali.");
      }
      throw new Error(`Claude API Error: ${errorMessage}`);
    }

    const data = await response.json() as any;
    const textBlock = data.content?.find((block: any) => block.type === 'text');
    const content = textBlock?.text || data.content?.map((b: any) => b.text).filter(Boolean).join('\n');

    if (!content) {
      console.error("Claude raw response data:", data);
      throw new Error("Claude memberikan respons kosong.");
    }

    // Robust JSON extraction from Claude response
    let result: any;
    try {
      result = JSON.parse(content);
    } catch {
      const codeBlockMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
      if (codeBlockMatch) {
        try { result = JSON.parse(codeBlockMatch[1].trim()); } catch { result = null; }
      }
      if (!result) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { result = JSON.parse(jsonMatch[0]); } catch { result = null; }
        }
      }
      if (!result) {
        console.error("Claude raw content that failed JSON parse:", content.substring(0, 500));
        throw new SyntaxError("Invalid JSON");
      }
    }

    if (result.papi_aspects && Array.isArray(result.papi_aspects)) {
      result.papi_aspects = result.papi_aspects.slice(0, aspectCount);
      result.codes_string = result.papi_aspects.map((item: any) => item.code).join(', ');
    }
    
    return result;

  } catch (error: any) {
    console.error("Claude PAPI generation failed:", error);
    if (error instanceof SyntaxError) {
      throw new Error("Claude mengembalikan format JSON yang tidak valid. Silakan coba lagi.");
    }
    throw new Error(error.message || "Gagal merumuskan standar dengan Claude.");
  }
}
