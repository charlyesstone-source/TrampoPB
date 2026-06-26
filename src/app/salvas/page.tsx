"use client";

import { ListaVagas } from "@/components/vaga-card";
import { useApp } from "@/context/app-context";

export default function SalvasPage() {
  const { vagas, salvas } = useApp();
  const lista = vagas.filter((v) => salvas.has(v.id));

  return (
    <section className="view">
      <div className="pad">
        <div className="greet" style={{ marginTop: 10 }}>
          Vagas salvas
        </div>
        <div style={{ marginTop: 16 }}>
          <ListaVagas
            vagas={lista}
            vazioTitulo="Nenhuma vaga salva."
            vazioSub="Toque no coração de uma vaga para guardá-la aqui."
          />
        </div>
      </div>
    </section>
  );
}
