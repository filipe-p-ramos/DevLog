"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";

export async function loginWithPassword(formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const envPassword = process.env.APP_PASSWORD || "123";

  // Por enquanto, todos os usuários usam a mesma senha global definida no .env
  if (password !== envPassword) {
    return { error: "Senha incorreta" };
  }

  // Verificar se o usuário existe no banco (usamos o campo email como username)
  const user = await prisma.user.findUnique({
    where: { email: username.toLowerCase() },
  });

  if (!user) {
    return { error: "Usuário não encontrado" };
  }

  const cookieStore = await cookies();
  cookieStore.set("auth_token", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  
  redirect("/");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  redirect("/login");
}

export async function getUserId() {
  const cookieStore = await cookies();
  const userId = cookieStore.get("auth_token")?.value;
  
  if (!userId) {
    throw new Error("Não autenticado");
  }
  
  return userId;
}
