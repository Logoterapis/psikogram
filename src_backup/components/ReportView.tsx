import React, { useRef } from 'react';
import { PsychogramData } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { FileDown, ArrowLeft, CheckCircle2, AlertCircle, HelpCircle, User, Briefcase, Calendar, Brain, FileText, Target, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface ReportViewProps {
  data: PsychogramData;
  onBack: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ data, onBack }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  if (!data) return null;

  const radarData = (data.papi || []).map(p => ({
    subject: p.code || '?',
    A: parseInt(p.score) || 0,
    fullMark: 9,
  }));

  const downloadPdf = () => {
    window.print();
  };

  const getStatusColor = (status: string = '') => {
    const s = status.toUpperCase();
    if (s.includes('TIDAK')) return 'text-red-600 bg-red-50 border-red-200';
    if (s.includes('PERTIMBANGKAN')) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const getStatusIcon = (status: string = '') => {
    const s = status.toUpperCase();
    if (s.includes('TIDAK')) return <AlertCircle className="w-6 h-6" />;
    if (s.includes('PERTIMBANGKAN')) return <HelpCircle className="w-6 h-6" />;
    return <CheckCircle2 className="w-6 h-6" />;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 sticky top-4 z-10 no-print">
        <button 
          onClick={onBack}
          className="text-slate-500 hover:text-slate-800 text-sm font-semibold flex items-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
        <button 
          onClick={downloadPdf}
          className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md flex items-center gap-2 transition"
        >
          <FileDown className="w-4 h-4" /> Print / Save as PDF
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        ref={reportRef}
        className="bg-white p-12 shadow-2xl mx-auto w-[210mm] min-h-[297mm] text-slate-800 font-sans"
      >
        {/* Header */}
        <div className="text-center border-b-4 border-red-600 pb-6 mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight mb-1 text-slate-900">Laporan Pemeriksaan Psikologi</h1>
          <h2 className="text-lg font-bold text-red-600 uppercase tracking-widest">Comprehensive Job Fit Analysis</h2>
        </div>

        {/* Identity */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4 bg-slate-100 p-2 rounded-r-lg border-l-4 border-red-600">
            <User className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider">I. Identitas Kandidat</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm ml-4">
            <div className="flex border-b border-slate-100 py-1">
              <span className="w-32 font-semibold text-slate-500">Nama Lengkap</span>
              <span className="font-bold text-slate-800">: {data.identity?.name || '-'}</span>
            </div>
            <div className="flex border-b border-slate-100 py-1">
              <span className="w-32 font-semibold text-slate-500">Posisi Dilamar</span>
              <span className="font-bold text-slate-800">: {data.identity?.position || '-'}</span>
            </div>
            <div className="flex border-b border-slate-100 py-1">
              <span className="w-32 font-semibold text-slate-500">Tanggal Analisis</span>
              <span className="font-bold text-slate-800">: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </section>

        {/* Cognitive */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4 bg-slate-100 p-2 rounded-r-lg border-l-4 border-red-600">
            <Brain className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider">II. Profil Kognitif & Intelektual (WPT)</h3>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-4 ml-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Raw Score</p>
              <p className="text-xl font-black text-slate-900">{data.cognitive?.raw_score || '-'}<span className="text-xs font-normal text-slate-400 ml-1">/50</span></p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Estimasi IQ</p>
              <p className="text-xl font-black text-blue-600">{data.cognitive?.iq || '-'}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Kategori</p>
              <p className="text-sm font-black text-red-600">{data.cognitive?.category || '-'}</p>
            </div>
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
              <p className="text-[10px] text-blue-100 uppercase font-bold mb-1">Match Rate</p>
              <p className="text-xl font-black text-white">{data.cognitive?.match_percentage || 0}%</p>
            </div>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed text-justify ml-4 italic">
            "{data.cognitive?.description || 'Deskripsi tidak tersedia.'}"
          </p>
        </section>

        {/* CV Evaluation */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4 bg-slate-100 p-2 rounded-r-lg border-l-4 border-blue-600">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-900">III. Evaluasi CV & Pengalaman Kerja</h3>
          </div>
          <div className="ml-4 border border-slate-200 rounded-2xl p-6 bg-[#fbfcfd]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h4 className="font-bold text-sm text-slate-900 mb-2">Ringkasan Kualifikasi</h4>
                <p className="text-sm text-slate-700 leading-relaxed">{data.cv_evaluation?.summary || 'Ringkasan tidak tersedia.'}</p>
              </div>
              <div className="ml-8 text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">CV Match</div>
                <div className="text-3xl font-black text-blue-600">{data.cv_evaluation?.match_percentage || 0}%</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Poin Plus
                </h5>
                <ul className="space-y-1">
                  {(data.cv_evaluation?.pros || []).map((pro, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-red-700 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Gap Kompetensi
                </h5>
                <ul className="space-y-1">
                  {(data.cv_evaluation?.cons || []).map((con, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-red-400 shrink-0" />
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* PAPI Radar */}
        <section className="mb-8 page-break-before">
          <div className="flex items-center gap-2 mb-4 bg-slate-100 p-2 rounded-r-lg border-l-4 border-red-600">
            <Target className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider">IV. Profil Sikap Kerja (PAPI Kostick)</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-8 ml-4 items-center">
            <div className="h-[300px] bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#cbd5e1" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 700 }} />
                  <Radar
                    name="Kandidat"
                    dataKey="A"
                    stroke="#dc2626"
                    fill="#dc2626"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
              <p className="text-[10px] text-center text-slate-400 mt-2 font-medium italic">Visualisasi {data.papi?.length || 0} Aspek Krusial Jabatan</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-600 p-4 rounded-2xl shadow-lg text-white">
                <p className="text-xs font-bold uppercase text-white/80 mb-1">Rata-rata Match PAPI</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black">
                    {data.papi?.length ? Math.round(data.papi.reduce((acc, curr) => acc + (curr.match_percentage || 0), 0) / data.papi.length) : 0}%
                  </span>
                  <span className="text-sm font-medium text-white/80">Kesesuaian Karakter</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed italic">
                Grafik di samping menunjukkan profil kepribadian kandidat pada {data.papi?.length || 0} aspek yang paling relevan dengan tuntutan posisi ini.
              </p>
            </div>
          </div>

          <div className="mt-6 ml-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 uppercase font-bold">
                  <th className="p-2 text-left border-b border-slate-200">Aspek Krusial</th>
                  <th className="p-2 text-center border-b border-slate-200">Skor</th>
                  <th className="p-2 text-left border-b border-slate-200">Interpretasi & Relevansi</th>
                  <th className="p-2 text-center border-b border-slate-200">Fit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(data.papi || []).map((p, i) => (
                  <tr key={i} className="hover:bg-[#fbfcfd] transition">
                    <td className="p-2 font-bold text-slate-800">{p.aspect_name || '-'} ({p.code || '?'})</td>
                    <td className="p-2 text-center font-black text-slate-900">{p.score || '-'}</td>
                    <td className="p-2 text-slate-600 leading-tight">
                      <span className="font-semibold text-slate-800">{p.interpretation || '-'}</span>
                      <br />
                      <span className="text-[9px] italic text-slate-400">{p.relevance_reason || '-'}</span>
                    </td>
                    <td className="p-2 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full font-bold uppercase text-[9px]",
                        (p.fit || '').toLowerCase().includes('tinggi') ? "bg-emerald-100 text-emerald-700" :
                        (p.fit || '').toLowerCase().includes('rendah') ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {p.fit || 'Sedang'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Conclusion */}
        <section className="mt-12">
          <div className="flex items-center gap-2 mb-6 bg-slate-900 p-3 rounded-lg text-white">
            <Award className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-bold uppercase tracking-widest">V. Kesimpulan & Rekomendasi Akhir</h3>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="col-span-1 bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Total Job Fit</p>
              <div className="text-5xl font-black text-slate-900 mb-1">{data.conclusion?.total_job_fit_percentage || 0}%</div>
              <p className="text-[10px] text-slate-400 font-medium">Weighted Score</p>
            </div>
            
            <div className={cn(
              "col-span-2 p-6 rounded-2xl border-2 flex items-center gap-6",
              getStatusColor(data.conclusion?.status)
            )}>
              <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                {getStatusIcon(data.conclusion?.status)}
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Status Rekomendasi</p>
                <h4 className="text-2xl font-black tracking-tight uppercase">{data.conclusion?.status || 'MENUNGGU HASIL'}</h4>
              </div>
            </div>
          </div>

          <div className="space-y-6 ml-4">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Kekuatan Utama
                </h5>
                <ul className="space-y-2">
                  {(data.analysis?.strengths || []).map((s, i) => (
                    <li key={i} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                      <span className="mt-2 w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Area Risiko
                </h5>
                <ul className="space-y-2">
                  {(data.analysis?.risks || []).map((r, i) => (
                    <li key={i} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                      <span className="mt-2 w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Catatan Khusus & Saran Wawancara</h5>
              <p className="text-sm text-slate-600 leading-relaxed italic">
                "{data.conclusion?.notes || 'Tidak ada catatan tambahan.'}"
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
            Confidential Document
          </p>
        </div>
      </motion.div>
    </div>
  );
};
