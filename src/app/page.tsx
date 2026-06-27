"use client";

import Link from "next/link";
import { useState } from "react";
import { CategoryChips } from "@/components/category-chips";
import { IconChevronRight, IconRefresh, IconSearch } from "@/components/icons";
import { PromoCarousel } from "@/components/promo-carousel";
import { ListaVagas } from "@/components/vaga-card";
import { useApp } from "@/context/app-context";
import { useSaudacao } from "@/lib/use-saudacao";

export default function InicioPage() {
  const { vagas, carregandoVagas, candidato, recarregarVagas } = useApp();
  const saudacao = useSaudacao();
  const [cat, setCat] = useState("Todas");
  const [atualizando, setAtualizando] = useState(false);

  const atualizar = async () => {
    setAtualizando(true);
    await recarregarVagas({ silencioso: true });
    setAtualizando(false);
  };

  const filtradas = vagas.filter((v) => cat === "Todas" || v.categoria === cat);

  return (
    <section className="view">
      <div className="pad">
        <div className="greet">
          {candidato.registrado
            ? `${saudacao}, ${candidato.nome.split(" ")[0]} 👋`
            : `${saudacao} 👋`}
          <small>Onde o trabalho nasce primeiro.</small>
        </div>

        {!candidato.registrado && (
          <>
            <Link href="/curriculo" className="signup-cta">
              <div className="sc-tx">
                <b>Sou candidato, quero me inscrever</b>
                <span>Crie seu currículo e candidate-se em segundos</span>
              </div>
              <IconChevronRight width={20} height={20} />
            </Link>
            <div
              className="form-alt"
              style={{ textAlign: "left", margin: "8px 2px 2px" }}
            >
              Já tem conta? <Link href="/entrar">Entrar</Link>
            </div>
          </>
        )}

        <Link href="/buscar" className="search" role="button">
          <IconSearch width={18} height={18} stroke="#9aa7a2" />
          <input
            placeholder="Buscar cargo, empresa ou bairro"
            readOnly
            tabIndex={-1}
          />
        </Link>

        <PromoCarousel />
      </div>

      <CategoryChips ativa={cat} onChange={setCat} />

      <div className="pad">
        <div className="sectitle">
          Vagas perto de você
          <span className="sec-right">
            <em>{carregandoVagas ? "…" : `${filtradas.length} vagas`}</em>
            <button
              type="button"
              className={`refresh-btn${atualizando ? " girando" : ""}`}
              onClick={atualizar}
              disabled={atualizando}
              aria-label="Atualizar vagas"
            >
              <IconRefresh width={16} height={16} />
            </button>
          </span>
        </div>
        {carregandoVagas ? (
          <div className="empty">
            <b>Carregando vagas…</b>
          </div>
        ) : (
          <ListaVagas
            vagas={filtradas}
            vazioTitulo="Nenhuma vaga publicada ainda."
            vazioSub="As vagas aparecem aqui assim que as empresas publicarem."
          />
        )}
      </div>
    </section>
  );
}
