const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== INICIANDO MIGRAÇÃO: PADRONIZAÇÃO E UNIFICAÇÃO DE TAGS ===");

  // 1. Atualizar Tarefas (Task)
  const tasks = await prisma.task.findMany({
    select: { id: true, title: true, tags: true }
  });

  console.log(`\nVerificando ${tasks.length} tarefas...`);
  let tasksUpdatedCount = 0;

  for (const task of tasks) {
    const originalTags = task.tags || [];
    const normalizedTags = Array.from(
      new Set(
        originalTags
          .map(t => (typeof t === 'string' ? t.trim().toUpperCase() : ''))
          .filter(Boolean)
      )
    );

    const hasChanged =
      originalTags.length !== normalizedTags.length ||
      originalTags.some((tag, idx) => tag !== normalizedTags[idx]);

    if (hasChanged) {
      await prisma.task.update({
        where: { id: task.id },
        data: { tags: normalizedTags }
      });
      tasksUpdatedCount++;
      console.log(`[Task Atualizada] "${task.title.substring(0, 30)}..." | De: [${originalTags.join(", ")}] -> Para: [${normalizedTags.join(", ")}]`);
    }
  }

  console.log(`✅ Total de tarefas atualizadas com sucesso: ${tasksUpdatedCount}`);

  // 2. Unificar e Padronizar TagConfig (Configuração de Cores)
  const tagConfigs = await prisma.tagConfig.findMany();
  console.log(`\nVerificando ${tagConfigs.length} configurações de tags...`);

  // Agrupar por userId e nome em maiúsculo
  const userTagMap = new Map(); // key: `${userId}:${nameUpper}`, value: array of configs

  for (const cfg of tagConfigs) {
    const upperName = cfg.name.trim().toUpperCase();
    const key = `${cfg.userId}:${upperName}`;
    if (!userTagMap.has(key)) {
      userTagMap.set(key, []);
    }
    userTagMap.get(key).push(cfg);
  }

  let configsUpdated = 0;
  let configsDeleted = 0;

  for (const [key, configs] of userTagMap.entries()) {
    const [userId, upperName] = key.split(":");

    if (configs.length === 1) {
      const single = configs[0];
      if (single.name !== upperName) {
        await prisma.tagConfig.update({
          where: { id: single.id },
          data: { name: upperName }
        });
        configsUpdated++;
        console.log(`[TagConfig Padronizada] "${single.name}" -> "${upperName}"`);
      }
    } else {
      // Mais de uma configuração para o mesmo nome (ex: URGENTE e Urgente)
      // Escolher a primeira que já estiver em maiúsculo ou a primeira da lista
      const canonical = configs.find(c => c.name === upperName) || configs[0];
      const duplicates = configs.filter(c => c.id !== canonical.id);

      // Deletar duplicatas redundantes
      for (const dup of duplicates) {
        await prisma.tagConfig.delete({
          where: { id: dup.id }
        });
        configsDeleted++;
        console.log(`[TagConfig Duplicada Removida] ID: ${dup.id}, Nome anterior: "${dup.name}"`);
      }

      // Garantir que a canônica esteja com nome em maiúsculo
      if (canonical.name !== upperName) {
        await prisma.tagConfig.update({
          where: { id: canonical.id },
          data: { name: upperName }
        });
        configsUpdated++;
        console.log(`[TagConfig Canônica Atualizada] "${canonical.name}" -> "${upperName}"`);
      }
    }
  }

  console.log(`✅ Configurações de tags padronizadas: ${configsUpdated}, duplicadas removidas: ${configsDeleted}`);
  console.log("\n🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!");
}

main()
  .catch(err => {
    console.error("❌ Erro durante a migração:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
