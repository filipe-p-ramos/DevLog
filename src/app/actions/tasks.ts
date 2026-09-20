"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getUserId } from "./auth";
import { cleanupOrphanTagConfigs } from "./tags";


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
      subtasks: {
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

function sanitizeTags(tags: string[] = []): string[] {
  return Array.from(
    new Set(
      tags
        .map(t => (typeof t === "string" ? t.trim().toUpperCase() : ""))
        .filter(Boolean)
    )
  );
}

export async function createTask(projectId: string, title: string, description: string = "", tags: string[] = [], attachments: string[] = []) {
  const userId = await getUserId();

  // Verificar posse
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId }
  });

  if (!project) throw new Error("Acesso negado");

  const cleanTags = sanitizeTags(tags);

  await prisma.task.create({
    data: {
      title,
      description,
      projectId,
      tags: cleanTags,
      attachments,
    },
  });
  revalidatePath("/");
}

export async function updateTaskStatus(id: string, status: string, conclusionNote?: string | null) {
  const isCompleted = status === "completed";
  await prisma.task.update({
    where: { id },
    data: {
      status,
      completedAt: isCompleted ? new Date() : null,
      conclusionNote: isCompleted
        ? (conclusionNote !== undefined ? (conclusionNote?.trim() || null) : undefined)
        : undefined,
      updatedAt: new Date(),
    },
  });
  revalidatePath("/");
}

export async function updateTaskConclusionNote(id: string, conclusionNote: string) {
  const cleanNote = conclusionNote.trim();
  await prisma.task.update({
    where: { id },
    data: {
      conclusionNote: cleanNote || null,
      updatedAt: new Date(),
    },
  });
  revalidatePath("/");
}

export async function updateTask(id: string, title: string, description: string, tags: string[]) {
  const userId = await getUserId();
  const cleanTags = sanitizeTags(tags);

  await prisma.task.update({
    where: { id },
    data: { title, description, tags: cleanTags },
  });

  await cleanupOrphanTagConfigs(userId);
  revalidatePath("/");
}

export async function deleteTask(id: string) {
  const userId = await getUserId();
  await prisma.task.delete({
    where: { id },
  });

  await cleanupOrphanTagConfigs(userId);
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

export async function createSubtask(taskId: string, title: string) {
  const cleanTitle = title.trim();
  if (!cleanTitle) return;

  await prisma.$transaction([
    prisma.subtask.create({
      data: {
        taskId,
        title: cleanTitle,
      },
    }),
    prisma.task.update({
      where: { id: taskId },
      data: { updatedAt: new Date() },
    }),
  ]);

  revalidatePath("/");
}

export async function toggleSubtask(id: string, completed: boolean, resolutionNote?: string | null) {
  const subtask = await prisma.subtask.update({
    where: { id },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
      resolutionNote: completed ? (resolutionNote?.trim() || null) : resolutionNote,
    },
    select: { taskId: true },
  });

  await prisma.task.update({
    where: { id: subtask.taskId },
    data: { updatedAt: new Date() },
  });

  revalidatePath("/");
}

export async function updateSubtask(id: string, title: string, resolutionNote?: string | null) {
  const cleanTitle = title.trim();
  if (!cleanTitle) return;

  const subtask = await prisma.subtask.update({
    where: { id },
    data: {
      title: cleanTitle,
      resolutionNote: resolutionNote !== undefined ? (resolutionNote?.trim() || null) : undefined,
    },
    select: { taskId: true },
  });

  await prisma.task.update({
    where: { id: subtask.taskId },
    data: { updatedAt: new Date() },
  });

  revalidatePath("/");
}

export async function deleteSubtask(id: string) {
  const subtask = await prisma.subtask.delete({
    where: { id },
    select: { taskId: true },
  });

  await prisma.task.update({
    where: { id: subtask.taskId },
    data: { updatedAt: new Date() },
  });

  revalidatePath("/");
}

