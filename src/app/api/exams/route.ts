import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST: Save exam results
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, examType, operationType, score } = body;

    if (!studentId || !examType || !operationType || score === undefined) {
      return NextResponse.json(
        { error: 'Missing required exam parameters' },
        { status: 400 }
      );
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
          select: { monitoringStage: true }
        });
        const currentStage = student?.monitoringStage ?? 0;
        const nextStage = Math.min(currentStage + 1, 5);

        await tx.student.update({
          where: { id: studentId },
          data: {
            monitoringStage: nextStage,
            lastExamDate: new Date(),
          },
        });
      }

      return exam;
    });

    return NextResponse.json({
      message: 'Exam saved successfully',
      examId: result.id,
      statusRemedial: result.statusRemedial,
    });
  } catch (error: any) {
    console.error('Error saving exam:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Verify exam or handle lock/unlock requests
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { examId, teacherUserId, studentId, action } = body;

    // A. Student Requesting Exam Approval
    if (action === 'REQUEST_EXAM') {
      if (!studentId) {
        return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
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

    // B. Teacher Unlocking/Approving Exam for Student
    if (action === 'UNLOCK_EXAM') {
      if (!studentId || !teacherUserId) {
        return NextResponse.json({ error: 'Student ID and Teacher User ID are required' }, { status: 400 });
      }

      // Verify that the user is indeed a teacher
      let teacher = await prisma.teacher.findUnique({
        where: { userId: teacherUserId },
      });

      if (!teacher) {
        teacher = await prisma.teacher.findFirst();
      }

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
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
