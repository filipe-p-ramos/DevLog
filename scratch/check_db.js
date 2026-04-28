const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tasks = await prisma.task.findMany({
    select: {
      id: true,
      title: true,
      updatedAt: true,
      createdAt: true
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });
  console.log(JSON.stringify(tasks, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
