"use client";

import { useState } from "react";
import { CategoryChips } from "@/components/category-chips";
import { IconSearch } from "@/components/icons";
import { SubHead } from "@/components/sub-head";
import { ListaVagas } from "@/components/vaga-card";
import { useApp } from "@/context/app-context";

export default function BuscarPage() {
  const { vagas } = useApp();
  const [cat, setCat] = useState("Todas");
  const [termo, setTermo] = useState("");

  const q = termo.toLowerCase();
  const resultados = vagas.filter((v) => {
    const naCat = cat === "Todas" || v.categoria === cat;
    const texto = (v.titulo + v.empresa + v.bairro + v.categoria).toLowerCase();
    return naCat && texto.includes(q);
  });

  return (
    <section className="view">
      <div className="pad">
        <SubHead titulo="Buscar vagas" sub="Cargo, empresa ou bairro." voltarPara="/" />
        <div className="search" style={{ marginTop: 12 }}>
          <IconSearch width={18} height={18} stroke="#9aa7a2" />
          <input
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Ex.: atendente, Manaíra, vendedor"
            aria-label="Buscar cargo, empresa ou bairro"
            autoFocus
          />
        </div>
      </div>

      <CategoryChips ativa={cat} onChange={setCat} />

      <div className="pad">
        <ListaVagas
          vagas={resultados}
          vazioTitulo="Nada encontrado."
          vazioSub="Tente outro termo ou bairro."
        />
      </div>
    </section>
  );
}
