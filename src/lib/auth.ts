import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET_STRING = process.env.JWT_SECRET || 'surahmath-super-secret-key-2026-fallback';
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET_STRING);
const COOKIE_NAME = 'auth_token';

export interface SessionPayload {
  id: string;               // User ID atau ID spesifik jika login tanpa password
  email?: string;
  role: 'STUDENT' | 'TEACHER' | 'PARENT' | 'ADMIN';
  name?: string;
  studentId?: string | null;
  teacherId?: string | null;
  token?: string | null;    // Untuk login token wali murid
  [key: string]: any;
}

/**
 * Membuat token JWT berdurasi 7 hari
 */
export async function signAuthToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

/**
 * Memverifikasi token JWT
 */
export async function verifyAuthToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Mengatur HttpOnly cookie untuk auth_token pada NextResponse
 */
export function setSessionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  });
  return response;
}

/**
 * Menghapus HttpOnly cookie pada NextResponse
 */
export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

/**
 * Mendapatkan dan memvalidasi sesi aktif dari NextRequest atau dari Next.js cookies()
 * Dapat dipanggil di dalam API Route Handlers.
 */
export async function getSession(request?: Request | NextRequest): Promise<SessionPayload | null> {
  let tokenValue: string | undefined;

  if (request && 'cookies' in request && typeof request.cookies.get === 'function') {
    const cookie = request.cookies.get(COOKIE_NAME);
    tokenValue = cookie?.value;
  }

  if (!tokenValue) {
    try {
      const cookieStore = await cookies();
      const cookie = cookieStore.get(COOKIE_NAME);
      tokenValue = cookie?.value;
    } catch (e) {
      // Jika dipanggil di luar konteks request dimana cookies() tidak tersedia
    }
  }

  if (!tokenValue && request) {
    // Coba baca dari header Authorization (jika ada) atau header Cookie secara manual
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      tokenValue = authHeader.substring(7);
    } else {
      const rawCookies = request.headers.get('cookie');
      if (rawCookies) {
        const parsed = rawCookies.split(';').reduce((acc, current) => {
          const [name, ...val] = current.trim().split('=');
          acc[name] = val.join('=');
          return acc;
        }, {} as Record<string, string>);
        tokenValue = parsed[COOKIE_NAME];
      }
    }
  }

  if (!tokenValue) return null;
  return await verifyAuthToken(tokenValue);
}

export { COOKIE_NAME };
