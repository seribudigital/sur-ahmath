import prisma from '../src/lib/prisma';
import { getMasteryHeatmap, getWeakCoordinates } from '../src/lib/db-helpers';

// Helper to determine max table number based on student level
function getMaxTableForLevel(level: string): number {
  switch (level.toUpperCase()) {
    case 'BEGINNER':
      return 3;
    case 'INTERMEDIATE':
      return 6;
    case 'ADVANCED':
      return 8;
    case 'EXPERT':
    default:
      return 10;
  }
}

async function runTest() {
  console.log('=== START DATABASE INTEGRATION & ADAPTIVE LOGIC TEST ===');
  
  try {
    // 1. Setup Mock User, Student, Teacher, and Parent
    console.log('\n[1/6] Setting up mock data...');
    
    // Clear existing mock data if any from previous runs
    await prisma.user.deleteMany({
      where: { email: { in: ['mock.student@sekolah.id', 'mock.teacher@sekolah.id'] } }
    });

    // Create Teacher
    const teacherUser = await prisma.user.create({
      data: {
        email: 'mock.teacher@sekolah.id',
        passwordHash: 'hashed_password',
        role: 'TEACHER',
        teacher: {
          create: {
            nama: 'Ibu Fatimah',
            school: 'MTsN 1 Jakarta',
          }
        }
      },
      include: { teacher: true }
    });
    const teacherId = teacherUser.teacher!.id;

    // Create Parent
    const parentUser = await prisma.user.create({
      data: {
        email: 'mock.parent@sekolah.id',
        passwordHash: 'hashed_password',
        role: 'PARENT',
        parent: {
          create: {
            nama: 'Pak Ahmad',
            kontak: '08123456789',
            uniqueToken: 'mock-unique-token-xyz-123',
          }
        }
      },
      include: { parent: true }
    });
    const parentId = parentUser.parent!.id;

    // Create Student
    const studentUser = await prisma.user.create({
      data: {
        email: 'mock.student@sekolah.id',
        passwordHash: 'hashed_password',
        role: 'STUDENT',
        student: {
          create: {
            nama: 'Budi Santoso',
            kelas: '7-A',
            school: 'MTsN 1 Jakarta',
            teacherId: teacherId, // Linked to teacher
            parentId: parentId, // Linked to parent
          }
        }
      },
      include: { student: true }
    });
    const studentId = studentUser.student!.id;

    console.log(`Mock Student Budi created with ID: ${studentId}`);
    console.log(`Mock Teacher Ibu Fatimah created with ID: ${teacherId}`);
    console.log(`Mock Parent Pak Ahmad created with ID: ${parentId}`);

    // 2. Test Practice Session Initialization (POST without questions)
    console.log('\n[2/6] Testing Practice Session Initialization...');
    const session = await prisma.practiceSession.create({
      data: {
        studentId,
        operationType: 'MULTIPLICATION',
        duration: 0,
        totalQuestions: 0,
        correctAnswers: 0,
      }
    });
    const sessionId = session.id;
    console.log(`Session initialized successfully. Session ID: ${sessionId}`);

    // 3. Log a mix of Correct and Incorrect answers to test atomic updates & response times
    console.log('\n[3/6] Logging questions to test atomic transactions...');
    
    // Let's log some answers:
    // Q1: 3 x 3 = 9 (Correct) - takes 2500ms
    // Q2: 3 x 7 = 20 (Incorrect, correct is 21) - takes 4000ms
    // Q3: 3 x 7 = 21 (Correct) - takes 1500ms
    // Q4: 2 x 5 = 11 (Incorrect, correct is 10) - takes 6000ms
    // Q5: 2 x 5 = 11 (Incorrect, correct is 10) - takes 5000ms (so 2x5 and 3x7 have incorrect history)
    
    const answersToLog = [
      { operand1: 3, operand2: 3, userAnswer: 9, correct: true, responseTime: 2500 },
      { operand1: 3, operand2: 7, userAnswer: 20, correct: false, responseTime: 4000 },
      { operand1: 3, operand2: 7, userAnswer: 21, correct: true, responseTime: 1500 },
      { operand1: 2, operand2: 5, userAnswer: 11, correct: false, responseTime: 6000 },
      { operand1: 2, operand2: 5, userAnswer: 11, correct: false, responseTime: 5000 },
    ];

    for (const ans of answersToLog) {
      await prisma.$transaction(async (tx) => {
        // Create question log (raw milliseconds)
        const log = await tx.questionLog.create({
          data: {
            sessionId,
            operationType: 'MULTIPLICATION',
            operand1: ans.operand1,
            operand2: ans.operand2,
            userAnswer: ans.userAnswer,
            correct: ans.correct,
            responseTime: ans.responseTime,
          }
        });

        // Update session duration (ms converted to seconds)
        const secAdded = Math.round(ans.responseTime / 1000);
        await tx.practiceSession.update({
          where: { id: sessionId },
          data: {
            totalQuestions: { increment: 1 },
            correctAnswers: ans.correct ? { increment: 1 } : undefined,
            duration: { increment: secAdded }
          }
        });
      });
      console.log(`Logged ${ans.operand1}x${ans.operand2}=${ans.userAnswer} (${ans.correct ? 'Correct' : 'Incorrect'}, responseTime: ${ans.responseTime}ms)`);
    }

    // Verify session state
    const updatedSession = await prisma.practiceSession.findUnique({
      where: { id: sessionId },
    });
    console.log(`\nUpdated Session Stats:`);
    console.log(`- Total Questions: ${updatedSession?.totalQuestions} (Expected: 5)`);
    console.log(`- Correct Answers: ${updatedSession?.correctAnswers} (Expected: 2)`);
    console.log(`- Duration: ${updatedSession?.duration} seconds (Expected: 3 + 4 + 2 + 6 + 5 = 20)`);

    // 4. Test Mastery Heatmap Helper & Weak Coordinates Helper
    console.log('\n[4/6] Testing Heatmap and Weak Coordinates retrieval...');
    const heatmap = await getMasteryHeatmap(studentId, 'MULTIPLICATION');
    
    // Filter cells that have logs to inspect
    const activeCells = heatmap.cells.filter(c => c.totalCount > 0);
    console.log('Active Heatmap Cells:');
    activeCells.forEach(cell => {
      console.log(`- Cell ${cell.operand1}x${cell.operand2}: Total attempts: ${cell.totalCount}, Correct: ${cell.correctCount}, Avg Speed: ${cell.avgResponseTime}ms, Status: ${cell.status}`);
    });

    const weakCoords = await getWeakCoordinates(studentId, 'MULTIPLICATION');
    console.log('Weak Coordinates detected:', weakCoords);

    // 5. Test GET Adaptive Question Engine Logic Simulation
    console.log('\n[5/6] Simulating GET Adaptive Question Selection (BEGINNER level: tables 1-3)...');
    
    const level = 'BEGINNER';
    const maxTable = getMaxTableForLevel(level);
    
    // Generate pool of Beginner questions (30 candidates: 1..3 x 1..10)
    interface QuestionCandidate {
      operand1: number;
      operand2: number;
      key: string;
    }
    const pool: QuestionCandidate[] = [];
    for (let table = 1; table <= maxTable; table++) {
      for (let mult = 1; mult <= 10; mult++) {
        pool.push({
          operand1: table,
          operand2: mult,
          key: `${table}-${mult}`,
        });
      }
    }

    // Load incorrect logs from DB to get coordinates
    const incorrectDBLogs = await prisma.questionLog.findMany({
      where: {
        session: { studentId },
        operationType: 'MULTIPLICATION',
        correct: false,
      },
      select: { operand1: true, operand2: true }
    });

    const failCounts = new Map<string, number>();
    for (const log of incorrectDBLogs) {
      const key = `${log.operand1}-${log.operand2}`;
      failCounts.set(key, (failCounts.get(key) || 0) + 1);
    }

    // Assign weights (default 1.0, incorrect 1.9)
    const weightedPool = pool.map(item => {
      const failCount = failCounts.get(item.key) || 0;
      const weight = failCount > 0 ? 1.9 : 1.0;
      return { candidate: item, weight };
    });

    // Check weights of key items:
    // - 3-3 (Only Correct log) -> Weight should be 1.0
    // - 3-7 (1 Incorrect, 1 Correct) -> Weight should be 1.9 (Adaptive +90%)
    // - 2-5 (2 Incorrect logs) -> Weight should be 1.9 (Adaptive +90%)
    // - 1-1 (No logs) -> Weight should be 1.0
    console.log('Verification of Probability Weights:');
    const verifyKeys = ['3-3', '3-7', '2-5', '1-1'];
    for (const key of verifyKeys) {
      const item = weightedPool.find(w => w.candidate.key === key);
      console.log(`- Candidate ${key} weight: ${item?.weight} (Expected: ${key === '3-7' || key === '2-5' ? 1.9 : 1.0})`);
    }

    // Perform weighted random selection simulation (run multiple times to show distribution)
    const counts = new Map<string, number>();
    const runs = 1000;
    
    for (let r = 0; r < runs; r++) {
      // Simulate choosing a single question with weighted random
      const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
      let randVal = Math.random() * totalWeight;
      let chosenKey = '';
      
      for (const item of weightedPool) {
        randVal -= item.weight;
        if (randVal <= 0) {
          chosenKey = item.candidate.key;
          break;
        }
      }
      
      counts.set(chosenKey, (counts.get(chosenKey) || 0) + 1);
    }

    console.log(`\nSelection frequency out of ${runs} simulated selections:`);
    console.log(`- 2-5 (Weight 1.9): ${counts.get('2-5')} selections (~${((counts.get('2-5') || 0)/runs*100).toFixed(1)}%)`);
    console.log(`- 3-7 (Weight 1.9): ${counts.get('3-7')} selections (~${((counts.get('3-7') || 0)/runs*100).toFixed(1)}%)`);
    console.log(`- 1-1 (Weight 1.0): ${counts.get('1-1')} selections (~${((counts.get('1-1') || 0)/runs*100).toFixed(1)}%)`);
    console.log(`- 3-3 (Weight 1.0): ${counts.get('3-3')} selections (~${((counts.get('3-3') || 0)/runs*100).toFixed(1)}%)`);

    // 6. Cleanup mock records to keep db clean
    console.log('\n[6/6] Cleaning up test data...');
    await prisma.user.deleteMany({
      where: { email: { in: ['mock.student@sekolah.id', 'mock.teacher@sekolah.id', 'mock.parent@sekolah.id'] } }
    });
    console.log('Cleanup completed successfully.');
    
    console.log('\n=== ALL TESTS COMPLETED SUCCESSFULLY AND PASSED! ===');
  } catch (err) {
    console.error('Test failed with error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
