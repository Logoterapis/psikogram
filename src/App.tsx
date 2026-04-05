import React, { useState } from 'react';
import { InputForm } from './components/InputForm';
import { ReportView } from './components/ReportView';
import { HistoryList } from './components/HistoryList';
import { useHistory } from './hooks/useHistory';
import { analyzePsychogram } from './lib/gemini';
import { PsychogramData } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, Sparkles, ShieldCheck } from 'lucide-react';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<PsychogramData | null>(null);
  const { history, saveToHistory, deleteFromHistory, clearHistory } = useHistory();

  const handleAnalyze = async (psikotes: string, cv: string | null, jobDesc: string | { data: string, mimeType: string }, papiStandard: string, apiKey: string, model: string) => {
    setIsLoading(true);
    try {
      const data = await analyzePsychogram(psikotes, cv, jobDesc, papiStandard, apiKey, model);
      setReportData(data);
      saveToHistory(data);
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Analisis gagal. Silakan coba lagi atau periksa file Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-red-100 selection:text-red-900">
      {/* Header */}
      <header className="bg-white border-b-4 border-yellow-400 shadow-sm py-6 sticky top-0 z-50 no-print">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-red-600 rounded-xl shadow-lg">
              <BrainCircuit className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-none tracking-tight">
                AI Psikogram <span className="text-red-600">Generator</span>
              </h1>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                Sika Indonesia • HR Assessment System
              </p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure Data
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-500" /> AI Powered
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!reportData ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4, ease: "circOut" }}
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Analisis Job Fit Berbasis AI</h2>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
                  Sistem cerdas untuk mengevaluasi kesesuaian kognitif, kepribadian, dan pengalaman kerja kandidat secara otomatis.
                </p>
              </div>
              <InputForm onAnalyze={handleAnalyze} isLoading={isLoading} />
              <HistoryList 
                history={history}
                onView={(item) => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setReportData(item.data);
                }}
                onDelete={deleteFromHistory}
                onClearAll={clearHistory}
              />
            </motion.div>
          ) : (
            <motion.div
              key="report"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5, ease: "circOut" }}
            >
              <ReportView data={reportData} onBack={() => setReportData(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 mt-20 no-print">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <BrainCircuit className="w-6 h-6 text-red-500" />
              <span className="text-lg font-black tracking-tight">AI Psikogram</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Membantu tim HR Sika Indonesia dalam pengambilan keputusan rekrutmen yang lebih objektif dan berbasis data.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Teknologi</h4>
            <ul className="text-sm text-slate-400 space-y-2 font-medium">
              <li>Google Gemini 2.5 Flash</li>
              <li>Vision AI Document Extraction</li>
              <li>PAPI Kostick Standard Analysis</li>
              <li>WPT Cognitive Evaluation</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Keamanan</h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Seluruh data dokumen diproses secara terenkripsi dan tidak disimpan secara permanen di server AI.
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-center">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
            © 2026 Sika Indonesia • HR Department • Internal Use Only
          </p>
        </div>
      </footer>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center text-white p-6">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-8"
          >
            <BrainCircuit className="w-20 h-20 text-red-500" />
          </motion.div>
          <h3 className="text-2xl font-black mb-2 tracking-tight">AI Sedang Menganalisis...</h3>
          <p className="text-slate-400 text-center max-w-md font-medium">
            Mengekstrak data visual dari PDF, mengevaluasi CV, dan menghitung skor Job Fit kandidat. Mohon tunggu sebentar.
          </p>
          <div className="mt-8 w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-full h-full bg-red-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
