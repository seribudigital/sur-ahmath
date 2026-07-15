import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// POST: Save exam results
export async function POST(request: Request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Sesi tidak valid' }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, examType, operationType, score, duration, totalQuestions } = body;

    if (!studentId || !examType || !operationType || score === undefined) {
      return NextResponse.json(
        { error: 'Missing required exam parameters' },
        { status: 400 }
      );
    }

    if (typeof score !== 'number' || score < 0 || score > 100) {
      return NextResponse.json({ error: 'Nilai ujian tidak valid (harus antara 0 - 100)' }, { status: 400 });
    }

    // IDOR Protection: Siswa hanya bisa menyimpan nilai untuk dirinya sendiri
    if (session.role === 'STUDENT' && session.studentId !== studentId) {
      return NextResponse.json({ error: 'Forbidden: Anda hanya dapat menyimpan nilai ujian Anda sendiri.' }, { status: 403 });
    }
    if (session.role === 'PARENT') {
      return NextResponse.json({ error: 'Forbidden: Wali murid tidak dapat menyimpan nilai ujian.' }, { status: 403 });
    }

    // Determine status_remedial: passing score is 90% for all exams
    const statusRemedial = score < 90.0;

    // Use transaction to ensure student flags are reset on POST_TEST and monitoringStage is updated on MONITORING
    const result = await prisma.$transaction(async (tx) => {
      const exam = await tx.exam.create({
        data: {
          studentId,
          examType,
          operationType,
          score,
          statusRemedial,
          verifiedByGuru: examType === 'MONITORING' ? true : false,
          duration: typeof duration === 'number' ? duration : null,
          totalQuestions: typeof totalQuestions === 'number' ? totalQuestions : null,
        },
      });

      if (examType === 'POST_TEST') {
        await tx.student.update({
          where: { id: studentId },
          data: {
            examRequested: false,
            examUnlocked: false,
          },
        });
      } else if (examType === 'MONITORING') {
        const student = await tx.student.findUnique({
          where: { id: studentId },
          select: { 
            monitoringStage: true,
            teacherId: true
          }
        });
        const currentStage = student?.monitoringStage ?? 0;
        
        let maxStages = 5;
        if (student?.teacherId) {
          const setting = await tx.teacherSetting.findUnique({
            where: { teacherId: student.teacherId }
          });
          if (setting) {
            maxStages = setting.monitoringStagesCount;
          }
        }

        if (score >= 90.0) {
          const nextStage = Math.min(maxStages, currentStage + 1);
          await tx.student.update({
            where: { id: studentId },
            data: {
              monitoringStage: nextStage,
              lastExamDate: new Date(),
            },
          });
        } else {
          await tx.student.update({
            where: { id: studentId },
            data: {
              lastExamDate: new Date(),
            },
          });
        }
      }

      return exam;
    });

    return NextResponse.json({
      message: 'Exam results saved successfully',
      examId: result.id,
      score: result.score,
      statusRemedial: result.statusRemedial,
    });
  } catch (error: any) {
    console.error('Error saving exam:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat menyimpan ujian.' },
      { status: 500 }
    );
  }
}

// PATCH: Verify exam or handle lock/unlock requests
export async function PATCH(request: Request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Sesi tidak valid' }, { status: 401 });
    }

    const body = await request.json();
    const { examId, teacherUserId, studentId, action } = body;

    // A. Student Requesting Exam Approval
    if (action === 'REQUEST_EXAM') {
      if (!studentId) {
        return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
      }
      if (session.role === 'STUDENT' && session.studentId !== studentId) {
        return NextResponse.json({ error: 'Forbidden: Anda hanya dapat mengajukan ujian untuk diri sendiri.' }, { status: 403 });
      }
      if (session.role === 'PARENT') {
        return NextResponse.json({ error: 'Forbidden: Wali murid tidak dapat mengajukan ujian.' }, { status: 403 });
      }
      
      const updatedStudent = await prisma.student.update({
        where: { id: studentId },
        data: {
          examRequested: true,
          examUnlocked: false
        }
      });

      return NextResponse.json({
        message: 'Exam request submitted successfully',
        examRequested: updatedStudent.examRequested,
        examUnlocked: updatedStudent.examUnlocked
      });
    }

    // B. Teacher Unlocking/Approving Exam for Student or Verifying Exam
    if (session.role !== 'TEACHER' && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Hanya Guru atau Admin yang dapat melakukan aksi ini.' }, { status: 403 });
    }
    if (session.role === 'TEACHER' && teacherUserId && session.id !== teacherUserId) {
      return NextResponse.json({ error: 'Forbidden: Tidak dapat mengatasnamakan guru lain.' }, { status: 403 });
    }

    if (action === 'UNLOCK_EXAM') {
      if (!studentId || !teacherUserId) {
        return NextResponse.json({ error: 'Student ID and Teacher User ID are required' }, { status: 400 });
      }

      // Verify that the user is indeed a teacher
      const teacher = await prisma.teacher.findUnique({
        where: { userId: teacherUserId },
      });

      if (!teacher) {
        return NextResponse.json({ error: 'Unauthorized: User is not registered as a teacher' }, { status: 403 });
      }

      const updatedStudent = await prisma.student.update({
        where: { id: studentId },
        data: {
          examRequested: true,
          examUnlocked: true
        }
      });

      return NextResponse.json({
        message: 'Exam unlocked successfully by Guru',
        studentId: updatedStudent.id,
        examRequested: updatedStudent.examRequested,
        examUnlocked: updatedStudent.examUnlocked
      });
    }

    if (!examId || !teacherUserId) {
      return NextResponse.json(
        { error: 'Exam ID and Teacher User ID are required' },
        { status: 400 }
      );
    }

    // Verify that the user is indeed a teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Unauthorized: User is not registered as a teacher' }, { status: 403 });
    }

    // Update the exam verification status
    const updatedExam = await prisma.exam.update({
      where: { id: examId },
      data: {
        verifiedByGuru: true,
      },
    });

    // If Post-Test was verified and passed (score >= 90%), initialize Monitoring Phase
    if (updatedExam.examType === 'POST_TEST' && updatedExam.score >= 90.0) {
      await prisma.student.update({
        where: { id: updatedExam.studentId },
        data: {
          monitoringStage: 0,
          lastExamDate: new Date(),
        },
      });
    }

    return NextResponse.json({
      message: 'Exam verified successfully by Guru',
      examId: updatedExam.id,
      verified: updatedExam.verifiedByGuru,
    });
  } catch (error: any) {
    console.error('Error verifying exam:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server saat memverifikasi ujian.' },
      { status: 500 }
    );
  }
}
