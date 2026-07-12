'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Target, 
  Zap, 
  Calendar, 
  BookOpen, 
  Award, 
  MessageSquare,
  ShieldAlert,
  Loader2,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  LogOut,
  Key
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import MetricCard from '@/components/dashboard/MetricCard';
import ProgressChart from '@/components/analytics/ProgressChart';
import { getStatusColorClass, formatDate, formatResponseTime } from '@/lib/utils';

// Premium Mock Data based on PRD Budi Santoso profile
const MOCK_STUDENT = {
  nama: 'Budi Santoso',
  kelas: '7A',
  school: 'MTs-MA Al-Khoir Cikande',
  predicate: 'Raja Perkalian',
  teacher: {
    nama: 'ahmad novan, S.T',
    school: 'MTs-MA Al-Khoir Cikande',
  }
};

const MOCK_METRICS = {
  accuracy: {
    value: '85.4%',
    subtext: '+20.4% sejak Pre-Test (diagnostik: 65.0%)',
    trend: { value: '5.4%', isPositive: true }
  },
  speed: {
    value: '2.7 dtk',
    subtext: '5.5 dtk lebih cepat (diagnostik: 8.2 dtk)',
    trend: { value: '67.0%', isPositive: true }
  },
  activity: {
    value: '5 hari',
    subtext: 'Total 42 sesi latihan minggu ini',
    trend: { value: '2 hari', isPositive: true }
  }
};

const MOCK_REPORTS_HISTORY = [
  { period: 'Pre-Test', accuracy: 65.0, speed: 8.2 },
  { period: 'Minggu 1', accuracy: 70.2, speed: 6.4 },
  { period: 'Minggu 2', accuracy: 74.8, speed: 5.1 },
  { period: 'Minggu 3', accuracy: 79.5, speed: 4.0 },
  { period: 'Minggu 4', accuracy: 82.1, speed: 3.2 },
  { period: 'Minggu 5', accuracy: 85.4, speed: 2.7 },
];

const MOCK_EXAM_LOGS = [
  { id: '1', date: '2026-06-18', name: 'Mastery Test Level 3', score: 92.0, status: 'LULUS', type: 'MASTERY' },
  { id: '2', date: '2026-06-12', name: 'Ujian Mingguan W24', score: 86.5, status: 'LULUS', type: 'WEEKLY' },
  { id: '3', date: '2026-06-05', name: 'Ujian Mingguan W23', score: 78.0, status: 'LULUS', type: 'WEEKLY' },
  { id: '4', date: '2026-06-01', name: 'Mastery Test Level 2', score: 95.0, status: 'LULUS', type: 'MASTERY' },
];

// Helper to generate a default 10x10 heatmap grid for Multiplication
function generateMockHeatmap(opType: 'MULTIPLICATION' | 'DIVISION') {
  const cells = [];
  for (let i = 1; i <= 10; i++) {
    for (let j = 1; j <= 10; j++) {
      let correct = 0;
      let total = 0;
      let time = 0;
      let status: 'master' | 'practice' | 'weak' | 'neutral' = 'neutral';

      // Seed mock values to make it look realistic
      if (i <= 3 && j <= 8) {
        // Beginner tables 1-3 (mostly mastered)
        total = Math.floor(Math.random() * 5) + 3;
        correct = total;
        time = Math.floor(Math.random() * 800) + 1200; // fast
        status = 'master';
      } else if (i <= 6) {
        // Intermediate tables 4-6 (some mastered, some practicing, one weak)
        total = Math.floor(Math.random() * 6) + 2;
        if (i === 5 && j === 7) {
          correct = 1;
          total = 4;
          time = 6200; // slow
          status = 'weak';
        } else {
          correct = total - (Math.random() > 0.7 ? 1 : 0);
          time = Math.floor(Math.random() * 1500) + 2000;
          status = correct / total >= 0.9 && time <= 3000 ? 'master' : 'practice';
        }
      } else if (i <= 8) {
        // Advanced tables 7-8 (practicing and some unattempted)
        if (Math.random() > 0.3) {
          total = Math.floor(Math.random() * 4) + 1;
          correct = total - Math.floor(Math.random() * 2);
          time = Math.floor(Math.random() * 2500) + 2800;
          status = correct / total >= 0.9 && time <= 3000 ? 'master' : (correct / total < 0.7 ? 'weak' : 'practice');
        }
      } else {
        // Expert tables 9-10 (mostly unattempted)
        if (Math.random() > 0.7) {
          total = Math.floor(Math.random() * 3) + 1;
          correct = Math.floor(Math.random() * total);
          time = Math.floor(Math.random() * 3000) + 3500;
          status = correct / total < 0.7 ? 'weak' : 'practice';
        }
      }

      cells.push({
        operand1: i,
        operand2: j,
        correctCount: correct,
        totalCount: total,
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        avgResponseTime: Math.round(time),
        status,
      });
    }
  }
  return cells;
}

