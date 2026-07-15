import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(request);
    if (!session || (session.role !== 'TEACHER' && session.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Forbidden: Hanya Guru atau Admin yang dapat menghapus data siswa.' }, { status: 403 });
    }

    const { id } = await params;

    // Find the student to obtain the associated userId and teacherId
    const student = await prisma.student.findUnique({
      where: { id },
      select: { userId: true, teacherId: true }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Siswa tidak ditemukan' },
        { status: 404 }
      );
    }

    if (session.role === 'TEACHER' && student.teacherId !== session.teacherId) {
      return NextResponse.json({ error: 'Forbidden: Anda hanya dapat menghapus siswa yang berada di bawah bimbingan Anda.' }, { status: 403 });
    }

    // Delete the User record, which will cascade and delete Student and all its related tables
    await prisma.user.delete({
      where: { id: student.userId }
    });

    return NextResponse.json({
      success: true,
      message: 'Akun siswa berhasil dihapus secara permanen dari sistem.'
    });
  } catch (error: any) {
    console.error('Delete Student Account Error:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus data akun siswa' },
      { status: 500 }
    );
  }
}

