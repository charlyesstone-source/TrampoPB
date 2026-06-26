"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SubHead } from "@/components/sub-head";
import { useApp } from "@/context/app-context";
import {
  atualizarStatusCandidaturaDb,
  getCandidaturaById,
  type CandidaturaPainel,
} from "@/lib/db";
import { iniciais } from "@/lib/mock-data";
import type { StatusCandidatura } from "@/lib/types";

const STATUS_LABEL: Record<StatusCandidatura, string> = {
  novo: "Novo",
  analise: "Em análise",
  contratado: "Contratado",
};
const CICLO: StatusCandidatura[] = ["novo", "analise", "contratado"];

export default function CurriculoCompletoPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { empresa, carregandoSessao, mostrarToast } = useApp();

  const [cand, setCand] = useState<CandidaturaPainel | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (carregandoSessao) return;
    if (!empresa.registrada || Number.isNaN(id)) {
      setCarregando(false);
      return;
    }
    getCandidaturaById(id)
      .then(setCand)
      .catch(() => mostrarToast("Não foi possível carregar o currículo."))
      .finally(() => setCarregando(false));
  }, [id, empresa.registrada, carregandoSessao, mostrarToast]);

  const avancarStatus = async () => {
    if (!cand) return;
    const prox = CICLO[(CICLO.indexOf(cand.status) + 1) % CICLO.length];
    const anterior = cand.status;
    setCand({ ...cand, status: prox });
    try {
      await atualizarStatusCandidaturaDb(cand.id, prox);
      mostrarToast("Status: " + STATUS_LABEL[prox]);
    } catch {
      setCand({ ...cand, status: anterior });
      mostrarToast("Não foi possível mudar o status.");
    }
  };

  const fone = cand?.whatsapp.replace(/\D/g, "") ?? "";

  return (
    <section className="view">
      <div className="pad">
        <SubHead
          titulo="Currículo"
          sub={cand ? `Candidatura para ${cand.vagaTitulo}` : "Currículo do candidato"}
          voltarPara="/candidaturas"
        />

        {carregando ? (
          <div className="empty">
            <b>Carregando…</b>
          </div>
        ) : !empresa.registrada ? (
          <div className="empty">
            <b>Acesso restrito ao anunciante.</b>
            Entre como empresa para ver o currículo de quem se candidatou.
          </div>
        ) : !cand ? (
          <div className="empty">
            <b>Currículo não encontrado.</b>
            Esta candidatura não existe ou não é de uma vaga sua.
          </div>
        ) : (
          <>
            <div className="profhead">
              <div className="big">{iniciais(cand.nome || "??")}</div>
              <div>
                <div className="name">{cand.nome || "Candidato"}</div>
                <div className="sub">
                  {[cand.area, cand.bairro].filter(Boolean).join(" • ") || "—"}
                </div>
              </div>
            </div>

            <div className="meta" style={{ marginTop: 14 }}>
              <span className="tag">Candidatou-se {cand.quando}</span>
              <span className={`status ${cand.status}`} style={{ cursor: "default" }}>
                {STATUS_LABEL[cand.status]}
              </span>
            </div>

            <div className="cv-actions">
              <a
                className="btn-cta wa"
                href={`https://wa.me/55${fone}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Chamar no WhatsApp
              </a>
              <a className="btn-cta mail" href={`mailto:${cand.email}`}>
                Enviar e-mail
              </a>
            </div>

            <div className="block">
              <h4>Contato</h4>
              <ul>
                <li>WhatsApp: {cand.whatsapp || "—"}</li>
                <li>E-mail: {cand.email || "—"}</li>
              </ul>
            </div>

            <div className="block">
              <h4>Sobre</h4>
              <p className="pre-wrap">{cand.sobre || "Não informado."}</p>
            </div>

            <div className="block">
              <h4>Experiência</h4>
              <p className="pre-wrap">
                {cand.experiencia.trim() ? cand.experiencia : "Não informada."}
              </p>
            </div>

            <button type="button" className="submit" onClick={avancarStatus}>
              Avançar status (atual: {STATUS_LABEL[cand.status]})
            </button>
            <p className="pay-note">
              O candidato autorizou o envio destes dados para contato sobre a vaga.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
