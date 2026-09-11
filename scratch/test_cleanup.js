const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testGarbageCollection() {
  console.log('--- Testando Garbage Collection de TagConfigs ---');
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      console.log('Nenhum usuário encontrado.');
      return;
    }

    // Criar uma TagConfig de teste que não existe em nenhuma tarefa
    const dummyTag = 'TAG_TESTE_LIXO';
    await prisma.tagConfig.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: dummyTag
        }
      },
      update: { color: '#123456' },
      create: { name: dummyTag, color: '#123456', userId: user.id }
    });

    console.log(`TagConfig temporária criada: ${dummyTag}`);

    // Verificar se existe
    let check = await prisma.tagConfig.findFirst({
      where: { userId: user.id, name: dummyTag }
    });
    console.log('Existe antes da limpeza?', !!check);

    // Simular o cleanupOrphanTagConfigs
    const tasks = await prisma.task.findMany({
      where: { project: { userId: user.id } },
      select: { tags: true }
    });

    const activeTags = new Set(
      tasks.flatMap(t => t.tags.map(tag => tag.trim().toUpperCase())).filter(Boolean)
    );

    const configs = await prisma.tagConfig.findMany({
      where: { userId: user.id },
      select: { id: true, name: true }
    });

    const orphanIds = configs
      .filter(c => !activeTags.has(c.name.trim().toUpperCase()))
      .map(c => c.id);

    console.log(`Encontradas ${orphanIds.length} configs órfãs para remoção:`, orphanIds);

    if (orphanIds.length > 0) {
      await prisma.tagConfig.deleteMany({
        where: { id: { in: orphanIds } }
      });
    }

    // Verificar se foi apagada
    check = await prisma.tagConfig.findFirst({
      where: { userId: user.id, name: dummyTag }
    });
    console.log('Existe após a limpeza?', !!check);
    console.log('Teste concluído com sucesso!');
  } finally {
    await prisma.$disconnect();
  }
}

testGarbageCollection();
