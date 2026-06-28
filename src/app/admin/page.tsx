"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SubHead } from "@/components/sub-head";
import { useApp } from "@/context/app-context";
import { formatarHa } from "@/lib/config";

interface Denuncia {
  id: number;
  vagaId: number | null;
  vagaTitulo: string;
  empresaNome: string;
  motivo: string;
  detalhe: string;
  anonima: boolean;
  status: "aberta" | "revisada" | "arquivada";
  criadoEm: string;
  vagaStatus: string; // 'ativa' | 'expirada' | 'removida' | ...
}

type Acao = "tirar_do_ar" | "excluir_vaga" | "arquivar" | "reabrir";

const ROTULO_STATUS: Record<Denuncia["status"], string> = {
  aberta: "Aberta",
  revisada: "Revisada",
  arquivada: "Arquivada",
};

export default function AdminPage() {
  const { mostrarToast } = useApp();
  const [estado, setEstado] = useState<"carregando" | "negado" | "ok" | "erro">(
    "carregando"
  );
  const [denuncias, setDenuncias] = useState<Denuncia[]>([]);
  const [soAbertas, setSoAbertas] = useState(true);
  const [agindo, setAgindo] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/denuncias");
      if (res.status === 403) {
        setEstado("negado");
        return;
      }
      if (!res.ok) {
        setEstado("erro");
        return;
      }
      const json = await res.json();
      setDenuncias(json.denuncias ?? []);
      setEstado("ok");
    } catch {
      setEstado("erro");
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const moderar = async (denunciaId: number, acao: Acao) => {
    if (acao === "excluir_vaga" && !confirm("Excluir a vaga de vez? Isso também apaga as candidaturas dela. Não dá para desfazer.")) {
      return;
    }
    setAgindo(denunciaId);
    try {
      const res = await fetch("/api/admin/moderar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ denunciaId, acao }),
      });
      if (!res.ok) throw new Error();
      const msgs: Record<Acao, string> = {
        tirar_do_ar: "Vaga tirada do ar ✓",
        excluir_vaga: "Vaga excluída ✓",
        arquivar: "Denúncia arquivada ✓",
        reabrir: "Denúncia reaberta ✓",
      };
      mostrarToast(msgs[acao]);
      await carregar();
    } catch {
      mostrarToast("Não foi possível concluir a ação.");
    } finally {
      setAgindo(null);
    }
  };

  const lista = soAbertas
    ? denuncias.filter((d) => d.status === "aberta")
    : denuncias;
  const nAbertas = denuncias.filter((d) => d.status === "aberta").length;

  return (
    <section className="view">
      <div className="pad">
        <SubHead
          titulo="Moderação"
          sub="Denúncias de vagas. Revise e tome uma ação."
          voltarPara="/perfil"
        />

        {estado === "carregando" && <p className="admin-vazio">Carregando…</p>}

        {estado === "negado" && (
          <div className="admin-negado">
            <p>
              Esta área é só para o dono do app. Entre com a conta de dono para
              acessar.
            </p>
            <Link className="btn-mini primary" href="/entrar">
              Ir para o login
            </Link>
          </div>
        )}

        {estado === "erro" && (
          <p className="admin-vazio">
            Não foi possível carregar as denúncias.{" "}
            <button className="link-inline" onClick={() => void carregar()}>
              Tentar de novo
            </button>
          </p>
        )}

        {estado === "ok" && (
          <>
            <div className="admin-filtros">
              <button
                className={`chip${soAbertas ? " on" : ""}`}
                onClick={() => setSoAbertas(true)}
              >
                Abertas{nAbertas > 0 ? ` (${nAbertas})` : ""}
              </button>
              <button
                className={`chip${!soAbertas ? " on" : ""}`}
                onClick={() => setSoAbertas(false)}
              >
                Todas ({denuncias.length})
              </button>
            </div>

            {lista.length === 0 ? (
              <p className="admin-vazio">
                {soAbertas
                  ? "Nenhuma denúncia aberta. Tudo em dia 🎉"
                  : "Nenhuma denúncia até agora."}
              </p>
            ) : (
              <ul className="admin-lista">
                {lista.map((d) => {
                  const removida = d.vagaStatus === "removida";
                  const noAr = d.vagaStatus === "ativa";
                  const ocupado = agindo === d.id;
                  return (
                    <li key={d.id} className="den-card">
                      <div className="den-top">
                        <span className={`den-status s-${d.status}`}>
                          {ROTULO_STATUS[d.status]}
                        </span>
                        <span className="den-quando">
                          {formatarHa(d.criadoEm)}
                        </span>
                      </div>

                      <div className="den-motivo">🚩 {d.motivo}</div>

                      <div className="den-vaga">
                        <b>{d.vagaTitulo || "(vaga sem título)"}</b>
                        {d.empresaNome ? ` · ${d.empresaNome}` : ""}
                        {d.vagaId ? (
                          <span className="den-id"> #{d.vagaId}</span>
                        ) : null}
                      </div>

                      {d.detalhe && (
                        <p className="den-detalhe">“{d.detalhe}”</p>
                      )}

                      <div className="den-meta">
                        <span className={`den-vstatus v-${removida ? "removida" : d.vagaStatus}`}>
                          {removida
                            ? "Vaga removida"
                            : noAr
                              ? "No ar"
                              : "Fora do ar"}
                        </span>
                        <span className="den-anon">
                          {d.anonima ? "Denúncia anônima" : "Denunciante logado"}
                        </span>
                      </div>

                      <div className="den-acoes">
                        {noAr && (
                          <button
                            className="btn-mini"
                            disabled={ocupado}
                            onClick={() => moderar(d.id, "tirar_do_ar")}
                          >
                            Tirar do ar
                          </button>
                        )}
                        {!removida && (
                          <button
                            className="btn-mini danger"
                            disabled={ocupado}
                            onClick={() => moderar(d.id, "excluir_vaga")}
                          >
                            Excluir vaga
                          </button>
                        )}
                        {d.status === "arquivada" ? (
                          <button
                            className="btn-mini"
                            disabled={ocupado}
                            onClick={() => moderar(d.id, "reabrir")}
                          >
                            Reabrir
                          </button>
                        ) : (
                          <button
                            className="btn-mini"
                            disabled={ocupado}
                            onClick={() => moderar(d.id, "arquivar")}
                          >
                            Arquivar
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  );
}
