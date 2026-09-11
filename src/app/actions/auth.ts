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

export async function changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
  try {
    const userId = await getUserId();

    if (!currentPassword || !newPassword || !confirmPassword) {
      return { success: false, error: "Preencha todos os campos obrigatórios." };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, error: "A nova senha e a confirmação não coincidem." };
    }

    if (newPassword.length < 4) {
      return { success: false, error: "A nova senha deve ter no mínimo 4 caracteres." };
    }

    // Buscar usuário e hash atual
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true }
    });

    if (!user || !user.password) {
      return { success: false, error: "Usuário não encontrado." };
    }

    // Validar senha atual com bcrypt resistente a timing attacks
    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      return { success: false, error: "A senha atual informada está incorreta." };
    }

    // Gerar novo hash com salt fator 10
    const salt = await bcrypt.genSalt(10);
    const newHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { password: newHash }
    });

    return { success: true, message: "Senha alterada com sucesso!" };
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    return { success: false, error: "Ocorreu um erro interno ao processar a solicitação." };
  }
}

