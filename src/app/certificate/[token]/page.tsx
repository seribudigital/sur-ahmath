'use client';

import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Printer, 
  Copy, 
  Check, 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  Compass, 
  Sigma, 
  TrendingUp, 
  ShieldCheck
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

// Fallback Mock Data matching the database test student
const MOCK_STUDENT = {
  nama: 'Budi Santoso',
  kelas: '7A',
  school: 'MTs-MA Al-Khoir Cikande',
  monitoringStage: 5,
  teacher: {
    nama: 'ahmad novan, S.T',
  }
};

const MOCK_STATS = {
  accuracy: '94.2%',
  speed: '1.8 dtk',
  totalSessions: 42
};

export default function CertificatePage({ params }: { params: React.Usable<{ token: string }> }) {
  // Unwrap parameters
  const { token } = React.use(params);

  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState(MOCK_STATS);
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!token) return;

    if (token === 'mock-unique-token-xyz-123' || token === 'mock') {
      // Load mock data immediately for preview
      setTimeout(() => {
        setProfile(MOCK_STUDENT);
        setStats(MOCK_STATS);
        setAuthorized(true);
        setLoading(false);
        setShowConfetti(true);
      }, 800);
      return;
    }

    setLoading(true);
    fetch(`/api/reports?parentToken=${token}`)
      .then((res) => {
        if (!res.ok) throw new Error('Data tidak ditemukan');
        return res.json();
      })
      .then((data) => {
        if (data.student) {
          const mStage = data.student.monitoringStage ?? 0;
          const maxStages = data.settings?.monitoringStagesCount ?? 5;
          
          setProfile(data.student);
          
          // Calculate student metrics from reports/sessions if available
          let accVal = '85.0%';
          let speedVal = '2.5 dtk';
          let totalSess = 10;
          
          if (data.report) {
            accVal = `${data.report.accuracy.toFixed(1)}%`;
            speedVal = `${data.report.speed.toFixed(1)} dtk`;
            totalSess = data.report.activityScore ? Math.round(data.report.activityScore) : 10;
          }
          
          setStats({
            accuracy: accVal,
            speed: speedVal,
            totalSessions: totalSess
          });
          
          // Authorized if completed all monitoring stages
          if (mStage >= maxStages) {
            setAuthorized(true);
            setShowConfetti(true);
          } else {
            setAuthorized(false);
          }
        } else {
          setAuthorized(false);
        }
      })
      .catch((err) => {
        console.error('Error loading certificate data', err);
        setAuthorized(false);
      })
      .finally(() => setLoading(false));
  }, [token]);

  // Handle printing
  const handlePrint = () => {
    const originalTitle = document.title;
    const cleanName = profile?.nama ? profile.nama.replace(/[^a-zA-Z0-9]/g, '_') : 'Siswa';
    const cleanClass = profile?.kelas ? profile.kelas.replace(/[^a-zA-Z0-9]/g, '_') : 'Kelas';
    document.title = `Sertifikat_${cleanName}_${cleanClass}`;
    
    window.print();
    
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  // Handle copying link
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#090d16] text-teal-400">
        <div className="relative flex items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-teal-500" />
          <Sigma className="absolute h-6 w-6 text-indigo-400 animate-pulse" />
        </div>
        <p className="mt-6 text-sm font-semibold text-slate-400 tracking-wider">MEMVERIFIKASI TINGKAT KELULUSAN AKHIR...</p>
        <p className="text-xs text-slate-500 mt-2">Menghitung matriks matematika & spaced repetition</p>
      </div>
    );
  }

  if (!authorized || !profile) {
    // Show certificate lock/not available state
    const currentStage = profile?.monitoringStage ?? 0;
    const maxStages = 5; // Default fallback

    return (
      <div className="min-h-screen bg-[#090d16] text-slate-300 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Futuristic background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        
        <div className="relative max-w-md w-full bg-slate-900/60 border-2 border-red-500/20 backdrop-blur-xl p-8 rounded-3xl text-center shadow-2xl z-10">
          <div className="mx-auto w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-400 mb-6">
            <Award className="w-8 h-8 opacity-40" />
          </div>
          <h2 className="text-xl font-black text-white tracking-wide uppercase">Sertifikat Belum Terbit</h2>
          
          {profile ? (
            <div className="mt-4 space-y-4">
              <p className="text-sm text-slate-400 leading-relaxed">
                Halo, <span className="text-white font-bold">{profile.nama}</span>. Sertifikat True Master hanya diterbitkan setelah menyelesaikan seluruh <span className="text-teal-400 font-semibold">{maxStages} Tahap Ujian Monitoring</span>.
              </p>
              
              {/* Progress visual tracker */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="flex justify-between text-xs text-slate-400 mb-2 font-bold">
                  <span>Progres Monitoring</span>
                  <span className="text-teal-400">{currentStage} / {maxStages} Tahap</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-teal-500 to-indigo-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${(currentStage / maxStages) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 italic">
                  Selesaikan {maxStages - currentStage} ujian monitoring lagi untuk membuka kunci sertifikat ini.
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              Token verifikasi tidak valid atau tidak memiliki wewenang akses. Pastikan Anda menggunakan tautan resmi dari platform Sur&apos;ahmath.
            </p>
          )}

          <div className="mt-8 flex flex-col gap-3">
            <a 
              href={profile ? `/dashboard?studentId=${profile.id}` : '/'}
              className="bg-slate-800 hover:bg-slate-750 text-white font-bold py-3 px-6 rounded-2xl text-xs transition duration-200 flex items-center justify-center space-x-2 border border-slate-700"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Dashboard</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060813] text-white flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-x-hidden print:bg-[#060813] print:p-0">
      
      {/* Confetti Particles (pure CSS animation) */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-35 overflow-hidden print:hidden">
          {Array.from({ length: 40 }).map((_, i) => {
            const randomX = Math.random() * 100;
            const randomDelay = Math.random() * 5;
            const randomDur = Math.random() * 4 + 3;
            const colors = ['bg-teal-400', 'bg-indigo-400', 'bg-yellow-400', 'bg-purple-400', 'bg-emerald-400'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            return (
              <div 
                key={i}
                className={`absolute w-2 h-2 rounded-sm opacity-70 animate-confetti ${randomColor}`}
                style={{
                  left: `${randomX}%`,
                  top: `-10px`,
                  animationDelay: `${randomDelay}s`,
                  animationDuration: `${randomDur}s`
                }}
              />
            );
          })}
        </div>
      )}

      {/* Futuristic Background grid & SVG mathematics curves (Visible on print as well) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1c253d" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Fibonacci Spiral */}
          <path 
            d="M 500 400 A 50 50 0 0 1 500 300 A 100 100 0 0 1 600 400 A 150 150 0 0 1 450 550 A 250 250 0 0 1 200 300" 
            fill="none" 
            stroke="rgba(20, 184, 166, 0.45)" 
            strokeWidth="1.5" 
            strokeDasharray="5,5" 
            className="animate-pulse"
          />
          {/* Coordinate Axis & Mathematical curves */}
          <path d="M 50 300 L 950 300 M 500 50 L 500 750" fill="none" stroke="rgba(79, 70, 229, 0.35)" strokeWidth="1" />
          <path d="M 100 450 Q 300 100, 500 300 T 900 150" fill="none" stroke="rgba(20, 184, 166, 0.55)" strokeWidth="2" />
          <path d="M 100 200 Q 400 650, 700 300 T 900 500" fill="none" stroke="rgba(168, 85, 247, 0.35)" strokeWidth="1.5" />
        </svg>
      </div>

      {/* Floating Action Buttons (no-print) */}
      <div className="no-print w-full max-w-5xl flex flex-wrap justify-between items-center mb-6 gap-4 z-40 px-2">
        <a 
          href={`/dashboard?studentId=${profile.id}`}
          className="bg-slate-900/80 border border-slate-800 hover:bg-slate-850 hover:text-white text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition duration-200 flex items-center space-x-2 backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ke Dashboard Siswa</span>
        </a>
        <div className="flex space-x-3">
          <button 
            onClick={handleCopyLink}
            className="bg-slate-900/80 border border-slate-800 hover:bg-slate-850 hover:text-white text-slate-300 font-bold px-4 py-2.5 rounded-xl text-xs transition duration-200 flex items-center space-x-2 backdrop-blur-sm active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Salin Tautan</span>
              </>
            )}
          </button>
          <button 
            onClick={handlePrint}
            className="bg-gradient-to-r from-teal-500 to-indigo-650 hover:from-teal-400 hover:to-indigo-500 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition duration-200 flex items-center space-x-2 shadow-lg shadow-teal-500/20 active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Unduh E-Sertifikat (PDF)</span>
          </button>
        </div>
      </div>

      {/* Outer Glow Wrapper */}
      <div className="relative w-full max-w-5xl aspect-[1.414/1] rounded-3xl p-0.5 bg-gradient-to-tr from-indigo-500/40 via-teal-500/30 to-purple-500/40 shadow-[0_0_50px_rgba(20,184,166,0.25)] z-20 print:p-0 print:border-0 print:shadow-none print:aspect-none print:max-w-none print:rounded-none">
        
        {/* Certificate Main Canvas - Beautiful Dark Galaxy Theme */}
        <div className="relative w-full h-full rounded-[22px] bg-gradient-to-br from-[#060814] via-[#0d152b] to-[#050711] p-10 sm:p-14 overflow-hidden flex flex-col justify-between border border-slate-850 print:border-0 print:rounded-none print:p-14 print:w-[297mm] print:h-[210mm] print:absolute print:top-0 print:left-0">
          
          {/* Beautiful Aurora Glowing Nebulas */}
          <div className="absolute top-[-15%] left-[-15%] w-[50%] h-[50%] bg-teal-500/15 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-[-15%] right-[-15%] w-[50%] h-[50%] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-[25%] left-[25%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '10s' }} />

          {/* Futuristic corner frame corners */}
          <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-teal-400/60" />
          <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-teal-400/60" />
          <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-teal-400/60" />
          <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-teal-400/60" />

          {/* Certificate Header */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center space-x-2">
              <span className="h-0.5 w-12 bg-gradient-to-r from-transparent to-teal-400" />
              <div className="flex items-center text-teal-400 font-bold tracking-widest text-[9px] sm:text-xs uppercase">
                <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-spin" style={{ animationDuration: '6s' }} />
                <span>SUR&apos;AHMATH NUMERACY SYSTEM</span>
              </div>
              <span className="h-0.5 w-12 bg-gradient-to-l from-transparent to-teal-400" />
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white uppercase">
              Sertifikat Kelulusan
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm tracking-wide font-medium">
              DIBERIKAN SEBAGAI PENGHARGAAN ATAS PENCAPAIAN TINGKAT AKHIR
            </p>
          </div>

          {/* Certificate Body */}
          <div className="text-center my-6 space-y-6 print:my-4 print:space-y-4">
            <div>
              <p className="text-slate-400 text-xs italic tracking-wider">Sertifikat ini secara sah menyatakan bahwa siswa:</p>
              
              {/* Student Name Wrapper with Premium Cursive/Handwriting Font */}
              <div className="relative inline-block mt-2 mb-2 print:mt-1">
                {/* Glow behind name */}
                <div className="absolute inset-0 bg-teal-500/10 rounded-full blur-md -z-10 animate-pulse" />
                <h2 
                  className="text-4xl sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-teal-200 to-indigo-100 tracking-wide select-all px-8 py-2 font-normal pb-4"
                  style={{ fontFamily: "'Great Vibes', 'Alex Brush', cursive" }}
                >
                  {profile.nama}
                </h2>
                {/* Underline geometric element */}
                <div className="h-0.5 w-3/4 mx-auto bg-gradient-to-r from-transparent via-teal-400 to-transparent" />
              </div>
              
              <p className="text-xs sm:text-sm text-slate-300 font-medium tracking-wide">
                Kelas <span className="text-teal-300 font-extrabold">{profile.kelas}</span> • <span className="font-semibold">{profile.school}</span>
              </p>
            </div>

            {/* Achievement text */}
            <div className="max-w-2xl mx-auto px-4">
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Telah sukses menempuh seluruh tahapan <span className="text-white font-semibold">Ujian Monitoring Spaced Repetition (Numerasi Tingkat Lanjut)</span> pada platform pembelajaran Sur&apos;ahmath, mendemonstrasikan retensi memori jangka panjang, akurasi, dan kecepatan luar biasa, serta secara resmi dinobatkan sebagai:
              </p>
            </div>

            {/* Title Badge (TRUE MASTER) */}
            <div className="relative inline-block mt-2">
              <div className="absolute inset-0 bg-teal-500/15 rounded-full blur-md animate-pulse" />
              <div className="bg-gradient-to-r from-teal-900/60 to-indigo-900/60 border border-teal-500/40 px-8 py-3 rounded-2xl flex items-center space-x-3">
                <Award className="w-6 h-6 text-yellow-400 animate-bounce flex-shrink-0" />
                <span className="font-black text-sm sm:text-lg tracking-widest text-teal-200 uppercase">
                  👑 TRUE MASTER NUMERASI
                </span>
              </div>
            </div>
          </div>

          {/* Certificate Footer Section */}
          <div className="grid grid-cols-3 items-end gap-4 mt-4 print:mt-2">
            
            {/* Left: HUD Stats Panel */}
            <div className="text-left space-y-1.5">
              <div className="text-[9px] text-slate-500 font-bold tracking-widest uppercase flex items-center">
                <TrendingUp className="w-3.5 h-3.5 mr-1 text-teal-400" />
                <span>PERFORMANCE METRICS</span>
              </div>
              <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-3 space-y-1.5 text-xs font-mono backdrop-blur-sm text-white">
                <div className="flex justify-between border-b border-slate-900 pb-1">
                  <span className="text-[10px] text-slate-400">AKURASI AKHIR</span>
                  <span className="text-emerald-400 font-bold">{stats.accuracy}</span>
                </div>
                <div className="flex justify-between border-b border-slate-900 pb-1">
                  <span className="text-[10px] text-slate-400">KEC. RESPON</span>
                  <span className="text-teal-300 font-bold">{stats.speed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-slate-400">TOTAL SESI</span>
                  <span className="text-indigo-400 font-bold">{stats.totalSessions} Sesi</span>
                </div>
              </div>
            </div>

            {/* Middle: Digital Holographic Seal */}
            <div className="flex flex-col items-center justify-center relative">
              <div className="relative group cursor-pointer w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center select-none print:w-20 print:h-20">
                
                {/* Glowing Outer Rings */}
                <div className="absolute inset-0 border border-dashed border-teal-500/30 rounded-full animate-spin" style={{ animationDuration: '20s' }} />
                <div className="absolute inset-2 border border-dotted border-indigo-500/40 rounded-full animate-spin" style={{ animationDuration: '10s', animationDirection: 'reverse' }} />
                
                {/* Seal Body */}
                <div className="absolute inset-3 bg-gradient-to-tr from-teal-950/80 to-indigo-950/80 border-2 border-teal-400/40 rounded-full flex flex-col items-center justify-center text-center shadow-lg transform group-hover:scale-105 group-hover:rotate-12 transition duration-500">
                  <Compass className="w-6 h-6 text-teal-400 animate-pulse" />
                  <span className="text-[7px] sm:text-[8px] font-black text-teal-300 tracking-widest mt-1 uppercase">TRUE MASTER</span>
                  <span className="text-[5px] sm:text-[6px] text-indigo-300 font-mono tracking-widest">VERIFIED</span>
                </div>
              </div>
            </div>

            {/* Right: Signature Area - Fixed to 1 line */}
            <div className="text-right flex flex-col items-end space-y-1">
              <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">DISETUJUI OLEH</p>
              <div className="h-12 flex items-center justify-end relative w-56 pr-2">
                
                {/* Simulated signature with cursive Alex Brush font on a single line */}
                <span 
                  className="text-lg sm:text-xl text-teal-300 tracking-wider absolute z-10 bottom-1 whitespace-nowrap"
                  style={{ fontFamily: "'Alex Brush', 'Great Vibes', cursive" }}
                >
                  {profile.teacher ? profile.teacher.nama : 'ahmad novan, S.T'}
                </span>
                
                {/* Line under signature */}
                <div className="h-0.5 w-full bg-slate-800 absolute bottom-0" />
              </div>
              <p className="text-[10px] text-slate-400 font-bold">Guru Pengajar Numerasi</p>
              <p className="text-[8px] text-slate-500">{profile.school}</p>
            </div>
            
          </div>

          {/* Verification Code Footer */}
          <div className="flex justify-between items-center border-t border-slate-900 pt-3 text-[8px] font-mono text-slate-500 print:pt-2">
            <div>
              ID SERTIFIKAT: <span className="text-slate-400 select-all font-bold">{token.substring(0, 18).toUpperCase()}...</span>
            </div>
            <div className="flex items-center text-[7px] sm:text-[8px]">
              <ShieldCheck className="w-3 h-3 text-emerald-500/70 mr-1" />
              <span>Diverifikasi oleh Platform Sur&apos;ahmath Spaced Repetition Numerasi</span>
            </div>
          </div>
          
        </div>
      </div>

      {/* Global CSS for Animations and Full Color PDF Printing */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&family=Alex+Brush&display=swap');

        @keyframes confetti-fall {
          0% { transform: translateY(-10px) rotate(0deg); }
          100% { transform: translateY(110vh) rotate(360deg); }
        }
        .animate-confetti {
          animation: confetti-fall linear infinite;
        }
        @media print {
          html, body {
            background-color: #060813 !important; /* Retain gorgeous dark color */
            color: white !important;
            height: auto !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            overflow: hidden !important;
          }
          .no-print {
            display: none !important;
          }
          /* Setup A4 Landscape printing precisely for e-certificate PDF download */
          @page {
            size: A4 landscape;
            margin: 0;
          }
          body {
            padding: 0;
            margin: 0;
          }
        }
      `}</style>
      
    </div>
  );
}
