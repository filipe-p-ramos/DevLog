const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const tasks = await prisma.task.findMany({
      select: { id: true, title: true, tags: true }
    });
    console.log('Total de Tarefas:', tasks.length);
    const allTags = tasks.flatMap(t => t.tags);
    console.log('Tags únicas encontradas:', Array.from(new Set(allTags)));
    
    const tagConfigs = await prisma.tagConfig.findMany();
    console.log('TagConfigs cadastradas:', tagConfigs);
  } catch (err) {
    console.error('Erro:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
