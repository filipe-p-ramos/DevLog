"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

import { getUserId } from "./auth";

export async function getProjects() {
  const userId = await getUserId();
  
  return await prisma.project.findMany({
    where: { userId },
    include: {
      _count: {
        select: { tasks: { where: { status: { not: "completed" } } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProject(name: string, color: string = "#3b82f6") {
  const userId = await getUserId();
  await prisma.project.create({
    data: {
      name,
      color,
      userId,
    },
  });
  revalidatePath("/");
}

export async function updateProject(id: string, name: string, color: string) {
  await prisma.project.update({
    where: { id },
    data: { name, color },
  });
  revalidatePath("/");
}

export async function deleteProject(id: string) {
  await prisma.project.delete({
    where: { id },
  });
  revalidatePath("/");
}
