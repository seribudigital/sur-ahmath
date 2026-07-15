'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console for monitoring
    console.error('SurahMath Global Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-teal-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-rose-500/30 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-xl relative z-10">
        <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-400">
          <AlertTriangle className="w-8 h-8 animate-bounce" />
        </div>

        <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
          Terjadi Gangguan Sistem
        </h1>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Maaf, halaman atau proses yang Anda coba jalankan mengalami gangguan tak terduga. Kami telah mencatat kejadian ini untuk segera diperbaiki oleh tim teknis Sur&apos;ahMath.
        </p>

        {error?.digest && (
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 mb-6 text-xs text-slate-500 font-mono break-all">
            Kode Referensi: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Coba Lagi
          </button>

          <a
            href="/"
            className="w-full sm:w-auto flex items-center justify-center px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-all active:scale-95"
          >
            <Home className="w-4 h-4 mr-2" />
            Kembali ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
}
