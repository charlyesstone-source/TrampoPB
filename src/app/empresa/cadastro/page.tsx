"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PasswordInput } from "@/components/password-input";
import { SubHead } from "@/components/sub-head";
import { useApp } from "@/context/app-context";
import { cadastrarEmpresa } from "@/lib/auth";

export default function EmpresaCadastroPage() {
  const router = useRouter();
  const { empresa, mostrarToast, temSupabase } = useApp();
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const aoEnviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro(null);
    const f = new FormData(e.currentTarget);
    if (!temSupabase) {
      setErro("Configure o Supabase (.env.local) para criar a conta.");
      return;
    }
    setEnviando(true);
    try {
      await cadastrarEmpresa({
        email: (f.get("email") as string).trim(),
        senha: f.get("senha") as string,
        nome: (f.get("nome") as string).trim(),
      });
      mostrarToast("Conta da empresa criada ✓");
      router.push("/anunciar");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível criar a conta.");
      setEnviando(false);
    }
  };

  return (
    <section className="view">
      <div className="pad">
        <SubHead
          titulo="Conta da empresa"
          sub="Crie sua conta para anunciar vagas."
          voltarPara="/"
        />
        <form onSubmit={aoEnviar}>
          <div className="field">
            <label htmlFor="nome">Nome da empresa</label>
            <input
              className="in"
              id="nome"
              name="nome"
              required
              placeholder="Ex.: Supermercado Mangabeira"
              defaultValue={empresa.nome}
            />
          </div>
          <div className="field">
            <label htmlFor="email">E-mail</label>
            <input
              className="in"
              id="email"
              name="email"
              type="email"
              required
              placeholder="rh@suaempresa.com.br"
              defaultValue={empresa.email}
            />
          </div>
          <div className="field">
            <label htmlFor="senha">Senha de acesso</label>
            <PasswordInput id="senha" placeholder="Crie uma senha" required />
          </div>

          {erro && <p className="form-erro">{erro}</p>}

          <button className="submit" type="submit" disabled={enviando}>
            {enviando ? "Criando…" : "Criar conta e anunciar"}
          </button>
          <div className="form-alt">
            Já tem conta? <Link href="/empresa/entrar">Entrar</Link>
          </div>
        </form>
      </div>
    </section>
  );
}
