"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getTasks(projectId: string) {
  return await prisma.task.findMany({
    where: { projectId },
    include: {
      logs: {
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createTask(projectId: string, title: string, tags: string[] = [], attachments: string[] = []) {
  await prisma.task.create({
    data: {
      title,
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

export async function updateTask(id: string, title: string, tags: string[]) {
  await prisma.task.update({
    where: { id },
    data: { title, tags },
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
  await prisma.log.create({
    data: {
      content,
      type,
      taskId,
      attachments,
    },
  });
  revalidatePath("/");
}
