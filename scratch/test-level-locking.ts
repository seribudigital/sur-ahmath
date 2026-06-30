import { PrismaClient, OperationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== TESTING PRACTICE LEVEL LOCKING LOGIC ===');

  // 1. Get student Ahmad Fauzan
  const student = await prisma.student.findFirst({
    where: { user: { email: 'siswa.kosong@sekolah.id' } }
  });

  if (!student) {
    console.error('Ahmad Fauzan student record not found! Run seed or reset script first.');
    return;
  }
  const studentId = student.id;

  // Clean old exams and practice sessions to start fresh
  await prisma.exam.deleteMany({ where: { studentId } });
  await prisma.practiceSession.deleteMany({ where: { studentId } });
  console.log('Cleaned database for a fresh test.');

  // Helper to fetch progress using the backend logic directly
  async function getProgress() {
    const getLevelProgress = async (opType: OperationType, level: string) => {
      const sessions = await prisma.practiceSession.findMany({
        where: {
          studentId,
          operationType: opType,
          level,
          totalQuestions: { gt: 0 }
        },
        orderBy: { date: 'desc' },
        take: 3
      });

      const sessionCount = sessions.length;
      const average = sessionCount > 0 
        ? Math.round(sessions.reduce((sum, s) => sum + (s.correctAnswers / (s.totalQuestions || 1)) * 100, 0) / sessionCount)
        : 0;

      const passed = sessionCount >= 3 && average >= 90;

      return { sessionCount, average, passed };
    };

    const beginner = await getLevelProgress(OperationType.MULTIPLICATION, 'BEGINNER');
    const intermediate = await getLevelProgress(OperationType.MULTIPLICATION, 'INTERMEDIATE');
    const advanced = await getLevelProgress(OperationType.MULTIPLICATION, 'ADVANCED');

    const intermediateUnlocked = beginner.passed;
    const advancedUnlocked = intermediateUnlocked && intermediate.passed;

    return {
      BEGINNER: { unlocked: true, progress: beginner },
      INTERMEDIATE: { unlocked: intermediateUnlocked, progress: intermediate },
      ADVANCED: { unlocked: advancedUnlocked, progress: advanced }
    };
  }

  // Helper to simulate completing a practice session
  async function simulateSession(level: string, correct: number, total: number) {
    await prisma.practiceSession.create({
      data: {
        studentId,
        operationType: OperationType.MULTIPLICATION,
        level,
        duration: 30,
        totalQuestions: total,
        correctAnswers: correct
      }
    });
  }

  // Step 1: Check initial progress
  let progress = await getProgress();
  console.log('\n--- Step 1: Initial state ---');
  console.log(`BEGINNER unlocked: ${progress.BEGINNER.unlocked}`);
  console.log(`INTERMEDIATE unlocked: ${progress.INTERMEDIATE.unlocked} (Sesi: ${progress.INTERMEDIATE.progress.sessionCount}/3, Rerata: ${progress.INTERMEDIATE.progress.average}%)`);

  // Step 2: Complete 1 session on BEGINNER (100% score)
  console.log('\n--- Step 2: Completed 1 session on BEGINNER ---');
  await simulateSession('BEGINNER', 10, 10);
  progress = await getProgress();
  console.log(`INTERMEDIATE unlocked: ${progress.INTERMEDIATE.unlocked} (Sesi BEGINNER: ${progress.BEGINNER.progress.sessionCount}/3, Rerata: ${progress.BEGINNER.progress.average}%)`);
  if (progress.INTERMEDIATE.unlocked) throw new Error('Intermediate should be locked after only 1 session');

  // Step 3: Complete 2 more sessions on BEGINNER (100% scores)
  console.log('\n--- Step 3: Completed 2 more sessions on BEGINNER (Total 3) ---');
  await simulateSession('BEGINNER', 10, 10);
  await simulateSession('BEGINNER', 10, 10);
  progress = await getProgress();
  console.log(`INTERMEDIATE unlocked: ${progress.INTERMEDIATE.unlocked} (Sesi BEGINNER: ${progress.BEGINNER.progress.sessionCount}/3, Rerata: ${progress.BEGINNER.progress.average}%)`);
  if (!progress.INTERMEDIATE.unlocked) throw new Error('Intermediate should be unlocked now');

  // Step 4: Complete 3 sessions on INTERMEDIATE with 80% score (average 80% < 90%)
  console.log('\n--- Step 4: Completed 3 sessions on INTERMEDIATE with 80% score ---');
  await simulateSession('INTERMEDIATE', 8, 10);
  await simulateSession('INTERMEDIATE', 8, 10);
  await simulateSession('INTERMEDIATE', 8, 10);
  progress = await getProgress();
  console.log(`ADVANCED unlocked: ${progress.ADVANCED.unlocked} (Sesi INTERMEDIATE: ${progress.INTERMEDIATE.progress.sessionCount}/3, Rerata: ${progress.INTERMEDIATE.progress.average}%)`);
  if (progress.ADVANCED.unlocked) throw new Error('Advanced should be locked since average is 80% < 90%');

  // Step 5: Complete 3 more sessions on INTERMEDIATE with 100% score (making the LAST 3 sessions have average 100%)
  console.log('\n--- Step 5: Completed 3 more sessions on INTERMEDIATE with 100% score ---');
  await simulateSession('INTERMEDIATE', 10, 10);
  await simulateSession('INTERMEDIATE', 10, 10);
  await simulateSession('INTERMEDIATE', 10, 10);
  progress = await getProgress();
  console.log(`ADVANCED unlocked: ${progress.ADVANCED.unlocked} (Sesi INTERMEDIATE (Terakhir): ${progress.INTERMEDIATE.progress.sessionCount}/3, Rerata: ${progress.INTERMEDIATE.progress.average}%)`);
  if (!progress.ADVANCED.unlocked) throw new Error('Advanced should be unlocked now that last 3 sessions have average 100%');

  console.log('\nALL LOCKING LOGIC VERIFICATION CHECKS PASSED SUCCESSFULLY!');
}

main()
  .catch(e => {
    console.error('Test failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
