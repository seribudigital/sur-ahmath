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

    const examTypeParam = searchParams.get('examType'); // 'DIAGNOSTIC', 'POST_TEST', 'MONITORING'
    const limit = parseInt(limitParam, 10);
    // If examType is present or level is EXPERT, use maxTable = 10 for full table scope
    const maxTable = (examTypeParam || level.toUpperCase() === 'EXPERT') ? 10 : getMaxTableForLevel(level);

    // 1. Generate full pool of possible questions for this level
    // Each question is represented by a unique key: "operand1-operand2"
    interface QuestionCandidate {
      operand1: number;
      operand2: number;
      tableGroup: number; // 1: 1-2, 2: 3-5, 3: 6-7, 4: 8-10
      key: string;
    }
    const pool: QuestionCandidate[] = [];

    if (operationType === 'MULTIPLICATION') {
      // Multiplication: Table (1 to maxTable) x Multiplier (1 to 10)
      for (let table = 1; table <= maxTable; table++) {
        for (let mult = 1; mult <= 10; mult++) {
          let tableGroup = 1;
          if (table >= 3 && table <= 5) tableGroup = 2;
          else if (table >= 6 && table <= 7) tableGroup = 3;
          else if (table >= 8) tableGroup = 4;

          pool.push({
            operand1: table,
            operand2: mult,
            tableGroup,
            key: `${table}-${mult}`,
          });
        }
      }
    } else {
      // Division: Dividend / Divisor = Quotient
      // Divisor (table) is 1 to maxTable, Quotient (mult) is 1 to 10
      for (let table = 1; table <= maxTable; table++) {
        for (let mult = 1; mult <= 10; mult++) {
          let tableGroup = 1;
          if (table >= 3 && table <= 5) tableGroup = 2;
          else if (table >= 6 && table <= 7) tableGroup = 3;
          else if (table >= 8) tableGroup = 4;

          const dividend = table * mult;
          pool.push({
            operand1: dividend,
            operand2: table, // Divisor
            tableGroup,
            key: `${dividend}-${table}`,
          });
        }
      }
    }

    // 2. Fetch student's historical incorrect answers (adaptive data)
    const incorrectLogs = await prisma.questionLog.findMany({
      where: {
        session: { studentId },
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

    // 3. Assign weights to each candidate in the pool
    interface WeightedCandidate {
      candidate: QuestionCandidate;
      weight: number;
    }
    const weightedPool: WeightedCandidate[] = pool.map((item) => {
      const failCount = failCounts.get(item.key) || 0;
      let baseWeight = 1.0;

      // De-prioritize trivial questions (x1, ÷1, x2, ÷2) when maxTable is 10 to focus on larger numbers
      if (maxTable === 10 || examTypeParam) {
        if (operationType === 'MULTIPLICATION') {
          if (item.operand1 === 1 || item.operand2 === 1) baseWeight = 0.2;
          else if (item.operand1 === 2 || item.operand2 === 2) baseWeight = 0.5;
        } else {
          if (item.operand2 === 1 || (item.operand1 / item.operand2) === 1) baseWeight = 0.2;
          else if (item.operand2 === 2 || (item.operand1 / item.operand2) === 2) baseWeight = 0.5;
        }
      }

      const weight = failCount > 0 ? (baseWeight + 1.5 * failCount) : baseWeight;
      return {
        candidate: item,
        weight,
      };
    });

    // Helper for weighted sampling without replacement from a candidates pool
    function sampleFromCandidates(candidates: WeightedCandidate[], count: number): QuestionCandidate[] {
      const selected: QuestionCandidate[] = [];
      const tempPool = [...candidates];
      const itemsToPick = Math.min(count, tempPool.length);

      for (let s = 0; s < itemsToPick; s++) {
        const totalWeight = tempPool.reduce((sum, item) => sum + item.weight, 0);
        if (totalWeight <= 0) break;

        let randomValue = Math.random() * totalWeight;
        let selectedIndex = -1;

        for (let i = 0; i < tempPool.length; i++) {
          randomValue -= tempPool[i].weight;
          if (randomValue <= 0) {
            selectedIndex = i;
            break;
          }
        }

        if (selectedIndex === -1) {
          selectedIndex = tempPool.length - 1;
        }

        selected.push(tempPool[selectedIndex].candidate);
        tempPool.splice(selectedIndex, 1);
      }

      return selected;
    }

    let selectedQuestions: QuestionCandidate[] = [];

    // 4. Perform sampling based on requested distribution for exams and full-table levels:
    // Group 1 (Table 1-2): 10%
    // Group 2 (Table 3-5): 30%
    // Group 3 (Table 6-7): 30%
    // Group 4 (Table 8-10): 30%
    if (maxTable === 10 || examTypeParam) {
      const g1 = weightedPool.filter(w => w.candidate.tableGroup === 1);
      const g2 = weightedPool.filter(w => w.candidate.tableGroup === 2);
      const g3 = weightedPool.filter(w => w.candidate.tableGroup === 3);
      const g4 = weightedPool.filter(w => w.candidate.tableGroup === 4);

      const target1 = Math.round(limit * 0.10);
      const target2 = Math.round(limit * 0.30);
      const target3 = Math.round(limit * 0.30);
      const target4 = Math.max(0, limit - target1 - target2 - target3);

      const sel1 = sampleFromCandidates(g1, target1);
      const sel2 = sampleFromCandidates(g2, target2);
      const sel3 = sampleFromCandidates(g3, target3);
      const sel4 = sampleFromCandidates(g4, target4);

      selectedQuestions = [...sel1, ...sel2, ...sel3, ...sel4];

      // Fill quota if any group fell short
      if (selectedQuestions.length < limit && selectedQuestions.length < pool.length) {
        const pickedKeys = new Set(selectedQuestions.map(q => q.key));
        const remainingPool = weightedPool.filter(w => !pickedKeys.has(w.candidate.key));
        const filled = sampleFromCandidates(remainingPool, limit - selectedQuestions.length);
        selectedQuestions.push(...filled);
      }

      // Shuffle final questions list so question presentation order is randomized
      for (let i = selectedQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
      }
    } else {
      selectedQuestions = sampleFromCandidates(weightedPool, limit);
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
      preTestSessionsCount: 3,
      postTestSessionsCount: 1,
    } as any;
  }

  const requiredPreTestSessions = settings?.preTestSessionsCount ?? 3;

  const checkProgressForOp = async (opType: OperationType) => {
    // Check if Pre-Test (Diagnostic exam) is completed for this operation type based on teacher settings
    const preTestCount = await prisma.exam.count({
      where: {
        studentId,
        examType: ExamType.DIAGNOSTIC,
        operationType: opType
      }
    });
    const preTestCompleted = preTestCount >= requiredPreTestSessions;

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
