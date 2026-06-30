import { POST } from '../src/app/api/exams/route';
import prisma from '../src/lib/prisma';

async function main() {
  console.log('=== TESTING API EXAMS POST HANDLER ===');

  const student = await prisma.student.findFirst({
    where: { nama: 'Ahmad Fauzan' }
  });

  if (!student) {
    console.error('Ahmad Fauzan not found');
    return;
  }

  console.log(`Student ID: ${student.id}`);

  const mockRequestBody = {
    studentId: student.id,
    examType: 'DIAGNOSTIC',
    operationType: 'MULTIPLICATION',
    score: 85.0
  };

  const mockRequest = new Request('http://localhost:3000/api/exams', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(mockRequestBody)
  });

  try {
    const response = await POST(mockRequest);
    const responseData = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Data:', responseData);

    if (response.ok && responseData.examId) {
      console.log('POST handler succeeded! Cleaning up...');
      await prisma.exam.delete({
        where: { id: responseData.examId }
      });
      console.log('Cleanup successful');
    } else {
      console.error('POST handler failed');
    }
  } catch (err) {
    console.error('Error during POST handler test:', err);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
