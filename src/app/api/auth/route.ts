import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth-helpers';
import { signAuthToken, setSessionCookie, SessionPayload } from '@/lib/auth';

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
      
      const payload: SessionPayload = {
        id: student.parentId || student.id,
        role: 'PARENT',
        token: student.uniqueToken,
        studentId: student.id,
        name: student.parent?.nama || 'Wali Murid',
      };

      const tokenString = await signAuthToken(payload);
      const resData = {
        role: 'PARENT',
        token: student.uniqueToken,
        name: payload.name,
        studentId: student.id
      };

      const response = NextResponse.json(resData);
      return setSessionCookie(response, tokenString);
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

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      );
    }

    const payload: SessionPayload = {
      id: user.id,
      email: user.email,
      role: user.role as any,
      name: user.role === 'STUDENT' ? user.student?.nama : (user.role === 'TEACHER' ? user.teacher?.nama : 'User'),
      studentId: user.student?.id || null,
      teacherId: user.teacher?.id || null,
    };

    const tokenString = await signAuthToken(payload);
    const resData = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: payload.name,
      studentId: user.student?.id || null
    };

    const response = NextResponse.json(resData);
    return setSessionCookie(response, tokenString);
  } catch (error: any) {
    console.error('Auth Error:', error);
    return NextResponse.json(
      { error: 'Gagal melakukan otentikasi' },
      { status: 500 }
    );
  }
}

