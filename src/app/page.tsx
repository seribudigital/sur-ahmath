'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Target, 
  Zap, 
  Users, 
  FileText, 
  BookOpen, 
  Award, 
  ChevronRight, 
  TrendingUp,
  Lock,
  Mail,
  Key,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

export default function Home() {
  const router = useRouter();

  // Login Form States
  const [activeTab, setActiveTab] = useState<'users' | 'parent'>('users');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle Submit Auth
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = activeTab === 'users' 
        ? { email, password } 
        : { token };

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat login.');
      }

      // Redirect based on User Role
      if (data.role === 'STUDENT') {
        router.push(`/dashboard?studentId=${data.studentId}`);
      } else if (data.role === 'TEACHER') {
        router.push(`/teacher?userId=${data.id}`);
      } else if (data.role === 'PARENT') {
        router.push(`/raport/${data.token}`);
      } else {
        throw new Error('Peran akun tidak dikenali.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to fill in demo credentials automatically
  const handleFillDemo = (type: 'student' | 'teacher' | 'parent' | 'student_empty') => {
    setError(null);
    if (type === 'student') {
      setActiveTab('users');
      setEmail('siswa.budi@sekolah.id');
      setPassword('hashed_password_123');
    } else if (type === 'student_empty') {
      setActiveTab('users');
      setEmail('siswa.kosong@sekolah.id');
      setPassword('hashed_password_123');
    } else if (type === 'teacher') {
      setActiveTab('users');
      setEmail('guru.fatimah@sekolah.id');
      setPassword('hashed_password_123');
    } else {
      setActiveTab('parent');
      setToken('mock-unique-token-xyz-123');
    }
  };

  return (
    <div className="relative z-0 min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between overflow-x-hidden">
      {/* Decorative gradient glowing circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-teal-500/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] -z-10" />

      {/* Header (Top Nav) */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-500 to-indigo-500 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-teal-500/20">
            S
          </div>
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            Sur'ah<span className="text-teal-400 font-black">Math</span>
          </span>
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Versi Pengembangan v1.0.0
        </div>
      </header>

      {/* Main Grid Area */}
      <main className="max-w-7xl mx-auto w-full px-6 py-12 flex-grow flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">
        
        {/* Left Side: Brand Hero Intro */}
        <div className="max-w-xl text-center lg:text-left space-y-6 lg:w-1/2">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-teal-400 tracking-wide uppercase">
            <Award className="w-3.5 h-3.5 mr-1" />
            <span>Membangun Fluency Numerasi Dasar</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Membangun Fluency Numerasi,<br />
            Mencetak Generasi Islami yang Presisi.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Platform latihan matematika terstruktur dan adaptif untuk siswa MTs dan MA. Menggunakan algoritma cerdas berbasis data histori latihan untuk melatih koordinat angka yang masih lemah.
          </p>

          {/* Quick Demo Credentials Widget */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-3.5 text-left">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center">
              <Key className="w-4 h-4 mr-2 text-teal-400" />
              Gunakan Akun Uji Coba (Klik untuk Mengisi):
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => handleFillDemo('student')}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all hover:scale-[1.02]"
              >
                <div className="text-[10px] font-extrabold text-teal-400 uppercase tracking-wider">Siswa (Ada Data)</div>
                <div className="text-xs font-bold text-white mt-1">Budi Santoso</div>
                <div className="text-[9px] text-slate-500 truncate mt-0.5">siswa.budi@sekolah.id</div>
              </button>
              
              <button
                onClick={() => handleFillDemo('student_empty')}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-teal-850 hover:border-teal-500 text-left transition-all hover:scale-[1.02] border-dashed"
              >
                <div className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">Siswa (Dari Nol)</div>
                <div className="text-xs font-bold text-white mt-1">Ahmad Fauzan</div>
                <div className="text-[9px] text-slate-500 truncate mt-0.5">siswa.kosong@sekolah.id</div>
              </button>

              <button
                onClick={() => handleFillDemo('teacher')}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all hover:scale-[1.02]"
              >
                <div className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider">Guru</div>
                <div className="text-xs font-bold text-white mt-1">Ibu Fatimah</div>
                <div className="text-[9px] text-slate-500 truncate mt-0.5">guru.fatimah@sekolah.id</div>
              </button>

              <button
                onClick={() => handleFillDemo('parent')}
                className="p-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-all hover:scale-[1.02]"
              >
                <div className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">Wali Murid</div>
                <div className="text-xs font-bold text-white mt-1">Pak Ahmad</div>
                <div className="text-[9px] text-slate-500 truncate mt-0.5">Token: mock-unique...</div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Login Portal */}
        <div className="w-full max-w-md lg:w-1/2">
          <Card className="border border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-teal-500 to-indigo-500" />
            
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-black text-white">Selamat Datang</CardTitle>
              <CardDescription className="text-slate-400">Silakan masuk menggunakan akun Anda untuk memulai</CardDescription>
              
              {/* Tab Selector */}
              <div className="flex p-1 rounded-xl bg-slate-950/80 border border-slate-800/80 mt-5">
                <button
                  type="button"
                  onClick={() => { setActiveTab('users'); setError(null); }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'users' 
                      ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Siswa / Pendidik
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveTab('parent'); setError(null); }}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'parent' 
                      ? 'bg-gradient-to-r from-teal-600 to-teal-500 text-white shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Wali Murid (Token)
                </button>
              </div>
            </CardHeader>

            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4 pt-2">
                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-start space-x-2 animate-shake">
                    <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {activeTab === 'users' ? (
                  <>
                    {/* Email Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alamat Email</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="masukkan@sekolah.id"
                          className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-white placeholder-slate-650 transition-all"
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kata Sandi</label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-white placeholder-slate-650 transition-all"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  /* Token Input for parents */
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Token Unik Wali Murid</label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        placeholder="masukkan-token-unik-raport"
                        className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-white placeholder-slate-650 transition-all"
                      />
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="pt-2 pb-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center py-3 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-extrabold rounded-xl transition-all shadow-lg hover:shadow-teal-500/25 disabled:opacity-50 hover:scale-[1.01]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Memverifikasi...
                    </>
                  ) : (
                    <>
                      Masuk ke Aplikasi
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>

      {/* Sandbox Demo Quick Gateway Container */}
      <section className="bg-slate-900/30 border-t border-slate-900 py-12 px-6">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-bold text-white flex items-center justify-center sm:justify-start">
              <Zap className="w-4 h-4 mr-2 text-teal-400" />
              Sandbox / Akses Cepat Demo
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              Gunakan menu pintas di bawah ini untuk menguji setiap dashboard langsung tanpa proses pengetikan login (Fitur Evaluasi & Demo).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Practice Card */}
            <a 
              href="/practice" 
              className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-teal-500/40 hover:bg-slate-900/60 transition-all group flex flex-col justify-between hover:-translate-y-0.5 relative"
            >
              <div className="absolute top-0 left-0 w-full h-[2.5px] bg-teal-500 rounded-t-2xl" />
              <div>
                <div className="p-2 w-fit rounded-lg bg-teal-500/10 text-teal-400 mb-3 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white mb-1">Latihan Mandiri</h4>
                <p className="text-slate-500 text-[10px] leading-relaxed">
                  Asah hitungan perkalian & pembagian siswa adaptif.
                </p>
              </div>
              <div className="mt-4 flex items-center text-[10px] font-bold text-teal-400 group-hover:text-teal-300">
                <span>Mulai</span>
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </div>
            </a>

            {/* Student Dashboard Card */}
            <a 
              href="/dashboard?studentId=6c49c487-0a33-4815-bb32-112b76bee827" 
              className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-teal-500/40 hover:bg-slate-900/60 transition-all group flex flex-col justify-between hover:-translate-y-0.5 relative"
            >
              <div className="absolute top-0 left-0 w-full h-[2.5px] bg-gradient-to-r from-teal-500 to-indigo-500 rounded-t-2xl" />
              <div>
                <div className="p-2 w-fit rounded-lg bg-teal-500/10 text-teal-400 mb-3 group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white mb-1">Dashboard Siswa</h4>
                <p className="text-slate-500 text-[10px] leading-relaxed">
                  Tinjau heatmap 10x10 & diagram progres akurasi.
                </p>
              </div>
              <div className="mt-4 flex items-center text-[10px] font-bold text-teal-400 group-hover:text-teal-300">
                <span>Dashboard</span>
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </div>
            </a>

            {/* Teacher Dashboard Card */}
            <a 
              href="/teacher?userId=teacher-user-id-xyz" 
              className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-indigo-500/40 hover:bg-slate-900/60 transition-all group flex flex-col justify-between hover:-translate-y-0.5 relative"
            >
              <div className="absolute top-0 left-0 w-full h-[2.5px] bg-indigo-500 rounded-t-2xl" />
              <div>
                <div className="p-2 w-fit rounded-lg bg-indigo-500/10 text-indigo-400 mb-3 group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white mb-1">Dashboard Guru</h4>
                <p className="text-slate-500 text-[10px] leading-relaxed">
                  Evaluasi komentar, roster kelas & otorisasi ujian.
                </p>
              </div>
              <div className="mt-4 flex items-center text-[10px] font-bold text-indigo-400 group-hover:text-indigo-300">
                <span>Akses Guru</span>
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </div>
            </a>

            {/* Parent Portal Card */}
            <a 
              href="/raport/mock-unique-token-xyz-123" 
              className="p-5 rounded-2xl bg-slate-950/40 border border-slate-900 hover:border-amber-500/40 hover:bg-slate-900/60 transition-all group flex flex-col justify-between hover:-translate-y-0.5 relative"
            >
              <div className="absolute top-0 left-0 w-full h-[2.5px] bg-amber-500 rounded-t-2xl" />
              <div>
                <div className="p-2 w-fit rounded-lg bg-amber-500/10 text-amber-400 mb-3 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-white mb-1">Raport Wali Murid</h4>
                <p className="text-slate-500 text-[10px] leading-relaxed">
                  Format cetak raport A4 tervalidasi tanda tangan.
                </p>
              </div>
              <div className="mt-4 flex items-center text-[10px] font-bold text-amber-400 group-hover:text-amber-300">
                <span>Raport</span>
                <ChevronRight className="w-3 h-3 ml-0.5" />
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 text-center text-slate-600 text-xs border-t border-slate-900">
        © 2026 Sur'ahMath. Proyek Latihan Numerasi Terstruktur MTs & MA.
      </footer>
    </div>
  );
}
