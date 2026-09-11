"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

import { getUserId } from "./auth";

export async function getTagConfigs() {
  const userId = await getUserId();
  return await prisma.tagConfig.findMany({
    where: { userId },
  });
}

export async function updateTagColor(name: string, color: string) {
  const userId = await getUserId();
  const normalizedName = name.trim().toUpperCase();
  if (!normalizedName) return;
  
  await prisma.tagConfig.upsert({
    where: {
      userId_name: {
        userId,
        name: normalizedName,
      },
    },
    update: {
      color,
    },
    create: {
      name: normalizedName,
      color,
      userId,
    },
  });
  
  revalidatePath("/");
}


export async function cleanupOrphanTagConfigs(userId: string) {
  try {
    // 1. Coletar todas as tags ativas de todas as tarefas de projetos do usuário
    const tasks = await prisma.task.findMany({
      where: {
        project: { userId }
      },
      select: { tags: true }
    });

    const activeTags = new Set(
      tasks.flatMap(t => t.tags.map(tag => tag.trim().toUpperCase())).filter(Boolean)
    );

    // 2. Buscar todas as TagConfig salvas para o usuário
    const configs = await prisma.tagConfig.findMany({
      where: { userId },
      select: { id: true, name: true }
    });

    // 3. Excluir configurações cujas tags não pertencem mais a nenhuma tarefa
    const orphanIds = configs
      .filter(c => !activeTags.has(c.name.trim().toUpperCase()))
      .map(c => c.id);

    if (orphanIds.length > 0) {
      await prisma.tagConfig.deleteMany({
        where: { id: { in: orphanIds } }
      });
    }
  } catch (err) {
    console.error("Erro ao executar cleanupOrphanTagConfigs:", err);
  }
}

export async function deleteTag(projectId: string, tagName: string) {
  const userId = await getUserId();
  const normalized = tagName.trim().toUpperCase();
  if (!normalized) return;

  // Verificar posse do projeto
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId }
  });
  if (!project) throw new Error("Acesso negado");

  // Buscar tarefas que contêm a tag no projeto
  const tasks = await prisma.task.findMany({
    where: {
      projectId,
      tags: { has: normalized }
    },
    select: { id: true, tags: true }
  });

  // Remover a tag de cada tarefa encontrada
  for (const task of tasks) {
    const updatedTags = task.tags.filter(
      t => t.trim().toUpperCase() !== normalized
    );
    await prisma.task.update({
      where: { id: task.id },
      data: { tags: updatedTags }
    });
  }

  // Executar Garbage Collection em TagConfig
  await cleanupOrphanTagConfigs(userId);

  revalidatePath("/");
}

