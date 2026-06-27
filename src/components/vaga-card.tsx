"use client";

import { useApp } from "@/context/app-context";
import { corLogo } from "@/lib/mock-data";
import type { Vaga } from "@/lib/types";

/** Card de vaga do feed/busca. Abre o sheet de detalhe ao tocar. */
export function VagaCard({ vaga }: { vaga: Vaga }) {
  const { candidaturasEnviadas, abrirSheet } = useApp();
  const candidatou = candidaturasEnviadas.has(vaga.id);

  return (
    <div
      className="card"
      role="button"
      tabIndex={0}
      onClick={() => abrirSheet(vaga.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrirSheet(vaga.id);
        }
      }}
      aria-label={`Ver vaga: ${vaga.titulo} na ${vaga.empresa}`}
    >
      <div className="top">
        <div className="logo" style={{ background: corLogo(vaga.id) }}>
          {vaga.empresa[0]}
        </div>
        <div>
          <h3>{vaga.titulo}</h3>
          <div className="co">{vaga.empresa}</div>
        </div>
      </div>
      <div className="meta">
        <span className="tag">📍 {vaga.bairro}</span>
        <span className="tag sal">R$ {vaga.salario}</span>
        <span className="tag muted">{vaga.tipo}</span>
      </div>
      <div className="when">
        {vaga.publicadaHa}
        {candidatou && <span className="sent"> • Candidatura enviada</span>}
      </div>
    </div>
  );
}

/** Lista de vagas com mensagem de vazio. */
export function ListaVagas({
  vagas,
  vazioTitulo,
  vazioSub,
}: {
  vagas: Vaga[];
  vazioTitulo: string;
  vazioSub?: string;
}) {
  if (vagas.length === 0) {
    return (
      <div className="empty">
        <b>{vazioTitulo}</b>
        {vazioSub}
      </div>
    );
  }
  return (
    <div className="list">
      {vagas.map((v) => (
        <VagaCard key={v.id} vaga={v} />
      ))}
    </div>
  );
}
