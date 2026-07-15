import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { OperationType, ExamType } from '@prisma/client';
import { getSession } from '@/lib/auth';

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

// GET: Generate adaptive random questions or check progress
export async function GET(request: Request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Sesi tidak valid' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let studentId = searchParams.get('studentId') || session.studentId || null;

    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId is required and session does not contain a student ID' },
        { status: 400 }
      );
    }

    if (session.role === 'STUDENT' && session.studentId !== studentId) {
      return NextResponse.json({ error: 'Forbidden: Anda hanya dapat berlatih dengan ID Anda sendiri.' }, { status: 403 });
    }
    if (session.role === 'PARENT' && session.studentId !== studentId) {
      return NextResponse.json({ error: 'Forbidden: Anda tidak dapat mengakses latihan siswa lain.' }, { status: 403 });
    }

    const checkProgress = searchParams.get('checkProgress') === 'true';
    if (checkProgress) {
      const progressData = await getUnlockedLevels(studentId);
      return NextResponse.json({
        progress: {
          multiplication: progressData.multiplication,
          division: progressData.division
        },
        settings: progressData.settings,
        examRequested: progressData.examRequested,
        examUnlocked: progressData.examUnlocked,
        monitoringStage: progressData.monitoringStage,
        lastExamDate: progressData.lastExamDate
      });
    }

    const operationTypeParam = searchParams.get('operationType'); // 'MULTIPLICATION' or 'DIVISION'
    const level = searchParams.get('level') || 'BEGINNER';
    const limitParam = searchParams.get('limit') || '10';

    if (!operationTypeParam) {
      return NextResponse.json(
        { error: 'operationType is required parameter' },
        { status: 400 }
      );
    }

    const operationType = operationTypeParam.toUpperCase() as OperationType;
    if (operationType !== 'MULTIPLICATION' && operationType !== 'DIVISION') {
      return NextResponse.json(
        { error: 'Invalid operationType. Use MULTIPLICATION or DIVISION' },
        { status: 400 }
      );
    }

    const limit = parseInt(limitParam, 10);
    const maxTable = getMaxTableForLevel(level);

    // 1. Generate full pool of possible questions for this level
    // Each question is represented by a unique key: "operand1-operand2"
    interface QuestionCandidate {
      operand1: number;
      operand2: number;
      key: string;
    }
    const pool: QuestionCandidate[] = [];

    if (operationType === 'MULTIPLICATION') {
      // Multiplication: Table (1 to maxTable) x Multiplier (1 to 10)
      for (let table = 1; table <= maxTable; table++) {
        for (let mult = 1; mult <= 10; mult++) {
          pool.push({
            operand1: table,
            operand2: mult,
            key: `${table}-${mult}`,
          });
        }
      }
    } else {
      // Division: Dividend / Divisor = Quotient
      // Divisor (table) is 1 to maxTable, Quotient (mult) is 1 to 10
      // Dividend is Table * Quotient
      for (let table = 1; table <= maxTable; table++) {
        for (let mult = 1; mult <= 10; mult++) {
          const dividend = table * mult;
          pool.push({
            operand1: dividend,
            operand2: table, // Divisor
            key: `${dividend}-${table}`,
          });
        }
      }
    }

    // 2. Fetch student's historical incorrect answers (adaptive data)
    // Querying through the session table using index optimizations
    const incorrectLogs = await prisma.questionLog.findMany({
      where: {
        session: {
          studentId,
        },
        operationType,
        correct: false,
      },
      select: {
        operand1: true,
        operand2: true,
      },
    });

    // Count incorrect attempts per coordinate
    const failCounts = new Map<string, number>();
    for (const log of incorrectLogs) {
      const key = `${log.operand1}-${log.operand2}`;
      failCounts.set(key, (failCounts.get(key) || 0) + 1);
    }

    // 3. Assign weights to each question in the pool
    // Default weight is 1.0. If a question was answered incorrectly, increase weight by 90% (to 1.9)
    interface WeightedCandidate {
      candidate: QuestionCandidate;
      weight: number;
    }
    let weightedPool: WeightedCandidate[] = pool.map((item) => {
      const failCount = failCounts.get(item.key) || 0;
      const weight = failCount > 0 ? 1.9 : 1.0;
      return {
        candidate: item,
        weight,
      };
    });

    // 4. Perform weighted random sampling without replacement
    const selectedQuestions: QuestionCandidate[] = [];
    const questionsToGenerate = Math.min(limit, pool.length);

    for (let s = 0; s < questionsToGenerate; s++) {
      // Calculate total weight of remaining candidates
      const totalWeight = weightedPool.reduce((sum, item) => sum + item.weight, 0);
      if (totalWeight <= 0) break;

      // Pick a random value in [0, totalWeight)
      let randomValue = Math.random() * totalWeight;
      let selectedIndex = -1;

      // Locate the candidate corresponding to the random value
      for (let i = 0; i < weightedPool.length; i++) {
        randomValue -= weightedPool[i].weight;
        if (randomValue <= 0) {
          selectedIndex = i;
          break;
        }
      }

      if (selectedIndex === -1) {
        selectedIndex = weightedPool.length - 1;
      }

      // Add selected candidate to results
      const selected = weightedPool[selectedIndex].candidate;
      selectedQuestions.push(selected);

      // Remove the selected candidate from the pool to avoid duplicate questions
      weightedPool.splice(selectedIndex, 1);
    }

    // Format output with expected questions structures
    const formattedQuestions = selectedQuestions.map((q) => {
      let expectedAnswer = 0;
      if (operationType === 'MULTIPLICATION') {
        expectedAnswer = q.operand1 * q.operand2;
      } else {
        expectedAnswer = q.operand1 / q.operand2;
      }

      return {
        operand1: q.operand1,
        operand2: q.operand2,
        operationType,
        expectedAnswer,
      };
    });

    return NextResponse.json({
      studentId,
      operationType,
      level,
      questionsCount: formattedQuestions.length,
      questions: formattedQuestions,
    });
  } catch (error: any) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat membuat pertanyaan.' },
      { status: 500 }
    );
  }
}

