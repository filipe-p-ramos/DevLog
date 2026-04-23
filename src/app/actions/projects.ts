"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Pegar ou criar usuário padrão para o sistema simples
async function getDefaultUserId() {
  const user = await prisma.user.findFirst();
  if (user) return user.id;

  const newUser = await prisma.user.create({
    data: {
      email: "user@projectnotes.local",
    },
  });
  return newUser.id;
}

export async function getProjects() {
  return await prisma.project.findMany({
    include: {
      _count: {
        select: { tasks: { where: { status: { not: "completed" } } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createProject(name: string, color: string = "#3b82f6") {
  const userId = await getDefaultUserId();
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
