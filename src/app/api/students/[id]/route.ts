import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the student to obtain the associated userId
    const student = await prisma.student.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Siswa tidak ditemukan' },
        { status: 404 }
      );
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
