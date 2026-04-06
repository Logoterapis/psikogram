import { GoogleGenAI, Type } from "@google/genai";
import { PsychogramData } from "../types";

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
      description: "Array berisi TEPAT 7 aspek PAPI Kostick yang paling relevan. TIDAK BOLEH KURANG ATAU LEBIH.",
      items: {
        type: Type.OBJECT,
        properties: {
          aspect_name: { type: Type.STRING },
          code: { type: Type.STRING },
          score: { type: Type.STRING },
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
  customApiKey?: string,
  selectedModel: string = "gemini-2.5-flash"
): Promise<{ role_summary: string, codes_string: string, top_7: any[] }> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key tidak ditemukan.");

  const ai = new GoogleGenAI({ apiKey });

  const systemPrompt = `Anda adalah Ahli Job Profiling HR Sika Indonesia. Analisis Job Description yang diberikan dan tentukan TEPAT 7 Aspek PAPI Kostick (dari 20 aspek: N,G,A,L,P,I,T,V,X,S,B,O,R,D,C,Z,E,K,F,W) yang PALING DIBUTUHKAN untuk kesuksesan di posisi tersebut.`;

  const schema = {
    type: Type.OBJECT,
    properties: {
      role_summary: { type: Type.STRING },
      codes_string: { type: Type.STRING },
      top_7: {
        type: Type.ARRAY,
        description: "Array berisi TEPAT 7 aspek yang paling dibutuhkan. Dilarang keras memberikan lebih atau kurang dari 7.",
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

  try {
    const response = await ai.models.generateContent({
      model: selectedModel,
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
    if (result.top_7 && Array.isArray(result.top_7)) {
      result.top_7 = result.top_7.slice(0, 7);
      // Force codes_string to match the top 7 only
      result.codes_string = result.top_7.map((item: any) => item.code).join(', ');
    }
    return result;
  } catch (error: any) {
    console.error("PAPI Profiling failed:", error);
    throw new Error(error.message || "Gagal merumuskan profil standar.");
  }
}

export async function analyzePsychogram(
  psikotesBase64: string,
  cvBase64: string | null,
  jobDesc: string | { data: string, mimeType: string },
  papiStandard: string,
  customApiKey?: string,
  selectedModel: string = "gemini-2.5-flash"
): Promise<PsychogramData> {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("API Key tidak ditemukan. Silakan masukkan API Key di kolom yang tersedia.");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const papiInstruction = papiStandard 
      ? `SAYA TELAH MENETAPKAN STANDAR UNTUK JABATAN INI. ANDA WAJIB MENGEVALUASI DAN HANYA MENGEMBALIKAN TEPAT 7 ASPEK BERIKUT DALAM ARRAY 'papi': [${papiStandard}]. 
         DILARANG KERAS memasukkan aspek lain di luar daftar 7 kode tersebut. 
         Pastikan jumlah objek dalam array 'papi' ADALAH TEPAT 7.`
      : `PILIH TEPAT 7 ASPEK PAPI KOSTICK yang PALING KRUSIAL untuk sukses di posisi tersebut. 
         Array 'papi' dalam JSON HARUS berisi tepat 7 objek (TIDAK BOLEH LEBIH, TIDAK BOLEH KURANG).`;

    const systemPrompt = `Anda adalah Ahli Ekstraksi Dokumen Vision AI dan Psikolog Senior HR Sika Indonesia.
TUGAS UTAMA ANDA ADALAH MELAKUKAN OCR VISUAL PADA DOKUMEN PDF YANG DIBERIKAN DAN MEMBERIKAN ANALISIS JOB FIT.

PANDUAN EKSTRAKSI DOKUMEN (HASIL PSIKOTES):
1. CARI TEKS "Raw Score (RS)" -> Ambil angka di sebelahnya (0-50).
2. CARI TEKS "Estimasi IQ" -> Ambil angka di sebelahnya (misal: 110).
3. CARI TABEL "PAPI KOSTICK" -> Ekstrak data skor untuk 20 aspek sebagai referensi internal Anda.

PANDUAN OUTPUT JSON (SANGAT PENTING):
1. Array 'papi' dalam JSON output HARUS BERISI TEPAT 7 OBJEK.
2. ${papiInstruction}
3. Untuk setiap aspek dalam array 'papi', berikan interpretasi mendalam (minimal 2 kalimat) dan alasan relevansinya terhadap Job Desc.
4. Hitung 'match_percentage' untuk setiap aspek berdasarkan seberapa dekat skor kandidat dengan skor ideal untuk posisi tersebut.
5. 'total_job_fit_percentage' adalah rata-rata tertimbang dari Kognitif (40%) dan PAPI (60%).

KUALITAS ANALISIS:
- Jangan memberikan nilai null atau "-" jika angka terlihat di dokumen.
- Gunakan bahasa Indonesia yang profesional, tegas, dan analitis.
- Jika CV tersedia, hubungkan temuan psikotes dengan pengalaman kerja nyata kandidat.

OUTPUT HARUS JSON LENGKAP SESUAI SCHEMA DENGAN TEPAT 7 ASPEK PAPI.`;

    const jobDescPart = typeof jobDesc === 'string' 
      ? { text: `JOB DESCRIPTION:\n${jobDesc}` }
      : { inlineData: { mimeType: jobDesc.mimeType, data: jobDesc.data } };

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
          { text: `STANDAR PAPI (JIKA ADA):\n${papiStandard}` }
        ]
      }
    ];

    const response = await ai.models.generateContent({
      model: selectedModel,
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
      result.papi = result.papi.slice(0, 7);
    }
    return result;

  } catch (error: any) {
    console.error(`Analysis failed with model ${selectedModel}:`, error);
    if (error.message?.includes('API_KEY_INVALID')) {
      throw new Error("API Key tidak valid. Silakan periksa kembali kode API Anda.");
    }
    throw new Error(error.message || "Terjadi kesalahan saat memproses data. Silakan coba lagi.");
  }
}
