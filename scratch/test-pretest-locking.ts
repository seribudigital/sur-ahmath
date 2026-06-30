import { GET } from '../src/app/api/practice/route';

async function test() {
  const req = new Request('http://localhost/api/practice?studentId=f3cd48c5-5a33-4b3e-8492-14399a9f5454&checkProgress=true');
  const res = await GET(req);
  const data = await res.json();
  
  console.log('=== MULTIPLICATION PROGRESS ===');
  console.log(JSON.stringify(data.progress.multiplication, null, 2));

  console.log('\n=== DIVISION PROGRESS ===');
  console.log(JSON.stringify(data.progress.division, null, 2));
}

test().catch(console.error);
