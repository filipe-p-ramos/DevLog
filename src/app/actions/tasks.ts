"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getUserId } from "./auth";

export async function getTasks(projectId: string) {
  const userId = await getUserId();
  
  // Verificar se o projeto pertence ao usuário
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId }
  });
  
  if (!project) return [];

  return await prisma.task.findMany({
    where: { projectId },
    include: {
      logs: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createTask(projectId: string, title: string, description: string = "", tags: string[] = [], attachments: string[] = []) {
  const userId = await getUserId();

  // Verificar posse
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId }
  });

  if (!project) throw new Error("Acesso negado");

  await prisma.task.create({
    data: {
      title,
      description,
      projectId,
      tags,
      attachments,
    },
  });
  revalidatePath("/");
}

export async function updateTaskStatus(id: string, status: string) {
  await prisma.task.update({
    where: { id },
    data: { status },
  });
  revalidatePath("/");
}

export async function updateTask(id: string, title: string, description: string, tags: string[]) {
  await prisma.task.update({
    where: { id },
    data: { title, description, tags },
  });
  revalidatePath("/");
}

export async function deleteTask(id: string) {
  await prisma.task.delete({
    where: { id },
  });
  revalidatePath("/");
}

export async function createLog(taskId: string, content: string, type: string = "note", attachments: string[] = []) {
  console.log(`[DEBUG] createLog chamada para taskId: ${taskId}`);

  await prisma.$transaction([
    prisma.log.create({
      data: {
        content,
        type,
        taskId,
        attachments,
      },
    }),
    prisma.task.update({
      where: { id: taskId },
      data: { updatedAt: new Date() },
    }),
  ]);
  revalidatePath("/");
}

export async function updateLog(id: string, content: string) {
  const log = await prisma.log.update({
    where: { id },
    data: { content },
    select: { taskId: true },
  });
  
  await prisma.task.update({
    where: { id: log.taskId },
    data: { updatedAt: new Date() },
  });

  revalidatePath("/");
}

export async function deleteLog(id: string) {
  const log = await prisma.log.delete({
    where: { id },
    select: { taskId: true },
  });

  await prisma.task.update({
    where: { id: log.taskId },
    data: { updatedAt: new Date() },
  });

  revalidatePath("/");
}
