"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PasswordInput } from "@/components/password-input";
import { SubHead } from "@/components/sub-head";
import { useApp } from "@/context/app-context";
import { entrarComoPapel } from "@/lib/auth";

export default function EntrarPage() {
  const router = useRouter();
  const { mostrarToast, temSupabase } = useApp();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const aoEnviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro(null);
    const f = new FormData(e.currentTarget);
    if (!temSupabase) {
      setErro("Configure o Supabase (.env.local) para entrar.");
      return;
    }
    setEnviando(true);
    try {
      await entrarComoPapel({
        email: (f.get("email") as string).trim(),
        senha: f.get("senha") as string,
        papelEsperado: "candidato",
      });
      mostrarToast("Login realizado ✓");
      router.push("/");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível entrar.");
      setEnviando(false);
    }
  };

  return (
    <section className="view">
      <div className="pad">
        <SubHead titulo="Entrar" sub="Acesse sua conta de candidato." voltarPara="/" />
        <form onSubmit={aoEnviar}>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              className="in"
              id="email"
              name="email"
              type="email"
              required
              placeholder="seu@email.com"
            />
          </div>
          <div className="field">
            <label htmlFor="senha">Senha</label>
            <PasswordInput id="senha" placeholder="Sua senha" required />
          </div>

          {erro && <p className="form-erro">{erro}</p>}

          <button className="submit" type="submit" disabled={enviando}>
            {enviando ? "Entrando…" : "Entrar"}
          </button>
          <div className="form-alt" style={{ marginTop: 12 }}>
            <Link href="/entrar/esqueci">Esqueci minha senha</Link>
          </div>
          <div className="form-alt">
            Não tem conta? <Link href="/curriculo">Inscreva-se</Link>
          </div>
        </form>
      </div>
    </section>
  );
}
