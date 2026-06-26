"use client";

import { useState, type FormEvent } from "react";
import { SubHead } from "@/components/sub-head";
import { useApp } from "@/context/app-context";
import { recuperarSenha } from "@/lib/auth";

export default function EsqueciSenhaPage() {
  const { temSupabase } = useApp();
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const aoEnviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro(null);
    const email = (new FormData(e.currentTarget).get("email") as string).trim();
    if (!temSupabase) {
      setErro("Configure o Supabase (.env.local) para recuperar a senha.");
      return;
    }
    setEnviando(true);
    try {
      await recuperarSenha(email);
      setEnviado(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="view">
      <div className="pad">
        <SubHead
          titulo="Recuperar senha"
          sub="Enviaremos um link de redefinição para o seu e-mail."
          voltarPara="/entrar"
        />
        {enviado ? (
          <p className="form-ok">
            Se existir uma conta com esse e-mail, enviamos um link para redefinir a
            senha. Confira sua caixa de entrada (e o spam).
          </p>
        ) : (
          <form onSubmit={aoEnviar}>
            <div className="field">
              <label htmlFor="email">E-mail da conta</label>
              <input
                className="in"
                id="email"
                name="email"
                type="email"
                required
                placeholder="seu@email.com"
              />
            </div>
            {erro && <p className="form-erro">{erro}</p>}
            <button className="submit" type="submit" disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar link de recuperação"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