interface MetricItem {
  value: string;
  subtext: string;
  trend?: { value: string; isPositive: boolean };
}

interface MetricsGroup {
  accuracy: MetricItem;
  speed: MetricItem;
  activity: MetricItem;
}

// Tab-specific metrics mock data for fallback
const MOCK_MULTIPLICATION_REPORT = {
  accuracy: 85.4,
  speed: 2.7,
  activityScore: 42,
};

const MOCK_DIVISION_REPORT = {
  accuracy: 78.2,
  speed: 3.5,
  activityScore: 28,
};

const MOCK_STUDENT_INFO = {
  examRequested: false,
  examUnlocked: false,
  multiplicationExpert: { passed: false, sessionCount: 1, average: 85 },
  divisionExpert: { passed: true, sessionCount: 3, average: 92 }
};

const MOCK_EXAMS = [
  { id: '1', examType: 'POST_TEST', operationType: 'MULTIPLICATION', score: 92.0, verifiedByGuru: true, date: '2026-06-18' },
  { id: '2', examType: 'DIAGNOSTIC', operationType: 'MULTIPLICATION', score: 65.0, verifiedByGuru: false, date: '2026-06-01' },
  { id: '3', examType: 'DIAGNOSTIC', operationType: 'MULTIPLICATION', score: 70.0, verifiedByGuru: false, date: '2026-06-02' },
  { id: '4', examType: 'DIAGNOSTIC', operationType: 'MULTIPLICATION', score: 75.0, verifiedByGuru: false, date: '2026-06-03' },
  { id: '5', examType: 'DIAGNOSTIC', operationType: 'DIVISION', score: 60.0, verifiedByGuru: false, date: '2026-06-01' },
  { id: '6', examType: 'DIAGNOSTIC', operationType: 'DIVISION', score: 68.0, verifiedByGuru: false, date: '2026-06-02' },
  { id: '7', examType: 'DIAGNOSTIC', operationType: 'DIVISION', score: 72.0, verifiedByGuru: false, date: '2026-06-03' },
];

