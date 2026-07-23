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

    // B. Email/Username/Nama & Password Login for Siswa & Guru
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email / Nama dan password wajib diisi' },
        { status: 400 }
      );
    }

    const rawInput = email.trim();
    const cleanInput = rawInput.toLowerCase();

    // 1. Exact email match
    let user = await prisma.user.findUnique({
      where: { email: cleanInput },
      include: {
        student: true,
        teacher: true
      }
    });

    // 2. Formatted username match (e.g. "siswa.novan" -> "siswa.novan@surahmath.id")
    if (!user) {
      const sanitized = cleanInput.replace(/[^a-z0-9]/g, '');
      const formattedEmail = cleanInput.startsWith('siswa.') 
        ? `${cleanInput.split('@')[0]}@surahmath.id` 
        : `siswa.${sanitized}@surahmath.id`;

      user = await prisma.user.findUnique({
        where: { email: formattedEmail },
        include: {
          student: true,
          teacher: true
        }
      });
    }

    // 3. Student Name match (case-insensitive)
    if (!user) {
      const studentMatch = await prisma.student.findFirst({
        where: {
          nama: {
            equals: rawInput,
            mode: 'insensitive'
          }
        },
        include: {
          user: true,
          teacher: true
        }
      });

      if (studentMatch && studentMatch.user) {
        user = {
          ...studentMatch.user,
          student: studentMatch,
          teacher: null
        } as any;
      }
    }

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: 'Email/Nama atau password salah' },
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

