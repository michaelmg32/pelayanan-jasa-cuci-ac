'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ShieldAlert, CheckCircle2, AlertCircle, Wrench, Calendar, Sparkles } from 'lucide-react';

interface ACInfo {
  id: string;
  brand: string;
  name: string;
  modelName: string;
}

interface ServiceHistory {
  id: number;
  serviceName: string;
  photoBefore: string;
  photoAfter: string;
  notes: string;
  createdAt: string;
  scheduledDate: string;
  workerName: string;
}

export default function PublicACCard() {
  const { id } = useParams() as { id: string };
  const [ac, setAc] = useState<ACInfo | null>(null);
  const [history, setHistory] = useState<ServiceHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!id) return;
    const fetchPublicData = async () => {
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await fetch(`/api/public/customer-ac/${id}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Barcode/QR AC ini belum terdaftar di sistem Sugar AC.');
          }
          throw new Error('Gagal mengambil data riwayat AC.');
        }
        const data = await res.json();
        setAc(data.ac);
        setHistory(data.history || []);
      } catch (err: any) {
        setErrorMsg(err.message || 'Terjadi kesalahan saat memuat data.');
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, [id]);

  const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-indigo-400 font-sans p-6">
        <div className="w-10 h-10 border-4 border-indigo-500/25 border-t-indigo-400 rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-widest text-indigo-300 animate-pulse">Memuat kartu riwayat AC...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200 font-sans p-6 text-center">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center mb-5">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-lg font-black text-white uppercase tracking-wider mb-2">QR Code Tidak Dikenal</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-6">{errorMsg}</p>
        <a
          href="/"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-5 py-2.5 rounded-xl font-bold uppercase tracking-wider transition shadow-lg shadow-indigo-600/20"
        >
          Kembali ke Beranda
        </a>
      </div>
    );
  }

  const isWellMaintained = history.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased p-4 sm:p-6 md:p-8 flex items-center justify-center">
      {/* Background radial effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none z-0" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="w-full max-w-2xl bg-slate-900/60 backdrop-filter backdrop-blur-2xl border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl z-10">
        
        {/* Banner/Header */}
        <div className="relative px-6 py-8 border-b border-slate-800 bg-gradient-to-r from-indigo-950/40 via-slate-900/50 to-slate-900/50">
          <div className="absolute right-6 top-6 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
            <Sparkles size={11} /> Digital Card
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/25">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">SUGAR AC</h1>
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 mt-1">Kartu Kesehatan AC Digital</p>
            </div>
          </div>
        </div>

        {/* AC Spec Section */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Nama Panggilan AC</span>
                <span className="text-base font-bold text-white">{ac?.name}</span>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Merk / Model</span>
                <span className="text-sm font-semibold text-slate-300">{ac?.brand} {ac?.modelName ? `— ${ac.modelName}` : ''}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Barcode / QR ID</span>
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-950/30 border border-indigo-900/50 px-3 py-1.5 rounded-xl inline-block mt-0.5">{ac?.id}</span>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Status Perawatan</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold mt-1 px-3 py-1 rounded-full border ${
                  isWellMaintained 
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                  {isWellMaintained ? (
                    <>
                      <CheckCircle2 size={12} />
                      <span>Terawat Baik ({history.length}x Servis)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={12} />
                      <span>Butuh Pembersihan Pertama</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* History Timeline */}
        <div className="p-6">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
            <Wrench size={14} className="text-indigo-400" /> Riwayat Pemeliharaan & Perbaikan
          </h3>

          {history.length === 0 ? (
            <div className="text-center py-10 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
              <p className="text-sm text-slate-500">Belum ada riwayat pengerjaan tercatat untuk AC ini.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-800 ml-3 md:ml-4 space-y-8 pb-4">
              {history.map((item, idx) => (
                <div key={item.id} className="relative pl-6 sm:pl-8">
                  {/* Timeline point */}
                  <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-slate-950 z-10" />
                  
                  <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 shadow-sm hover:border-slate-700/60 transition-all duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 border-b border-slate-800/40 pb-2">
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        {item.serviceName}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 w-fit">
                        <Calendar size={10} />
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-350 leading-relaxed italic mb-4">
                      "{item.notes || 'Tidak ada catatan pengerjaan.'}"
                    </p>

                    {/* Before & After Photos */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col justify-end group">
                        {item.photoBefore ? (
                          <>
                            <img src={item.photoBefore} alt="Before" className="w-full h-full object-cover" />
                            <span className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md text-[8px] font-black text-rose-400 px-2 py-0.5 rounded-md uppercase tracking-wider">Before</span>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-600 font-bold uppercase tracking-wider bg-slate-900">No Photo</div>
                        )}
                      </div>
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col justify-end group">
                        {item.photoAfter ? (
                          <>
                            <img src={item.photoAfter} alt="After" className="w-full h-full object-cover" />
                            <span className="absolute bottom-2 left-2 bg-slate-950/80 backdrop-blur-md text-[8px] font-black text-emerald-400 px-2 py-0.5 rounded-md uppercase tracking-wider">After</span>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-600 font-bold uppercase tracking-wider bg-slate-900">No Photo</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-800/40 text-[9px] font-black text-slate-500 uppercase tracking-wider">
                      <div className="w-3.5 h-3.5 bg-indigo-500/10 text-indigo-400 rounded-md flex items-center justify-center text-[8px]">🛠️</div>
                      Teknisi: <span className="text-slate-300">{item.workerName || 'Staff Sugar AC'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/40 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500 font-medium">© {new Date().getFullYear()} Sugar AC — Sistem Manajemen AC Pintar. All rights reserved.</p>
        </div>

      </div>
    </div>
  );
}
