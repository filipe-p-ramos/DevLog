const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tasks = await prisma.task.findMany({
    where: { tags: { has: 'MELHORIAS DE UX' } },
    select: {
      id: true,
      title: true,
      status: true,
      projectId: true,
      project: { select: { name: true } }
    }
  });
  console.log('Tarefas com MELHORIAS DE UX:', JSON.stringify(tasks, null, 2));

  // Vamos checar todas as tarefas e suas tags e status
  const allTasks = await prisma.task.findMany({
    select: { id: true, title: true, status: true, tags: true, projectId: true }
  });
  console.log('\nResumo de tarefas por tag e status:');
  const tagSummary = {};
  for (const t of allTasks) {
    for (const tag of t.tags) {
      if (!tagSummary[tag]) {
        tagSummary[tag] = { pending: 0, in_progress: 0, completed: 0, total: 0, projects: new Set() };
      }
      tagSummary[tag][t.status] = (tagSummary[tag][t.status] || 0) + 1;
      tagSummary[tag].total += 1;
      tagSummary[tag].projects.add(t.projectId);
    }
  }
  for (const [tag, data] of Object.entries(tagSummary)) {
    console.log(`- ${tag}: total=${data.total}, pendentes=${data.pending || 0}, concluidas=${data.completed || 0}, projetos=${data.projects.size}`);
  }
}

main().finally(() => prisma.$disconnect());
