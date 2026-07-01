import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getMasteryHeatmap } from '@/lib/db-helpers';

// GET: Retrieve student report card (Accuracy, Speed, Heatmap, and comments)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let studentId = searchParams.get('studentId');
    const parentToken = searchParams.get('parentToken');
    const period = searchParams.get('period'); // E.g., "2026-M06"
    const teacherUserId = searchParams.get('teacherUserId');

    // A. Teacher Dashboard Roster Fetch
    if (teacherUserId) {
      // Find teacher (fallback to first teacher if placeholder is passed)
      let teacher = await prisma.teacher.findUnique({
        where: { userId: teacherUserId },
      });
      
      if (!teacher) {
        teacher = await prisma.teacher.findFirst();
      }

      if (!teacher) {
        return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
      }

      // Fetch all students under this teacher
      const students = await prisma.student.findMany({
        where: { teacherId: teacher.id },
        include: {
          user: true, // Fetch user to get email and password hash
          exams: {
            orderBy: { date: 'desc' },
          },
          reports: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
          practiceSessions: {
            orderBy: { date: 'desc' },
          }
        },
        orderBy: { nama: 'asc' }
      });

      // Format response for Teacher Dashboard Roster
      const roster = students.map((s) => {
        const latestReport = s.reports[0];
        const latestPractice = s.practiceSessions[0];
        const postTest = s.exams.find(e => e.examType === 'POST_TEST');
        
        // Calculate average accuracy and speed from reports or practice sessions
        let accuracy = 0.0;
        let speed = 0.0;
        let activeDays = 0;
        
        if (latestReport) {
          accuracy = latestReport.accuracy;
          speed = latestReport.speed;
          activeDays = Math.round(latestReport.activityScore / 10);
        } else if (s.practiceSessions.length > 0) {
          const validSessions = s.practiceSessions.filter(p => p.totalQuestions > 0);
          const totalQ = validSessions.reduce((sum, p) => sum + p.totalQuestions, 0);
          const totalC = validSessions.reduce((sum, p) => sum + p.correctAnswers, 0);
          const totalD = validSessions.reduce((sum, p) => sum + p.duration, 0);
          
          accuracy = totalQ > 0 ? (totalC / totalQ) * 100 : 0.0;
          speed = totalQ > 0 ? totalD / totalQ : 0.0;
          activeDays = s.practiceSessions.length;
        } else if (s.exams.length > 0) {
          accuracy = s.exams[0].score;
        }

        // Calculate Pre-Test averages (DIAGNOSTIC)
        const preTestsMult = s.exams.filter(e => e.examType === 'DIAGNOSTIC' && e.operationType === 'MULTIPLICATION');
        const preTestsDiv = s.exams.filter(e => e.examType === 'DIAGNOSTIC' && e.operationType === 'DIVISION');
        
        const preTestAvgMult = preTestsMult.length > 0
          ? Math.round(preTestsMult.reduce((sum, e) => sum + e.score, 0) / preTestsMult.length)
          : null;
        const preTestAvgDiv = preTestsDiv.length > 0
          ? Math.round(preTestsDiv.reduce((sum, e) => sum + e.score, 0) / preTestsDiv.length)
          : null;

        // Fetch all Post-Tests (POST_TEST) sorted chronologically
        const postTestsMult = s.exams
          .filter(e => e.examType === 'POST_TEST' && e.operationType === 'MULTIPLICATION')
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map(e => e.score);

        const postTestsDiv = s.exams
          .filter(e => e.examType === 'POST_TEST' && e.operationType === 'DIVISION')
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map(e => e.score);

        let examStatus = 'LOCKED';
        let examId = postTest ? postTest.id : null;
        
        const hasPassedPostTest = s.exams.some(e => e.examType === 'POST_TEST' && e.verifiedByGuru && e.score >= 90.0);

        if (s.monitoringStage >= 5) {
          examStatus = 'TRUE_MASTER';
        } else if (hasPassedPostTest) {
          examStatus = 'MONITORING';
        } else if (postTest && postTest.verifiedByGuru) {
          examStatus = 'PASSED';
        } else if (postTest && postTest.score >= 90.0) {
          // Completed & passed, waiting for teacher approval
          examStatus = 'NEEDS_VERIFICATION';
        } else if (s.examUnlocked) {
          examStatus = 'UNLOCKED'; // unlocked by teacher, ready to take exam
        } else if (s.examRequested) {
          examStatus = 'REQUESTED'; // student has requested the exam
        } else if (postTest) {
          examStatus = 'REMEDIAL';
        }

        return {
          id: s.id,
          nama: s.nama,
          kelas: s.kelas,
          email: s.user.email,
          password: s.user.passwordHash,
          accuracy,
          speed,
          activeDays,
          streak: 0,
          examStatus,
          examId,
          reportId: latestReport ? latestReport.id : null,
          comment: latestReport ? latestReport.teacherComment || '' : '',
          lastActive: latestPractice ? 'Baru-baru ini' : 'Belum aktif',
          examRequested: s.examRequested,
          examUnlocked: s.examUnlocked,
          preTestAvgMult,
          preTestAvgDiv,
          postTestsMult,
          postTestsDiv,
          uniqueToken: s.uniqueToken,
          monitoringStage: s.monitoringStage,
          lastExamDate: s.lastExamDate
        };
      });

      return NextResponse.json({ teacher, students: roster });
    }

    if (!studentId && !parentToken) {
      return NextResponse.json(
        { error: 'Student ID, Parent Token, or Teacher User ID is required' },
        { status: 400 }
      );
    }

    // Resolve studentId from parentToken if provided
    if (parentToken) {
      const studentRecord = await prisma.student.findUnique({
        where: { uniqueToken: parentToken }
      });

      if (!studentRecord) {
        return NextResponse.json(
          { error: 'Invalid parent token' },
          { status: 404 }
        );
      }

      studentId = studentRecord.id;
    }

    if (!studentId) {
      return NextResponse.json(
        { error: 'Student ID could not be resolved' },
        { status: 400 }
      );
    }

    // Fetch student profile
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        teacher: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch specific period report (accuracy, speed, activity_score, teacher_comment)
    const report = await prisma.report.findFirst({
      where: {
        studentId,
        ...(period ? { period } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch all practice sessions to calculate real-time fallback metrics
    const sessions = await prisma.practiceSession.findMany({
      where: { studentId, totalQuestions: { gt: 0 } },
    });

    let realTimeStats = null;
    if (sessions.length > 0) {
      const validSessions = sessions.filter(p => p.totalQuestions > 0);
      const totalQ = validSessions.reduce((sum, p) => sum + p.totalQuestions, 0);
      const totalC = validSessions.reduce((sum, p) => sum + p.correctAnswers, 0);
      const totalD = validSessions.reduce((sum, p) => sum + p.duration, 0);
      
      realTimeStats = {
        accuracy: totalQ > 0 ? (totalC / totalQ) * 100 : 0.0,
        speed: totalQ > 0 ? totalD / totalQ : 0.0,
        activityScore: validSessions.length,
      };
    }

    // Calculate Expert progress for Multiplication & Division
    const getExpertProgressForOp = (opType: any) => {
      const opSessions = sessions.filter(s => s.operationType === opType && s.level === 'EXPERT' && s.totalQuestions > 0);
      const sortedSessions = opSessions
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .slice(0, 3);
      const count = sortedSessions.length;
      const avg = count > 0 
        ? Math.round(sortedSessions.reduce((sum, s) => sum + (s.correctAnswers / (s.totalQuestions || 1)) * 100, 0) / count)
        : 0;
      return {
        passed: count >= 3 && avg >= 90,
        sessionCount: count,
        average: avg
      };
    };

    const multiplicationExpert = getExpertProgressForOp('MULTIPLICATION');
    const divisionExpert = getExpertProgressForOp('DIVISION');

    const getReportForOp = (opType: any) => {
      const opSessions = sessions.filter(s => s.operationType === opType && s.totalQuestions > 0);
      if (opSessions.length === 0) {
        return {
          accuracy: 0.0,
          speed: 0.0,
          activityScore: 0,
        };
      }
      const totalQ = opSessions.reduce((sum, s) => sum + s.totalQuestions, 0);
      const totalC = opSessions.reduce((sum, s) => sum + s.correctAnswers, 0);
      const totalD = opSessions.reduce((sum, s) => sum + s.duration, 0);
      return {
        accuracy: totalQ > 0 ? (totalC / totalQ) * 100 : 0.0,
        speed: totalQ > 0 ? totalD / totalQ : 0.0,
        activityScore: opSessions.length,
      };
    };

    const multiplicationReport = getReportForOp('MULTIPLICATION');
    const divisionReport = getReportForOp('DIVISION');

    // Fetch last 6 reports for progress trend chart
    const reportsHistory = await prisma.report.findMany({
      where: { studentId },
      orderBy: { createdAt: 'asc' },
      take: 6,
    });

    // Generate dynamic practice trend fallback from completed sessions
    const sessionsForTrend = await prisma.practiceSession.findMany({
      where: { studentId, totalQuestions: { gt: 0 } },
      orderBy: { date: 'asc' },
    });

    let dynamicHistory: any[] = [];
    if (sessionsForTrend.length > 0) {
      const totalSessions = sessionsForTrend.length;
      if (totalSessions <= 6) {
        dynamicHistory = sessionsForTrend.map((s, idx) => ({
          id: s.id,
          period: `Latihan ${idx + 1}`,
          accuracy: s.totalQuestions > 0 ? Math.round((s.correctAnswers / s.totalQuestions) * 100) : 0,
          speed: s.totalQuestions > 0 ? parseFloat((s.duration / s.totalQuestions).toFixed(1)) : 0,
        }));
      } else {
        const chunkSize = Math.floor(totalSessions / 6);
        for (let i = 0; i < 6; i++) {
          const start = i * chunkSize;
          const end = i === 5 ? totalSessions : (i + 1) * chunkSize;
          const chunk = sessionsForTrend.slice(start, end);
          if (chunk.length > 0) {
            const totalQ = chunk.reduce((sum, s) => sum + s.totalQuestions, 0);
            const totalC = chunk.reduce((sum, s) => sum + s.correctAnswers, 0);
            const totalD = chunk.reduce((sum, s) => sum + s.duration, 0);
            dynamicHistory.push({
              id: `chunk-${i}`,
              period: `Tren ${i + 1}`,
              accuracy: totalQ > 0 ? Math.round((totalC / totalQ) * 100) : 0,
              speed: totalQ > 0 ? parseFloat((totalD / totalQ).toFixed(1)) : 0,
            });
          }
        }
      }
    }

    // Generate Heatmaps for both multiplication & division
    const multiplicationHeatmap = await getMasteryHeatmap(studentId, 'MULTIPLICATION');
    const divisionHeatmap = await getMasteryHeatmap(studentId, 'DIVISION');

    // Fetch student exams
    const exams = await prisma.exam.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    });

    // Fetch teacher settings for the student
    let settings = null;
    if (student.teacherId) {
      settings = await prisma.teacherSetting.findUnique({
        where: { teacherId: student.teacherId },
      });
    }

    if (!settings) {
      settings = {
        monitoringCooldownDays: 7,
        monitoringStagesCount: 5,
      } as any;
    }

    return NextResponse.json({
      student: {
        id: student.id,
        nama: student.nama,
        kelas: student.kelas,
        school: student.school,
        examRequested: student.examRequested,
        examUnlocked: student.examUnlocked,
        multiplicationExpert,
        divisionExpert,
        monitoringStage: student.monitoringStage,
        lastExamDate: student.lastExamDate,
        teacher: student.teacher ? { nama: student.teacher.nama, school: student.teacher.school } : null,
      },
      settings: {
        monitoringCooldownDays: settings.monitoringCooldownDays,
        monitoringStagesCount: settings.monitoringStagesCount,
      },
      multiplicationReport,
      divisionReport,
      report: report ? {
        id: report.id,
        period: report.period,
        accuracy: report.accuracy,
        speed: report.speed,
        activityScore: report.activityScore,
        teacherComment: report.teacherComment,
      } : (realTimeStats ? {
        id: 'realtime',
        period: 'Real-time',
        accuracy: realTimeStats.accuracy,
        speed: realTimeStats.speed,
        activityScore: realTimeStats.activityScore,
        teacherComment: 'Belum ada catatan evaluasi dari guru pengajar.',
      } : null),
      reportsHistory: reportsHistory.length >= 2 
        ? reportsHistory.map(r => ({
            id: r.id,
            period: r.period,
            accuracy: r.accuracy,
            speed: r.speed,
          }))
        : (dynamicHistory.length > 0 
            ? dynamicHistory 
            : (realTimeStats ? [{
                id: 'realtime-hist',
                period: 'Saat Ini',
                accuracy: realTimeStats.accuracy,
                speed: realTimeStats.speed,
              }] : [])
          ),
      heatmaps: {
        multiplication: multiplicationHeatmap,
        division: divisionHeatmap,
      },
      exams: exams.map(e => ({
        id: e.id,
        examType: e.examType,
        operationType: e.operationType,
        score: e.score,
        statusRemedial: e.statusRemedial,
        verifiedByGuru: e.verifiedByGuru,
        date: e.date,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching report:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Add or update teacher's comment on a report
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { reportId, studentId, teacherUserId, comment } = body;

    if ((!reportId && !studentId) || !teacherUserId || comment === undefined) {
      return NextResponse.json(
        { error: 'Report ID or Student ID, Teacher User ID and Comment are required' },
        { status: 400 }
      );
    }

    // 1. Verify user is a teacher
    let teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });

    if (!teacher) {
      teacher = await prisma.teacher.findFirst();
    }

    if (!teacher) {
      return NextResponse.json(
        { error: 'Unauthorized: User is not registered as a teacher' },
        { status: 403 }
      );
    }

    // 2. Update or Create report comment
    let updatedReport;
    if (reportId) {
      const rep = await prisma.report.findUnique({ where: { id: reportId } });
      const sId = rep ? rep.studentId : studentId;
      
      let accuracy = undefined;
      let speed = undefined;
      let activityScore = undefined;

      if (rep && rep.accuracy === 0 && sId) {
        const sessions = await prisma.practiceSession.findMany({
          where: { studentId: sId, totalQuestions: { gt: 0 } },
        });
        if (sessions.length > 0) {
          const validSessions = sessions.filter(p => p.totalQuestions > 0);
          const totalQ = validSessions.reduce((sum, p) => sum + p.totalQuestions, 0);
          const totalC = validSessions.reduce((sum, p) => sum + p.correctAnswers, 0);
          const totalD = validSessions.reduce((sum, p) => sum + p.duration, 0);
          accuracy = totalQ > 0 ? (totalC / totalQ) * 100 : 0.0;
          speed = totalQ > 0 ? totalD / totalQ : 0.0;
          activityScore = validSessions.length;
        }
      }

      updatedReport = await prisma.report.update({
        where: { id: reportId },
        data: {
          teacherComment: comment,
          ...(accuracy !== undefined ? { accuracy, speed, activityScore } : {}),
        },
      });
    } else {
      // Find latest report, or create a new one for "Minggu 1"
      const latest = await prisma.report.findFirst({
        where: { studentId },
        orderBy: { createdAt: 'desc' }
      });

      const sessions = await prisma.practiceSession.findMany({
        where: { studentId, totalQuestions: { gt: 0 } },
      });
      let accuracy = 0.0;
      let speed = 0.0;
      let activityScore = 0.0;
      if (sessions.length > 0) {
        const validSessions = sessions.filter(p => p.totalQuestions > 0);
        const totalQ = validSessions.reduce((sum, p) => sum + p.totalQuestions, 0);
        const totalC = validSessions.reduce((sum, p) => sum + p.correctAnswers, 0);
        const totalD = validSessions.reduce((sum, p) => sum + p.duration, 0);
        accuracy = totalQ > 0 ? (totalC / totalQ) * 100 : 0.0;
        speed = totalQ > 0 ? totalD / totalQ : 0.0;
        activityScore = validSessions.length;
      }

      if (latest) {
        updatedReport = await prisma.report.update({
          where: { id: latest.id },
          data: {
            teacherComment: comment,
            ...(latest.accuracy === 0 ? { accuracy, speed, activityScore } : {}),
          },
        });
      } else {
        updatedReport = await prisma.report.create({
          data: {
            studentId,
            period: 'Minggu 1',
            accuracy,
            speed,
            activityScore,
            teacherComment: comment,
          },
        });
      }
    }

    return NextResponse.json({
      message: 'Teacher comment updated successfully',
      reportId: updatedReport.id,
      teacherComment: updatedReport.teacherComment,
    });
  } catch (error: any) {
    console.error('Error updating comment:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
