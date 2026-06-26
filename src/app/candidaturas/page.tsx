"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SubHead } from "@/components/sub-head";
import { useApp } from "@/context/app-context";
import {
  atualizarStatusCandidaturaDb,
  listarCandidaturasDaEmpresa,
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

export default function CandidaturasPage() {
  const router = useRouter();
  const { empresa, candidato, carregandoSessao, sairConta, mostrarToast } = useApp();
  const [lista, setLista] = useState<CandidaturaPainel[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (carregandoSessao) return;
    if (!empresa.registrada) {
      setCarregando(false);
      return;
    }
    listarCandidaturasDaEmpresa()
      .then(setLista)
      .catch(() => mostrarToast("Não foi possível carregar as candidaturas."))
      .finally(() => setCarregando(false));
  }, [empresa.registrada, carregandoSessao, mostrarToast]);

  // Não é anunciante: candidato logado ou visitante.
  if (!carregandoSessao && !empresa.registrada) {
    return (
      <section className="view">
        <div className="pad">
          <SubHead
            titulo="Candidaturas recebidas"
            sub="Área do anunciante."
            voltarPara={candidato.registrado ? "/perfil" : "/"}
          />
          <div className="empty">
            {candidato.registrado ? (
              <>
                <b>Você está conectado como candidato, não como anunciante.</b>
                Esta área é exclusiva para empresas. As candidaturas que você envia
                aparecem para a empresa dona da vaga.
              </>
            ) : (
              <>
                <b>Entre como empresa para ver as candidaturas.</b>
                Aqui o anunciante acompanha quem se candidatou às suas vagas.
              </>
            )}
          </div>
          <button
            type="button"
            className="submit"
            onClick={() => router.push("/empresa/entrar")}
          >
            Entrar como empresa
          </button>
        </div>
      </section>
    );
  }

  const ciclar = async (id: number, atual: StatusCandidatura) => {
    const prox = CICLO[(CICLO.indexOf(atual) + 1) % CICLO.length];
    setLista((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: prox } : c))
    );
    try {
      await atualizarStatusCandidaturaDb(id, prox);
      mostrarToast("Status: " + STATUS_LABEL[prox]);
    } catch {
      setLista((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: atual } : c))
      );
      mostrarToast("Não foi possível mudar o status.");
    }
  };

  // Agrupa por vaga.
  const grupos = new Map<number, CandidaturaPainel[]>();
  lista.forEach((c) => {
    const arr = grupos.get(c.vagaId) ?? [];
    arr.push(c);
    grupos.set(c.vagaId, arr);
  });

  return (
    <section className="view">
      <div className="pad">
        <SubHead
          titulo="Candidaturas recebidas"
          sub="Visão da empresa: quem se candidatou às suas vagas."
          voltarPara="/perfil"
        />

        {empresa.registrada && (
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
        )}

        {carregando ? (
          <div className="empty">
            <b>Carregando…</b>
          </div>
        ) : lista.length === 0 ? (
          <div className="empty">
            <b>Nenhuma candidatura ainda.</b>
            Quando alguém se candidatar às suas vagas, aparece aqui — com e-mail e
            WhatsApp para contato.
          </div>
        ) : (
          <div style={{ marginTop: 6 }}>
            {[...grupos.values()].map((cands) => (
              <div className="vgroup" key={cands[0].vagaId}>
                <div className="vg-head">
                  <span className="vg-t">{cands[0].vagaTitulo}</span>
                  <span className="vg-c">{cands.length} candidato(s)</span>
                </div>
                {cands.map((a) => {
                  const fone = a.whatsapp.replace(/\D/g, "");
                  return (
                    <div className="cand" key={a.id}>
                      <div className="ch">
                        <div className="cav">{iniciais(a.nome || "??")}</div>
                        <div>
                          <div className="cn">{a.nome || "Candidato"}</div>
                          <div className="cmeta">
                            {a.area} • {a.bairro} • {a.quando}
                          </div>
                        </div>
                      </div>
                      <div className="ccontact">
                        <span>{a.sobre}</span>
                        <span>
                          📱{" "}
                          <a
                            href={`https://wa.me/55${fone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {a.whatsapp}
                          </a>
                        </span>
                        <span>
                          ✉️ <a href={`mailto:${a.email}`}>{a.email}</a>
                        </span>
                      </div>
                      <Link className="ver-cv" href={`/candidaturas/${a.id}`}>
                        Ver currículo completo
                      </Link>
                      <div className="cfoot">
                        <button
                          type="button"
                          className={`status ${a.status}`}
                          onClick={() => ciclar(a.id, a.status)}
                        >
                          {STATUS_LABEL[a.status]}
                        </button>
                        <a
                          className="cbtn"
                          href={`https://wa.me/55${fone}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Chamar no WhatsApp
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
