import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, token } = body;

    // A. Parent Token Login
    if (token) {
      const parent = await prisma.parent.findUnique({
        where: { uniqueToken: token },
        include: { students: true }
      });
      
      if (!parent) {
        return NextResponse.json(
          { error: 'Token wali murid tidak valid' },
          { status: 400 }
        );
      }
      
      return NextResponse.json({
        role: 'PARENT',
        token: parent.uniqueToken,
        name: parent.nama,
        studentId: parent.students[0]?.id || null
      });
    }

    // B. Email/Password Login for Siswa & Guru
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan password wajib diisi' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        student: true,
        teacher: true
      }
    });

    if (!user || user.passwordHash !== password) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.role === 'STUDENT' ? user.student?.nama : (user.role === 'TEACHER' ? user.teacher?.nama : 'User'),
      studentId: user.student?.id || null
    });
  } catch (error: any) {
    console.error('Auth Error:', error);
    return NextResponse.json(
      { error: 'Gagal melakukan otentikasi' },
      { status: 500 }
    );
  }
}
