import prisma from '../src/lib/prisma';
import { GET as getReport } from '../src/app/api/reports/route';
import { POST as postExam, PATCH as patchExam } from '../src/app/api/exams/route';

async function testFlow() {
  const studentId = 'f3cd48c5-5a33-4b3e-8492-14399a9f5454';
  const teacherUserId = '367e2745-e04c-417b-81f5-048a90bc99ed';

  console.log('=== STARTING LIFECYCLE FLOW VERIFICATION ===');

  // Step 1: Initial state reset
  await prisma.student.update({
    where: { id: studentId },
    data: {
      examRequested: false,
      examUnlocked: false
    }
  });
  console.log('1. Initialized database flags: examRequested = false, examUnlocked = false.');

  // Step 2: Fetch report and verify student is eligible (expert average >= 90)
  const reportReq = new Request(`http://localhost/api/reports?studentId=${studentId}`);
  const reportRes = await getReport(reportReq);
  const reportData = await reportRes.json();

  console.log(`2. Student divisionExpert status:`, reportData.student.divisionExpert);
  if (!reportData.student.divisionExpert.passed) {
    throw new Error('Student is not eligible for division post-test. Expert average is below 90% or count < 3.');
  }
  console.log('   Student is eligible for Division Post-Test! (average >= 90% in last 3 sessions)');

  // Step 3: Simulate Student requesting the exam
  console.log('3. Simulating Student requesting exam...');
  const reqExamReq = new Request('http://localhost/api/exams', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, action: 'REQUEST_EXAM' })
  });
  const reqExamRes = await patchExam(reqExamReq);
  const reqExamData = await reqExamRes.json();
  console.log('   Response:', reqExamData);

  // Verify student db state
  let studentDb = await prisma.student.findUnique({ where: { id: studentId } });
  console.log(`   DB State: examRequested = ${studentDb?.examRequested}, examUnlocked = ${studentDb?.examUnlocked}`);
  if (studentDb?.examRequested !== true || studentDb?.examUnlocked !== false) {
    throw new Error('REQUEST_EXAM failed to update flags correctly.');
  }

  // Step 4: Simulate Teacher unlocking/activating the exam
  console.log('4. Simulating Teacher unlocking/activating exam...');
  const unlockExamReq = new Request('http://localhost/api/exams', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId, teacherUserId, action: 'UNLOCK_EXAM' })
  });
  const unlockExamRes = await patchExam(unlockExamReq);
  const unlockExamData = await unlockExamRes.json();
  console.log('   Response:', unlockExamData);

  // Verify student db state
  studentDb = await prisma.student.findUnique({ where: { id: studentId } });
  console.log(`   DB State: examRequested = ${studentDb?.examRequested}, examUnlocked = ${studentDb?.examUnlocked}`);
  if (studentDb?.examRequested !== true || studentDb?.examUnlocked !== true) {
    throw new Error('UNLOCK_EXAM failed to update flags correctly.');
  }

  // Step 5: Simulate Student taking and submitting the Post-Test (score = 95.0)
  console.log('5. Simulating Student taking and submitting division Post-Test with score 95%...');
  const submitExamReq = new Request('http://localhost/api/exams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentId,
      examType: 'POST_TEST',
      operationType: 'DIVISION',
      score: 95.0
    })
  });
  const submitExamRes = await postExam(submitExamReq);
  const submitExamData = await submitExamRes.json();
  console.log('   Response:', submitExamData);

  // Verify that flags are reset to false
  studentDb = await prisma.student.findUnique({ where: { id: studentId } });
  console.log(`   DB State after Post-Test: examRequested = ${studentDb?.examRequested}, examUnlocked = ${studentDb?.examUnlocked}`);
  if (studentDb?.examRequested !== false || studentDb?.examUnlocked !== false) {
    throw new Error('Exam submission failed to reset flags atomically.');
  }

  // Step 6: Simulate Teacher verifying the exam in roster
  console.log('6. Simulating Teacher verifying the Post-Test...');
  const verifyExamReq = new Request('http://localhost/api/exams', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      examId: submitExamData.examId,
      teacherUserId
    })
  });
  const verifyExamRes = await patchExam(verifyExamReq);
  const verifyExamData = await verifyExamRes.json();
  console.log('   Response:', verifyExamData);

  // Verify exam state in DB
  const examDb = await prisma.exam.findUnique({ where: { id: submitExamData.examId } });
  console.log(`   Exam DB State: verifiedByGuru = ${examDb?.verifiedByGuru}`);
  if (examDb?.verifiedByGuru !== true) {
    throw new Error('Teacher validation failed to set verifiedByGuru to true.');
  }

  console.log('=== FLOW VERIFICATION COMPLETED SUCCESSFULLY ===');
}

testFlow().catch(err => {
  console.error('Test Flow Failed:', err);
  process.exit(1);
});