// POST: Log answer and update session stats atomically
export async function POST(request: Request) {
  try {
    const authSession = await getSession(request);
    if (!authSession) {
      return NextResponse.json({ error: 'Unauthorized: Sesi tidak valid' }, { status: 401 });
    }

    const body = await request.json();
    let { studentId, sessionId, operationType: opTypeParam, operand1, operand2, userAnswer, responseTime, level } = body;
    if (!studentId && authSession.studentId) {
      studentId = authSession.studentId;
    }

    // A. Start Session Mode: If operand1 is not provided, initialize a new practice session
    if (operand1 === undefined) {
      if (!studentId || !opTypeParam) {
        return NextResponse.json(
          { error: 'studentId and operationType are required to initialize a session' },
          { status: 400 }
        );
      }

      if (authSession.role === 'STUDENT' && authSession.studentId !== studentId) {
        return NextResponse.json({ error: 'Forbidden: Anda hanya dapat memulai sesi untuk diri sendiri.' }, { status: 403 });
      }

      const operationType = opTypeParam.toUpperCase() as OperationType;
      
      const newSession = await prisma.practiceSession.create({
        data: {
          studentId,
          operationType,
          level: level || 'BEGINNER',
          duration: 0,
          totalQuestions: 0,
          correctAnswers: 0,
        },
      });

      return NextResponse.json({
        message: 'Practice session started successfully',
        sessionId: newSession.id,
      });
    }

    // B. Answer Submission Mode: Check requirements for submitting answers
    const { practiceMode } = body;
    if (!sessionId || !opTypeParam || operand1 === undefined || operand2 === undefined || userAnswer === undefined || responseTime === undefined) {
      return NextResponse.json(
        { error: 'Missing parameters. Required: sessionId, operationType, operand1, operand2, userAnswer, responseTime' },
        { status: 400 }
      );
    }

    const operationType = opTypeParam.toUpperCase() as OperationType;

    // Check correctness
    let correct = false;
    if (practiceMode === 'MISSING_NUMBER') {
      correct = operand2 === userAnswer;
    } else {
      if (operationType === 'MULTIPLICATION') {
        correct = (operand1 * operand2) === userAnswer;
      } else if (operationType === 'DIVISION') {
        if (operand2 === 0) {
          correct = false;
        } else {
          correct = Math.abs((operand1 / operand2) - userAnswer) < 0.001;
        }
      }
    }

    // Execute atomic updates in a database transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Double check that the session exists
      const session = await tx.practiceSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) {
        throw new Error(`Practice session with ID ${sessionId} not found`);
      }

      if (authSession.role === 'STUDENT' && authSession.studentId !== session.studentId) {
        throw new Error('Forbidden: Session ID ini bukan milik Anda');
      }

      // 2. Insert new question log (responseTime is saved directly in ms)
      const log = await tx.questionLog.create({
        data: {
          sessionId,
          operationType,
          operand1,
          operand2,
          userAnswer,
          correct,
          responseTime,
        },
      });

      // 3. Update session stats (duration is updated by summing all response times in ms and rounding)
      const allLogs = await tx.questionLog.findMany({
        where: { sessionId },
        select: { responseTime: true }
      });
      const totalMs = allLogs.reduce((sum, l) => sum + l.responseTime, 0) + responseTime;
      const totalSeconds = Math.max(1, Math.round(totalMs / 1000)); // Ensure at least 1s if there's activity

      const updatedSession = await tx.practiceSession.update({
        where: { id: sessionId },
        data: {
          totalQuestions: { increment: 1 },
          correctAnswers: correct ? { increment: 1 } : undefined,
          duration: totalSeconds,
        },
      });

      return { log, updatedSession };
    });

    return NextResponse.json({
      message: 'Question logged and session updated atomically',
      correct,
      log: {
        id: result.log.id,
        operand1: result.log.operand1,
        operand2: result.log.operand2,
        userAnswer: result.log.userAnswer,
        correct: result.log.correct,
        responseTimeMs: result.log.responseTime,
      },
      session: {
        id: result.updatedSession.id,
        totalQuestions: result.updatedSession.totalQuestions,
        correctAnswers: result.updatedSession.correctAnswers,
        durationSeconds: result.updatedSession.duration,
      },
    });
  } catch (error: any) {
    console.error('Error submitting answer:', error);
    
    if (error.message && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat mengirim jawaban.' },
      { status: 500 }
    );
  }
}

