"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function loginWithPassword(prevStateOrFormData: any, maybeFormData?: FormData) {
  const formData = (maybeFormData && typeof (maybeFormData as any).get === "function")
    ? maybeFormData
    : (prevStateOrFormData && typeof (prevStateOrFormData as any).get === "function")
      ? (prevStateOrFormData as FormData)
      : null;

  if (!formData) {
    return { error: "Credenciais inválidas" };
  }

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
    redirect("/login");
  }

  // Validar se o usuário existe no banco de dados (previne sessões presas com usuários purgados)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    redirect("/login?reset=1");
  }
  
  return user.id;
}
