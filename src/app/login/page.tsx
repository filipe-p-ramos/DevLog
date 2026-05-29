"use client";

import { useActionState } from "react";
import { loginWithPassword } from "../actions/auth";
import { LockKeyhole, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [state, action, isPending] = useActionState(
    async (prevState: any, formData: FormData) => {
      return await loginWithPassword(formData);
    },
    null
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111111] p-4 font-sans text-[#ededed]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#1a1a1a] border border-[#333333] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl overflow-hidden">
            <img 
              src="/logo-devlog.png" 
              alt="Logo DevLog" 
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Project Notes</h1>
          <p className="text-[#888888]">Acesso restrito. Insira a senha do sistema.</p>
        </div>

        <form action={action} className="bg-[#1a1a1a] border border-[#333333] rounded-2xl p-8 shadow-2xl">
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#aaaaaa] mb-2" htmlFor="username">
              Nome de Usuário
            </label>
            <input
              type="text"
              id="username"
              name="username"
              autoFocus
              required
              className="w-full bg-[#111111] border border-[#333333] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl px-4 py-3 text-white placeholder-[#555] transition-all outline-none"
              placeholder="Usuário"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#aaaaaa] mb-2" htmlFor="password">
              Senha de Acesso
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              className="w-full bg-[#111111] border border-[#333333] focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 rounded-xl px-4 py-3 text-white placeholder-[#555] transition-all outline-none"
              placeholder="••••••••"
            />
            {state?.error && (
              <p className="text-red-400 text-sm mt-3 font-medium bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg text-center">
                {state.error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] border border-blue-500"
          >
            {isPending ? "Verificando..." : "Entrar no Workspace"}
            {!isPending && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
