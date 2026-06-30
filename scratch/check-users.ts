import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== CHECKING DATABASE USERS ===');
  const users = await prisma.user.findMany({
    include: {
      student: true,
      teacher: true,
      parent: true
    }
  });

  for (const user of users) {
    console.log(`- ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Name: ${user.student?.nama || user.teacher?.nama || user.parent?.nama || 'N/A'}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
