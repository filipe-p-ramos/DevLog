"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function loginWithPassword(formData: FormData) {
  const username = (formData.get("username") as string)?.trim();
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Credenciais inválidas" };
  }

  // Buscar o usuário no banco pelo username/email
  const user = await prisma.user.findUnique({
    where: { email: username.toLowerCase() },
  });

  // Se o usuário não existir ou não possuir hash configurado, rejeitar
  if (!user || !user.password) {
    return { error: "Credenciais inválidas" };
  }

  // Comparação criptográfica segura com bcrypt (resistente a timing attacks)
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return { error: "Credenciais inválidas" };
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
