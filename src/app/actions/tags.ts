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
