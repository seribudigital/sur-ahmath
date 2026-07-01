import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Role } from '@prisma/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nama, kelas, password } = body;

    // 1. Validation
    if (!nama || !kelas || !password) {
      return NextResponse.json(
        { error: 'Nama Lengkap, Kelas, dan Password wajib diisi' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password minimal harus 6 karakter' },
        { status: 400 }
      );
    }

    const uniformClasses = ['7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B', '10', '11', '12'];
    if (!uniformClasses.includes(kelas)) {
      return NextResponse.json(
        { error: 'Pilihan Kelas tidak valid' },
        { status: 400 }
      );
    }

    // 2. Generate Unique Email
    const sanitizedName = nama.toLowerCase().replace(/[^a-z0-9]/g, '');
    let baseEmail = `siswa.${sanitizedName}`;
    let email = `${baseEmail}@surahmath.id`;
    let userExists = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    let suffix = 2;
    while (userExists) {
      email = `${baseEmail}${suffix}@surahmath.id`;
      userExists = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });
      suffix++;
    }

    // 3. Find Supervisor (Guru ahmad novan, S.T / admin@surahmath.id)
    let teacher = await prisma.teacher.findFirst({
      where: {
        user: {
          email: 'admin@surahmath.id'
        }
      }
    });

    // Fallback: If not found, use first available teacher
    if (!teacher) {
      teacher = await prisma.teacher.findFirst();
    }

    if (!teacher) {
      return NextResponse.json(
        { error: 'Data guru utama tidak ditemukan di sistem. Harap hubungi Administrator.' },
        { status: 500 }
      );
    }

    // 4. Create User and Student (Transaction)
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash: password, // Plain string storage per application design
          role: Role.STUDENT,
        }
      });

      const student = await tx.student.create({
        data: {
          userId: user.id,
          nama: nama.trim(),
          kelas: kelas,
          school: teacher.school || 'MTs-MA Al-Khoir Cikande',
          teacherId: teacher.id,
        }
      });

      return { user, student };
    });

    return NextResponse.json({
      success: true,
      email: result.user.email,
      studentId: result.student.id,
      nama: result.student.nama,
      kelas: result.student.kelas
    });

  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json(
      { error: 'Gagal melakukan pendaftaran siswa baru' },
      { status: 500 }
    );
  }
}
