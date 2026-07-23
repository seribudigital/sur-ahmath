'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Users, 
  Search, 
  MessageSquare, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Unlock, 
  Lock,
  ChevronRight,
  TrendingUp,
  Award,
  Loader2,
  Save,
  Check,
  LogOut,
  Trash2,
  Key
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import TeacherExamsRecap from './TeacherExamsRecap';

// Default mock teacher user ID for demo/testing
const DEFAULT_TEACHER_USER_ID = 'teacher-user-id-xyz';

// Mock list of students managed by Ibu Fatimah
const INITIAL_STUDENTS_LIST = [
  {
    id: '6c49c487-0a33-4815-bb32-112b76bee827', // Budi's ID
    nama: 'Budi Santoso',
    kelas: '7A',
    accuracy: 85.4,
    speed: 2.7,
    activeDays: 5,
    streak: 5,
    examStatus: 'LOCKED', // LOCKED, READY, REMEDIAL, PASSED
    examId: 'mock-exam-id-1',
    reportId: 'mock-report-id-1',
    comment: 'Ananda Budi menunjukkan perkembangan yang sangat signifikan, khususnya pada otomatisasi perkalian angka 1-3.',
    lastActive: 'Kemarin'
  },
  {
    id: 'student-id-2',
    nama: 'Siti Rahma',
    kelas: '7A',
    accuracy: 91.2,
    speed: 2.1,
    activeDays: 6,
    streak: 8,
    examStatus: 'READY', // Ready to take final master test (Needs teacher unlock)
    examId: 'mock-exam-id-2',
    reportId: 'mock-report-id-2',
    comment: 'Siti sangat luar biasa! Akurasi dan kecepatan menghitungnya sangat konsisten di tingkat Expert.',
    lastActive: 'Hari Ini'
  },
  {
    id: 'student-id-3',
    nama: 'Ahmad Fauzi',
    kelas: '7A',
    accuracy: 62.5,
    speed: 7.1,
    activeDays: 2,
    streak: 0,
    examStatus: 'REMEDIAL', // Failed post-test, locked in remedial mode
    examId: 'mock-exam-id-3',
    reportId: 'mock-report-id-3',
    comment: 'Ahmad masih mengalami kesulitan di perkalian 7 dan 8. Mohon dibimbing untuk latihan mandiri lebih sering.',
    lastActive: '3 hari lalu'
  }
];

