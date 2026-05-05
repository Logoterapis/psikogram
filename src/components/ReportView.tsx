import React, { useRef, useState } from 'react';
import { PsychogramData } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { FileDown, ArrowLeft, CheckCircle2, AlertCircle, HelpCircle, AlertTriangle, User, Briefcase, Calendar, Brain, FileText, Target, Award, Globe, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { translateWithDeepSeek } from '../lib/deepseek';

type Lang = 'id' | 'en';

const t = {
  id: {
    reportTitle: 'Laporan Pemeriksaan Psikologi',
    reportSubtitle: 'Comprehensive Job Fit Analysis',
    back: 'Kembali',
    print: 'Print / Save as PDF',
    sectionIdentity: 'I. Identitas Kandidat',
    sectionCognitive: 'II. Profil Kognitif & Intelektual (WPT)',
    sectionCV: 'III. Evaluasi CV & Pengalaman Kerja',
    sectionPAPI: 'IV. Profil Sikap Kerja (PAPI Kostick)',
    sectionConclusion: 'V. Kesimpulan & Rekomendasi Akhir',
    fullName: 'Nama Lengkap',
    position: 'Posisi Dilamar',
    analysisDate: 'Tanggal Analisis',
    rawScore: 'Raw Score',
    estIQ: 'Estimasi IQ',
    category: 'Kategori',
    matchRate: 'Match Rate',
    descNA: 'Deskripsi tidak tersedia.',
    cvSummary: 'Ringkasan Kualifikasi',
    cvSummaryNA: 'Ringkasan tidak tersedia.',
    cvMatch: 'CV Match',
    pros: 'Poin Plus',
    cons: 'Gap Kompetensi',
    papiAvgMatch: 'Rata-rata Match PAPI',
    papiCharMatch: 'Kesesuaian Karakter',
    papiChartDesc: (n: number) => `Grafik di samping menunjukkan profil kepribadian kandidat pada ${n} aspek yang paling relevan dengan tuntutan posisi ini.`,
    papiChartLabel: (n: number) => `Visualisasi ${n} Aspek Krusial Jabatan`,
    thCrucial: 'Aspek Krusial',
    thScore: 'Skor (Ideal)',
    thInterpretation: 'Interpretasi & Relevansi',
    thFit: 'Fit',
    target: 'TARGET',
    totalJobFit: 'Total Job Fit',
    weightedScore: 'Weighted Score',
    statusLabel: 'Status Rekomendasi',
    waiting: 'MENUNGGU HASIL',
    evalCV: 'Evaluasi CV',
    cogWPT: 'Kognitif (WPT)',
    papiKostick: 'PAPI Kostick',
    weight: 'Bobot',
    contribution: 'Kontribusi',
    strengths: 'Kekuatan Utama',
    risks: 'Area Risiko',
    notes: 'Catatan Khusus & Saran Wawancara',
    notesNA: 'Tidak ada catatan tambahan.',
    confidential: 'Confidential Document',
    statusRecommended: 'DISARANKAN',
    statusFairly: 'CUKUP DISARANKAN',
    statusLess: 'KURANG DISARANKAN',
    statusNot: 'TIDAK DISARANKAN',
    printHeader: 'Laporan Pemeriksaan Psikologi',
    printFooterPrefix: 'Confidential • Sika Indonesia HR Assessment •',
  },
  en: {
    reportTitle: 'Psychological Assessment Report',
    reportSubtitle: 'Comprehensive Job Fit Analysis',
    back: 'Back',
    print: 'Print / Save as PDF',
    sectionIdentity: 'I. Candidate Identity',
    sectionCognitive: 'II. Cognitive & Intellectual Profile (WPT)',
    sectionCV: 'III. CV & Work Experience Evaluation',
    sectionPAPI: 'IV. Work Attitude Profile (PAPI Kostick)',
    sectionConclusion: 'V. Conclusion & Final Recommendation',
    fullName: 'Full Name',
    position: 'Applied Position',
    analysisDate: 'Analysis Date',
    rawScore: 'Raw Score',
    estIQ: 'Estimated IQ',
    category: 'Category',
    matchRate: 'Match Rate',
    descNA: 'Description not available.',
    cvSummary: 'Qualification Summary',
    cvSummaryNA: 'Summary not available.',
    cvMatch: 'CV Match',
    pros: 'Strengths',
    cons: 'Competency Gaps',
    papiAvgMatch: 'Average PAPI Match',
    papiCharMatch: 'Character Fit',
    papiChartDesc: (n: number) => `The chart shows the candidate's personality profile across ${n} aspects most relevant to the position requirements.`,
    papiChartLabel: (n: number) => `Visualization of ${n} Critical Job Aspects`,
    thCrucial: 'Critical Aspect',
    thScore: 'Score (Ideal)',
    thInterpretation: 'Interpretation & Relevance',
    thFit: 'Fit',
    target: 'TARGET',
    totalJobFit: 'Total Job Fit',
    weightedScore: 'Weighted Score',
    statusLabel: 'Recommendation Status',
    waiting: 'AWAITING RESULTS',
    evalCV: 'CV Evaluation',
    cogWPT: 'Cognitive (WPT)',
    papiKostick: 'PAPI Kostick',
    weight: 'Weight',
    contribution: 'Contribution',
    strengths: 'Key Strengths',
    risks: 'Risk Areas',
    notes: 'Special Notes & Interview Suggestions',
    notesNA: 'No additional notes.',
    confidential: 'Confidential Document',
    statusRecommended: 'RECOMMENDED',
    statusFairly: 'FAIRLY RECOMMENDED',
    statusLess: 'LESS RECOMMENDED',
    statusNot: 'NOT RECOMMENDED',
    printHeader: 'Psychological Assessment Report',
    printFooterPrefix: 'Confidential • Sika Indonesia HR Assessment •',
  },
};

function getRecommendationStatus(score: number, lang: Lang) {
  const labels = t[lang];
  if (score >= 70) return labels.statusRecommended;
  if (score >= 60) return labels.statusFairly;
  if (score >= 50) return labels.statusLess;
  return labels.statusNot;
}

function getScoreStatusColor(score: number) {
  if (score >= 70) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
  if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

function getScoreStatusIcon(score: number) {
  if (score >= 70) return <CheckCircle2 className="w-6 h-6" />;
  if (score >= 60) return <HelpCircle className="w-6 h-6" />;
  if (score >= 50) return <AlertTriangle className="w-6 h-6" />;
  return <AlertCircle className="w-6 h-6" />;
}

interface ReportViewProps {
  data: PsychogramData;
  onBack: () => void;
  onUpdate?: (data: PsychogramData) => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ data, onBack, onUpdate }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [lang, setLang] = useState<Lang>('id');
  const [isTranslating, setIsTranslating] = useState(false);
  const L = t[lang];

  if (!data) return null;

  const displayData = lang === 'en' && data.translatedData?.en
    ? { ...data, ...data.translatedData.en }
    : data;

  const handleToggleLang = async () => {
    if (lang === 'id') {
      if (!data.translatedData?.en) {
        setIsTranslating(true);
        try {
          const translatedEn = await translateWithDeepSeek(data, 'English');
          const newData = { ...data, translatedData: { ...data.translatedData, en: translatedEn } };
          if (onUpdate) onUpdate(newData);
          setLang('en');
        } catch (err) {
          alert("Gagal menerjemahkan laporan. Silakan coba lagi.");
        } finally {
          setIsTranslating(false);
        }
      } else {
        setLang('en');
      }
    } else {
      setLang('id');
    }
  };

  const radarData = (data.papi || []).map(p => ({
    subject: p.code || '?',
    A: parseInt(p.score) || 0,
    fullMark: 9,
  }));

  // ============================================================
  // CALCULATED Total Job Fit = CV (34%) + Kognitif (33%) + PAPI (33%)
  // ============================================================
  const cvMatchScore = displayData.cv_evaluation?.match_percentage || 0;
  const cognitiveMatchScore = displayData.cognitive?.match_percentage || 0;
  const papiAvgMatch = displayData.papi?.length
    ? Math.round(displayData.papi.reduce((acc, curr) => acc + (curr.match_percentage || 0), 0) / displayData.papi.length)
    : 0;

  const calculatedTotalJobFit = Math.round(
    (cvMatchScore * 0.34) + (cognitiveMatchScore * 0.33) + (papiAvgMatch * 0.33)
  );

  const downloadPdf = () => {
    window.print();
  };

  const recommendationStatus = getRecommendationStatus(calculatedTotalJobFit, lang);
  const statusColor = getScoreStatusColor(calculatedTotalJobFit);
  const statusIcon = getScoreStatusIcon(calculatedTotalJobFit);

  const dateStr = lang === 'id'
    ? new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 sticky top-4 z-10 no-print">
        <button 
          onClick={onBack}
          className="text-slate-500 hover:text-slate-800 text-sm font-semibold flex items-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" /> {L.back}
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleLang}
            disabled={isTranslating}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm font-bold transition",
              isTranslating 
                ? "border-slate-100 bg-slate-100 text-slate-400 cursor-wait" 
                : "border-slate-200 hover:border-slate-400 text-slate-600 bg-slate-50 hover:bg-white"
            )}
          >
            {isTranslating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Globe className="w-4 h-4" />
            )}
            {isTranslating ? (lang === 'id' ? 'Translating...' : 'Menerjemahkan...') : (lang === 'id' ? '🇮🇩 ID' : '🇬🇧 EN')}
          </button>
          <button 
            onClick={downloadPdf}
            className="bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-lg font-bold text-sm shadow-md flex items-center gap-2 transition"
          >
            <FileDown className="w-4 h-4" /> {L.print}
          </button>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        ref={reportRef}
        className="bg-white p-12 shadow-2xl mx-auto w-[210mm] min-h-[297mm] text-slate-800 font-sans relative"
      >
        {/* Repeating Print Header - appears on every printed page */}
        <div className="print-header hidden">
          <span style={{ fontSize: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#0f172a' }}>
            {L.printHeader}
          </span>
          <span style={{ fontSize: '7px', fontWeight: 700, color: '#64748b' }}>
            {displayData.identity?.name || '-'} — {displayData.identity?.position || '-'}
          </span>
        </div>

        {/* Repeating Print Footer - appears on every printed page */}
        <div className="print-footer hidden">
          <span style={{ fontSize: '7px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            {L.printFooterPrefix} {dateStr}
          </span>
        </div>
        {/* Header */}
        <div className="text-center border-b-4 border-red-600 pb-6 mb-8">
          <h1 className="text-3xl font-black uppercase tracking-tight mb-1 text-slate-900">{L.reportTitle}</h1>
          <h2 className="text-lg font-bold text-red-600 uppercase tracking-widest">{L.reportSubtitle}</h2>
        </div>

        {/* Identity */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4 bg-slate-100 p-2 rounded-r-lg border-l-4 border-red-600">
            <User className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider">{L.sectionIdentity}</h3>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm ml-4">
            <div className="flex border-b border-slate-100 py-1">
              <span className="w-32 font-semibold text-slate-500">{L.fullName}</span>
              <span className="font-bold text-slate-800">: {displayData.identity?.name || '-'}</span>
            </div>
            <div className="flex border-b border-slate-100 py-1">
              <span className="w-32 font-semibold text-slate-500">{L.position}</span>
              <span className="font-bold text-slate-800">: {displayData.identity?.position || '-'}</span>
            </div>
            <div className="flex border-b border-slate-100 py-1">
              <span className="w-32 font-semibold text-slate-500">{L.analysisDate}</span>
              <span className="font-bold text-slate-800">: {dateStr}</span>
            </div>
          </div>
        </section>

        {/* Cognitive */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4 bg-slate-100 p-2 rounded-r-lg border-l-4 border-red-600">
            <Brain className="w-4 h-4 text-red-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider">{L.sectionCognitive}</h3>
          </div>
          <div className="grid grid-cols-4 gap-4 mb-4 ml-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{L.rawScore}</p>
              <p className="text-xl font-black text-slate-900">{displayData.cognitive?.raw_score || '-'}<span className="text-xs font-normal text-slate-400 ml-1">/50</span></p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{L.estIQ}</p>
              <p className="text-xl font-black text-blue-600">{displayData.cognitive?.iq || '-'}</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{L.category}</p>
              <p className="text-sm font-black text-red-600">{displayData.cognitive?.category || '-'}</p>
            </div>
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
              <p className="text-[10px] text-blue-100 uppercase font-bold mb-1">{L.matchRate}</p>
              <p className="text-xl font-black text-white">{displayData.cognitive?.match_percentage || 0}%</p>
            </div>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed text-justify ml-4 italic">
            "{displayData.cognitive?.description || L.descNA}"
          </p>
        </section>

        {/* CV Evaluation */}
        <section className="mb-8 page-break-before">
          <div className="flex items-center gap-2 mb-4 bg-slate-100 p-2 rounded-r-lg border-l-4 border-blue-600">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-blue-900">{L.sectionCV}</h3>
          </div>
          <div className="ml-4 border border-slate-200 rounded-2xl p-6 bg-[#fbfcfd]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h4 className="font-bold text-sm text-slate-900 mb-2">{L.cvSummary}</h4>
                <p className="text-sm text-slate-700 leading-relaxed">{displayData.cv_evaluation?.summary || L.cvSummaryNA}</p>
              </div>
              <div className="ml-8 text-right">
                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{L.cvMatch}</div>
                <div className="text-3xl font-black text-blue-600">{displayData.cv_evaluation?.match_percentage || 0}%</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {L.pros}
                </h5>
                <ul className="space-y-1">
                  {(displayData.cv_evaluation?.pros || []).map((pro, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-emerald-400 shrink-0" />
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-red-700 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {L.cons}
                </h5>
                <ul className="space-y-1">
                  {(displayData.cv_evaluation?.cons || []).map((con, i) => (
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
            <h3 className="text-sm font-bold uppercase tracking-wider">{L.sectionPAPI}</h3>
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
              <p className="text-[10px] text-center text-slate-400 mt-2 font-medium italic">{L.papiChartLabel(displayData.papi?.length || 0)}</p>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-600 p-4 rounded-2xl shadow-lg text-white">
                <p className="text-xs font-bold uppercase text-white/80 mb-1">{L.papiAvgMatch}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black">
                    {displayData.papi?.length ? Math.round(displayData.papi.reduce((acc, curr) => acc + (curr.match_percentage || 0), 0) / displayData.papi.length) : 0}%
                  </span>
                  <span className="text-sm font-medium text-white/80">{L.papiCharMatch}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed italic">
                {L.papiChartDesc(displayData.papi?.length || 0)}
              </p>
            </div>
          </div>

          <div className="mt-6 ml-4 overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-[10px] border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 uppercase font-bold">
                  <th className="p-2 text-left border-b border-slate-200">{L.thCrucial}</th>
                  <th className="p-2 text-center border-b border-slate-200">{L.thScore}</th>
                  <th className="p-2 text-left border-b border-slate-200">{L.thInterpretation}</th>
                  <th className="p-2 text-center border-b border-slate-200">{L.thFit}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(displayData.papi || []).map((p, i) => (
                  <tr key={i} className="hover:bg-[#fbfcfd] transition">
                    <td className="p-2 font-bold text-slate-800">{p.aspect_name || '-'} ({p.code || '?'})</td>
                    <td className="p-2 text-center">
                      <div className="font-black text-slate-900 text-sm">{p.score || '-'}</div>
                      <div className="text-[9px] font-bold text-slate-400 mt-0.5">{L.target}: {p.ideal_score || '-'}</div>
                    </td>
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
        <section className="mt-12 page-break-before">
          <div className="flex items-center gap-2 mb-6 bg-slate-900 p-3 rounded-lg text-white">
            <Award className="w-5 h-5 text-red-500" />
            <h3 className="text-base font-bold uppercase tracking-widest">{L.sectionConclusion}</h3>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="col-span-1 bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 flex flex-col items-center justify-center text-center">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">{L.totalJobFit}</p>
              <div className="text-5xl font-black text-slate-900 mb-1">{calculatedTotalJobFit}%</div>
              <p className="text-[10px] text-slate-400 font-medium">{L.weightedScore}</p>
            </div>
            
            <div className={cn(
              "col-span-2 p-6 rounded-2xl border-2 flex items-center gap-6",
              statusColor
            )}>
              <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100">
                {statusIcon}
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-slate-400 mb-1">{L.statusLabel}</p>
                <h4 className="text-2xl font-black tracking-tight uppercase">{recommendationStatus}</h4>
              </div>
            </div>
          </div>

          {/* Job Fit Breakdown */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-bold text-blue-500 uppercase">{L.evalCV}</p>
                <span className="text-xs font-black text-blue-700">{L.weight} 34%</span>
              </div>
              <div className="text-2xl font-black text-blue-700 mb-2">{cvMatchScore}%</div>
              <div className="w-full bg-blue-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${cvMatchScore}%` }} />
              </div>
              <p className="text-[9px] text-blue-400 mt-1 font-medium">{L.contribution}: {Math.round(cvMatchScore * 0.34)}%</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-bold text-purple-500 uppercase">{L.cogWPT}</p>
                <span className="text-xs font-black text-purple-700">{L.weight} 33%</span>
              </div>
              <div className="text-2xl font-black text-purple-700 mb-2">{cognitiveMatchScore}%</div>
              <div className="w-full bg-purple-100 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${cognitiveMatchScore}%` }} />
              </div>
              <p className="text-[9px] text-purple-400 mt-1 font-medium">{L.contribution}: {Math.round(cognitiveMatchScore * 0.33)}%</p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-200">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-bold text-red-500 uppercase">{L.papiKostick}</p>
                <span className="text-xs font-black text-red-700">{L.weight} 33%</span>
              </div>
              <div className="text-2xl font-black text-red-700 mb-2">{papiAvgMatch}%</div>
              <div className="w-full bg-red-100 rounded-full h-2">
                <div className="bg-red-600 h-2 rounded-full transition-all" style={{ width: `${papiAvgMatch}%` }} />
              </div>
              <p className="text-[9px] text-red-400 mt-1 font-medium">{L.contribution}: {Math.round(papiAvgMatch * 0.33)}%</p>
            </div>
          </div>

          <div className="space-y-6 ml-4">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {L.strengths}
                </h5>
                <ul className="space-y-2">
                  {(displayData.analysis?.strengths || []).map((s, i) => (
                    <li key={i} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                      <span className="mt-2 w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {L.risks}
                </h5>
                <ul className="space-y-2">
                  {(displayData.analysis?.risks || []).map((r, i) => (
                    <li key={i} className="text-sm text-slate-600 leading-relaxed flex items-start gap-2">
                      <span className="mt-2 w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 catatan-khusus">
              <h5 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">{L.notes}</h5>
              <p className="text-sm text-slate-600 leading-relaxed italic">
                "{displayData.conclusion?.notes || L.notesNA}"
              </p>
            </div>
          </div>
        </section>



        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
            {L.confidential}
          </p>
        </div>
      </motion.div>
    </div>
  );
};
