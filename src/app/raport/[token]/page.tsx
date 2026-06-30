'use client';

import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Target, 
  Zap, 
  Calendar, 
  Award, 
  MessageSquare, 
  Loader2, 
  TrendingUp, 
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import MetricCard from '@/components/dashboard/MetricCard';
import ProgressChart from '@/components/analytics/ProgressChart';
import { formatDate, formatResponseTime } from '@/lib/utils';

// Fallback Mock Data matching the database test student
const MOCK_STUDENT = {
  nama: 'Budi Santoso',
  kelas: '7-A',
  school: 'MTsN 1 Jakarta',
  predicate: 'Raja Perkalian',
  teacher: {
    nama: 'Ibu Fatimah, S.Pd.',
    school: 'MTsN 1 Jakarta',
  }
};

const MOCK_METRICS = {
  accuracy: {
    value: '85.4%',
    subtext: 'Akurasi pengerjaan soal latihan',
    trend: { value: '5.4%', isPositive: true }
  },
  speed: {
    value: '2.7 dtk',
    subtext: 'Rata-rata kecepatan berhitung',
    trend: { value: '67.0%', isPositive: true }
  },
  activity: {
    value: '5 hari',
    subtext: 'Total keaktifan latihan minggu ini',
    trend: { value: '2 hari', isPositive: true }
  }
};

const MOCK_CHART_DATA = [
  { period: 'Pre-Test', accuracy: 65.0, speed: 8.2 },
  { period: 'Minggu 1', accuracy: 70.2, speed: 6.4 },
  { period: 'Minggu 2', accuracy: 74.8, speed: 5.1 },
  { period: 'Minggu 3', accuracy: 79.5, speed: 4.0 },
  { period: 'Minggu 4', accuracy: 82.1, speed: 3.2 },
  { period: 'Minggu 5', accuracy: 85.4, speed: 2.7 },
];

