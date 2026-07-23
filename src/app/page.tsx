'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Award, 
  ChevronRight, 
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

  // Registration Form States
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regNama, setRegNama] = useState('');
  const [regKelas, setRegKelas] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<any | null>(null);

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegError(null);

    if (regPassword.length < 6) {
      setRegError('Kata sandi harus minimal 6 karakter.');
      setRegLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama: regNama, kelas: regKelas, password: regPassword })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mendaftarkan siswa baru.');
      }

      setRegSuccess({
        email: data.email,
        password: regPassword,
        kelas: regKelas
      });
      // Reset form fields
      setRegNama('');
      setRegKelas('');
      setRegPassword('');
    } catch (err: any) {
      setRegError(err.message);
    } finally {
      setRegLoading(false);
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
                    {/* Email / Username / Nama Input */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alamat Email / Nama Lengkap Siswa</label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        <input
                          type="text"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Email (siswa.budi@surahmath.id) atau Nama Lengkap"
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

              <CardFooter className="pt-2 pb-6 flex flex-col items-center">
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

                {/* Registration Link */}
                <div className="text-center text-xs text-slate-400 mt-4 w-full">
                  Siswa baru?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegisterOpen(true);
                      setRegSuccess(null);
                      setRegError(null);
                    }}
                    className="text-teal-400 font-bold hover:underline focus:outline-none bg-transparent border-0 cursor-pointer"
                  >
                    Daftar sebagai Siswa Baru
                  </button>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full px-6 py-6 text-center text-slate-600 text-xs border-t border-slate-900">
        © 2026 Sur'ahMath. Proyek Latihan Numerasi Terstruktur MTs & MA.
      </footer>

      {/* Registration Modal */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 text-slate-800">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl relative overflow-hidden text-left">
            <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-teal-500 to-indigo-500" />
            
            <div className="p-6">
              <h3 className="text-xl font-black text-white">Daftar Siswa Baru</h3>
              <p className="text-slate-400 text-xs mt-1">Lengkapi data di bawah ini untuk membuat akun latihan baru</p>
              
              {regSuccess ? (
                <div className="mt-6 space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium space-y-2">
                    <div className="font-bold text-sm text-emerald-400">Pendaftaran Berhasil! 🎉</div>
                    <p className="text-slate-300">Akun latihan matematika Anda berhasil dibuat. Silakan gunakan detail berikut untuk masuk:</p>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono text-[11px] text-white select-all">
                      <div>Email: <span className="text-teal-400 font-bold">{regSuccess.email}</span></div>
                      <div>Sandi: <span className="text-teal-400 font-bold">{regSuccess.password}</span></div>
                      <div>Kelas: <span className="text-slate-300 font-bold">{regSuccess.kelas}</span></div>
                    </div>
                    <p className="text-[10px] text-slate-400">* Silakan salin atau catat alamat email di atas untuk login.</p>
                  </div>
                  
                  <button
                    type="button"
                    disabled={loading}
                    onClick={async () => {
                      const targetEmail = regSuccess.email;
                      const targetPassword = regSuccess.password;
                      setIsRegisterOpen(false);
                      setRegSuccess(null);
                      setEmail(targetEmail);
                      setPassword(targetPassword);
                      
                      setLoading(true);
                      setError(null);
                      try {
                        const response = await fetch('/api/auth', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: targetEmail, password: targetPassword })
                        });
                        const data = await response.json();

                        if (!response.ok) {
                          throw new Error(data.error || 'Terjadi kesalahan saat login.');
                        }

                        if (data.role === 'STUDENT') {
                          router.push(`/dashboard?studentId=${data.studentId}`);
                        } else if (data.role === 'TEACHER') {
                          router.push(`/teacher?userId=${data.id}`);
                        } else {
                          throw new Error('Peran akun tidak dikenali.');
                        }
                      } catch (err: any) {
                        setError(err.message);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white text-xs font-extrabold rounded-xl transition-all shadow-lg hover:shadow-teal-500/25 flex items-center justify-center cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Memproses Login...
                      </>
                    ) : (
                      'Masuk Sekarang ke Dashboard'
                    )}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="mt-5 space-y-4">
                  {regError && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0 mt-0.5 text-rose-400" />
                      <span>{regError}</span>
                    </div>
                  )}

                  {/* Nama Lengkap */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={regNama}
                      onChange={(e) => setRegNama(e.target.value)}
                      placeholder="Contoh: Ahmad Fauzan"
                      className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-white placeholder-slate-600 transition-all"
                    />
                  </div>

                  {/* Kelas Dropdown */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kelas</label>
                    <div className="relative">
                      <select
                        required
                        value={regKelas}
                        onChange={(e) => setRegKelas(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-white transition-all appearance-none cursor-pointer"
                        style={{
                          backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'></polyline></svg>")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 16px center',
                          backgroundSize: '16px'
                        }}
                      >
                        <option value="" disabled className="bg-slate-950 text-slate-500">Pilih Kelas</option>
                        {['7A', '7B', '8A', '8B', '8C', '9A', '9B', '10', '11', '12'].map((kls) => (
                          <option key={kls} value={kls} className="bg-slate-950 text-white">Kelas {kls}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kata Sandi (Password)</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 text-white placeholder-slate-600 transition-all"
                    />
                  </div>

                  <div className="flex space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRegisterOpen(false);
                        setRegError(null);
                      }}
                      className="flex-1 py-2.5 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-extrabold rounded-xl transition-all"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={regLoading}
                      className="flex-1 py-2.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white text-xs font-extrabold rounded-xl transition-all shadow-lg disabled:opacity-50"
                    >
                      {regLoading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
