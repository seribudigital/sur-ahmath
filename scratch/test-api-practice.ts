import { GET } from '../src/app/api/practice/route';
import prisma from '../src/lib/prisma';

async function main() {
  console.log('=== TESTING API PRACTICE GET HANDLER ===');

  const student = await prisma.student.findFirst({
    where: { nama: 'Ahmad Fauzan' }
  });

  if (!student) {
    console.error('Ahmad Fauzan not found');
    return;
  }

  console.log(`Student ID: ${student.id}`);

  // Test with limit = 50, operationType = MULTIPLICATION, level = EXPERT
  const mockRequest = new Request(
    `http://localhost:3000/api/practice?studentId=${student.id}&operationType=MULTIPLICATION&level=EXPERT&limit=50`
  );

  try {
    const response = await GET(mockRequest);
    const responseData = await response.json();
    console.log('Response Status:', response.status);
    console.log('Questions Count:', responseData.questionsCount);
    console.log('Questions Array Length:', responseData.questions?.length);
    
    if (responseData.questions && responseData.questions.length > 0) {
      console.log('Sample question:', responseData.questions[0]);
    } else {
      console.warn('Warning: No questions generated!');
    }
  } catch (err) {
    console.error('Error during GET handler test:', err);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
