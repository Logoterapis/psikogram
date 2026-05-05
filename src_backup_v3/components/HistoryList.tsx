import React from 'react';
import { motion } from 'motion/react';
import { HistoryItem } from '../hooks/useHistory';
import { Trash2, Eye, Calendar, User, Briefcase, History } from 'lucide-react';

interface HistoryListProps {
  history: HistoryItem[];
  onView: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function HistoryList({ history, onView, onDelete, onClearAll }: HistoryListProps) {
  if (history.length === 0) return null;

  return (
    <div className="mt-16 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-800">Riwayat Analisis</h3>
            <p className="text-sm text-slate-500">Akses laporan yang telah dibuat sebelumnya</p>
          </div>
        </div>
        <button
          onClick={() => {
            if (window.confirm('Yakin ingin menghapus semua riwayat?')) {
              onClearAll();
            }
          }}
          className="text-sm font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Hapus Semua
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {history.map((item, index) => {
          const date = new Date(item.timestamp).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          // Calculate job fit score using weighted formula: CV(34%) + Cognitive(33%) + PAPI(33%)
          const cvMatch = item.data.cv_evaluation?.match_percentage || 0;
          const cogMatch = item.data.cognitive?.match_percentage || 0;
          const papiMatch = item.data.papi?.length
            ? Math.round(item.data.papi.reduce((acc: number, curr: any) => acc + (curr.match_percentage || 0), 0) / item.data.papi.length)
            : 0;
          const score = Math.round((cvMatch * 0.34) + (cogMatch * 0.33) + (papiMatch * 0.33));
          let scoreColor = 'text-green-600 bg-green-50 border-green-200';
          if (score < 50) scoreColor = 'text-red-600 bg-red-50 border-red-200';
          else if (score < 75) scoreColor = 'text-yellow-600 bg-yellow-50 border-yellow-200';

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative group border-slate-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400" />
                    {item.data.identity.name}
                  </h4>
                  <p className="text-sm text-slate-600 flex items-center gap-2 mt-1">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    {item.data.identity.position}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-black border ${scoreColor}`}>
                  {score}%
                </div>
              </div>

              <div className="flex items-center text-xs text-slate-400 mb-3 font-medium">
                <Calendar className="w-3.5 h-3.5 mr-1.5" />
                Dianalisis pada {date}
              </div>

              {item.data.costs && item.data.costs.length > 0 && (
                <div className="mb-4 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <div className="font-bold text-slate-600 mb-2 uppercase tracking-wider text-[10px]">Estimasi Biaya API:</div>
                  {item.data.costs.map((cost, idx) => (
                    <div key={idx} className="flex justify-between items-center mb-1">
                      <span className="text-slate-500 font-mono text-[10px]">{cost.model}</span>
                      <span className="font-bold text-slate-700">Rp {cost.totalRupiah.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-600">Total:</span>
                    <span className="font-black text-red-600">Rp {item.data.costs.reduce((sum, cost) => sum + cost.totalRupiah, 0).toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => onView(item)}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Eye className="w-4 h-4" /> Buka Laporan
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Hapus laporan ini dari riwayat?')) {
                      onDelete(item.id);
                    }
                  }}
                  className="px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center transition-colors"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
