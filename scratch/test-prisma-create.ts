import { PrismaClient, ExamType, OperationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const student = await prisma.student.findFirst({
    where: { nama: 'Ahmad Fauzan' }
  });

  if (!student) {
    console.error('Ahmad Fauzan not found');
    return;
  }

  console.log(`Found student: ${student.nama} with ID: ${student.id}`);

  try {
    const exam = await prisma.exam.create({
      data: {
        studentId: student.id,
        examType: ExamType.DIAGNOSTIC,
        operationType: OperationType.MULTIPLICATION,
        score: 100.0,
        statusRemedial: false,
        verifiedByGuru: false,
      }
    });
    console.log('Successfully created exam record:', exam);
    
    // Clean it up immediately
    await prisma.exam.delete({
      where: { id: exam.id }
    });
    console.log('Successfully deleted test exam record');
  } catch (err) {
    console.error('Error creating exam:', err);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
