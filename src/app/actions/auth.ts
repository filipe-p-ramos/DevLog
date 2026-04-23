"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function loginWithPassword(formData: FormData) {
  const password = formData.get("password") as string;
  const envPassword = process.env.APP_PASSWORD || "123";

  if (password === envPassword) {
    const cookieStore = await cookies();
    cookieStore.set("auth_token", "authenticated", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
    
    redirect("/");
  }

  return { error: "Senha incorreta" };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  redirect("/login");
}
