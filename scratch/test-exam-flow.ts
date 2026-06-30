import { PrismaClient, Role, ExamType, OperationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== RUNNING DIAGNOSTIC EXAM FLOW DATABASE TEST ===');

  // 1. Get or create student Ahmad Fauzan
  let student = await prisma.student.findFirst({
    where: { user: { email: 'siswa.kosong@sekolah.id' } },
    include: { user: true }
  });

  if (!student) {
    console.error('Ahmad Fauzan student record not found! Run seed or reset script first.');
    return;
  }
  const studentId = student.id;
  console.log(`Verified Student: ${student.nama} (ID: ${studentId})`);

  // Clean old exams and practice sessions to start fresh
  await prisma.exam.deleteMany({ where: { studentId } });
  await prisma.practiceSession.deleteMany({ where: { studentId } });
  console.log('Cleaned up previous exam and session history for a fresh baseline.');

  // 2. Simulate 3 rounds (sessions) of Pre-Test
  const ROUNDS = 3;
  const QUESTIONS_PER_ROUND = 10;
  const scores = [100, 90, 80]; // average score = 90% (LULUS)

  for (let r = 1; r <= ROUNDS; r++) {
    console.log(`\n--- Simulating Pre-Test Session ${r}/${ROUNDS} ---`);
    
    // A. Start Practice Session (Atomic metadata)
    const session = await prisma.practiceSession.create({
      data: {
        studentId,
        operationType: OperationType.MULTIPLICATION,
        duration: 25, // seconds
        totalQuestions: QUESTIONS_PER_ROUND,
        correctAnswers: Math.round((scores[r - 1] / 100) * QUESTIONS_PER_ROUND),
      }
    });
    console.log(`Started Session ID: ${session.id}`);

    // B. Log individual question logs
    const correctCountForRound = Math.round((scores[r - 1] / 100) * QUESTIONS_PER_ROUND);
    for (let q = 1; q <= QUESTIONS_PER_ROUND; q++) {
      const isCorrect = q <= correctCountForRound;
      await prisma.questionLog.create({
        data: {
          sessionId: session.id,
          operationType: OperationType.MULTIPLICATION,
          operand1: 7,
          operand2: q,
          userAnswer: isCorrect ? (7 * q) : -1,
          responseTime: 2500, // 2.5 seconds
          correct: isCorrect,
        }
      });
    }
    console.log(`Logged ${QUESTIONS_PER_ROUND} questions (${correctCountForRound} correct) for Session ${r}.`);

    // C. Submit Round Exam score
    const roundScore = scores[r - 1];
    const statusRemedial = roundScore < 90.0;
    const exam = await prisma.exam.create({
      data: {
        studentId,
        examType: ExamType.DIAGNOSTIC,
        operationType: OperationType.MULTIPLICATION,
        score: roundScore,
        statusRemedial,
        verifiedByGuru: false,
      }
    });
    console.log(`Submitted Exam Round ${r} Score: ${roundScore}% (Remedial: ${statusRemedial}, Exam ID: ${exam.id})`);
  }

  // 3. Verify Database State
  console.log('\n=== VERIFYING FINAL DATABASE STATE ===');
  const finalExams = await prisma.exam.findMany({
    where: { studentId, examType: ExamType.DIAGNOSTIC }
  });

  console.log(`Total Diagnostic Exams recorded: ${finalExams.length}`);
  if (finalExams.length !== 3) {
    throw new Error(`Expected exactly 3 Diagnostic Exams, but found ${finalExams.length}`);
  }

  const avgScore = finalExams.reduce((sum, e) => sum + e.score, 0) / finalExams.length;
  console.log(`Calculated Average Diagnostic Score: ${avgScore.toFixed(1)}%`);

  const passed = avgScore >= 90.0;
  console.log(`Mastery Threshold Passed (>= 90%): ${passed ? 'YES' : 'NO'}`);

  console.log('\nDatabase state verified successfully. Flow is fully supported!');
}

main()
  .catch((e) => {
    console.error('Test Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
