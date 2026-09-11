const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log("=== INICIANDO PURGA DE USUÁRIOS E MIGRAÇÃO ===");

  // 1. Identificar os usuários
  const users = await prisma.user.findMany();
  console.log("Usuários encontrados:", users.map(u => ({ id: u.id, email: u.email })));

  const filipe = users.find(u => u.email.toLowerCase() === 'filipe');
  if (!filipe) {
    throw new Error("Usuário 'filipe' não foi encontrado no banco! Abortando por segurança.");
  }
  console.log(`✅ Usuário filipe confirmado com ID: ${filipe.id}`);

  // 2. Limpeza segura de Raphael
  const raphael = users.find(u => u.email.toLowerCase() === 'raphael');
  if (raphael) {
    console.log(`\nRemovendo registros associados a raphael (${raphael.id})...`);
    
    // Buscar projetos de raphael
    const raphaelProjects = await prisma.project.findMany({
      where: { userId: raphael.id },
      select: { id: true, name: true }
    });
    console.log("Projetos de raphael:", raphaelProjects);

    for (const project of raphaelProjects) {
      // Buscar tasks desse projeto para limpar logs
      const tasks = await prisma.task.findMany({
        where: { projectId: project.id },
        select: { id: true }
      });
      const taskIds = tasks.map(t => t.id);

      // Deletar logs das tasks
      if (taskIds.length > 0) {
        const deletedLogs = await prisma.log.deleteMany({
          where: { taskId: { in: taskIds } }
        });
        console.log(`- Deletados ${deletedLogs.count} logs de tasks.`);
      }

      // Deletar tasks do projeto
      const deletedTasks = await prisma.task.deleteMany({
        where: { projectId: project.id }
      });
      console.log(`- Deletadas ${deletedTasks.count} tasks do projeto ${project.name}.`);

      // Deletar notes do projeto
      const deletedNotes = await prisma.note.deleteMany({
        where: { projectId: project.id }
      });
      console.log(`- Deletadas ${deletedNotes.count} notes do projeto ${project.name}.`);

      // Deletar o projeto
      await prisma.project.delete({
        where: { id: project.id }
      });
      console.log(`- Projeto ${project.name} deletado.`);
    }

    // Deletar tagConfigs de raphael
    const deletedTags = await prisma.tagConfig.deleteMany({
      where: { userId: raphael.id }
    });
    console.log(`- Deletadas ${deletedTags.count} tagConfigs de raphael.`);

    // Deletar o usuário raphael
    await prisma.user.delete({
      where: { id: raphael.id }
    });
    console.log(`✅ Usuário raphael excluído permanentemente.`);
  } else {
    console.log("Usuário raphael não existe mais no banco.");
  }

  // 3. Limpeza do usuário residual user@projectnotes.local
  const residualUser = users.find(u => u.email.toLowerCase() === 'user@projectnotes.local');
  if (residualUser) {
    console.log(`\nRemovendo usuário residual user@projectnotes.local (${residualUser.id})...`);
    await prisma.tagConfig.deleteMany({ where: { userId: residualUser.id } });
    await prisma.project.deleteMany({ where: { userId: residualUser.id } });
    await prisma.user.delete({ where: { id: residualUser.id } });
    console.log(`✅ Usuário user@projectnotes.local excluído permanentemente.`);
  }

  // 4. Verificação final de integridade de filipe
  const filipeFinal = await prisma.user.findUnique({
    where: { id: filipe.id },
    include: {
      _count: {
        select: {
          projects: true,
          tagConfigs: true
        }
      },
      projects: {
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              tasks: true,
              notes: true
            }
          }
        }
      }
    }
  });

  console.log("\n=== STATUS FINAL DO USUÁRIO FILIPE ===");
  console.log(JSON.stringify(filipeFinal, null, 2));

  const allRemainingUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  console.log("\nUsuários restantes no banco:", allRemainingUsers);
}

main().catch(console.error).finally(() => prisma.$disconnect());
