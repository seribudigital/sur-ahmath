import prisma from './prisma';
import { OperationType, MasteryHeatmapData, HeatmapCell } from '../types';

/**
 * Generates a 10x10 Mastery Heatmap data for a specific student and operation type.
 * This helper groups question_logs by operand_1 and operand_2.
 * The index on (operand_1, operand_2) and (session_id, correct) ensures high performance.
 */
export async function getMasteryHeatmap(
  studentId: string,
  operationType: OperationType
): Promise<MasteryHeatmapData> {
  // 1. Fetch all sessions for the student of the specified operation type
  const sessions = await prisma.practiceSession.findMany({
    where: {
      studentId,
      operationType,
    },
    select: {
      id: true,
    },
  });

  const sessionIds = sessions.map((s) => s.id);

  // Initialize a 10x10 matrix map (keys: "op1-op2")
  const cellMap = new Map<string, { correct: number; total: number; totalTime: number }>();
  for (let i = 1; i <= 10; i++) {
    for (let j = 1; j <= 10; j++) {
      cellMap.set(`${i}-${j}`, { correct: 0, total: 0, totalTime: 0 });
    }
  }

  if (sessionIds.length > 0) {
    // 2. Query question_logs grouped by operand1 and operand2 for these sessions
    // Using Prisma groupBy or raw query. Since we want counts and sums, raw query or direct findMany is clean.
    // For large databases, we perform an aggregation query.
    const aggregations = await prisma.questionLog.groupBy({
      by: ['operand1', 'operand2', 'correct'],
      where: {
        sessionId: { in: sessionIds },
      },
      _count: {
        id: true,
      },
      _sum: {
        responseTime: true,
      },
    });

    // Populate matrix map from aggregations
    for (const group of aggregations) {
      const key = `${group.operand1}-${group.operand2}`;
      const existing = cellMap.get(key);
      if (existing) {
        existing.total += group._count.id;
        existing.totalTime += group._sum.responseTime || 0;
        if (group.correct) {
          existing.correct += group._count.id;
        }
      }
    }
  }

  // 3. Construct 100 cells for the heatmap, calculating accuracy and status
  const cells: HeatmapCell[] = [];
  for (let i = 1; i <= 10; i++) {
    for (let j = 1; j <= 10; j++) {
      const key = `${i}-${j}`;
      const data = cellMap.get(key) || { correct: 0, total: 0, totalTime: 0 };
      
      const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;
      const avgResponseTime = data.total > 0 ? data.totalTime / data.total : 0;

      // Status logic:
      // - No data: 'practice' (or neutral)
      // - Correct >= 90% and average speed < 3000ms: 'master' (Green)
      // - Correct < 70% or average speed > 6000ms (when answered): 'weak' (Red)
      // - Else: 'practice' (Orange)
      let status: 'master' | 'practice' | 'weak' = 'practice';
      if (data.total > 0) {
        if (accuracy >= 90 && avgResponseTime <= 3000) {
          status = 'master';
        } else if (accuracy < 70 || avgResponseTime > 6000) {
          status = 'weak';
        }
      }

      cells.push({
        operand1: i,
        operand2: j,
        correctCount: data.correct,
        totalCount: data.total,
        accuracy: Math.round(accuracy * 10) / 10,
        avgResponseTime: Math.round(avgResponseTime),
        status,
      });
    }
  }

  return {
    operationType,
    studentId,
    cells,
  };
}

/**
 * Gets adaptive question parameters for a student.
 * Returns coordinates of weak answers to prioritize in Practice Mode (Adaptive Difficulty).
 * The PRD specifies that for adaptive practice, system prioritizes coordinates where user previously failed.
 */
export async function getWeakCoordinates(
  studentId: string,
  operationType: OperationType,
  limit = 5
): Promise<{ operand1: number; operand2: number }[]> {
  const sessions = await prisma.practiceSession.findMany({
    where: { studentId, operationType },
    select: { id: true },
    orderBy: { date: 'desc' },
    take: 10, // Analyze recent 10 sessions
  });

  const sessionIds = sessions.map((s) => s.id);
  if (sessionIds.length === 0) return [];

  // Group incorrect logs
  const incorrectLogs = await prisma.questionLog.groupBy({
    by: ['operand1', 'operand2'],
    where: {
      sessionId: { in: sessionIds },
      correct: false,
    },
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
    take: limit,
  });

  return incorrectLogs.map((log) => ({
    operand1: log.operand1,
    operand2: log.operand2,
  }));
}
