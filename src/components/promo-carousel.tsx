"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/context/app-context";
import { CONTRATADOS_DEMO_BASE } from "@/lib/config";
import { DEPOIMENTOS } from "@/lib/mock-data";
import { IconCheckCircle } from "./icons";

/**
 * Carrossel de provas sociais. 1º slide = nº de contratados
 * (real, do status 'contratado', + base de demonstração — ver config),
 * seguido dos depoimentos (fictícios no mock).
 */
export function PromoCarousel() {
  const { totalContratados } = useApp();
  const contratadosExibidos = totalContratados + CONTRATADOS_DEMO_BASE;
  const totalSlides = DEPOIMENTOS.length + 1;
  const [i, setI] = useState(0);

  const irPara = useCallback(
    (k: number) => setI(((k % totalSlides) + totalSlides) % totalSlides),
    [totalSlides]
  );

  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % totalSlides), 3800);
    return () => clearInterval(t);
  }, [totalSlides]);

  return (
    <div className="promo">
      {/* Slide 0 — métrica real */}
      <div className={`promo-slide${i === 0 ? " active" : ""}`}>
        <div className="wb-ic" aria-hidden="true">
          <IconCheckCircle width={22} height={22} stroke="#fff" />
        </div>
        <div className="wb-tx">
          <b>+ de {contratadosExibidos} empregos contratados</b>
          <span>na Paraíba através da TrampoPB</span>
        </div>
      </div>

      {/* Slides de depoimento */}
      {DEPOIMENTOS.map((d, n) => (
        <div
          key={d.iniciais}
          className={`promo-slide quote${i === n + 1 ? " active" : ""}`}
        >
          <div className="tst-av">{d.iniciais}</div>
          <div className="wb-tx">
            <div className="stars">★★★★★</div>
            <b>&ldquo;{d.frase}&rdquo;</b>
            <span>
              {d.nome} • {d.bairro}
            </span>
          </div>
        </div>
      ))}

      <div className="promo-dots">
        {Array.from({ length: totalSlides }).map((_, k) => (
          <button
            key={k}
            className={i === k ? "on" : ""}
            aria-label={`Slide ${k + 1}`}
            onClick={() => irPara(k)}
          />
        ))}
      </div>
    </div>
  );
}
