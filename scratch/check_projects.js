const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    select: { id: true, name: true, color: true }
  });
  console.log('Projetos e cores:', JSON.stringify(projects, null, 2));
}

main().finally(() => prisma.$disconnect());
