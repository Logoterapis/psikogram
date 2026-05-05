import React, { useState, useRef } from 'react';
import { Upload, FileText, Briefcase, Target, Info, Loader2, FileUp, X, User, CheckCircle2, Save, FolderOpen, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import mammoth from 'mammoth';
import { cn } from '../lib/utils';
import { generatePapiStandard } from '../lib/gemini';
import { generatePapiStandardWithDeepSeek } from '../lib/deepseek';
import { useJobProfiles } from '../hooks/useJobProfiles';
import { JobProfileAspect } from '../types';

interface InputFormProps {
  onAnalyze: (psikotes: string, cv: string | null, jobDesc: string, papiStandard: string, apiKey: string, model: string, profileAspects?: JobProfileAspect[]) => void;
  isLoading: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ onAnalyze, isLoading }) => {
  const [psikotesFile, setPsikotesFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [jobDesc, setJobDesc] = useState('');
  const [jdFile, setJdFile] = useState<{ data: string, mimeType: string } | null>(null);
  const [papiStandard, setPapiStandard] = useState('G, L, I, T, V, S, R, D, C, E');
  const [jdTab, setJdTab] = useState<'text' | 'file'>('text');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [papiCount, setPapiCount] = useState(10);
  const [isGeneratingPapi, setIsGeneratingPapi] = useState(false);
  const [generatedPapi, setGeneratedPapi] = useState<{ role_summary: string, codes_string: string, papi_aspects: any[] } | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const { profiles, saveProfile, deleteProfile } = useJobProfiles();

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleJdFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      const base64 = await fileToBase64(file);
      setJdFile({ data: base64, mimeType: 'application/pdf' });
      setJobDesc(file.name); // Just to show the filename in the UI
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setJobDesc(result.value);
        setJdFile(null);
      } catch (err) {
        alert("Gagal membaca file Word. Pastikan format file adalah .docx.");
      }
    } else {
      alert("Format file tidak didukung. Gunakan .pdf atau .docx.");
    }
  };

  const handleSubmit = async () => {
    if (!psikotesFile) return alert("Mohon unggah file PDF hasil Psikotes.");
    if (!jobDesc && !jdFile) return alert("Mohon masukkan Job Description.");

    const psikotesBase64 = await fileToBase64(psikotesFile);
    const cvBase64 = cvFile ? await fileToBase64(cvFile) : null;

    const jdPayload = jdFile ? jdFile : jobDesc;

    // Get active profile aspects if available
    const activeProfile = profiles.find(p => p.id === activeProfileId);
    const profileAspects = activeProfile?.papiAspects || (generatedPapi?.papi_aspects?.map(a => ({ code: a.code, name: a.name, ideal_range: a.ideal_range, reason: a.reason })) || undefined);

    onAnalyze(psikotesBase64, cvBase64, jdPayload, papiStandard, "", selectedModel, profileAspects);
  };

  const handleSaveProfile = () => {
    if (!generatedPapi) return;
    const posName = prompt("Masukkan nama posisi/jabatan untuk profil ini:");
    if (!posName) return;
    const saved = saveProfile(
      posName,
      generatedPapi.role_summary,
      generatedPapi.papi_aspects.map(a => ({ code: a.code, name: a.name, ideal_range: a.ideal_range, reason: a.reason })),
      generatedPapi.codes_string
    );
    setActiveProfileId(saved.id);
    alert(`Profil "${posName}" berhasil disimpan!`);
  };

  const handleLoadProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    setActiveProfileId(profileId);
    setPapiStandard(profile.codesString);
    setPapiCount(profile.papiAspects.length);
    setGeneratedPapi({
      role_summary: profile.roleSummary,
      codes_string: profile.codesString,
      papi_aspects: profile.papiAspects,
    });
  };

  const handleGeneratePapi = async () => {
    if (!jobDesc && !jdFile) return alert("Mohon masukkan Job Description terlebih dahulu.");
    
    setIsGeneratingPapi(true);
    try {
      const jdPayload = jdFile ? jdFile : jobDesc;
      let result;
      if (selectedModel === 'deepseek') {
        const deepseekApiKey = (process.env as any).DEEPSEEK_API_KEY;
        result = await generatePapiStandardWithDeepSeek(jdPayload, papiCount, deepseekApiKey, "deepseek-chat");
      } else {
        result = await generatePapiStandard(jdPayload, papiCount, "", "gemini-2.5-flash");
      }
      setGeneratedPapi(result);
      setPapiStandard(result.codes_string);
    } catch (error: any) {
      alert(error.message || "Gagal merumuskan profil standar.");
    } finally {
      setIsGeneratingPapi(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200"
      >
        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
          <div className="p-3 bg-red-600 rounded-2xl shadow-lg shadow-red-200">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Input Data Asesmen</h2>
            <p className="text-sm text-slate-500 font-medium">Lengkapi data kandidat untuk analisis Job Fit</p>
          </div>
        </div>

        {/* API & Model Config */}
        <div className="mb-8 p-6 bg-slate-50 rounded-3xl border border-slate-100">
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Model AI Analisis</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedModel('gemini-2.5-flash')}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  selectedModel === 'gemini-2.5-flash'
                    ? "border-red-500 bg-red-50 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="text-xs font-black text-slate-900 mb-1">🚀 Gemini 2.5 Flash</div>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">Full Gemini — OCR + Analisis dalam satu langkah. Cepat & akurat.</p>
              </button>
              <button
                type="button"
                onClick={() => setSelectedModel('deepseek')}
                className={cn(
                  "p-4 rounded-xl border-2 text-left transition-all",
                  selectedModel === 'deepseek'
                    ? "border-blue-500 bg-blue-50 shadow-md"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="text-xs font-black text-slate-900 mb-1">🧠 DeepSeek (Hybrid)</div>
                <p className="text-[10px] text-slate-500 font-medium leading-tight">Gemini OCR + DeepSeek Analisis. Narasi mendalam & korporat.</p>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Psikotes Upload */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
              <FileUp className="w-4 h-4 text-red-600" /> 1. Hasil Tes (PDF)
            </label>
            <div className={cn(
              "relative border-2 border-dashed rounded-2xl p-6 transition-all group",
              psikotesFile ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-red-400 hover:bg-slate-50"
            )}>
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={(e) => setPsikotesFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="text-center">
                {psikotesFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    <p className="text-sm font-bold text-emerald-700 truncate max-w-full">{psikotesFile.name}</p>
                    <button onClick={(e) => { e.stopPropagation(); setPsikotesFile(null); }} className="text-[10px] uppercase font-black text-emerald-600 hover:text-red-500">Ganti File</button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-slate-300 group-hover:text-red-400 transition-colors" />
                    <p className="text-sm font-bold text-slate-500">Klik atau Drag PDF WPT & PAPI</p>
                    <p className="text-[10px] text-slate-400 font-medium">Maksimal 10MB</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CV Upload */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
              <User className="w-4 h-4 text-blue-600" /> 2. CV / Resume (PDF)
            </label>
            <div className={cn(
              "relative border-2 border-dashed rounded-2xl p-6 transition-all group",
              cvFile ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-blue-400 hover:bg-slate-50"
            )}>
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="text-center">
                {cvFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-blue-500" />
                    <p className="text-sm font-bold text-blue-700 truncate max-w-full">{cvFile.name}</p>
                    <button onClick={(e) => { e.stopPropagation(); setCvFile(null); }} className="text-[10px] uppercase font-black text-blue-600 hover:text-red-500">Ganti File</button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-slate-300 group-hover:text-blue-400 transition-colors" />
                    <p className="text-sm font-bold text-slate-500">Klik atau Drag CV Pelamar</p>
                    <p className="text-[10px] text-slate-400 font-medium">Opsional tapi disarankan</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <label className="flex items-center gap-2 text-sm font-bold text-slate-700 uppercase tracking-wider">
                <Briefcase className="w-4 h-4 text-slate-900" /> 3. Job Description
              </label>
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setJdTab('text')}
                  className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition", jdTab === 'text' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                  Teks
                </button>
                <button 
                  onClick={() => setJdTab('file')}
                  className={cn("px-4 py-1.5 text-xs font-bold rounded-lg transition", jdTab === 'file' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                  File (.docx / .pdf)
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {jdTab === 'text' ? (
                <motion.div 
                  key="text"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <textarea 
                    value={jobDesc}
                    onChange={(e) => { setJobDesc(e.target.value); setJdFile(null); }}
                    rows={5}
                    className="w-full p-4 border border-slate-200 rounded-2xl text-sm focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all bg-slate-50/50"
                    placeholder="Tempelkan tugas, tanggung jawab, dan kualifikasi posisi di sini..."
                  />
                </motion.div>
              ) : (
                <motion.div 
                  key="file"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-4"
                >
                  <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 hover:border-slate-400 transition-all">
                    <input 
                      type="file" 
                      accept=".docx,application/pdf" 
                      onChange={handleJdFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-slate-500">Pilih File (.docx atau .pdf)</p>
                    <p className="text-[10px] text-slate-400 font-medium">Sistem akan mengekstrak teks secara otomatis</p>
                  </div>
                  {jobDesc && (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-emerald-700 uppercase mb-1">
                          {jdFile ? "File PDF Terpilih:" : "Teks Berhasil Diekstrak:"}
                        </p>
                        <p className="text-xs text-emerald-600 truncate italic">"{jobDesc}"</p>
                      </div>
                      <button 
                        onClick={() => { setJobDesc(''); setJdFile(null); }}
                        className="p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-600 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* PAPI Standard */}
          <div className="col-span-1 md:col-span-2 bg-red-50/50 p-6 rounded-3xl border border-red-100 space-y-6">
            {/* Saved Profiles Dropdown */}
            {profiles.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-amber-600" />
                  <label className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Profil Jabatan Tersimpan</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profiles.map(p => (
                    <div key={p.id} className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all",
                      activeProfileId === p.id
                        ? "border-amber-500 bg-amber-50 text-amber-800 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-amber-300"
                    )}>
                      <button onClick={() => handleLoadProfile(p.id)} className="flex items-center gap-1.5">
                        <CheckCircle2 className={cn("w-3.5 h-3.5", activeProfileId === p.id ? "text-amber-500" : "text-slate-300")} />
                        {p.positionName}
                      </button>
                      <button onClick={() => { deleteProfile(p.id); if (activeProfileId === p.id) setActiveProfileId(null); }} className="p-0.5 hover:text-red-500 transition">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                {activeProfileId && (
                  <p className="text-[9px] text-amber-600 font-bold italic">✓ Menggunakan profil tersimpan — parameter akan konsisten di setiap analisis.</p>
                )}
              </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <Info className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-red-900 uppercase tracking-wider">4. Standar {papiCount} Aspek PAPI Kostick (Wajib)</label>
                  <p className="text-[11px] text-red-600 font-medium mt-1">Gunakan {papiCount} kode aspek standar untuk akurasi Job Fit maksimal.</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase">Jumlah Aspek:</label>
                  <select 
                    value={papiCount}
                    onChange={(e) => setPapiCount(parseInt(e.target.value))}
                    className="p-1.5 border border-red-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-red-500/20 outline-none bg-white cursor-pointer"
                  >
                    {[5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button 
                onClick={handleGeneratePapi}
                disabled={isGeneratingPapi}
                className={cn(
                  "px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2",
                  isGeneratingPapi 
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed" 
                    : "bg-slate-900 hover:bg-black text-white"
                )}
              >
                {isGeneratingPapi ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menganalisis JD...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    Bantu Rumuskan Standar
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4">
              <input 
                type="text"
                value={papiStandard}
                onChange={(e) => setPapiStandard(e.target.value)}
                className="w-full p-4 border border-red-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all bg-white text-slate-900"
                placeholder="Contoh: L, P, I, T, V, X, S, B, O, R"
              />

              <AnimatePresence>
                {generatedPapi && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-white border border-red-100 rounded-2xl p-6 shadow-sm space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">Rekomendasi Profil Ideal</h4>
                          <p className="text-[11px] text-slate-500 font-medium mt-1 italic">{generatedPapi.role_summary}</p>
                        </div>
                        <button 
                          onClick={() => setGeneratedPapi(null)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px] border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 uppercase font-bold">
                              <th className="p-2 text-left border-b border-slate-100">Aspek (Kode)</th>
                              <th className="p-2 text-center border-b border-slate-100">Skor Ideal</th>
                              <th className="p-2 text-left border-b border-slate-100">Alasan Kebutuhan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {generatedPapi.papi_aspects.map((item, i) => (
                              <tr key={i} className="hover:bg-slate-50/50 transition">
                                <td className="p-2 font-bold text-slate-800">{item.name} <span className="text-red-600">({item.code})</span></td>
                                <td className="p-2 text-center font-black text-blue-600">{item.ideal_range}</td>
                                <td className="p-2 text-slate-500 leading-relaxed">{item.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] text-red-500 font-bold italic">* Kode di atas telah otomatis diinput ke kolom standar.</p>
                        <button
                          onClick={handleSaveProfile}
                          className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md transition-all hover:-translate-y-0.5"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Simpan Profil Ini
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-100">
          <button 
            onClick={handleSubmit}
            disabled={isLoading}
            className={cn(
              "w-full py-4 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-3",
              isLoading 
                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                : "bg-red-600 hover:bg-red-700 text-white hover:-translate-y-1 active:translate-y-0"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Menganalisis Dokumen...
              </>
            ) : (
              <>
                Mulai Analisis Terpadu
              </>
            )}
          </button>
          <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">Powered by Gemini 2.5 Flash & DeepSeek AI</p>
        </div>
      </motion.div>
    </div>
  );
};

