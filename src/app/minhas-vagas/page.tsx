"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/context/app-context";
import { listarMinhasCandidaturas, type MinhaCandidatura } from "@/lib/db";
import type { StatusCandidatura } from "@/lib/types";

const STATUS_LABEL: Record<StatusCandidatura, string> = {
  novo: "Novo",
  analise: "Em análise",
  contratado: "Contratado",
};

export default function MinhasVagasPage() {
  const { candidato, empresa, carregandoSessao, abrirSheet, mostrarToast } = useApp();
  const [lista, setLista] = useState<MinhaCandidatura[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (carregandoSessao) return;
    if (!candidato.registrado) {
      setCarregando(false);
      return;
    }
    listarMinhasCandidaturas()
      .then(setLista)
      .catch(() => mostrarToast("Não foi possível carregar suas vagas."))
      .finally(() => setCarregando(false));
  }, [candidato.registrado, carregandoSessao, mostrarToast]);

  return (
    <section className="view">
      <div className="pad">
        <div className="greet" style={{ marginTop: 10 }}>
          Minhas vagas
          <small>As vagas a que você se candidatou.</small>
        </div>

        {carregandoSessao || carregando ? (
          <div className="empty">
            <b>Carregando…</b>
          </div>
        ) : empresa.registrada ? (
          <div className="empty">
            <b>Esta área é do candidato.</b>
            Você está com uma conta de empresa. Suas vagas e candidaturas ficam na aba
            Empresa.
          </div>
        ) : !candidato.registrado ? (
          <>
            <div className="empty">
              <b>Entre para ver suas candidaturas.</b>
              Inscreva-se como candidato e candidate-se às vagas — elas aparecem aqui.
            </div>
            <Link
              href="/curriculo"
              className="submit"
              style={{ display: "block", textAlign: "center", textDecoration: "none" }}
            >
              Inscrever-se
            </Link>
          </>
        ) : lista.length === 0 ? (
          <div className="empty">
            <b>Você ainda não se candidatou a nenhuma vaga.</b>
            Quando se candidatar, as vagas aparecem aqui com o status da sua
            candidatura.
          </div>
        ) : (
          <div className="list" style={{ marginTop: 16 }}>
            {lista.map((c, i) => {
              const conteudo = (
                <>
                  <div className="top">
                    <div>
                      <h3>{c.vagaTitulo}</h3>
                      <div className="co">{c.empresaNome || "Vaga não disponível"}</div>
                    </div>
                  </div>
                  {c.vagaAtiva && (
                    <div className="meta">
                      <span className="tag">📍 {c.bairro}</span>
                      <span className="tag sal">R$ {c.salario}</span>
                      <span className="tag muted">{c.tipo}</span>
                    </div>
                  )}
                  <div className="cfoot" style={{ marginTop: 12 }}>
                    <span className={`status ${c.statusCandidatura}`}>
                      {STATUS_LABEL[c.statusCandidatura]}
                    </span>
                    <span className="when" style={{ margin: 0, marginLeft: "auto" }}>
                      Candidatou-se {c.quando}
                    </span>
                  </div>
                </>
              );
              return c.vagaAtiva ? (
                <div
                  key={i}
                  className="card"
                  role="button"
                  tabIndex={0}
                  onClick={() => abrirSheet(c.vagaId)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      abrirSheet(c.vagaId);
                    }
                  }}
                >
                  {conteudo}
                </div>
              ) : (
                <div key={i} className="card" style={{ cursor: "default" }}>
                  {conteudo}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