function StudentDashboardContent() {
  const searchParams = useSearchParams();
  const studentId = searchParams.get('studentId');

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'multiplication' | 'division'>('multiplication');
  
  // Ubah Sandi Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [profile, setProfile] = useState(MOCK_STUDENT);
  const [metrics, setMetrics] = useState<MetricsGroup>(MOCK_METRICS);
  const [chartData, setChartData] = useState(MOCK_REPORTS_HISTORY);
  const [examLogs, setExamLogs] = useState<any[]>([]);
  
  // Real database states
  const [multiplicationReport, setMultiplicationReport] = useState<any>(null);
  const [divisionReport, setDivisionReport] = useState<any>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [teacherComment, setTeacherComment] = useState('Belum ada catatan evaluasi dari guru pengajar.');
  const [settings, setSettings] = useState<any>({
    monitoringCooldownDays: 7,
    monitoringStagesCount: 5,
  });

  const [heatmapData, setHeatmapData] = useState<{
    multiplication: any[];
    division: any[];
  }>({
    multiplication: [],
    division: [],
  });

  // Load dashboard data
  useEffect(() => {
    // Generate default heatmap on mount
    setHeatmapData({
      multiplication: generateMockHeatmap('MULTIPLICATION'),
      division: generateMockHeatmap('DIVISION'),
    });

    if (!studentId) {
      setMultiplicationReport(MOCK_MULTIPLICATION_REPORT);
      setDivisionReport(MOCK_DIVISION_REPORT);
      setStudentInfo(MOCK_STUDENT_INFO);
      setExams(MOCK_EXAMS);
      
      const mappedExams = MOCK_EXAMS.map((e: any) => {
        let name = 'Ujian Resmi';
        if (e.examType === 'DIAGNOSTIC') name = `Ujian Diagnostik Pre-Test (${e.operationType === 'MULTIPLICATION' ? 'Perkalian' : 'Pembagian'})`;
        else if (e.examType === 'POST_TEST') name = `Ujian Akhir Master (${e.operationType === 'MULTIPLICATION' ? 'Perkalian' : 'Pembagian'})`;
        
        let status = e.score >= 70.0 ? 'LULUS' : 'REMEDIAL';
        return {
          id: e.id,
          name,
          date: e.date,
          score: e.score,
          status,
        };
      });
      setExamLogs(mappedExams);
      return;
    }

    // Reset to empty states for real database user lookup
    setMultiplicationReport(null);
    setDivisionReport(null);
    setStudentInfo(null);
    setExams([]);
    setMetrics({
      accuracy: { value: '0%', subtext: 'Belum ada data latihan', trend: undefined },
      speed: { value: '0.0 dtk', subtext: 'Belum ada data latihan', trend: undefined },
      activity: { value: '0', subtext: 'Belum ada keaktifan', trend: undefined }
    });
    setChartData([]);
    setExamLogs([]);
    setTeacherComment('Belum ada catatan evaluasi dari guru pengajar.');

    setLoading(true);
    fetch(`/api/reports?studentId=${studentId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
        }
        if (data.student) {
          setStudentInfo(data.student);
          setProfile({
            nama: data.student.nama,
            kelas: data.student.kelas,
            school: data.student.school,
            predicate: data.student.teacher ? 'Aktif' : 'Siswa',
            teacher: data.student.teacher || { nama: 'Belum ditunjuk', school: data.student.school }
          });
        }
        
        if (data.multiplicationReport) {
          setMultiplicationReport(data.multiplicationReport);
        }
        if (data.divisionReport) {
          setDivisionReport(data.divisionReport);
        }

        if (data.report) {
          setTeacherComment(data.report.teacherComment || 'Belum ada catatan evaluasi dari guru pengajar.');
        }

        if (data.reportsHistory && data.reportsHistory.length > 0) {
          setChartData(data.reportsHistory.map((r: any) => ({
            period: r.period,
            accuracy: r.accuracy,
            speed: r.speed
          })));
        }

        if (data.heatmaps) {
          setHeatmapData({
            multiplication: data.heatmaps.multiplication.cells,
            division: data.heatmaps.division.cells,
          });
        }

        // Process exams to detect pre-test / post-test status and logs
        if (data.exams) {
          setExams(data.exams);

          // Map exam history logs
          const mappedExams = data.exams.map((e: any) => {
            let name = 'Ujian Resmi';
            if (e.examType === 'DIAGNOSTIC') name = `Pre-Test (${e.operationType === 'MULTIPLICATION' ? 'Perkalian' : 'Pembagian'})`;
            else if (e.examType === 'WEEKLY') name = 'Ujian Mingguan';
            else if (e.examType === 'MONTHLY') name = 'Ujian Evaluasi Bulanan';
            else if (e.examType === 'POST_TEST') name = `Ujian Akhir Master (${e.operationType === 'MULTIPLICATION' ? 'Perkalian' : 'Pembagian'})`;
            else if (e.examType === 'MONITORING') name = `Ujian Monitoring (${e.operationType === 'MULTIPLICATION' ? 'Perkalian' : 'Pembagian'})`;
            
            let status = 'REMEDIAL';
            if (e.examType === 'POST_TEST') {
              status = e.verifiedByGuru ? 'LULUS' : 'BUTUH VERIFIKASI';
            } else if (e.examType === 'MONITORING') {
              status = e.score >= 90.0 ? 'LULUS' : 'REMEDIAL';
            } else {
              status = e.score >= 70.0 ? 'LULUS' : 'REMEDIAL';
            }

            return {
              id: e.id,
              name,
              date: e.date,
              score: e.score,
              status,
            };
          });
          setExamLogs(mappedExams);
        }
      })
      .catch((err) => console.error('Failed to fetch real data, using premium mocks', err))
      .finally(() => setLoading(false));
  }, [studentId]);

  // Sync metrics cards when activeTab or reports change
  useEffect(() => {
    const currentReport = activeTab === 'multiplication' ? multiplicationReport : divisionReport;
    if (currentReport) {
      setMetrics({
        accuracy: {
          value: `${currentReport.accuracy.toFixed(1)}%`,
          subtext: currentReport.activityScore > 0 ? `Akurasi rata-rata dari ${currentReport.activityScore} ujian` : 'Belum ada data ujian',
          trend: undefined
        },
        speed: {
          value: `${currentReport.speed.toFixed(1)} dtk`,
          subtext: currentReport.activityScore > 0 ? 'Kecepatan rata-rata per soal dalam ujian' : 'Belum ada data ujian',
          trend: undefined
        },
        activity: {
          value: `${currentReport.activityScore}`,
          subtext: `Total sesi ujian ${activeTab === 'multiplication' ? 'perkalian' : 'pembagian'}`,
          trend: undefined
        }
      });
    } else {
      setMetrics({
        accuracy: { value: '0%', subtext: 'Belum ada data ujian', trend: undefined },
        speed: { value: '0.0 dtk', subtext: 'Belum ada data ujian', trend: undefined },
        activity: { value: '0', subtext: 'Belum ada keaktifan', trend: undefined }
      });
    }
  }, [activeTab, multiplicationReport, divisionReport]);

  const handleRequestExam = async () => {
    if (!studentId) return;
    try {
      const res = await fetch('/api/exams', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, action: 'REQUEST_EXAM' }),
      });
      const data = await res.json();
      if (res.ok) {
        setStudentInfo((prev: any) => ({
          ...prev,
          examRequested: data.examRequested,
          examUnlocked: data.examUnlocked,
        }));
      } else {
        alert(data.error || 'Gagal mengajukan ujian.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan koneksi.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
        <p className="mt-4 text-sm font-semibold text-slate-600">Memuat Laporan Numerasi...</p>
      </div>
    );
  }

  // Active heatmap cells based on tab selection
  const currentHeatmap = activeTab === 'multiplication' ? heatmapData.multiplication : heatmapData.division;

  const currentOp = activeTab === 'multiplication' ? 'MULTIPLICATION' : 'DIVISION';
  
  const currentPreTests = exams.filter(
    (e: any) => e.examType === 'DIAGNOSTIC' && e.operationType === currentOp
  );
  const currentPreTestCount = currentPreTests.length;
  const currentHasPreTest = currentPreTestCount >= 3;

  const currentPostTest = exams
    .filter((e: any) => e.examType === 'POST_TEST' && e.operationType === currentOp)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  let currentPostTestStatus = 'NOT_TAKEN';
  if (currentPostTest) {
    if (currentPostTest.verifiedByGuru || currentPostTest.score >= 90) {
      currentPostTestStatus = 'PASSED';
    } else {
      currentPostTestStatus = 'REMEDIAL';
    }
  }

  const expertProgress = activeTab === 'multiplication' ? studentInfo?.multiplicationExpert : studentInfo?.divisionExpert;
  const isEligibleForPostTest = expertProgress?.passed || false;

  return (
    <div className="relative z-0 min-h-screen bg-[#f8fafc] text-slate-800 pb-12">
      {/* Background elegant gradient elements */}
      <div className="absolute top-0 left-0 w-full h-[320px] bg-gradient-to-b from-[#0f172a] to-[#1e293b] -z-10" />

      {/* Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-700/50 pb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                onClick={() => {
                  setShowPasswordModal(true);
                  setPasswordError('');
                  setPasswordSuccess('');
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
                title="Ubah Sandi"
                className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:text-white hover:bg-slate-700 transition-all flex-shrink-0 cursor-pointer"
              >
                <Key className="w-4 h-4" />
              </button>
              <a 
                href="/" 
                title="Keluar (Logout)"
                className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:text-white hover:bg-rose-950/30 hover:text-rose-450 hover:border-rose-900/50 transition-all flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </a>
            </div>
            <div>
              <div className="flex items-center space-x-2 text-teal-400 text-sm font-bold tracking-wider uppercase">
                <span>Raport Perkembangan Siswa</span>
                <span>•</span>
                <span>Sur'ahMath</span>
              </div>
              <h1 className="text-3xl font-extrabold text-white mt-1 tracking-tight">{profile.nama}</h1>
              <div className="flex flex-wrap items-center mt-2 gap-y-2 text-slate-300 text-sm">
                <span className="bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700 mr-3">Kelas {profile.kelas}</span>
                <span className="mr-3">{profile.school}</span>
                <span className="flex items-center text-teal-300 font-semibold bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/20">
                  <Award className="w-4 h-4 mr-1 text-teal-400" />
                  {profile.predicate}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-3">
            {currentHasPreTest ? (
              <a 
                href={studentId ? `/practice?operationType=${currentOp}&studentId=${studentId}` : `/practice?operationType=${currentOp}`} 
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 transition-all shadow-lg hover:shadow-teal-500/20 hover:scale-[1.02]"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Mulai Latihan
              </a>
            ) : (
              <a 
                href={studentId ? `/practice?examType=DIAGNOSTIC&operationType=${currentOp}&studentId=${studentId}` : `/practice?examType=DIAGNOSTIC&operationType=${currentOp}`} 
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 transition-all shadow-lg hover:shadow-rose-500/20 hover:scale-[1.02]"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Mulai Ujian Pre-Test
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Alert Banners for Exam Mode */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-4">
        {!currentHasPreTest && (
          <div className="bg-rose-500/10 border-2 border-rose-500/30 text-rose-300 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-sm animate-pulse">
            <div>
              <h3 className="font-extrabold text-white text-base">⚠️ Ujian Diagnostik (Pre-Test) {activeTab === 'multiplication' ? 'Perkalian' : 'Pembagian'} Diperlukan ({currentPreTestCount}/3)</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Anda wajib menyelesaikan Ujian Diagnostik {activeTab === 'multiplication' ? 'perkalian' : 'pembagian'} sebanyak 3 kali untuk menetapkan nilai dasar numerasi awal.
              </p>
            </div>
            <a
              href={studentId ? `/practice?examType=DIAGNOSTIC&operationType=${currentOp}&studentId=${studentId}` : `/practice?examType=DIAGNOSTIC&operationType=${currentOp}`}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-500/20 whitespace-nowrap transition-all hover:scale-[1.02]"
            >
              Mulai Ujian Pre-Test ({currentPreTestCount + 1}/3)
            </a>
          </div>
        )}

        {currentHasPreTest && currentPostTestStatus === 'PASSED' && (() => {
          const mStage = studentInfo?.monitoringStage ?? 0;
          const lastExamTime = studentInfo?.lastExamDate ? new Date(studentInfo.lastExamDate).getTime() : 0;
          
          const maxStages = settings?.monitoringStagesCount ?? 5;
          const cooldownDays = settings?.monitoringCooldownDays ?? 7;
          
          const now = new Date().getTime();
          const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
          const elapsedMs = now - lastExamTime;
          const isCooldownActive = lastExamTime > 0 && elapsedMs < cooldownMs;
          const remainingMs = cooldownMs - elapsedMs;

          const remainingDays = Math.max(0, Math.floor(remainingMs / (24 * 60 * 60 * 1000)));
          const remainingHours = Math.max(0, Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000)));
          const remainingMinutes = Math.max(0, Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000)));

          if (mStage >= maxStages) {
            return (
              <div className="bg-gradient-to-r from-emerald-600/90 to-teal-600/90 border-2 border-emerald-400/40 text-emerald-100 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm shadow-xl">
                <div className="flex items-center space-x-4">
                  <div className="p-3.5 bg-yellow-400/10 rounded-full text-yellow-300 border border-yellow-400/20 flex-shrink-0 animate-bounce">
                    <Award className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-lg">👑 True Master Numerasi (Lulus Total)</h3>
                    <p className="text-emerald-250 text-xs mt-1 leading-relaxed max-w-2xl">
                      Luar biasa! Anda telah menyelesaikan seluruh {maxStages} Tahap Ujian Monitoring (Spaced Repetition) dengan sukses. Anda telah resmi diakui sebagai True Master perkalian/pembagian!
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div className="bg-gradient-to-r from-teal-950/80 to-slate-900/80 border-2 border-teal-500/30 text-teal-300 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm shadow-xl">
              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-2.5">
                  <span className="bg-teal-500/10 text-teal-300 border border-teal-500/20 px-2.5 py-0.5 rounded text-[10px] font-black tracking-widest uppercase">
                    Fase Monitoring ({mStage}/{maxStages})
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 text-xs font-semibold">Spaced Repetition</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    {isCooldownActive 
                      ? `⏳ Ujian Monitoring Berikutnya (Stage ${mStage + 1}/${maxStages}) Terkunci` 
                      : `🚀 Siap untuk Ujian Monitoring (Stage ${mStage + 1}/${maxStages})`
                    }
                  </h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-2xl">
                    {isCooldownActive 
                      ? `Untuk memastikan retensi memori jangka panjang, ujian dikunci selama ${cooldownDays} hari. Masa tunggu berakhir dalam: ${remainingDays} hari ${remainingHours} jam ${remainingMinutes} menit.` 
                      : `Jeda waktu ${cooldownDays} hari telah terpenuhi! Silakan klik tombol di samping untuk menempuh Ujian Monitoring Anda secara mandiri.`
                    }
                  </p>
                  <p className="text-[10px] text-teal-400/80 mt-1 italic">
                    Catatan: Jalur Latihan Mandiri tetap terbuka bebas untuk belajar kapan saja selama masa tunggu.
                  </p>
                </div>

                {/* Progress dot indicator */}
                <div className="flex items-center space-x-2 pt-1">
                  {Array.from({ length: maxStages }).map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-2 w-8 rounded-full border ${
                        idx < mStage 
                          ? 'bg-emerald-500 border-emerald-600 shadow-sm shadow-emerald-500/20' 
                          : idx === mStage && !isCooldownActive
                          ? 'bg-teal-400 border-teal-500 animate-pulse'
                          : 'bg-slate-800 border-slate-700'
                      }`} 
                    />
                  ))}
                </div>
              </div>

              <div>
                {isCooldownActive ? (
                  <button
                    disabled
                    className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-xs font-black text-slate-500 bg-slate-800/80 border border-slate-700/60 cursor-not-allowed whitespace-nowrap"
                  >
                    <ShieldAlert className="w-4 h-4 mr-2" />
                    Cooldown {cooldownDays} Hari
                  </button>
                ) : (
                  <a
                    href={studentId ? `/practice?examType=MONITORING&operationType=${currentOp}&studentId=${studentId}` : `/practice?examType=MONITORING&operationType=${currentOp}`}
                    className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-xs font-black text-white bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 transition-all shadow-lg hover:shadow-teal-500/20 hover:scale-[1.02] whitespace-nowrap"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Mulai Ujian Monitoring ({mStage + 1}/{maxStages})
                  </a>
                )}
              </div>
            </div>
          );
        })()}

        {currentHasPreTest && currentPostTestStatus !== 'PASSED' && (
          <>
            {studentInfo?.examUnlocked ? (
              <div className="bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-300 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-sm animate-pulse">
                <div>
                  <h3 className="font-extrabold text-white text-base">🎓 Ujian Akhir Master {activeTab === 'multiplication' ? 'Perkalian' : 'Pembagian'} Siap Tempuh!</h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    Ujian akhir master telah diaktifkan oleh Guru Anda. Silakan klik tombol di samping untuk memulai ujian di hadapan Guru.
                  </p>
                </div>
                <a
                  href={studentId ? `/practice?examType=POST_TEST&operationType=${currentOp}&studentId=${studentId}` : `/practice?examType=POST_TEST&operationType=${currentOp}`}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-500/20 whitespace-nowrap transition-all hover:scale-[1.02]"
                >
                  Ikuti Ujian Akhir Master
                </a>
              </div>
            ) : studentInfo?.examRequested ? (
              <div className="bg-amber-500/10 border-2 border-amber-500/30 text-amber-300 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-sm">
                <div>
                  <h3 className="font-extrabold text-white text-base">⏳ Menunggu Persetujuan Guru</h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    Permohonan untuk menempuh Ujian Akhir Master {activeTab === 'multiplication' ? 'perkalian' : 'pembagian'} sedang menunggu persetujuan Guru. Silakan minta Guru Anda untuk mengaktifkan ujian dari dashboard guru.
                  </p>
                </div>
                <button
                  disabled
                  className="px-5 py-2.5 bg-slate-700 text-slate-400 rounded-xl text-xs font-black cursor-not-allowed whitespace-nowrap"
                >
                  Menunggu Persetujuan...
                </button>
              </div>
            ) : (
              <div className="bg-teal-500/10 border-2 border-teal-500/30 text-teal-300 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-sm">
                <div className="flex-1">
                  <h3 className="font-extrabold text-white text-base flex items-center">
                    {isEligibleForPostTest ? '🎓 Siap untuk Ujian Akhir Master?' : '🔒 Ujian Akhir Master Terkunci'}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    {isEligibleForPostTest
                      ? `Anda telah memenuhi syarat untuk mengikuti Ujian Akhir Master ${activeTab === 'multiplication' ? 'perkalian' : 'pembagian'}! Ajukan izin ujian sekarang kepada Guru Anda.`
                      : `Selesaikan minimal 3 latihan di tingkat EXPERT dengan nilai rata-rata minimal 90% pada tab ${activeTab === 'multiplication' ? 'perkalian' : 'pembagian'} untuk membuka ujian. (Progres: ${expertProgress?.sessionCount || 0}/3 latihan, rata-rata ${expertProgress?.average || 0}%)`
                    }
                  </p>
                </div>
                {isEligibleForPostTest ? (
                  <button
                    onClick={handleRequestExam}
                    className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black shadow-lg shadow-teal-500/20 whitespace-nowrap transition-all hover:scale-[1.02]"
                  >
                    Ajukan Ujian Akhir Master
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-5 py-2.5 bg-slate-800 text-slate-500 border border-slate-700 rounded-xl text-xs font-black cursor-not-allowed whitespace-nowrap"
                  >
                    Ujian Terkunci
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Main Grid Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns (Metrics & Heatmap) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard 
              title="Accuracy Score" 
              value={metrics.accuracy.value}
              subtext={metrics.accuracy.subtext}
              trend={metrics.accuracy.trend}
              icon={<Target className="w-5 h-5 text-teal-600" />}
              colorClass="from-teal-500 to-teal-600"
            />
            <MetricCard 
              title="Speed Score" 
              value={metrics.speed.value}
              subtext={metrics.speed.subtext}
              trend={metrics.speed.trend}
              icon={<Zap className="w-5 h-5 text-indigo-600" />}
              colorClass="from-indigo-500 to-indigo-600"
            />
            <MetricCard 
              title="Activity Consistency" 
              value={metrics.activity.value}
              subtext={metrics.activity.subtext}
              trend={metrics.activity.trend}
              icon={<Calendar className="w-5 h-5 text-amber-500" />}
              colorClass="from-amber-400 to-amber-500"
            />
          </div>

          {/* Visual Analytics Grid */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <CardTitle className="text-xl text-slate-800">Mastery Heatmap 10x10</CardTitle>
                <CardDescription>Visualisasi penguasaan perkalian/pembagian angka 1-10</CardDescription>
              </div>
              
              {/* Tab Selector */}
              <div className="flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 mt-3 sm:mt-0">
                <button
                  onClick={() => setActiveTab('multiplication')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    activeTab === 'multiplication' 
                      ? 'bg-white text-slate-800 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tab Perkalian
                </button>
                <button
                  onClick={() => setActiveTab('division')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    activeTab === 'division' 
                      ? 'bg-white text-slate-800 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Tab Pembagian
                </button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {/* Heatmap Legend */}
              <div className="flex flex-wrap items-center justify-center gap-6 mb-6 text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 p-3 rounded-lg">
                <div className="flex items-center">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-500 mr-2 border border-emerald-600" />
                  <span>Master (Benar &ge; 90% & speed &le; 3 dtk)</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3.5 h-3.5 rounded bg-amber-500 mr-2 border border-amber-600" />
                  <span>Latihan (Butuh Latihan)</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3.5 h-3.5 rounded bg-rose-500 mr-2 border border-rose-600" />
                  <span>Lemah (Serangan Sering Salah/Lambat)</span>
                </div>
                <div className="flex items-center">
                  <span className="w-3.5 h-3.5 rounded bg-slate-100 mr-2 border border-slate-200" />
                  <span>Belum Berlatih</span>
                </div>
              </div>

              {/* Responsive Matrix Grid Wrapper with custom styling scrollbars */}
              <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-slate-50">
                <div className="min-w-[500px] flex flex-col justify-center items-center py-2">
                  
                  {/* Operand 2 Label (Horizontal Header) */}
                  <div className="flex mb-1.5">
                    <div className="w-8 h-8 flex items-center justify-center text-[10px] font-extrabold text-slate-400 mr-1.5" />
                    {Array.from({ length: 10 }).map((_, j) => (
                      <div key={j} className="w-8 h-8 flex items-center justify-center text-[11px] font-bold text-slate-400 mr-1">
                        {j + 1}
                      </div>
                    ))}
                  </div>

                  {/* Matrix Rows */}
                  {Array.from({ length: 10 }).map((_, i) => {
                    const rowNum = i + 1;
                    return (
                      <div key={i} className="flex mb-1">
                        {/* Operand 1 Label (Vertical Header) */}
                        <div className="w-8 h-8 flex items-center justify-center text-[11px] font-bold text-slate-400 mr-1.5">
                          {rowNum}
                        </div>

                        {/* Cell Grids */}
                        {Array.from({ length: 10 }).map((_, j) => {
                          const colNum = j + 1;
                          const cell = currentHeatmap.find(c => c.operand1 === rowNum && c.operand2 === colNum) || {
                            status: 'neutral',
                            totalCount: 0,
                            accuracy: 0,
                            avgResponseTime: 0
                          };

                          let colorClass = 'bg-slate-100 text-slate-400 border-slate-200/50 hover:bg-slate-200';
                          if (cell.totalCount > 0) {
                            if (cell.status === 'master') colorClass = 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-sm shadow-emerald-500/10';
                            else if (cell.status === 'practice') colorClass = 'bg-amber-400 text-white border-amber-500 hover:bg-amber-500 shadow-sm shadow-amber-500/10';
                            else if (cell.status === 'weak') colorClass = 'bg-rose-500 text-white border-rose-600 hover:bg-rose-600 shadow-sm shadow-rose-500/10';
                          }

                          return (
                            <div
                              key={j}
                              className={`w-8 h-8 flex items-center justify-center rounded text-[10px] font-bold border transition-all duration-200 cursor-help mr-1 hover:scale-[1.08] relative group/cell ${colorClass}`}
                              title={`${rowNum} ${activeTab === 'multiplication' ? 'x' : '÷'} ${colNum}`}
                            >
                              <span>
                                {activeTab === 'multiplication' 
                                  ? `${rowNum * colNum}` 
                                  : `${colNum}`
                                }
                              </span>

                              {/* Cell Tooltip details */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded bg-slate-900/95 text-white p-2.5 text-[10px] font-medium leading-relaxed shadow-xl border border-slate-700 pointer-events-none opacity-0 group-hover/cell:opacity-100 transition-opacity duration-200 z-20">
                                <p className="font-extrabold border-b border-slate-700 pb-1 mb-1 text-center text-teal-300">
                                  {activeTab === 'multiplication' 
                                    ? `${rowNum} × ${colNum} = ${rowNum * colNum}` 
                                    : `${rowNum} ÷ ${colNum} = ${rowNum / colNum}`
                                  }
                                </p>
                                <p>Sesi Latihan: {cell.totalCount} kali</p>
                                <p>Akurasi: {cell.accuracy}%</p>
                                <p>Rerata Kecepatan: {cell.avgResponseTime > 0 ? formatResponseTime(cell.avgResponseTime) : '-'}</p>
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                  
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Progress Chart & Comments) */}
        <div className="space-y-8">
          
          {/* Progress Chart */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl text-slate-800 flex items-center">
                <TrendingUp className="w-5 h-5 text-teal-600 mr-2" />
                Progress Chart
              </CardTitle>
              <CardDescription>Grafik tren akurasi & kecepatan belajar</CardDescription>
            </CardHeader>
            <CardContent>
              <ProgressChart data={chartData} />
            </CardContent>
          </Card>

          {/* Teacher Comment Card */}
          <Card className="border border-slate-200 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-slate-50/50">
            <div className="absolute top-0 left-0 w-1 bg-amber-500 h-full" />
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-800 flex items-center font-bold">
                <MessageSquare className="w-4 h-4 text-amber-500 mr-2" />
                Catatan Guru
              </CardTitle>
              <CardDescription>Evaluasi langsung oleh guru pengajar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm italic text-slate-600 leading-relaxed bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl">
                "{teacherComment}"
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-400 font-medium">
                <span className="font-semibold text-slate-600 mr-1.5">{profile.teacher.nama}</span>
                <span>•</span>
                <span className="ml-1.5">Diperbarui kemarin</span>
              </div>
            </CardContent>
          </Card>

          {/* Exam Logs History */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-800 flex items-center font-bold">
                <BookOpen className="w-4 h-4 text-teal-600 mr-2" />
                Riwayat Ujian Resmi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {examLogs.map((log) => (
                  <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors duration-200">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{log.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(log.date)}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold text-slate-700">{log.score.toFixed(1)}%</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        log.status === 'LULUS' 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Ubah Sandi Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
            <div className="p-6 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center">
                <Key className="w-5 h-5 text-teal-600 mr-2" />
                Ubah Sandi Akun Anda
              </h3>
              <p className="text-slate-500 text-xs mt-1">Gunakan sandi minimal 6 karakter demi keamanan akun Anda.</p>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (newPassword !== confirmPassword) {
                setPasswordError('Konfirmasi sandi baru tidak cocok');
                return;
              }
              if (newPassword.length < 6) {
                setPasswordError('Sandi baru minimal harus 6 karakter');
                return;
              }
              
              setPasswordSubmitting(true);
              setPasswordError('');
              setPasswordSuccess('');
              
              try {
                const res = await fetch('/api/auth/change-password', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    studentId: studentId || '6c49c487-0a33-4815-bb32-112b76bee827', // use buddy's mock studentId as fallback if null
                    currentPassword,
                    newPassword
                  })
                });
                const data = await res.json();
                if (res.ok) {
                  setPasswordSuccess('Sandi berhasil diperbarui!');
                  setTimeout(() => setShowPasswordModal(false), 1500);
                } else {
                  setPasswordError(data.error || 'Gagal mengubah sandi');
                }
              } catch (err) {
                setPasswordError('Terjadi kesalahan koneksi');
              } finally {
                setPasswordSubmitting(false);
              }
            }} className="p-6 space-y-4">
              {passwordError && (
                <div className="bg-rose-50 text-rose-700 p-3 rounded-lg text-xs font-semibold border border-rose-100">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="bg-emerald-50 text-emerald-700 p-3 rounded-lg text-xs font-semibold border border-emerald-100">
                  {passwordSuccess}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">Sandi Lama</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  placeholder="Masukkan sandi saat ini"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">Sandi Baru</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  placeholder="Masukkan sandi baru (min 6 karakter)"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 block">Konfirmasi Sandi Baru</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  placeholder="Ulangi sandi baru"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                >
                  {passwordSubmitting ? 'Menyimpan...' : 'Simpan Sandi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
        <p className="mt-4 text-sm font-semibold text-slate-600">Memuat Laporan Numerasi...</p>
      </div>
    }>
      <StudentDashboardContent />
    </Suspense>
  );
}

