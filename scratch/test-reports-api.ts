import { GET } from '../src/app/api/reports/route';

async function test() {
  const req = new Request('http://localhost/api/reports?studentId=f3cd48c5-5a33-4b3e-8492-14399a9f5454');
  const res = await GET(req);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

test().catch(console.error);
