import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('=== GENERATING MARKDOWN RECAP ===');
  
  const students = await prisma.student.findMany({
    include: {
      exams: {
        orderBy: {
          date: 'asc'
        }
      }
    },
    orderBy: {
      nama: 'asc'
    }
  });

  const teacher = await prisma.teacher.findFirst();
  const schoolName = teacher?.school || 'MTs-MA Al-Khoir Cikande';
  const teacherName = teacher?.nama || 'ahmad novan, S.T';
  const currentDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Calculate monitoring stages count (default to 5)
  let maxStages = 5;
  if (teacher) {
    const setting = await prisma.teacherSetting.findUnique({
      where: { teacherId: teacher.id }
    });
    if (setting) {
      maxStages = setting.monitoringStagesCount;
    }
  }

  let md = `# Laporan Rekapitulasi Nilai Ujian Siswa\n\n`;
  md += `**Platform Pembelajaran Matematika Numerasi - Sur'ahmath**\n\n`;
  md += `| Metadata Laporan | Keterangan |\n`;
  md += `| :--- | :--- |\n`;
  md += `| **Sekolah** | ${schoolName} |\n`;
  md += `| **Guru Pengajar** | ${teacherName} |\n`;
  md += `| **Tanggal Cetak** | ${currentDate} |\n`;
  md += `| **Batas Nilai Kelulusan** | >= 90% (Kriteria Tuntas) |\n\n`;

  md += `> [!NOTE]\n`;
  md += `> Laporan ini direkap secara otomatis dari database sistem ujian resmi. Latihan harian tidak dimasukkan dalam rekapitulasi nilai ini sesuai dengan instruksi.\n\n`;

  const operations = [
    { type: 'MULTIPLICATION', title: '✖️ Operasi Perkalian (Multiplication)' },
    { type: 'DIVISION', title: '➕ Operasi Pembagian (Division)' }
  ];

  for (const op of operations) {
    md += `## ${op.title}\n\n`;
    
    // Header row
    md += `| No | Nama Siswa | Kelas | Pre-Test (Diagnostic) | Post-Test |`;
    for (let i = 1; i <= maxStages; i++) {
      md += ` Monitor ${i} |`;
    }
    md += ` Rata-rata |\n`;

    // Alignment row
    md += `| :---: | :--- | :---: | :---: | :---: |`;
    for (let i = 1; i <= maxStages; i++) {
      md += ` :---: |`;
    }
    md += ` :---: |\n`;

    // Data rows
    students.forEach((student, idx) => {
      const exams = student.exams.filter(e => e.operationType === op.type);
      
      const preTests = exams.filter(e => e.examType === 'DIAGNOSTIC').map(e => `${e.score}%`).join(', ') || '-';
      const postTests = exams.filter(e => e.examType === 'POST_TEST').map(e => `${e.score}%`).join(', ') || '-';
      
      const monitorings = exams.filter(e => e.examType === 'MONITORING')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      md += `| ${idx + 1} | **${student.nama}** | ${student.kelas} | ${preTests} | ${postTests} |`;

      for (let i = 0; i < maxStages; i++) {
        const mExam = monitorings[i];
        md += mExam ? ` **${mExam.score}%** |` : ` - |`;
      }

      const avg = exams.length > 0
        ? `${Math.round(exams.reduce((sum, e) => sum + e.score, 0) / exams.length)}%`
        : '-';

      md += ` **${avg}** |\n`;
    });

    md += `\n`;
  }

  md += `---\n\n`;
  md += `### Lembar Pengesahan (Cetak)\n\n`;
  md += `| Mengetahui, | Tangerang, ${currentDate} |\n`;
  md += `| :---: | :---: |\n`;
  md += `| Kepala Sekolah | Guru Pengajar |\n`;
  md += `| | |\n`;
  md += `| | |\n`;
  md += `| | |\n`;
  md += `| ( .................................... ) | ( **${teacherName}** ) |\n`;
  md += `| NIP. | NUPTK. |\n`;

  const outputPath = 'C:/Users/adenf/.gemini/antigravity/brain/24ea118d-981b-47b2-af1c-11f294ac6473/student_exams_recap.md';
  fs.writeFileSync(outputPath, md, 'utf-8');
  console.log(`Markdown report written successfully to ${outputPath}`);
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
