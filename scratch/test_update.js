const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const taskId = "5e6b0077-aa9d-42f1-bf9b-7c09883a9110";
  console.log("Updating task:", taskId);
  
  const result = await prisma.$transaction([
    prisma.log.create({
      data: {
        content: "Teste de ordenação " + new Date().toISOString(),
        taskId: taskId
      }
    }),
    prisma.task.update({
      where: { id: taskId },
      data: { updatedAt: new Date() }
    })
  ]);
  
  console.log("Result:", JSON.stringify(result[1], null, 2));
}

test().catch(console.error).finally(() => prisma.$disconnect());
