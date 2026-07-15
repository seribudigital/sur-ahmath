import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession(request);
    if (!session || (session.role !== 'TEACHER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Hanya Guru atau Admin' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const teacherUserId = searchParams.get('teacherUserId');

    if (!teacherUserId) {
      return NextResponse.json(
        { error: 'teacherUserId is required' },
        { status: 400 }
      );
    }

    if (session.role === 'TEACHER' && session.id !== teacherUserId) {
      return NextResponse.json({ error: 'Forbidden: Tidak dapat mengakses rekap guru lain' }, { status: 403 });
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
      { error: 'Terjadi kesalahan pada server saat mengambil rekap ujian.' },
      { status: 500 }
    );
  }
}