function TeacherDashboardContent() {
  const searchParams = useSearchParams();
  const teacherUserId = searchParams.get('userId') || DEFAULT_TEACHER_USER_ID;

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [teacher, setTeacher] = useState<any>(null);
  const [classFilter, setClassFilter] = useState<string>('ALL');
  
  // Comment editing state
  const [activeComment, setActiveComment] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Exam verification state
  const [examLoading, setExamLoading] = useState(false);

  // Reset Password Modal States
  const [resettingStudent, setResettingStudent] = useState<any>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [resetPasswordError, setResetPasswordError] = useState('');
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState('');
  const [resetPasswordSubmitting, setResetPasswordSubmitting] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<'roster' | 'recap' | 'settings'>('roster');

  // Settings states
  const [settings, setSettings] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaveSuccess, setSettingsSaveSuccess] = useState(false);

  // Settings form states
  const [preTestLimitMult, setPreTestLimitMult] = useState(10);
  const [preTestLimitDiv, setPreTestLimitDiv] = useState(10);
  const [practiceLimitMult, setPracticeLimitMult] = useState(10);
  const [practiceLimitDiv, setPracticeLimitDiv] = useState(10);
  const [postTestLimitMult, setPostTestLimitMult] = useState(10);
  const [postTestLimitDiv, setPostTestLimitDiv] = useState(10);

  const [preTestTimeMult, setPreTestTimeMult] = useState(5);
  const [preTestTimeDiv, setPreTestTimeDiv] = useState(5);
  const [practiceTimeMult, setPracticeTimeMult] = useState(0);
  const [practiceTimeDiv, setPracticeTimeDiv] = useState(0);
  const [postTestTimeMult, setPostTestTimeMult] = useState(5);
  const [postTestTimeDiv, setPostTestTimeDiv] = useState(5);

  const [monitoringCooldownDays, setMonitoringCooldownDays] = useState(7);
  const [monitoringStagesCount, setMonitoringStagesCount] = useState(5);
  const [preTestSessionsCount, setPreTestSessionsCount] = useState(3);

  // Load settings from database
  useEffect(() => {
    const controller = new AbortController();
    if (!teacherUserId) return;
    setSettingsLoading(true);
    fetch(`/api/teacher/settings?teacherUserId=${teacherUserId}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
          setPreTestLimitMult(data.settings.preTestLimitMult);
          setPreTestLimitDiv(data.settings.preTestLimitDiv);
          setPracticeLimitMult(data.settings.practiceLimitMult);
          setPracticeLimitDiv(data.settings.practiceLimitDiv);
          setPostTestLimitMult(data.settings.postTestLimitMult);
          setPostTestLimitDiv(data.settings.postTestLimitDiv);

          setPreTestTimeMult(data.settings.preTestTimeMult);
          setPreTestTimeDiv(data.settings.preTestTimeDiv);
          setPracticeTimeMult(data.settings.practiceTimeMult);
          setPracticeTimeDiv(data.settings.practiceTimeDiv);
          setPostTestTimeMult(data.settings.postTestTimeMult);
          setPostTestTimeDiv(data.settings.postTestTimeDiv);
          setMonitoringCooldownDays(data.settings.monitoringCooldownDays ?? 7);
          setMonitoringStagesCount(data.settings.monitoringStagesCount ?? 5);
          setPreTestSessionsCount(data.settings.preTestSessionsCount ?? 3);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error('Failed to fetch settings:', err);
      })
      .finally(() => setSettingsLoading(false));

    return () => controller.abort();
  }, [teacherUserId]);

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    setSettingsSaveSuccess(false);
    try {
      const res = await fetch('/api/teacher/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherUserId,
          preTestLimitMult,
          preTestLimitDiv,
          practiceLimitMult,
          practiceLimitDiv,
          postTestLimitMult,
          postTestLimitDiv,
          preTestTimeMult,
          preTestTimeDiv,
          practiceTimeMult,
          practiceTimeDiv,
          postTestTimeMult,
          postTestTimeDiv,
          monitoringCooldownDays,
          monitoringStagesCount,
          preTestSessionsCount,
        }),
      });
      if (res.ok) {
        setSettingsSaveSuccess(true);
        setNotification({ type: 'success', message: 'Pengaturan kustomisasi berhasil disimpan!' });
      } else {
        const data = await res.json();
        setNotification({ type: 'error', message: data.error || 'Gagal menyimpan pengaturan' });
      }
    } catch (err: any) {
      console.error(err);
      setNotification({ type: 'error', message: `Gagal menyimpan pengaturan: ${err.message}` });
    } finally {
      setSettingsLoading(false);
    }
  };

  // Load roster data from database
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    fetch(`/api/reports?teacherUserId=${teacherUserId}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.teacher) {
          setTeacher(data.teacher);
        }
        if (data.students) {
          setStudents(data.students);
          if (data.students.length > 0) {
            setSelectedStudentId(data.students[0].id);
          }
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') console.error('Failed to fetch students roster:', err);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [teacherUserId]);

  const handleDeleteStudent = async (studentId: string, nama: string) => {
    const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus akun siswa "${nama}" secara permanen? Semua data latihan, nilai ujian, dan raportnya juga akan terhapus.`);
    if (!confirmDelete) return;

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE'
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menghapus siswa');
      }

      setNotification({ type: 'success', message: `Akun siswa "${nama}" berhasil dihapus.` });
      
      // Refresh list locally
      setStudents(prev => {
        const updated = prev.filter(s => s.id !== studentId);
        // If the deleted student was selected, select the first one of the remaining, or null
        if (selectedStudentId === studentId) {
          setSelectedStudentId(updated.length > 0 ? updated[0].id : null);
        }
        return updated;
      });
    } catch (err: any) {
      console.error('Failed to delete student:', err);
      setNotification({ type: 'error', message: `Gagal menghapus siswa: ${err.message}` });
    }
  };

  // Selected Student Details
  const selectedStudent = students.find(s => s.id === selectedStudentId) || students[0] || null;

  // Sync activeComment when selectedStudentId changes
  useEffect(() => {
    if (selectedStudent) {
      setActiveComment(selectedStudent.comment || '');
      setSaveSuccess(false);
    }
  }, [selectedStudentId, selectedStudent]);

  // Filter students based on search query and class filter
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.nama.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter === 'ALL' || s.kelas === classFilter;
    return matchesSearch && matchesClass;
  });

  // Handle saving teacher comment
  const handleSaveComment = async () => {
    if (!selectedStudent) return;
    setSaveLoading(true);
    setSaveSuccess(false);

    try {
      // API call to update comment
      const response = await fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: selectedStudent.reportId,
          studentId: selectedStudent.id,
          teacherUserId: teacherUserId,
          comment: activeComment
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menyimpan komentar');
      }

      // Update locally
      setStudents(prev => prev.map(s => {
        if (s.id === selectedStudent.id) {
          return { ...s, comment: activeComment, reportId: data.reportId };
        }
        return s;
      }));

      setSaveSuccess(true);
      setNotification({ type: 'success', message: 'Catatan guru berhasil disimpan!' });
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving comment:', err);
      setNotification({ type: 'error', message: `Gagal menyimpan catatan guru: ${err.message}` });
    } finally {
      setSaveLoading(false);
    }
  };

  // Handle activating/unlocking master exam for student (Before taken)
  const handleUnlockMasterExam = async () => {
    if (!selectedStudent) return;
    setExamLoading(true);

    try {
      const response = await fetch('/api/exams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          teacherUserId: teacherUserId,
          action: 'UNLOCK_EXAM'
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal mengaktifkan ujian');
      }

      // Update locally
      setStudents(prev => prev.map(s => {
        if (s.id === selectedStudent.id) {
          return { ...s, examStatus: 'UNLOCKED' };
        }
        return s;
      }));
      setNotification({ type: 'success', message: 'Ujian berhasil diaktifkan untuk siswa!' });
    } catch (err: any) {
      console.error('Error activating exam:', err);
      setNotification({ type: 'error', message: `Gagal mengaktifkan ujian: ${err.message}` });
    } finally {
      setExamLoading(false);
    }
  };

  // Handle validating/approving master exam (After taken)
  const handleVerifyExam = async () => {
    if (!selectedStudent || !selectedStudent.examId) return;
    setExamLoading(true);

    try {
      const response = await fetch('/api/exams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examId: selectedStudent.examId,
          teacherUserId: teacherUserId
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memverifikasi ujian');
      }

      // Update locally
      setStudents(prev => prev.map(s => {
        if (s.id === selectedStudent.id) {
          return { ...s, examStatus: 'PASSED' };
        }
        return s;
      }));
      setNotification({ type: 'success', message: 'Ujian berhasil diverifikasi!' });
    } catch (err: any) {
      console.error('Error verifying exam:', err);
      setNotification({ type: 'error', message: `Gagal memverifikasi ujian: ${err.message}` });
    } finally {
      setExamLoading(false);
    }
  };

  const getExamBadgeClass = (status: string) => {
    switch (status) {
      case 'TRUE_MASTER':
        return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-300 font-black shadow-sm';
      case 'MONITORING':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'PASSED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'NEEDS_VERIFICATION':
        return 'bg-teal-50 text-teal-700 border-teal-250 animate-pulse';
      case 'UNLOCKED':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'REQUESTED':
        return 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
      case 'REMEDIAL':
        return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'LOCKED':
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const getExamLabel = (status: string) => {
    switch (status) {
      case 'TRUE_MASTER':
        return 'True Master (Lulus Total)';
      case 'MONITORING':
        return 'Fase Monitoring';
      case 'PASSED':
        return 'Lulus Ujian Master';
      case 'NEEDS_VERIFICATION':
        return 'Butuh Verifikasi Guru';
      case 'UNLOCKED':
        return 'Ujian Aktif (Siap Tempuh)';
      case 'REQUESTED':
        return 'Permohonan Ujian';
      case 'REMEDIAL':
        return 'Mode Remedial';
      case 'LOCKED':
      default:
        return 'Belum Menempuh';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#f8fafc]">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
        <p className="mt-4 text-sm font-semibold text-slate-650">Memuat Roster Kelas...</p>
      </div>
    );
  }

  return (
    <div className="relative z-0 min-h-screen bg-[#f8fafc] text-slate-800 pb-12">
      {/* Background gradient banner */}
      <div className="absolute top-0 left-0 w-full h-[280px] bg-gradient-to-b from-[#0f172a] to-[#1e293b] -z-10" />

      {/* Notification Banner */}
      {notification && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className={`p-4 rounded-xl flex items-center justify-between shadow-lg ${
            notification.type === 'error' ? 'bg-rose-500/90 text-white font-medium' : 'bg-teal-500/90 text-slate-950 font-bold'
          }`}>
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="text-xs underline ml-4 cursor-pointer">Tutup</button>
          </div>
        </div>
      )}

      {/* Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700/50 pb-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={async () => {
                try {
                  await fetch('/api/auth/logout', { method: 'POST' });
                } catch (e) {
                  console.error('Logout error:', e);
                }
                window.location.href = '/';
              }}
              title="Keluar (Logout)"
              className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:text-white hover:bg-rose-950/30 hover:text-rose-450 hover:border-rose-900/50 transition-all flex-shrink-0 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center space-x-2 text-teal-400 text-sm font-bold tracking-wider uppercase">
                <Users className="w-4 h-4" />
                <span>Dashboard Pendidik</span>
                <span>•</span>
                <span>Sur'ahMath</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white mt-1 tracking-tight">
                {teacher?.nama || 'ahmad novan, S.T'}
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                Guru Pengajar • {teacher?.school || 'MTs-MA Al-Khoir Cikande'}
              </p>
            </div>
          </div>

          <div className="mt-4 sm:mt-0 flex space-x-4 bg-slate-800/80 border border-slate-700 p-4 rounded-xl text-slate-200 text-xs font-semibold backdrop-blur-sm">
            <div className="text-center pr-4 border-r border-slate-700">
              <div className="text-slate-400">Total Siswa</div>
              <div className="text-lg font-bold text-white mt-0.5">{students.length}</div>
            </div>
            <div className="text-center pl-4">
              <div className="text-slate-400">Perlu Verifikasi</div>
              <div className="text-lg font-bold text-teal-400 mt-0.5">
                {students.filter(s => s.examStatus === 'READY').length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 print:hidden">
        <div className="flex space-x-2 border-b border-slate-700/60 pb-px">
          <button
            onClick={() => setActiveTab('roster')}
            className={`px-5 py-2.5 rounded-t-lg font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer ${
              activeTab === 'roster'
                ? 'border-teal-400 text-teal-600 bg-white shadow-sm font-black'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            👥 Perkembangan Siswa
          </button>
          <button
            onClick={() => setActiveTab('recap')}
            className={`px-5 py-2.5 rounded-t-lg font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer ${
              activeTab === 'recap'
                ? 'border-teal-400 text-teal-600 bg-white shadow-sm font-black'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            📈 Rekap Ujian
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-5 py-2.5 rounded-t-lg font-bold text-xs sm:text-sm transition-all border-b-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'border-teal-400 text-teal-600 bg-white shadow-sm font-black'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            ⚙️ Pengaturan Soal & Waktu
          </button>
        </div>
      </div>

      {activeTab === 'settings' && (
        /* Settings Tab UI */
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
          <Card className="border border-slate-200 shadow-xl overflow-hidden bg-white">
            <div className="h-2 bg-gradient-to-r from-teal-500 to-indigo-500" />
            <CardHeader className="pb-4 border-b border-slate-150">
              <CardTitle className="text-2xl text-slate-800 font-extrabold flex items-center">
                ⚙️ Pengaturan Parameter Ujian & Latihan
              </CardTitle>
              <CardDescription>
                Atur jumlah soal dan batas waktu pengerjaan per soal untuk pre-test, latihan, dan post-test.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Multiplication Column */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                    <span className="text-xl">✖️</span>
                    <h3 className="text-lg font-bold text-slate-800">Jalur Perkalian</h3>
                  </div>
                  
                  {/* Pre-Test Mult */}
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black text-teal-600 uppercase tracking-wider">Pre-Test (Diagnostik)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Jumlah Soal</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={preTestLimitMult}
                          onChange={(e) => setPreTestLimitMult(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Waktu per Soal (detik)</label>
                        <input
                          type="number"
                          min={1}
                          max={300}
                          value={preTestTimeMult}
                          onChange={(e) => setPreTestTimeMult(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 bg-white font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Latihan Mult */}
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-wider">Latihan Mandiri</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Jumlah Soal</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={practiceLimitMult}
                          onChange={(e) => setPracticeLimitMult(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Waktu per Soal (detik)</label>
                        <input
                          type="number"
                          min={0}
                          max={300}
                          value={practiceTimeMult}
                          onChange={(e) => setPracticeTimeMult(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 bg-white font-bold"
                        />
                        <span className="text-[8px] text-slate-400 mt-0.5 block">* 0 = tanpa batas waktu</span>
                      </div>
                    </div>
                  </div>

                  {/* Post-Test Mult */}
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black text-rose-600 uppercase tracking-wider">Post-Test (Ujian Akhir)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Jumlah Soal</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={postTestLimitMult}
                          onChange={(e) => setPostTestLimitMult(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Waktu per Soal (detik)</label>
                        <input
                          type="number"
                          min={1}
                          max={300}
                          value={postTestTimeMult}
                          onChange={(e) => setPostTestTimeMult(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 bg-white font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Division Column */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                    <span className="text-xl">➗</span>
                    <h3 className="text-lg font-bold text-slate-800">Jalur Pembagian</h3>
                  </div>

                  {/* Pre-Test Div */}
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black text-teal-600 uppercase tracking-wider">Pre-Test (Diagnostik)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Jumlah Soal</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={preTestLimitDiv}
                          onChange={(e) => setPreTestLimitDiv(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Waktu per Soal (detik)</label>
                        <input
                          type="number"
                          min={1}
                          max={300}
                          value={preTestTimeDiv}
                          onChange={(e) => setPreTestTimeDiv(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 bg-white font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Latihan Div */}
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black text-indigo-650 uppercase tracking-wider">Latihan Mandiri</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Jumlah Soal</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={practiceLimitDiv}
                          onChange={(e) => setPracticeLimitDiv(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Waktu per Soal (detik)</label>
                        <input
                          type="number"
                          min={0}
                          max={300}
                          value={practiceTimeDiv}
                          onChange={(e) => setPracticeTimeDiv(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 bg-white font-bold"
                        />
                        <span className="text-[8px] text-slate-400 mt-0.5 block">* 0 = tanpa batas waktu</span>
                      </div>
                    </div>
                  </div>

                  {/* Post-Test Div */}
                  <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                    <h4 className="text-xs font-black text-rose-600 uppercase tracking-wider">Post-Test (Ujian Akhir)</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Jumlah Soal</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={postTestLimitDiv}
                          onChange={(e) => setPostTestLimitDiv(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 bg-white font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">Waktu per Soal (detik)</label>
                        <input
                          type="number"
                          min={1}
                          max={300}
                          value={postTestTimeDiv}
                          onChange={(e) => setPostTestTimeDiv(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 bg-white font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monitoring Settings Section */}
                <div className="md:col-span-2 pt-6 border-t border-slate-100 space-y-4">
                  <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                    <span className="text-xl">⏱️</span>
                    <h3 className="text-lg font-bold text-slate-800">Fase Monitoring (Spaced Repetition)</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                      <h4 className="text-xs font-black text-teal-650 uppercase tracking-wider block mb-1">Masa Tunggu (Cooldown)</h4>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Jeda Waktu Antar Ujian (Hari)</label>
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={monitoringCooldownDays}
                        onChange={(e) => setMonitoringCooldownDays(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 bg-white font-bold"
                      />
                      <span className="text-[8px] text-slate-400 mt-1.5 block">* Kunci otomatis tombol ujian pasca pengerjaan (default 7 hari)</span>
                    </div>

                    <div className="space-y-1.5 p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                      <h4 className="text-xs font-black text-indigo-650 uppercase tracking-wider block mb-1">Jumlah Ujian Tahap</h4>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Total Tahapan (Stage) Monitoring</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={monitoringStagesCount}
                        onChange={(e) => setMonitoringStagesCount(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 bg-white font-bold"
                      />
                      <span className="text-[8px] text-slate-400 mt-1.5 block">* Jumlah sesi Ujian Monitoring untuk lulus total (default 5 kali)</span>
                    </div>

                    <div className="space-y-1.5 p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm sm:col-span-2">
                      <h4 className="text-xs font-black text-rose-600 uppercase tracking-wider block mb-1">Pre-Test Diagnostik (Kelulusan Sesi Wajib)</h4>
                      <label className="text-[10px] font-bold text-slate-500 block mb-1">Jumlah Sesi Wajib Pre-Test (Sesi)</label>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={preTestSessionsCount}
                        onChange={(e) => setPreTestSessionsCount(Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 bg-white font-bold"
                      />
                      <span className="text-[8px] text-slate-400 mt-1.5 block">* Jumlah kali sesi Ujian Diagnostik yang wajib diselesaikan siswa sebelum level latihan terbuka (default 3 kali)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                * Pastikan nilai batas waktu & jumlah soal realistis bagi siswa.
              </span>
              <button
                onClick={handleSaveSettings}
                disabled={settingsLoading}
                className="flex items-center justify-center py-2.5 px-6 bg-slate-800 hover:bg-slate-900 text-white text-sm font-extrabold rounded-lg transition-all shadow-md disabled:opacity-50"
              >
                {settingsLoading ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : settingsSaveSuccess ? (
                  <Check className="w-4 h-4 mr-1.5 text-emerald-400" />
                ) : (
                  <Save className="w-4 h-4 mr-1.5" />
                )}
                {settingsSaveSuccess ? 'Pengaturan Disimpan!' : 'Simpan Pengaturan'}
              </button>
            </CardFooter>
          </Card>
        </div>
      )}

      {activeTab === 'roster' && (
        /* Main Grid Container */
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left column - Students list */}
        <div className="lg:col-span-2 space-y-6">
          
          <Card className="border border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl text-slate-800">
                  {classFilter === 'ALL' ? 'Daftar Perkembangan Semua Kelas' : `Daftar Perkembangan Kelas ${classFilter}`}
                </CardTitle>
                <CardDescription>Pilih siswa untuk mengedit catatan evaluasi dan memverifikasi ujian</CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {/* Class Filter */}
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 bg-white font-semibold text-slate-700 cursor-pointer"
                >
                  <option value="ALL">Semua Kelas</option>
                  {['7A', '7B', '8A', '8B', '8C', '9A', '9B', '10', '11', '12'].map((kls) => (
                    <option key={kls} value={kls}>Kelas {kls}</option>
                  ))}
                </select>

                {/* Search Bar */}
                <div className="relative w-full sm:max-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="Cari nama siswa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10"
                  />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-y border-slate-100 text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                      <th className="py-3 px-6">Nama Siswa</th>
                      <th className="py-3 px-6 text-center">Pre-Test (Rerata)</th>
                      <th className="py-3 px-6">Post-Test (Riwayat)</th>
                      <th className="py-3 px-6 text-center">Status Ujian</th>
                      <th className="py-3 px-6 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length > 0 ? (
                      filteredStudents.map((student) => (
                        <tr 
                          key={student.id}
                          onClick={() => setSelectedStudentId(student.id)}
                          className={`hover:bg-slate-50/50 cursor-pointer transition-colors duration-200 ${
                            selectedStudentId === student.id ? 'bg-teal-50/20' : ''
                          }`}
                        >
                          <td className="py-4 px-6">
                            <div className="font-bold text-slate-800 flex items-center gap-1.5">{student.nama}</div>
                            <div className="text-[10px] text-slate-500 mt-1 space-y-0.5">
                              <div>Email: <span className="font-semibold text-slate-700 select-all">{student.email}</span></div>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">Kelas {student.kelas} • {student.lastActive}</div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="inline-flex flex-col text-xs space-y-1.5 text-left">
                              <div className="flex items-center space-x-1.5 text-slate-600 h-6">
                                <span className="font-semibold w-5 text-center text-[10px]">✖️</span>
                                <span className="font-bold text-slate-800">{student.preTestAvgMult !== null && student.preTestAvgMult !== undefined ? `${student.preTestAvgMult}%` : '-'}</span>
                              </div>
                              <div className="flex items-center space-x-1.5 text-slate-600 h-6">
                                <span className="font-semibold w-5 text-center text-[10px]">➗</span>
                                <span className="font-bold text-slate-800">{student.preTestAvgDiv !== null && student.preTestAvgDiv !== undefined ? `${student.preTestAvgDiv}%` : '-'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className="inline-flex flex-col text-xs space-y-1.5 text-left justify-center">
                              <div className="flex items-center h-6">
                                {student.postTestsMult && student.postTestsMult.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                                    {student.postTestsMult.map((score: number, idx: number) => (
                                      <span 
                                        key={idx} 
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${
                                          score >= 90 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                            : 'bg-rose-50 text-rose-700 border-rose-100'
                                        }`}
                                      >
                                        U{idx + 1}: {score}%
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-xs font-semibold">-</span>
                                )}
                              </div>
                              <div className="flex items-center h-6">
                                {student.postTestsDiv && student.postTestsDiv.length > 0 ? (
                                  <div className="flex flex-wrap gap-1 max-w-[180px]">
                                    {student.postTestsDiv.map((score: number, idx: number) => (
                                      <span 
                                        key={idx} 
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-black border ${
                                          score >= 90 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                            : 'bg-rose-50 text-rose-700 border-rose-100'
                                        }`}
                                      >
                                        U{idx + 1}: {score}%
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-slate-400 text-xs font-semibold">-</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`text-[10px] font-extrabold border px-2.5 py-0.5 rounded-full ${getExamBadgeClass(student.examStatus)}`}>
                              {student.examStatus === 'MONITORING' 
                                ? `Fase Monitoring (Stage ${student.monitoringStage}/${settings?.monitoringStagesCount ?? 5})` 
                                : getExamLabel(student.examStatus)
                              }
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteStudent(student.id, student.nama);
                                }}
                                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                                title="Hapus Akun Siswa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-slate-400 font-medium">
                          Siswa tidak ditemukan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Selected student detail controller */}
        <div className="space-y-6">
          {selectedStudent && (
            <Card className="border border-slate-200 shadow-xl overflow-hidden relative bg-gradient-to-br from-white to-slate-50/50">
              <div className="absolute top-0 left-0 w-full h-[4px] bg-gradient-to-r from-teal-500 to-teal-600" />
              
              <CardHeader className="pb-4">
                <span className="text-[10px] font-bold text-teal-600 tracking-wider uppercase">Inspeksi Siswa</span>
                <CardTitle className="text-xl text-slate-800 font-extrabold">{selectedStudent.nama}</CardTitle>
                <CardDescription>Detail Laporan & Kontrol Otoritas Ujian</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                
                {/* Visual statistics summary */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-100 p-4 rounded-xl text-center">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Rerata Pre-Test ✖️</span>
                    <span className="text-xl font-black text-slate-700 mt-0.5 block">
                      {selectedStudent.preTestAvgMult !== null && selectedStudent.preTestAvgMult !== undefined ? `${selectedStudent.preTestAvgMult}%` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Rerata Pre-Test ➗</span>
                    <span className="text-xl font-black text-slate-700 mt-0.5 block">
                      {selectedStudent.preTestAvgDiv !== null && selectedStudent.preTestAvgDiv !== undefined ? `${selectedStudent.preTestAvgDiv}%` : '-'}
                    </span>
                  </div>
                </div>

                {/* Student Account Details Card */}
                <div className="border border-slate-100 rounded-xl p-4 bg-white shadow-sm space-y-2">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Informasi Akun Siswa</h4>
                  <div className="text-xs space-y-1.5 text-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Email:</span>
                      <span className="font-semibold select-all text-slate-850">{selectedStudent.email}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Kata Sandi:</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setResettingStudent(selectedStudent);
                          setResetPasswordVal('');
                          setResetPasswordError('');
                          setResetPasswordSuccess('');
                        }}
                        className="px-2.5 py-1 text-[10px] font-bold text-teal-600 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 transition-colors"
                      >
                        Reset Sandi
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Kelas:</span>
                      <span className="font-semibold text-slate-850">{selectedStudent.kelas}</span>
                    </div>
                  </div>
                </div>

                {/* Riwayat Post-Test */}
                <div className="border border-slate-100 rounded-xl p-4 bg-white shadow-sm space-y-3">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Riwayat Ujian Post-Test</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500 font-medium flex items-center">
                        <span className="mr-1 text-[10px]">✖️</span> Perkalian
                      </span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                        {selectedStudent.postTestsMult && selectedStudent.postTestsMult.length > 0 ? (
                          selectedStudent.postTestsMult.map((score: number, idx: number) => (
                            <span 
                              key={idx} 
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                score >= 90 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}
                            >
                              U{idx + 1}: {score}%
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 font-semibold text-[10px]">-</span>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-medium flex items-center">
                        <span className="mr-1 text-[10px]">➗</span> Pembagian
                      </span>
                      <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                        {selectedStudent.postTestsDiv && selectedStudent.postTestsDiv.length > 0 ? (
                          selectedStudent.postTestsDiv.map((score: number, idx: number) => (
                            <span 
                              key={idx} 
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                score >= 90 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                                  : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}
                            >
                              U{idx + 1}: {score}%
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 font-semibold text-[10px]">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Authority Lock/Unlock Controller for final master exam */}
                <div className="border border-slate-100 rounded-xl p-4 bg-white shadow-sm space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      selectedStudent.examStatus === 'PASSED' 
                        ? 'bg-emerald-50 text-emerald-600'
                        : selectedStudent.examStatus === 'UNLOCKED'
                        ? 'bg-blue-50 text-blue-600'
                        : selectedStudent.examStatus === 'NEEDS_VERIFICATION' || selectedStudent.examStatus === 'REQUESTED'
                        ? 'bg-amber-55 text-amber-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {selectedStudent.examStatus === 'PASSED' ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : selectedStudent.examStatus === 'UNLOCKED' ? (
                        <Unlock className="w-5 h-5 animate-pulse" />
                      ) : selectedStudent.examStatus === 'NEEDS_VERIFICATION' || selectedStudent.examStatus === 'REQUESTED' ? (
                        <Clock className="w-5 h-5" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Status Ujian Akhir Master</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {selectedStudent.examStatus === 'MONITORING' 
                          ? `Fase Monitoring (Stage ${selectedStudent.monitoringStage}/${settings?.monitoringStagesCount ?? 5})` 
                          : getExamLabel(selectedStudent.examStatus)
                        }
                      </p>
                    </div>
                  </div>

                  {/* Informational Alerts */}
                  {selectedStudent.examStatus === 'REQUESTED' && (
                    <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200/50 p-2.5 rounded-lg leading-relaxed flex items-start">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 mr-1.5 flex-shrink-0 mt-0.5" />
                      <span>Siswa mengajukan permohonan pengerjaan Ujian Akhir Master. Silakan aktifkan tombol ujian di bawah agar siswa dapat mengerjakannya di hadapan Anda.</span>
                    </div>
                  )}

                  {selectedStudent.examStatus === 'UNLOCKED' && (
                    <div className="text-[10px] text-blue-800 bg-blue-50 border border-blue-200/50 p-2.5 rounded-lg leading-relaxed flex items-start">
                      <ShieldAlert className="w-3.5 h-3.5 text-blue-600 mr-1.5 flex-shrink-0 mt-0.5" />
                      <span>Ujian Master telah diaktifkan dan siap dikerjakan siswa. Silakan awasi siswa dalam pengerjaan ujian secara langsung.</span>
                    </div>
                  )}

                  {selectedStudent.examStatus === 'NEEDS_VERIFICATION' && (
                    <div className="text-[10px] text-teal-800 bg-teal-50 border border-teal-200/50 p-2.5 rounded-lg leading-relaxed flex items-start">
                      <ShieldAlert className="w-3.5 h-3.5 text-teal-600 mr-1.5 flex-shrink-0 mt-0.5" />
                      <span>Siswa telah selesai pengerjaan Ujian Akhir Master dan mencapai nilai kelulusan. Silakan lakukan validasi kelulusan resmi.</span>
                    </div>
                  )}

                  {selectedStudent.examStatus === 'REMEDIAL' && (
                    <div className="text-[10px] text-rose-800 bg-rose-50 border border-rose-100 p-2.5 rounded-lg leading-relaxed flex items-start">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-500 mr-1.5 flex-shrink-0 mt-0.5" />
                      <span>Siswa belum lulus target Ujian Master. Tombol terkunci kembali dan sistem memicu menu latihan remedial otomatis.</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  {selectedStudent.examStatus === 'REQUESTED' && (
                    <button
                      onClick={handleUnlockMasterExam}
                      disabled={examLoading}
                      className="w-full flex items-center justify-center py-2.5 rounded-lg text-xs font-extrabold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 transition-all shadow-md hover:scale-[1.01]"
                    >
                      {examLoading ? (
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      ) : (
                        <Unlock className="w-4 h-4 mr-1.5" />
                      )}
                      Aktifkan Ujian Master (Buka Kunci)
                    </button>
                  )}

                  {selectedStudent.examStatus === 'UNLOCKED' && (
                    <div className="py-2 text-center text-[10px] font-bold text-blue-600 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center justify-center">
                      <Clock className="w-4 h-4 mr-1 animate-pulse" />
                      Ujian Aktif - Menunggu Siswa Mengerjakan
                    </div>
                  )}

                  {selectedStudent.examStatus === 'NEEDS_VERIFICATION' && (
                    <button
                      onClick={handleVerifyExam}
                      disabled={examLoading}
                      className="w-full flex items-center justify-center py-2.5 rounded-lg text-xs font-extrabold text-white bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 transition-all shadow-md hover:scale-[1.01]"
                    >
                      {examLoading ? (
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                      )}
                      Validasi Kelulusan Ujian
                    </button>
                  )}

                  {selectedStudent.examStatus === 'PASSED' && (
                    <div className="py-2 text-center text-[10px] font-bold text-emerald-600 bg-emerald-50/50 rounded-lg border border-emerald-100 flex items-center justify-center">
                      <Check className="w-4 h-4 mr-1" />
                      Ujian Master Tervalidasi & Lulus
                    </div>
                  )}

                  {selectedStudent.examStatus === 'MONITORING' && (
                    <div className="space-y-2">
                      <div className="py-2.5 text-center text-xs font-bold text-teal-700 bg-teal-50/60 rounded-lg border border-teal-200 flex items-center justify-center">
                        <Clock className="w-4 h-4 mr-1.5 animate-spin text-teal-600" />
                        Fase Monitoring (Stage {selectedStudent.monitoringStage}/{settings?.monitoringStagesCount ?? 5})
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed text-center italic">
                        Ujian monitoring berikutnya dapat diselesaikan mandiri oleh siswa dari rumah/sekolah tanpa unlock manual dari Guru.
                      </p>
                    </div>
                  )}

                  {selectedStudent.examStatus === 'TRUE_MASTER' && (
                    <div className="py-3 text-center text-xs font-black text-white bg-gradient-to-r from-emerald-650 to-teal-600 rounded-lg border border-emerald-400 shadow-md flex items-center justify-center">
                      <Award className="w-5 h-5 mr-1.5 text-yellow-350 animate-bounce" />
                      True Master (Lulus Rapor Total)
                    </div>
                  )}

                  {(selectedStudent.examStatus === 'LOCKED' || selectedStudent.examStatus === 'REMEDIAL') && (
                    <button
                      disabled
                      className="w-full flex items-center justify-center py-2.5 rounded-lg text-xs font-bold text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed"
                    >
                      <Lock className="w-3.5 h-3.5 mr-1.5" />
                      Ujian Terkunci Sistem
                    </button>
                  )}
                </div>

                {/* Teacher Comment Section Form */}
                <div className="space-y-2.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                    <MessageSquare className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
                    Catatan Evaluasi Guru
                  </label>
                  <textarea
                    rows={4}
                    value={activeComment}
                    onChange={(e) => setActiveComment(e.target.value)}
                    placeholder="Tulis catatan perkembangan belajar siswa di sini..."
                    className="w-full p-3 text-xs text-slate-700 border border-slate-200 rounded-xl focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 leading-relaxed bg-white"
                  />
                  
                  <button
                    onClick={handleSaveComment}
                    disabled={saveLoading}
                    className="w-full flex items-center justify-center py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold rounded-lg transition-all shadow-md disabled:opacity-50"
                  >
                    {saveLoading ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : saveSuccess ? (
                      <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                    ) : (
                      <Save className="w-3.5 h-3.5 mr-1.5" />
                    )}
                    {saveSuccess ? 'Catatan Disimpan!' : 'Simpan Catatan Guru'}
                  </button>
                </div>

                {/* Parent Access link generator details */}
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Link Akses Wali Murid</h5>
                  <p className="text-[10px] text-slate-500 leading-relaxed">Wali murid dapat memantau perkembangan belajar anak tanpa login melalui URL unik berikut:</p>
                  <div className="bg-white border border-slate-200 p-2 rounded text-[9px] font-mono text-teal-600 select-all overflow-hidden text-ellipsis whitespace-nowrap">
                    {`http://surahmath.id/raport/${selectedStudent.uniqueToken || 'mock-unique-token-xyz-123'}`}
                  </div>
                </div>

              </CardContent>
            </Card>
          )}
        </div>

      </div>
      )}

      {activeTab === 'recap' && (
        <TeacherExamsRecap teacherUserId={teacherUserId} />
      )}

      {/* Reset Password Modal */}
      {resettingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Key className="w-5 h-5 text-teal-600 mr-2" />
                Reset Sandi Siswa
              </h3>
              <p className="text-slate-500 text-xs mt-1">
                Menyetel ulang kata sandi untuk siswa: <strong className="text-slate-700">{resettingStudent.nama}</strong>
              </p>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (resetPasswordVal.length < 6) {
                setResetPasswordError('Sandi baru minimal harus 6 karakter');
                return;
              }
              
              setResetPasswordSubmitting(true);
              setResetPasswordError('');
              setResetPasswordSuccess('');
              
              try {
                const res = await fetch('/api/teacher/reset-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    teacherUserId,
                    studentId: resettingStudent.id,
                    newPassword: resetPasswordVal
                  })
                });
                const data = await res.json();
                if (res.ok) {
                  setResetPasswordSuccess('Sandi siswa berhasil direset!');
                  
                  // Update students state locally so if they fetch again or inspect, they have the updated placeholder
                  setStudents(prev => prev.map(s => s.id === resettingStudent.id ? { ...s, password: null } : s));
                  
                  setTimeout(() => setResettingStudent(null), 1500);
                } else {
                  setResetPasswordError(data.error || 'Gagal mereset sandi');
                }
              } catch (err) {
                setResetPasswordError('Terjadi kesalahan koneksi');
              } finally {
                setResetPasswordSubmitting(false);
              }
            }} className="p-6 space-y-4">
              {resetPasswordError && (
                <div className="bg-rose-50 text-rose-700 p-3 rounded-lg text-xs font-semibold border border-rose-100">
                  {resetPasswordError}
                </div>
              )}
              {resetPasswordSuccess && (
                <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-xs font-semibold border border-emerald-100">
                  {resetPasswordSuccess}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">Sandi Baru Siswa</label>
                <input
                  type="text"
                  required
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  placeholder="Masukkan sandi baru (misal: siswa123)"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResettingStudent(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordSubmitting}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  {resetPasswordSubmitting ? 'Menyimpan...' : 'Reset Sandi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TeacherDashboard() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
        <p className="mt-4 text-sm font-semibold text-slate-600">Memuat Dashboard Guru...</p>
      </div>
    }>
      <TeacherDashboardContent />
    </Suspense>
  );
}

