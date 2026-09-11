const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: {
          projects: true,
          tagConfigs: true,
        }
      },
      projects: {
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              tasks: true,
              notes: true,
            }
          }
        }
      }
    }
  });
  console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
