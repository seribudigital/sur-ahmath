import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuthToken, COOKIE_NAME } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Ambil token dari cookie atau header Authorization
  let token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // 2. Verifikasi token
  const session = token ? await verifyAuthToken(token) : null;

  // 3. Jika sesi tidak ada / tidak valid
  if (!session) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Sesi Anda telah habis atau tidak sah. Silakan login kembali.' },
        { status: 401 }
      );
    }
    // Jika akses halaman web (dashboard/teacher/practice), redirect ke halaman login (/)
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Role-based Access Control (RBAC)
  // Rute Khusus Guru & Admin (/teacher, /api/teacher, /api/students)
  if (
    pathname.startsWith('/teacher') ||
    pathname.startsWith('/api/teacher') ||
    pathname.startsWith('/api/students')
  ) {
    if (session.role !== 'TEACHER' && session.role !== 'ADMIN') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Akses ditolak: Anda tidak memiliki otoritas Guru atau Admin.' },
          { status: 403 }
        );
      }
      // Redirect siswa/parent yang mencoba masuk ke halaman guru kembali ke dashboard/raport mereka
      if (session.role === 'STUDENT' && session.studentId) {
        return NextResponse.redirect(new URL(`/dashboard?studentId=${session.studentId}`, request.url));
      } else if (session.role === 'PARENT' && session.token) {
        return NextResponse.redirect(new URL(`/raport/${session.token}`, request.url));
      }
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Rute Khusus Siswa (/practice) -> Guru juga boleh akses untuk inspeksi jika mau, tapi utamanya Siswa
  if (pathname.startsWith('/practice') && session.role === 'PARENT') {
    return NextResponse.redirect(new URL(`/raport/${session.token}`, request.url));
  }

  // 5. Meneruskan request dengan menyisipkan header identitas terverifikasi
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-user-id', session.id || '');
  requestHeaders.set('x-user-role', session.role || '');
  if (session.studentId) requestHeaders.set('x-student-id', session.studentId);
  if (session.teacherId) requestHeaders.set('x-teacher-id', session.teacherId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Rute yang dijaga oleh Middleware
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/teacher/:path*',
    '/practice/:path*',
    '/api/reports/:path*',
    '/api/exams/:path*',
    '/api/practice/:path*',
    '/api/students/:path*',
    '/api/teacher/:path*',
    '/api/auth/change-password/:path*',
    '/api/auth/logout/:path*',
  ],
};
