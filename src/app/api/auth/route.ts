import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, token } = body;

    // A. Parent Token Login
    if (token) {
      let tokenValue = token.trim();
      if (tokenValue.includes('http://') || tokenValue.includes('https://') || tokenValue.includes('/raport/')) {
        try {
          const cleanUrl = tokenValue.split('?')[0];
          const parts = cleanUrl.split('/raport/');
          if (parts.length > 1) {
            tokenValue = parts[parts.length - 1];
          } else {
            const slashParts = cleanUrl.split('/');
            tokenValue = slashParts[slashParts.length - 1];
          }
        } catch (e) {
          console.error('Failed to parse token URL:', e);
        }
      }

      const student = await prisma.student.findUnique({
        where: { uniqueToken: tokenValue },
        include: { parent: true }
      });
      
      if (!student) {
        return NextResponse.json(
          { error: 'Token wali murid tidak valid' },
          { status: 400 }
        );
      }
      
      return NextResponse.json({
        role: 'PARENT',
        token: student.uniqueToken,
        name: student.parent?.nama || 'Wali Murid',
        studentId: student.id
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
