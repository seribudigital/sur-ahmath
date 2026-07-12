import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherUserId = searchParams.get('teacherUserId');

    if (!teacherUserId) {
      return NextResponse.json(
        { error: 'teacherUserId is required' },
        { status: 400 }
      );
    }

    // Find the teacher
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Find settings for monitoring stages count
    const settings = await prisma.teacherSetting.findUnique({
      where: { teacherId: teacher.id },
    });

    // Fetch all students under this teacher with their exams sorted by date
    const students = await prisma.student.findMany({
      where: { teacherId: teacher.id },
      include: {
        exams: {
          orderBy: { date: 'asc' }, // Older to newer to easily identify monitoring stages
        },
      },
      orderBy: { nama: 'asc' },
    });

    return NextResponse.json({
      teacher,
      settings: settings || { monitoringStagesCount: 5 },
      students,
    });
  } catch (error: any) {
    console.error('Error fetching exams recap:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', details: error.message },
      { status: 500 }
    );
  }
}
