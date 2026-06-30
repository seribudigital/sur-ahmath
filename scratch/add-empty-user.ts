import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Menambahkan user kosong baru (Ahmad Fauzan)...');

  // 1. Dapatkan data guru pendidik yang sudah ada (Ibu Fatimah)
  const teacher = await prisma.teacher.findFirst();
  if (!teacher) {
    console.error('Data guru Fatimah tidak ditemukan. Jalankan seed terlebih dahulu.');
    return;
  }

  // 2. Cek apakah user sudah ada
  const existingUser = await prisma.user.findUnique({
    where: { email: 'siswa.kosong@sekolah.id' },
  });

  if (existingUser) {
    console.log('User siswa.kosong@sekolah.id sudah ada. Menghapus untuk reset ulang...');
    await prisma.user.delete({
      where: { email: 'siswa.kosong@sekolah.id' },
    });
  }

  const existingParent = await prisma.user.findUnique({
    where: { email: 'parent.kosong@mail.com' },
  });

  if (existingParent) {
    console.log('User parent.kosong@mail.com sudah ada. Menghapus untuk reset ulang...');
    await prisma.user.delete({
      where: { email: 'parent.kosong@mail.com' },
    });
  }

  // 3. Buat data user wali murid baru untuk siswa kosong
  const parentUser = await prisma.user.create({
    data: {
      email: 'parent.kosong@mail.com',
      passwordHash: 'hashed_password_123',
      role: Role.PARENT,
      parent: {
        create: {
          nama: 'Bapak Fauzan',
          kontak: '085799998888',
          uniqueToken: 'token-unik-fauzan-777',
        }
      }
    },
    include: { parent: true }
  });
  const parentId = parentUser.parent!.id;
  console.log(`Berhasil membuat Wali Murid: ${parentUser.parent!.nama}`);

  // 4. Buat data siswa baru (Ahmad Fauzan) dengan data benar-benar kosong (tanpa logs, exams, reports)
  const studentUser = await prisma.user.create({
    data: {
      email: 'siswa.kosong@sekolah.id',
      passwordHash: 'hashed_password_123',
      role: Role.STUDENT,
      student: {
        create: {
          nama: 'Ahmad Fauzan',
          kelas: '7-A',
          school: 'MTsN 1 Jakarta',
          teacherId: teacher.id,
          parentId: parentId,
        }
      }
    },
    include: { student: true }
  });
  const studentId = studentUser.student!.id;
  console.log(`Berhasil membuat Siswa: ${studentUser.student!.nama} (ID: ${studentId})`);

  console.log('\n--- DATA USER KOSONG BERHASIL DIBUAT ---');
  console.log('Siswa:');
  console.log('  Email:    siswa.kosong@sekolah.id');
  console.log('  Password: hashed_password_123');
  console.log('Wali Murid:');
  console.log('  Token:    token-unik-fauzan-777');
  console.log('----------------------------------------');
}

main()
  .catch((e) => {
    console.error('Gagal menambahkan user kosong:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
