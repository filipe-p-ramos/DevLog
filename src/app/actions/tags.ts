"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

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

export async function getTagConfigs() {
  const userId = await getDefaultUserId();
  return await prisma.tagConfig.findMany({
    where: { userId },
  });
}

export async function updateTagColor(name: string, color: string) {
  const userId = await getDefaultUserId();
  
  await prisma.tagConfig.upsert({
    where: {
      userId_name: {
        userId,
        name,
      },
    },
    update: {
      color,
    },
    create: {
      name,
      color,
      userId,
    },
  });
  
  revalidatePath("/");
}