function generateMockHeatmap() {
  const cells = [];
  for (let i = 1; i <= 10; i++) {
    for (let j = 1; j <= 10; j++) {
      let status: 'master' | 'practice' | 'weak' | 'neutral' = 'neutral';
      let total = 0;
      let correct = 0;
      let time = 0;

      if (i <= 3 && j <= 8) {
        total = 5;
        correct = 5;
        time = 1400;
        status = 'master';
      } else if (i <= 6) {
        total = 4;
        if (i === 5 && j === 7) {
          correct = 1;
          time = 6200;
          status = 'weak';
        } else {
          correct = 3;
          time = 2200;
          status = 'practice';
        }
      }
      cells.push({ operand1: i, operand2: j, status, totalCount: total, accuracy: total > 0 ? (correct/total)*100 : 0, avgResponseTime: time });
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

export default function ParentPortal({ params }: { params: React.Usable<{ token: string }> }) {
  // Unwrap parameters using React.use() as recommended for newer Next.js versions
  const { token } = React.use(params);

  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(MOCK_STUDENT);
  const [metrics, setMetrics] = useState<MetricsGroup>(MOCK_METRICS);
  const [chartData, setChartData] = useState(MOCK_CHART_DATA);
  const [activeTab, setActiveTab] = useState<'multiplication' | 'division'>('multiplication');
  
  const [heatmapData, setHeatmapData] = useState<{
    multiplication: any[];
    division: any[];
  }>({
    multiplication: [],
    division: [],
  });

  // Load parent portal data
  useEffect(() => {
    // Generate default heatmap on mount
    setHeatmapData({
      multiplication: generateMockHeatmap(),
      division: generateMockHeatmap(),
    });

    if (!token || token === 'mock-unique-token-xyz-123') return;

    setLoading(true);
    fetch(`/api/reports?parentToken=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.student) {
          setProfile({
            nama: data.student.nama,
            kelas: data.student.kelas,
            school: data.student.school,
            predicate: 'Aktif',
            teacher: data.student.teacher || { nama: 'Belum ditunjuk', school: data.student.school }
          });
        }

        if (data.report) {
          setMetrics({
            accuracy: {
              value: `${data.report.accuracy.toFixed(1)}%`,
              subtext: 'Persentase pengerjaan soal benar',
              trend: undefined
            },
            speed: {
              value: `${data.report.speed.toFixed(1)} dtk`,
              subtext: 'Rata-rata waktu respons',
              trend: undefined
            },
            activity: {
              value: `${Math.round(data.report.activityScore)}`,
              subtext: 'Indeks keaktifan latihan siswa',
              trend: undefined
            }
          });
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
      })
      .catch((err) => console.error('Failed to fetch token data, using default mock data', err))
      .finally(() => setLoading(false));
  }, [token]);

  // Handle printing
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
        <p className="mt-4 text-sm font-semibold text-slate-600">Memuat Dokumen Raport Wali Murid...</p>
      </div>
    );
  }

  const currentHeatmap = activeTab === 'multiplication' ? heatmapData.multiplication : heatmapData.division;

  return (
    <div className="relative z-0 min-h-screen bg-[#f8fafc] text-slate-800 pb-12 print:bg-white print:pb-0 print:text-black">
      {/* Background header banner (hidden in print) */}
      <div className="absolute top-0 left-0 w-full h-[280px] bg-gradient-to-b from-[#0f172a] to-[#1e293b] -z-10 print:hidden" />

      {/* CSS Styles block for A4 Print formatting */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            font-size: 12px !important;
          }
          .no-print {
            display: none !important;
          }
          .print-card {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            background: white !important;
            break-inside: avoid !important;
            margin-bottom: 1.5rem !important;
            padding: 1rem !important;
          }
          .print-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem !important;
          }
          .print-container {
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-title {
            color: black !important;
          }
          .print-heatmap-cell {
            print-color-adjust: exact !important;
            -webkit-print-color-adjust: exact !important;
          }
        }
      `}</style>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 print-container">
        
        {/* Verification banner (hidden in print) */}
        <div className="no-print bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 p-4 rounded-xl flex items-center justify-between mb-6 backdrop-blur-sm">
          <div className="flex items-center space-x-2 text-xs font-bold">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Akses Wali Murid Tervalidasi (Tanpa Password)</span>
          </div>
          
          <button
            onClick={handlePrint}
            className="flex items-center justify-center px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-all shadow-md shadow-slate-950/10 hover:scale-[1.01]"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Cetak / Unduh Raport (PDF)
          </button>
        </div>

        {/* Printable Header Profile */}
        <div className="border-b border-slate-700/50 print:border-b-2 print:border-black pb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-4">
            <a 
              href="/" 
              className="no-print p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:text-white transition-all flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </a>
            <div>
              <div className="text-teal-400 print:text-slate-500 text-xs font-bold tracking-wider uppercase">
                Dokumen Raport Perkembangan Numerasi
              </div>
              <h1 className="text-3xl font-extrabold text-white print:text-black mt-1 print-title tracking-tight">
                {profile.nama}
              </h1>
              <div className="flex flex-wrap items-center mt-2 gap-y-1 text-slate-300 print:text-slate-700 text-sm">
                <span className="bg-slate-850 print:bg-slate-100 border border-slate-750 print:border-slate-300 px-2.5 py-0.5 rounded mr-3">Kelas {profile.kelas}</span>
                <span className="mr-3 font-semibold">{profile.school}</span>
                <span className="flex items-center text-teal-300 print:text-teal-800 font-bold bg-teal-500/10 print:bg-teal-50 px-2 rounded border border-teal-500/20">
                  <Award className="w-3.5 h-3.5 mr-1" />
                  {profile.predicate}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 md:mt-0 text-slate-400 print:text-slate-500 text-right text-xs leading-relaxed">
            <div>Wali Kelas: <span className="font-semibold text-slate-200 print:text-black">{profile.teacher.nama}</span></div>
            <div className="mt-0.5">Tanggal Cetak: <span className="font-medium text-slate-300 print:text-black">{formatDate(new Date())}</span></div>
          </div>
        </div>

        {/* Printable Grid Area */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8 print-grid">
          
          {/* Metrics & Heatmap (Left/Top side) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Metric widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <MetricCard 
                title="Accuracy Score" 
                value={metrics.accuracy.value}
                subtext={metrics.accuracy.subtext}
                icon={<Target className="w-5 h-5 text-teal-600" />}
                colorClass="from-teal-500 to-teal-600"
              />
              <MetricCard 
                title="Speed Score" 
                value={metrics.speed.value}
                subtext={metrics.speed.subtext}
                icon={<Zap className="w-5 h-5 text-indigo-600" />}
                colorClass="from-indigo-500 to-indigo-600"
              />
              <MetricCard 
                title="Activity Consistency" 
                value={metrics.activity.value}
                subtext={metrics.activity.subtext}
                icon={<Calendar className="w-5 h-5 text-amber-500" />}
                colorClass="from-amber-400 to-amber-500"
              />
            </div>

            {/* Heatmap Card widget */}
            <Card className="border border-slate-200 shadow-sm print-card">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <CardTitle className="text-lg text-slate-800">Mastery Heatmap 10x10</CardTitle>
                  <CardDescription>Status penguasaan materi hitung angka 1-10</CardDescription>
                </div>
                
                {/* Tab selector (hidden in print) */}
                <div className="no-print flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 mt-3 sm:mt-0">
                  <button
                    onClick={() => setActiveTab('multiplication')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      activeTab === 'multiplication' 
                        ? 'bg-white text-slate-800 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Perkalian
                  </button>
                  <button
                    onClick={() => setActiveTab('division')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      activeTab === 'division' 
                        ? 'bg-white text-slate-800 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Pembagian
                  </button>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {/* Heatmap legend description */}
                <div className="flex flex-wrap items-center justify-center gap-4 mb-6 text-[10px] font-semibold text-slate-500 bg-slate-50 print:bg-white border border-slate-100 p-2.5 rounded-lg">
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded bg-emerald-500 mr-1.5 border border-emerald-600 print-heatmap-cell" />
                    <span>Master (Benar &ge; 90% & speed &le; 3 dtk)</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded bg-amber-400 mr-1.5 border border-amber-500 print-heatmap-cell" />
                    <span>Butuh Latihan</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded bg-rose-500 mr-1.5 border border-rose-600 print-heatmap-cell" />
                    <span>Lemah (Serangan Sering Salah)</span>
                  </div>
                </div>

                {/* Heatmap Matrix grids */}
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[450px] flex flex-col justify-center items-center py-2">
                    
                    {/* Header Columns */}
                    <div className="flex mb-1.5">
                      <div className="w-7 h-7 mr-1" />
                      {Array.from({ length: 10 }).map((_, j) => (
                        <div key={j} className="w-7 h-7 flex items-center justify-center text-[10px] font-bold text-slate-400 mr-0.5">
                          {j + 1}
                        </div>
                      ))}
                    </div>

                    {/* Table Rows */}
                    {Array.from({ length: 10 }).map((_, i) => {
                      const rowNum = i + 1;
                      return (
                        <div key={i} className="flex mb-0.5">
                          <div className="w-7 h-7 flex items-center justify-center text-[10px] font-bold text-slate-400 mr-1">
                            {rowNum}
                          </div>

                          {Array.from({ length: 10 }).map((_, j) => {
                            const colNum = j + 1;
                            const cell = currentHeatmap.find(c => c.operand1 === rowNum && c.operand2 === colNum) || {
                              status: 'neutral',
                              accuracy: 0
                            };

                            let colorClass = 'bg-slate-100 text-slate-400 border-slate-200/50';
                            if (cell.totalCount === undefined || cell.totalCount > 0) {
                              if (cell.status === 'master') colorClass = 'bg-emerald-500 text-white border-emerald-600 print-heatmap-cell';
                              else if (cell.status === 'practice') colorClass = 'bg-amber-400 text-white border-amber-500 print-heatmap-cell';
                              else if (cell.status === 'weak') colorClass = 'bg-rose-500 text-white border-rose-600 print-heatmap-cell';
                            }

                            return (
                              <div
                                key={j}
                                className={`w-7 h-7 flex items-center justify-center rounded text-[9px] font-bold border mr-0.5 relative group/cell print-heatmap-cell ${colorClass}`}
                              >
                                <span>
                                  {activeTab === 'multiplication' ? rowNum * colNum : colNum}
                                </span>
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

          {/* Right Column details (Progress Chart & Catatan Guru) */}
          <div className="space-y-6">
            
            {/* Progress chart */}
            <Card className="border border-slate-200 shadow-sm print-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-slate-800 flex items-center font-bold">
                  <TrendingUp className="w-4 h-4 text-teal-600 mr-2" />
                  Tren Perkembangan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressChart data={chartData} />
              </CardContent>
            </Card>

            {/* Comments Card */}
            <Card className="border border-slate-200 shadow-sm relative overflow-hidden bg-gradient-to-br from-white to-slate-50/50 print-card">
              <div className="absolute top-0 left-0 w-1 bg-amber-500 h-full print:hidden" />
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-800 flex items-center font-bold">
                  <MessageSquare className="w-4 h-4 text-amber-500 mr-2" />
                  Catatan Evaluasi Guru
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs italic text-slate-600 leading-relaxed bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl print:bg-white print:border-slate-300 print:text-black">
                  "{profile.teacher.nama}: Ananda Budi menunjukkan perkembangan yang sangat signifikan, khususnya pada otomatisasi perkalian angka 1-3. Mohon dipertahankan latihannya di rumah, terutama pada tabel perkalian 7 dan 8 yang masih memiliki respons jawaban agak lambat."
                </div>
              </CardContent>
            </Card>

            {/* School Signature Panel (Visible ONLY in print) */}
            <div className="hidden print:block pt-12 text-xs flex justify-end">
              <div className="text-center w-48 float-right">
                <p>Jakarta, {formatDate(new Date())}</p>
                <p className="mt-1 font-semibold">Guru Wali Kelas</p>
                <div className="h-16" />
                <p className="font-bold underline">{profile.teacher.nama}</p>
                <p className="text-[10px] text-slate-500">NIP. 198204122008012003</p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
