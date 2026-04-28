"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getUserId } from "./auth";

export async function getNotes(projectId: string) {
  const userId = await getUserId();
  
  // Verificar posse do projeto
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId }
  });
  
  if (!project) return [];

  return await prisma.note.findMany({
    where: { projectId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createNote(projectId: string, content: string) {
  const userId = await getUserId();

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId }
  });

  if (!project) throw new Error("Acesso negado");

  await prisma.note.create({
    data: {
      content,
      projectId,
    },
  });
  revalidatePath("/");
}

export async function updateNote(id: string, content: string) {
  await prisma.note.update({
    where: { id },
    data: { content },
  });
  revalidatePath("/");
}

export async function deleteNote(id: string) {
  await prisma.note.delete({
    where: { id },
  });
  revalidatePath("/");
}
