import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== CHECKING DATABASE EXAMS ===');
  const students = await prisma.student.findMany({
    include: {
      exams: true,
      practiceSessions: {
        include: {
          _count: {
            select: { questionLogs: true }
          }
        }
      }
    }
  });

  for (const student of students) {
    console.log(`\nStudent: ${student.nama} (ID: ${student.id})`);
    console.log(`Exams (${student.exams.length}):`);
    student.exams.forEach(e => {
      console.log(`  - ID: ${e.id}, Type: ${e.examType}, Op: ${e.operationType}, Score: ${e.score}%, Date: ${e.date}, Verified: ${e.verifiedByGuru}`);
    });
    console.log(`Practice Sessions (${student.practiceSessions.length}):`);
    student.practiceSessions.forEach(s => {
      console.log(`  - Session ID: ${s.id}, Op: ${s.operationType}, Total Qs: ${s.totalQuestions}, Correct Qs: ${s.correctAnswers}, Logs Count: ${s._count.questionLogs}`);
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
