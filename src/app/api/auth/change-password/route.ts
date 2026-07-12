import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, verifyPassword } from '@/lib/auth-helpers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId, currentPassword, newPassword } = body;

    if (!studentId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'ID Siswa, sandi lama, dan sandi baru wajib diisi' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Sandi baru minimal harus 6 karakter' },
        { status: 400 }
      );
    }

    // 1. Fetch student and user account
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true }
    });

    if (!student || !student.user) {
      return NextResponse.json(
        { error: 'Data siswa tidak ditemukan' },
        { status: 404 }
      );
    }

    // 2. Verify current password
    const isCurrentPasswordCorrect = verifyPassword(currentPassword, student.user.passwordHash);
    if (!isCurrentPasswordCorrect) {
      return NextResponse.json(
        { error: 'Sandi lama yang dimasukkan salah' },
        { status: 401 }
      );
    }

    // 3. Update with new hashed password
    await prisma.user.update({
      where: { id: student.userId },
      data: {
        passwordHash: hashPassword(newPassword)
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Sandi Anda berhasil diperbarui.'
    });

  } catch (error: any) {
    console.error('Change Password Error:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui sandi' },
      { status: 500 }
    );
  }
}
