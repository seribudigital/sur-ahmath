import { PrismaClient, Role, OperationType, ExamType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Menambahkan user baru...');

  // 1. Dapatkan data guru pendidik yang sudah ada (Ibu Fatimah)
  const teacher = await prisma.teacher.findFirst();
  if (!teacher) {
    console.error('Data guru Fatimah tidak ditemukan. Jalankan seed terlebih dahulu.');
    return;
  }

  // 2. Buat data user wali murid baru
  const parentUser = await prisma.user.create({
    data: {
      email: 'parent.farhan@mail.com',
      passwordHash: 'hashed_password_123',
      role: Role.PARENT,
      parent: {
        create: {
          nama: 'Bapak Hendra',
          kontak: '085712345678',
          uniqueToken: 'token-unik-farhan-999',
        }
      }
    },
    include: { parent: true }
  });
  const parentId = parentUser.parent!.id;
  console.log(`Berhasil membuat Wali Murid: ${parentUser.parent!.nama}`);

  // 3. Buat data siswa baru (Farhan Ramadhan)
  const studentUser = await prisma.user.create({
    data: {
      email: 'siswa.baru@sekolah.id',
      passwordHash: 'hashed_password_123',
      role: Role.STUDENT,
      student: {
        create: {
          nama: 'Farhan Ramadhan',
          kelas: '7-B',
          school: 'MTsN 1 Jakarta',
          teacherId: teacher.id,
          parentId: parentId,
        }
      }
    },
    include: { student: true }
  });
  const studentId = studentUser.student!.id;
  console.log(`Berhasil membuat Siswa: ${studentUser.student!.nama} (ID: ${studentId})`);

  // 4. Buat histori latihan awal untuk Farhan (beberapa perkalian)
  await prisma.practiceSession.create({
    data: {
      studentId,
      operationType: OperationType.MULTIPLICATION,
      duration: 48, // detik
      totalQuestions: 6,
      correctAnswers: 5,
      questionLogs: {
        create: [
          { operationType: OperationType.MULTIPLICATION, operand1: 2, operand2: 4, userAnswer: 8, correct: true, responseTime: 2100 },
          { operationType: OperationType.MULTIPLICATION, operand1: 3, operand2: 5, userAnswer: 15, correct: true, responseTime: 1900 },
          { operationType: OperationType.MULTIPLICATION, operand1: 4, operand2: 3, userAnswer: 12, correct: true, responseTime: 2400 },
          { operationType: OperationType.MULTIPLICATION, operand1: 5, operand2: 5, userAnswer: 25, correct: true, responseTime: 2900 },
          { operationType: OperationType.MULTIPLICATION, operand1: 6, operand2: 7, userAnswer: 40, correct: false, responseTime: 5100 }, // Salah (6x7 = 42)
          { operationType: OperationType.MULTIPLICATION, operand1: 6, operand2: 7, userAnswer: 42, correct: true, responseTime: 3800 },
        ]
      }
    }
  });
  console.log('Berhasil membuat sesi latihan awal perkalian.');

  // 5. Buat data ujian awal (Pre-Test) untuk Farhan
  await prisma.exam.create({
    data: {
      studentId,
      examType: ExamType.DIAGNOSTIC,
      operationType: OperationType.MULTIPLICATION,
      score: 70.0,
      statusRemedial: false,
      verifiedByGuru: false,
    }
  });

  // 6. Buat Raport perkembangan awal
  await prisma.report.create({
    data: {
      studentId,
      period: 'Minggu 1',
      accuracy: 83.3,
      speed: 3.0,
      activityScore: 25.0,
      teacherComment: 'Selamat bergabung Farhan. Latihan awal menunjukkan akurasi yang cukup baik, pertahankan konsistensinya!',
    }
  });
  console.log('Berhasil membuat raport awal perkembangan.');

  console.log('\n--- DATA USER BARU BISA DIGUNAKAN UNTUK LOGIN ---');
  console.log('Siswa:');
  console.log('  Email:    siswa.baru@sekolah.id');
  console.log('  Password: hashed_password_123');
  console.log('Wali Murid:');
  console.log('  Token:    token-unik-farhan-999');
  console.log('--------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Gagal menambahkan user baru:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