async function getUnlockedLevels(studentId: string) {
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

    return {
      sessionCount,
      average,
      passed
    };
  };

  const checkProgressForOp = async (opType: OperationType) => {
    // Check if Pre-Test (Diagnostic exam) is completed (at least 3 attempts) for this operation type
    const preTestCount = await prisma.exam.count({
      where: {
        studentId,
        examType: ExamType.DIAGNOSTIC,
        operationType: opType
      }
    });
    const preTestCompleted = preTestCount >= 3;

    const beginner = await getLevelProgress(opType, 'BEGINNER');
    const intermediate = await getLevelProgress(opType, 'INTERMEDIATE');
    const advanced = await getLevelProgress(opType, 'ADVANCED');
    const expert = await getLevelProgress(opType, 'EXPERT');

    // ALL levels (including BEGINNER) are locked if Pre-Test is not completed!
    const beginnerUnlocked = preTestCompleted;
    const intermediateUnlocked = beginnerUnlocked && beginner.passed;
    const advancedUnlocked = intermediateUnlocked && intermediate.passed;
    const expertUnlocked = advancedUnlocked && advanced.passed;

    return {
      BEGINNER: { unlocked: beginnerUnlocked, progress: beginner, needsPreTest: !preTestCompleted },
      INTERMEDIATE: { unlocked: intermediateUnlocked, progress: intermediate },
      ADVANCED: { unlocked: advancedUnlocked, progress: advanced },
      EXPERT: { unlocked: expertUnlocked, progress: expert }
    };
  };

  const multiplication = await checkProgressForOp(OperationType.MULTIPLICATION);
  const division = await checkProgressForOp(OperationType.DIVISION);

  // Fetch teacher settings for the student
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { teacherId: true, examRequested: true, examUnlocked: true, monitoringStage: true, lastExamDate: true },
  });

  let settings = null;
  if (student?.teacherId) {
    settings = await prisma.teacherSetting.findUnique({
      where: { teacherId: student.teacherId },
    });
  }

  if (!settings) {
    settings = {
      id: '',
      teacherId: student?.teacherId || '',
      preTestLimitMult: 10,
      preTestLimitDiv: 10,
      practiceLimitMult: 10,
      practiceLimitDiv: 10,
      postTestLimitMult: 10,
      postTestLimitDiv: 10,
      preTestTimeMult: 5,
      preTestTimeDiv: 5,
      practiceTimeMult: 0,
      practiceTimeDiv: 0,
      postTestTimeMult: 5,
      postTestTimeDiv: 5,
    } as any;
  }

  return { 
    multiplication, 
    division, 
    settings, 
    examRequested: student?.examRequested ?? false, 
    examUnlocked: student?.examUnlocked ?? false,
    monitoringStage: student?.monitoringStage ?? 0,
    lastExamDate: student?.lastExamDate ?? null
  };
}
