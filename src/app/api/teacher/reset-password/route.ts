import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teacherUserId, studentId, newPassword } = body;

    if (!teacherUserId || !studentId || !newPassword) {
      return NextResponse.json(
        { error: 'ID Guru, ID Siswa, dan sandi baru wajib diisi' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Sandi baru minimal harus 6 karakter' },
        { status: 400 }
      );
    }

    // 1. Authorize the teacher (Strict check: must find unique teacher)
    const teacher = await prisma.teacher.findUnique({
      where: { userId: teacherUserId }
    });

    if (!teacher) {
      return NextResponse.json(
        { error: 'Akses ditolak: Hanya Guru terdaftar yang dapat mereset sandi siswa' },
        { status: 403 }
      );
    }

    // 2. Fetch the student to get the associated userId
    const student = await prisma.student.findUnique({
      where: { id: studentId }
    });

    if (!student) {
      return NextResponse.json(
        { error: 'Data siswa tidak ditemukan' },
        { status: 404 }
      );
    }

    // 3. Update the student's password
    await prisma.user.update({
      where: { id: student.userId },
      data: {
        passwordHash: hashPassword(newPassword)
      }
    });

    return NextResponse.json({
      success: true,
      message: `Sandi untuk siswa ${student.nama} berhasil direset.`
    });

  } catch (error: any) {
    console.error('Teacher Reset Password Error:', error);
    return NextResponse.json(
      { error: 'Gagal mereset sandi siswa' },
      { status: 500 }
    );
  }
}
