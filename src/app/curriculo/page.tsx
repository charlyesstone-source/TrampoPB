"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PasswordInput } from "@/components/password-input";
import { SubHead } from "@/components/sub-head";
import { useApp } from "@/context/app-context";
import { cadastrarCandidato } from "@/lib/auth";

export default function CurriculoPage() {
  const router = useRouter();
  const { candidato, atualizarCurriculo, mostrarToast, temSupabase } = useApp();
  const novo = !candidato.registrado;
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const aoEnviar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro(null);
    const f = new FormData(e.currentTarget);
    const txt = (k: string) => (f.get(k) as string)?.trim() ?? "";
    const extras = {
      whatsapp: txt("whatsapp"),
      area: txt("area"),
      bairro: txt("bairro"),
      sobre: txt("sobre"),
      experiencia: txt("experiencia"),
    };

    setEnviando(true);
    try {
      if (novo) {
        if (!temSupabase) {
          throw new Error("Configure o Supabase (.env.local) para criar a conta.");
        }
        await cadastrarCandidato({
          email: txt("email"),
          senha: txt("senha"),
          nome: txt("nome"),
        });
        await atualizarCurriculo(extras, { silencioso: true });
        mostrarToast("Inscrição concluída ✓ Bem-vindo(a)!");
      } else {
        await atualizarCurriculo({ nome: txt("nome"), ...extras });
      }
      router.push("/");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
      setEnviando(false);
    }
  };

  return (
    <section className="view">
      <div className="pad">
        <SubHead
          titulo={novo ? "Inscrição de candidato" : "Meu currículo"}
          sub={
            novo
              ? "Crie seu currículo para começar a se candidatar."
              : "É isto que a empresa recebe quando você se candidata."
          }
          voltarPara="/perfil"
        />

        <form onSubmit={aoEnviar}>
          <div className="field">
            <label htmlFor="nome">Nome completo</label>
            <input
              className="in"
              id="nome"
              name="nome"
              required
              defaultValue={candidato.nome}
            />
          </div>
          <div className="row2">
            <div className="field">
              <label htmlFor="whatsapp">WhatsApp</label>
              <input
                className="in"
                id="whatsapp"
                name="whatsapp"
                required
                inputMode="tel"
                defaultValue={candidato.whatsapp}
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
                defaultValue={candidato.email}
                readOnly={!novo}
              />
            </div>
          </div>

          {novo && (
            <div className="field">
              <label htmlFor="senha">Senha de acesso</label>
              <PasswordInput id="senha" placeholder="Crie uma senha" required />
            </div>
          )}

          <div className="row2">
            <div className="field">
              <label htmlFor="area">Área de interesse</label>
              <input
                className="in"
                id="area"
                name="area"
                defaultValue={candidato.area}
              />
            </div>
            <div className="field">
              <label htmlFor="bairro">Bairro</label>
              <input
                className="in"
                id="bairro"
                name="bairro"
                defaultValue={candidato.bairro}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="sobre">Sobre você</label>
            <textarea
              className="in"
              id="sobre"
              name="sobre"
              placeholder="Um resumo curto de quem você é profissionalmente."
              defaultValue={candidato.sobre}
            />
          </div>
          <div className="field">
            <label htmlFor="experiencia">Experiência (uma por linha)</label>
            <textarea
              className="in"
              id="experiencia"
              name="experiencia"
              placeholder={"Atendente em loja de varejo (2 anos)\nRecepção em clínica (1 ano)"}
              defaultValue={candidato.experiencia}
            />
          </div>

          {erro && <p className="form-erro">{erro}</p>}

          <button className="submit" type="submit" disabled={enviando}>
            {enviando
              ? "Salvando…"
              : novo
                ? "Concluir inscrição"
                : "Salvar currículo"}
          </button>

          {novo && (
            <div className="form-alt">
              Já tem conta? <Link href="/entrar">Entrar</Link>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
