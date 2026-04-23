"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function getNotes(projectId: string) {
  return await prisma.note.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createNote(projectId: string, content: string) {
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
