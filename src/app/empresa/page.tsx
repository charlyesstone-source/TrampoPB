"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";

/** Área da empresa: hub com Meus anúncios e Candidaturas recebidas. */
export default function EmpresaHubPage() {
  const router = useRouter();
  const { empresa, carregandoSessao, sairConta } = useApp();

  return (
    <section className="view">
      <div className="pad">
        <div className="greet" style={{ marginTop: 10 }}>
          Empresa
          <small>Gerencie seus anúncios e candidaturas.</small>
        </div>

        {carregandoSessao ? (
          <div className="empty">
            <b>Carregando…</b>
          </div>
        ) : empresa.registrada ? (
          <>
            <div className="biz-bar">
              Conectado como <b>{empresa.nome}</b> ·{" "}
              <a
                onClick={async () => {
                  await sairConta();
                  router.push("/");
                }}
              >
                Sair
              </a>
            </div>
            <div className="menu" style={{ marginTop: 16 }}>
              <Link href="/anunciar">
                Anunciar nova vaga <span>›</span>
              </Link>
              <Link href="/anuncios">
                Meus anúncios <span>›</span>
              </Link>
              <Link href="/candidaturas">
                Candidaturas recebidas <span>›</span>
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="demo-note" style={{ textAlign: "left", margin: "16px 0 0" }}>
              Esta é a área das empresas anunciantes. Crie uma conta de empresa para
              publicar vagas e receber candidaturas.
            </p>
            <button
              type="button"
              className="submit"
              onClick={() => router.push("/empresa/cadastro")}
            >
              Criar conta de empresa
            </button>
            <div className="form-alt">
              Já tem conta? <Link href="/empresa/entrar">Entrar</Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
