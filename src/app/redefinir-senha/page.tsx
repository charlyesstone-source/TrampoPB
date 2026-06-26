"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PasswordInput } from "@/components/password-input";
import { SubHead } from "@/components/sub-head";
import { useApp } from "@/context/app-context";
import { definirNovaSenha } from "@/lib/auth";

/**
 * Aberta a partir do link enviado por e-mail. O Supabase cria uma sessão de
 * recuperação ao abrir o link; aqui o usuário define a nova senha.
 */
export default function RedefinirSenhaPage() {
  const router = useRouter();
  const { mostrarToast, temSupabase } = useApp();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const aoEnviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro(null);
    const f = new FormData(e.currentTarget);
    const senha = f.get("senha") as string;
    const confirma = f.get("confirma") as string;
    if (senha !== confirma) {
      setErro("As senhas não coincidem.");
      return;
    }
    if (!temSupabase) {
      setErro("Configure o Supabase (.env.local) para redefinir a senha.");
      return;
    }
    setEnviando(true);
    try {
      await definirNovaSenha(senha);
      mostrarToast("Senha redefinida ✓ Faça login.");
      router.push("/entrar");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível redefinir.");
      setEnviando(false);
    }
  };

  return (
    <section className="view">
      <div className="pad">
        <SubHead
          titulo="Nova senha"
          sub="Defina uma nova senha para a sua conta."
          voltarPara="/entrar"
        />
        <form onSubmit={aoEnviar}>
          <div className="field">
            <label htmlFor="senha">Nova senha</label>
            <PasswordInput id="senha" placeholder="Crie uma nova senha" required />
          </div>
          <div className="field">
            <label htmlFor="confirma">Confirmar senha</label>
            <PasswordInput id="confirma" placeholder="Repita a nova senha" required />
          </div>
          {erro && <p className="form-erro">{erro}</p>}
          <button className="submit" type="submit" disabled={enviando}>
            {enviando ? "Salvando…" : "Redefinir senha"}
          </button>
        </form>
      </div>
    </section>
  );
}
