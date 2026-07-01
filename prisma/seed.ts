import { PrismaClient, Role, OperationType, ExamType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // 1. Clean existing records
  await prisma.user.deleteMany({});
  
  // 2. Create Teacher
  const teacherUser = await prisma.user.create({
    data: {
      id: 'teacher-user-id-xyz', // Static User ID matching default/mock
      email: 'admin@surahmath.id',
      passwordHash: 'Surahmath123',
      role: Role.TEACHER,
      teacher: {
        create: {
          id: 'teacher-id-xyz', // Static Teacher ID matching default/mock
          nama: 'ahmad novan, S.T',
          school: 'MTsN 1 Jakarta',
        }
      }
    },
    include: { teacher: true }
  });
  const teacherId = teacherUser.teacher!.id;
  console.log(`Created teacher: ${teacherUser.teacher!.nama}`);

  // 3. Create Parent
  const parentUser = await prisma.user.create({
    data: {
      email: 'parent.ahmad@mail.com',
      passwordHash: 'hashed_password_123',
      role: Role.PARENT,
      parent: {
        create: {
          nama: 'Pak Ahmad',
          kontak: '08123456789',
        }
      }
    },
    include: { parent: true }
  });
  const parentId = parentUser.parent!.id;
  console.log(`Created parent: ${parentUser.parent!.nama}`);

  // 4. Create Student (Budi)
  const studentUser = await prisma.user.create({
    data: {
      email: 'siswa.budi@sekolah.id',
      passwordHash: 'hashed_password_123',
      role: Role.STUDENT,
      student: {
        create: {
          id: '6c49c487-0a33-4815-bb32-112b76bee827', // Matching default studentId
          nama: 'Budi Santoso',
          kelas: '7A',
          school: 'MTsN 1 Jakarta',
          teacherId: teacherId,
          parentId: parentId,
          uniqueToken: 'mock-unique-token-xyz-123', // Token matching portal URLs
        }
      }
    },
    include: { student: true }
  });
  const studentId = studentUser.student!.id;
  console.log(`Created student: ${studentUser.student!.nama}`);

  // 5. Create Practice Sessions & Logs for Budi (Multiplication)
  const session1 = await prisma.practiceSession.create({
    data: {
      studentId,
      operationType: OperationType.MULTIPLICATION,
      duration: 35, // seconds
      totalQuestions: 8,
      correctAnswers: 6,
      questionLogs: {
        create: [
          { operationType: OperationType.MULTIPLICATION, operand1: 2, operand2: 3, userAnswer: 6, correct: true, responseTime: 2500 },
          { operationType: OperationType.MULTIPLICATION, operand1: 2, operand2: 5, userAnswer: 10, correct: true, responseTime: 1800 },
          { operationType: OperationType.MULTIPLICATION, operand1: 3, operand2: 3, userAnswer: 9, correct: true, responseTime: 2100 },
          { operationType: OperationType.MULTIPLICATION, operand1: 3, operand2: 7, userAnswer: 20, correct: false, responseTime: 5200 }, // failed 3x7
          { operationType: OperationType.MULTIPLICATION, operand1: 4, operand2: 4, userAnswer: 16, correct: true, responseTime: 3100 },
          { operationType: OperationType.MULTIPLICATION, operand1: 5, operand2: 7, userAnswer: 35, correct: true, responseTime: 4000 },
          { operationType: OperationType.MULTIPLICATION, operand1: 5, operand2: 8, userAnswer: 45, correct: false, responseTime: 6500 }, // failed 5x8
          { operationType: OperationType.MULTIPLICATION, operand1: 3, operand2: 7, userAnswer: 21, correct: true, responseTime: 3400 }, // practiced 3x7 correct
        ]
      }
    }
  });
  console.log(`Created practice session for Budi (ID: ${session1.id})`);

  // 6. Create Exams History
  await prisma.exam.createMany({
    data: [
      {
        studentId,
        examType: ExamType.DIAGNOSTIC,
        operationType: OperationType.MULTIPLICATION,
        score: 65.0,
        statusRemedial: true,
        verifiedByGuru: false,
      },
      {
        studentId,
        examType: ExamType.DIAGNOSTIC,
        operationType: OperationType.MULTIPLICATION,
        score: 62.0,
        statusRemedial: true,
        verifiedByGuru: false,
      },
      {
        studentId,
        examType: ExamType.DIAGNOSTIC,
        operationType: OperationType.MULTIPLICATION,
        score: 68.0,
        statusRemedial: true,
        verifiedByGuru: false,
      },
      {
        studentId,
        examType: ExamType.WEEKLY,
        operationType: OperationType.MULTIPLICATION,
        score: 72.5,
        statusRemedial: false,
        verifiedByGuru: false,
      },
      {
        studentId,
        examType: ExamType.MASTERY,
        operationType: OperationType.MULTIPLICATION,
        score: 92.0,
        statusRemedial: false,
        verifiedByGuru: true, // Lulus level 3
      }
    ]
  });
  console.log('Created exams history');

  // 7. Create Report Card
  await prisma.report.create({
    data: {
      studentId,
      period: 'Minggu 5',
      accuracy: 85.4,
      speed: 2.7,
      activityScore: 50.0,
      teacherComment: 'Ananda Budi menunjukkan perkembangan yang sangat signifikan, khususnya pada otomatisasi perkalian angka 1-3. Mohon dipertahankan latihannya di rumah, terutama pada tabel perkalian 7 dan 8 yang masih memiliki respons jawaban agak lambat.',
    }
  });
  console.log('Created monthly report');

  // 8. Create Student (Ahmad Fauzan)
  const ahmadUser = await prisma.user.create({
    data: {
      id: '9837c5e3-47f5-4d86-adcb-9de02196ae36',
      email: 'siswa.kosong@sekolah.id',
      passwordHash: 'hashed_password_123',
      role: Role.STUDENT,
      student: {
        create: {
          id: 'f3cd48c5-5a33-4b3e-8492-14399a9f5454',
          nama: 'Ahmad Fauzan',
          kelas: '7A',
          school: 'MTsN 1 Jakarta',
          teacherId: teacherId,
          parentId: parentId,
          examRequested: true,
          examUnlocked: false,
        }
      }
    },
    include: { student: true }
  });
  const ahmadStudentId = ahmadUser.student!.id;
  console.log(`Created student: ${ahmadUser.student!.nama}`);

  // 9. Create Exams History for Ahmad Fauzan
  await prisma.exam.createMany({
    data: [
      {
        studentId: ahmadStudentId,
        examType: ExamType.DIAGNOSTIC,
        operationType: OperationType.DIVISION,
        score: 40.0,
        statusRemedial: true,
        verifiedByGuru: false,
      },
      {
        studentId: ahmadStudentId,
        examType: ExamType.DIAGNOSTIC,
        operationType: OperationType.DIVISION,
        score: 50.0,
        statusRemedial: true,
        verifiedByGuru: false,
      },
      {
        studentId: ahmadStudentId,
        examType: ExamType.DIAGNOSTIC,
        operationType: OperationType.DIVISION,
        score: 80.0,
        statusRemedial: true,
        verifiedByGuru: false,
      }
    ]
  });
  console.log('Created exams history for Ahmad Fauzan');

  // 10. Create Report Card for Ahmad Fauzan matching screenshot stats
  await prisma.report.create({
    data: {
      studentId: ahmadStudentId,
      period: 'Minggu 5',
      accuracy: 91.8,
      speed: 1.4,
      activityScore: 80.0,
      teacherComment: '',
    }
  });
  console.log('Created monthly report for Ahmad Fauzan');

  console.log('Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
