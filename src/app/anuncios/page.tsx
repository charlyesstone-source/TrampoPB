"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SubHead } from "@/components/sub-head";
import { useApp } from "@/context/app-context";
import { VALIDADE_DIAS } from "@/lib/config";
import {
  encerrarVaga,
  excluirVaga,
  listarMinhasVagas,
  type VagaGerenciada,
} from "@/lib/db";
import type { StatusVaga } from "@/lib/types";

const STATUS_LABEL: Record<StatusVaga, string> = {
  rascunho: "Rascunho",
  aguardando_pagamento: "Aguardando pagamento",
  ativa: "No ar",
  expirada: "Encerrada",
};

export default function MeusAnunciosPage() {
  const router = useRouter();
  const { empresa, carregandoSessao, recarregarVagas, mostrarToast } = useApp();
  const [vagas, setVagas] = useState<VagaGerenciada[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState<number | null>(null);

  const carregar = () => {
    listarMinhasVagas()
      .then(setVagas)
      .catch(() => mostrarToast("Não foi possível carregar seus anúncios."))
      .finally(() => setCarregando(false));
  };

  useEffect(() => {
    if (carregandoSessao) return;
    if (!empresa.registrada) {
      setCarregando(false);
      return;
    }
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresa.registrada, carregandoSessao]);

  const aoEncerrar = async (id: number) => {
    if (!window.confirm("Encerrar esta vaga? Ela sai do ar e para de receber candidatos. As candidaturas já recebidas continuam no painel.")) return;
    setOcupado(id);
    try {
      await encerrarVaga(id);
      mostrarToast("Vaga encerrada ✓");
      carregar();
      await recarregarVagas();
    } catch {
      mostrarToast("Não foi possível encerrar.");
    } finally {
      setOcupado(null);
    }
  };

  const aoExcluir = async (id: number) => {
    if (!window.confirm("Excluir esta vaga definitivamente? Isso remove também todas as candidaturas recebidas. Esta ação não pode ser desfeita.")) return;
    setOcupado(id);
    try {
      await excluirVaga(id);
      mostrarToast("Vaga excluída ✓");
      carregar();
      await recarregarVagas();
    } catch {
      mostrarToast("Não foi possível excluir.");
    } finally {
      setOcupado(null);
    }
  };

  return (
    <section className="view">
      <div className="pad">
        <SubHead
          titulo="Meus anúncios"
          sub="Gerencie suas vagas: encerre quando preencher ou exclua."
          voltarPara="/perfil"
        />

        {!empresa.registrada && !carregandoSessao ? (
          <>
            <div className="empty">
              <b>Entre como empresa para ver seus anúncios.</b>
              Aqui você acompanha e gerencia as vagas que publicou.
            </div>
            <button
              type="button"
              className="submit"
              onClick={() => router.push("/empresa/entrar")}
            >
              Entrar como empresa
            </button>
          </>
        ) : carregando ? (
          <div className="empty">
            <b>Carregando…</b>
          </div>
        ) : vagas.length === 0 ? (
          <>
            <div className="empty">
              <b>Você ainda não tem anúncios.</b>
              Publique sua primeira vaga para começar a receber candidatos.
            </div>
            <Link href="/anunciar" className="submit" style={{ display: "block", textAlign: "center", textDecoration: "none" }}>
              Anunciar vaga
            </Link>
          </>
        ) : (
          <div style={{ marginTop: 8 }}>
            {vagas.map((v) => (
              <div className="anuncio" key={v.id}>
                <div className="a-top">
                  <div>
                    <div className="a-tit">{v.titulo}</div>
                    <div className="a-meta">
                      📍 {v.bairro} • R$ {v.salario} • {v.tipo}
                    </div>
                  </div>
                  <span className={`a-status ${v.status}`}>
                    {STATUS_LABEL[v.status]}
                  </span>
                </div>

                <div className="a-info">
                  {v.nCandidaturas} candidatura(s)
                  {v.status === "ativa" && v.validadeDias != null
                    ? ` • expira em ${v.validadeDias} dia(s)`
                    : v.status === "aguardando_pagamento"
                      ? " • aguardando confirmação do pagamento"
                      : ""}
                </div>

                <div className="a-acoes">
                  {v.nCandidaturas > 0 && (
                    <Link className="btn-mini" href="/candidaturas">
                      Ver candidaturas
                    </Link>
                  )}
                  {v.status === "ativa" && (
                    <button
                      type="button"
                      className="btn-mini primary"
                      disabled={ocupado === v.id}
                      onClick={() => aoEncerrar(v.id)}
                    >
                      Encerrar (preenchida)
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-mini danger"
                    disabled={ocupado === v.id}
                    onClick={() => aoExcluir(v.id)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}

            <Link
              href="/anunciar"
              className="submit"
              style={{ display: "block", textAlign: "center", textDecoration: "none", marginTop: 18 }}
            >
              Anunciar nova vaga
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
