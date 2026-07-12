'use client';

import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  Search, 
  Award,
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  BookOpen
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface Exam {
  id: string;
  examType: 'DIAGNOSTIC' | 'WEEKLY' | 'MONTHLY' | 'MASTERY' | 'POST_TEST' | 'MONITORING';
  operationType: 'MULTIPLICATION' | 'DIVISION';
  score: number;
  statusRemedial: boolean;
  date: string;
  verifiedByGuru: boolean;
}

interface Student {
  id: string;
  nama: string;
  kelas: string;
  school: string;
  exams: Exam[];
}

interface Teacher {
  id: string;
  nama: string;
  school: string;
}

interface Settings {
  monitoringStagesCount: number;
}

interface TeacherExamsRecapProps {
  teacherUserId: string;
}

export default function TeacherExamsRecap({ teacherUserId }: TeacherExamsRecapProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [settings, setSettings] = useState<Settings>({ monitoringStagesCount: 5 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [operationTab, setOperationTab] = useState<'MULTIPLICATION' | 'DIVISION'>('MULTIPLICATION');

  // Load recap data from database
  useEffect(() => {
    setLoading(true);
    fetch(`/api/teacher/exams-recap?teacherUserId=${teacherUserId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Gagal memuat rekap data ujian');
        return res.json();
      })
      .then((data) => {
        if (data.students) setStudents(data.students);
        if (data.teacher) setTeacher(data.teacher);
        if (data.settings) setSettings(data.settings);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [teacherUserId]);

  // Extract all unique classes dynamically from students list
  const classes = Array.from(new Set(students.map((s) => s.kelas))).filter(Boolean).sort();

  // Filter students based on search and class filter
  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.nama.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesClass = classFilter === 'ALL' || s.kelas === classFilter;
    return matchesSearch && matchesClass;
  });

  // Calculate average of exam scores (Pre, Post, Monitoring) for a student
  const getExamStats = (student: Student, op: 'MULTIPLICATION' | 'DIVISION') => {
    const diagnosticExams = student.exams.filter(
      (e) => e.examType === 'DIAGNOSTIC' && e.operationType === op
    );
    const postTestExams = student.exams.filter(
      (e) => e.examType === 'POST_TEST' && e.operationType === op
    );
    // Filter monitoring exams, ordered by date asc (already ordered from API but safe to ensure here)
    const monitoringExams = student.exams
      .filter((e) => e.examType === 'MONITORING' && e.operationType === op)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const allOpExams = student.exams.filter((e) => e.operationType === op);
    const average = allOpExams.length > 0
      ? Math.round(allOpExams.reduce((sum, e) => sum + e.score, 0) / allOpExams.length)
      : null;

    return {
      diagnosticExams,
      postTestExams,
      monitoringExams,
      average,
      totalExams: allOpExams.length
    };
  };

  // Export to CSV Function
  const handleExportCSV = () => {
    const opLabel = operationTab === 'MULTIPLICATION' ? 'Perkalian' : 'Pembagian';
    const filename = `rekap_nilai_ujian_${opLabel.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`;
    
    // CSV Headers
    const headers = [
      'No',
      'Nama Siswa',
      'Kelas',
      'Sekolah',
      'Pre-Test (Diagnostic)',
      'Post-Test',
    ];

    // Add Monitoring headers dynamically
    for (let i = 1; i <= settings.monitoringStagesCount; i++) {
      headers.push(`Monitoring Stage ${i}`);
    }
    headers.push('Rata-rata Nilai Ujian (%)');

    // CSV Rows
    const rows = filteredStudents.map((s, idx) => {
      const stats = getExamStats(s, operationTab);
      
      const preTestStr = stats.diagnosticExams.map(e => `${e.score}%`).join(', ') || '-';
      const postTestStr = stats.postTestExams.map(e => `${e.score}%`).join(', ') || '-';
      
      const row = [
        idx + 1,
        `"${s.nama.replace(/"/g, '""')}"`,
        `"${s.kelas}"`,
        `"${s.school}"`,
        `"${preTestStr}"`,
        `"${postTestStr}"`,
      ];

      // Add monitoring scores
      for (let i = 0; i < settings.monitoringStagesCount; i++) {
        const exam = stats.monitoringExams[i];
        row.push(exam ? `${exam.score}%` : '-');
      }

      // Add average
      row.push(stats.average !== null ? `${stats.average}%` : '-');

      return row;
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Create Download Link
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Function
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-4" />
        <p className="text-slate-600 font-semibold text-sm">Memuat rekapitulasi nilai ujian...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 text-rose-700 p-6 rounded-xl border border-rose-100 max-w-2xl mx-auto my-8 text-center">
        <p className="font-bold mb-2">Terjadi kesalahan saat memuat data</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
      
      {/* Action panel (Hidden on print) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center">
            📈 Rekapitulasi Nilai Ujian Siswa
          </h2>
          <p className="text-slate-500 text-sm mt-0.5 font-medium">
            Laporan lengkap nilai ujian pre-test, post-test, dan monitoring siswa per kelas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={filteredStudents.length === 0}
            className="flex items-center justify-center py-2.5 px-4 bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-bold rounded-lg border border-teal-200/60 shadow-sm transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Ekspor CSV
          </button>
          
          <button
            onClick={handlePrint}
            disabled={filteredStudents.length === 0}
            className="flex items-center justify-center py-2.5 px-5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg border border-slate-700 shadow-md transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Cetak Laporan / PDF
          </button>
        </div>
      </div>

      {/* Filter panel (Hidden on print) */}
      <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4 print:hidden">
        
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama siswa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium placeholder-slate-400"
          />
        </div>

        {/* Class Filter */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Kelas:</span>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="w-full md:w-auto px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/10 bg-white font-semibold text-slate-700 cursor-pointer"
          >
            <option value="ALL">Semua Kelas</option>
            {classes.map((kls) => (
              <option key={kls} value={kls}>Kelas {kls}</option>
            ))}
          </select>
        </div>

        {/* Operation Selector */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/50 w-full md:w-auto ml-auto">
          <button
            onClick={() => setOperationTab('MULTIPLICATION')}
            className={`flex-1 md:flex-initial px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              operationTab === 'MULTIPLICATION'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ✖️ Perkalian
          </button>
          <button
            onClick={() => setOperationTab('DIVISION')}
            className={`flex-1 md:flex-initial px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
              operationTab === 'DIVISION'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            ➕ Pembagian
          </button>
        </div>
      </div>

      {/* Printable Report Title & Header (Visible ONLY on print) */}
      <div className="hidden print:block mb-8 font-serif">
        <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900">
            LAPORAN REKAPITULASI NILAI UJIAN SISWA
          </h1>
          <p className="text-sm font-bold text-slate-700 mt-1 uppercase">
            Platform Pembelajaran Matematika Numerasi - Sur'ahmath
          </p>
          <div className="flex justify-between text-xs text-slate-600 mt-4 px-2">
            <span><strong>Sekolah:</strong> {teacher?.school || 'MTs-MA Al-Khoir Cikande'}</span>
            <span><strong>Guru Pengajar:</strong> {teacher?.nama || 'ahmad novan, S.T'}</span>
            <span><strong>Operasi:</strong> {operationTab === 'MULTIPLICATION' ? 'Perkalian (Multiplication)' : 'Pembagian (Division)'}</span>
            <span><strong>Tanggal Cetak:</strong> {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>
      </div>

      {/* Recap Data Card */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden bg-white print:border-none print:shadow-none">
        <div className="h-1 bg-gradient-to-r from-teal-500 to-indigo-500 print:hidden" />
        
        {/* Table Title on UI */}
        <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between print:hidden">
          <div>
            <CardTitle className="text-lg text-slate-800 flex items-center">
              <BookOpen className="w-5 h-5 text-teal-600 mr-2" />
              Daftar Nilai Ujian - {operationTab === 'MULTIPLICATION' ? 'Perkalian' : 'Pembagian'}
            </CardTitle>
            <CardDescription>
              Menampilkan {filteredStudents.length} siswa dengan filter aktif. Nilai kelulusan minimal adalah 90%.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium">
              Tidak ada data siswa yang cocok dengan filter pencarian.
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px] print:min-w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider print:bg-slate-100 print:text-slate-800">
                  <th className="py-3 px-4 w-12 text-center">No</th>
                  <th className="py-3 px-4 min-w-[150px]">Nama Siswa</th>
                  <th className="py-3 px-3 w-16 text-center">Kelas</th>
                  <th className="py-3 px-4 text-center min-w-[120px]">Pre-Test (Diagnostic)</th>
                  <th className="py-3 px-4 text-center min-w-[100px]">Post-Test</th>
                  
                  {/* Dynamic Monitoring Headers */}
                  {Array.from({ length: settings.monitoringStagesCount }).map((_, i) => (
                    <th key={i} className="py-3 px-2 text-center w-24">
                      Monitor {i + 1}
                    </th>
                  ))}
                  
                  <th className="py-3 px-4 text-center w-24">Rata-rata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700 print:text-slate-900">
                {filteredStudents.map((student, idx) => {
                  const stats = getExamStats(student, operationTab);
                  
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors odd:bg-slate-50/20 print:odd:bg-slate-50/50">
                      {/* No */}
                      <td className="py-3.5 px-4 text-center font-semibold text-slate-400 print:text-slate-600">
                        {idx + 1}
                      </td>

                      {/* Name */}
                      <td className="py-3.5 px-4 font-bold text-slate-800 print:text-slate-900">
                        {student.nama}
                      </td>

                      {/* Class */}
                      <td className="py-3.5 px-3 text-center font-bold text-indigo-600 print:text-slate-900">
                        {student.kelas}
                      </td>

                      {/* Pre-Test Scores */}
                      <td className="py-3.5 px-4 text-center font-medium">
                        {stats.diagnosticExams.length === 0 ? (
                          <span className="text-slate-300">-</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {stats.diagnosticExams.map((e) => (
                              <span
                                key={e.id}
                                className={`px-2 py-0.5 rounded text-xs font-black ${
                                  e.score >= 90
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50 print:text-emerald-700'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200/50 print:text-rose-700'
                                }`}
                                title={new Date(e.date).toLocaleDateString()}
                              >
                                {e.score}%
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Post-Test Scores */}
                      <td className="py-3.5 px-4 text-center font-medium">
                        {stats.postTestExams.length === 0 ? (
                          <span className="text-slate-300">-</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {stats.postTestExams.map((e) => (
                              <span
                                key={e.id}
                                className={`px-2 py-0.5 rounded text-xs font-black ${
                                  e.score >= 90
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50 print:text-emerald-700'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200/50 print:text-rose-700'
                                }`}
                                title={new Date(e.date).toLocaleDateString()}
                              >
                                {e.score}%
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Dynamic Monitoring Stages */}
                      {Array.from({ length: settings.monitoringStagesCount }).map((_, i) => {
                        const exam = stats.monitoringExams[i];
                        
                        return (
                          <td key={i} className="py-3.5 px-2 text-center font-medium">
                            {exam ? (
                              <span
                                className={`px-2 py-1 rounded text-xs font-black ${
                                  exam.score >= 90
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50 print:text-emerald-700'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200/50 print:text-rose-700'
                                }`}
                                title={new Date(exam.date).toLocaleDateString()}
                              >
                                {exam.score}%
                              </span>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Average */}
                      <td className="py-3.5 px-4 text-center font-extrabold text-slate-800 print:text-slate-900">
                        {stats.average !== null ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-black ${
                            stats.average >= 90
                              ? 'bg-teal-50 text-teal-700 border border-teal-200/50 print:text-teal-700'
                              : 'bg-slate-100 text-slate-700 border border-slate-200/50 print:text-slate-700'
                          }`}>
                            {stats.average}%
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
      
      {/* Formal Signature/Sign-off for Printed Layout */}
      <div className="hidden print:block mt-16 font-serif">
        <div className="grid grid-cols-2 text-center text-sm text-slate-800">
          <div>
            <p className="mb-16">Mengetahui,<br /><strong>Kepala Sekolah</strong></p>
            <p className="border-b border-slate-400 w-48 mx-auto"></p>
            <p className="mt-1">NIP. ..................................</p>
          </div>
          <div>
            <p className="mb-16">Tangerang, {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}<br /><strong>Guru Pengajar</strong></p>
            <p className="border-b border-slate-400 w-48 mx-auto font-bold">{teacher?.nama || 'ahmad novan, S.T'}</p>
            <p className="mt-1">NUPTK. ..............................</p>
          </div>
        </div>
      </div>
      
    </div>
  );
}
