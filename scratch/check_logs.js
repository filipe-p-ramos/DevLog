const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const logs = await prisma.log.findMany({
    where: { content: { contains: "teste" } },
    include: { task: true },
    orderBy: { createdAt: "desc" }
  });
  console.log(JSON.stringify(logs, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
