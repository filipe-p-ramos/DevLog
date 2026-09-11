const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('--- Iniciando Unificação da Tag MELHORIAS DE UX -> MELHORIA DE UX ---');
  try {
    // 1. Localizar tarefas com a tag 'MELHORIAS DE UX'
    const tasksWithPlural = await prisma.task.findMany({
      where: {
        tags: {
          has: 'MELHORIAS DE UX'
        }
      },
      select: {
        id: true,
        title: true,
        tags: true,
        status: true,
        projectId: true
      }
    });

    console.log(`Tarefas encontradas com 'MELHORIAS DE UX': ${tasksWithPlural.length}`);

    for (const task of tasksWithPlural) {
      const updatedTags = Array.from(
        new Set(
          task.tags.map(t => {
            const normalized = t.trim().toUpperCase();
            return normalized === 'MELHORIAS DE UX' ? 'MELHORIA DE UX' : normalized;
          }).filter(Boolean)
        )
      );

      await prisma.task.update({
        where: { id: task.id },
        data: { tags: updatedTags }
      });

      console.log(`Tarefa '${task.title}' (${task.id}) atualizada.`);
      console.log(`  Tags anteriores: ${JSON.stringify(task.tags)}`);
      console.log(`  Novas tags:      ${JSON.stringify(updatedTags)}`);
    }

    // 2. Se houver alguma TagConfig com 'MELHORIAS DE UX', remover ou mesclar
    const oldConfig = await prisma.tagConfig.findFirst({
      where: { name: 'MELHORIAS DE UX' }
    });

    if (oldConfig) {
      console.log(`Removendo TagConfig residual de 'MELHORIAS DE UX' (id: ${oldConfig.id})...`);
      await prisma.tagConfig.delete({
        where: { id: oldConfig.id }
      });
      console.log('TagConfig residual removida.');
    } else {
      console.log('Nenhuma TagConfig residual de MELHORIAS DE UX encontrada.');
    }

    console.log('\n--- Unificação concluída com sucesso! ---');
  } catch (error) {
    console.error('Erro na unificação:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run();
