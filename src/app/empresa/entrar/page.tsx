"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PasswordInput } from "@/components/password-input";
import { SubHead } from "@/components/sub-head";
import { useApp } from "@/context/app-context";
import { entrarComoPapel } from "@/lib/auth";

export default function EmpresaLoginPage() {
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
        papelEsperado: "empresa",
      });
      mostrarToast("Login da empresa ✓");
      router.push("/anunciar");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível entrar.");
      setEnviando(false);
    }
  };

  return (
    <section className="view">
      <div className="pad">
        <SubHead
          titulo="Entrar — empresa"
          sub="Acesse sua conta para gerenciar suas vagas."
          voltarPara="/"
        />
        <form onSubmit={aoEnviar}>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              className="in"
              id="email"
              name="email"
              type="email"
              required
              placeholder="rh@suaempresa.com.br"
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
            Não tem conta? <Link href="/empresa/cadastro">Criar conta</Link>
          </div>
        </form>
      </div>
    </section>
  );
}
