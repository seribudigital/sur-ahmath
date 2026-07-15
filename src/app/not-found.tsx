import React from 'react';
import { FileQuestion, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-amber-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl backdrop-blur-xl relative z-10">
        <div className="w-16 h-16 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-teal-400">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="inline-block px-3 py-1 bg-teal-500/10 border border-teal-500/20 rounded-full text-xs font-bold text-teal-400 tracking-wider uppercase mb-3">
          Error 404
        </div>

        <h1 className="text-3xl font-extrabold text-white tracking-tight mb-3">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          Maaf, halaman atau tautan raport yang Anda cari tidak tersedia, telah dipindahkan, atau Anda tidak memiliki izin untuk mengakses alamat ini.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
          <a
            href="/"
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-teal-500/20 active:scale-95"
          >
            <Home className="w-4 h-4 mr-2" />
            Ke Halaman Utama
          </a>
        </div>
      </div>
    </div>
  );
}
