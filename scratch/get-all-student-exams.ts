import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== FETCHING ALL STUDENTS & EXAMS ===');
  
  const students = await prisma.student.findMany({
    include: {
      exams: {
        orderBy: {
          date: 'asc'
        }
      }
    }
  });

  const recap = students.map(student => ({
    id: student.id,
    nama: student.nama,
    kelas: student.kelas,
    school: student.school,
    exams: student.exams.map(e => ({
      id: e.id,
      examType: e.examType,
      operationType: e.operationType,
      score: e.score,
      statusRemedial: e.statusRemedial,
      date: e.date,
      verifiedByGuru: e.verifiedByGuru
    }))
  }));

  console.log(JSON.stringify(recap, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
