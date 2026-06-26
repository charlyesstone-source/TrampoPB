"use client";

import Link from "next/link";
import { useApp } from "@/context/app-context";
import { CIDADE } from "@/lib/config";
import { iniciais } from "@/lib/mock-data";
import { IconPin, IconUser } from "./icons";

/** Cabeçalho fixo: marca (sol nascente), localização e avatar. */
export function Header() {
  const { candidato, empresa } = useApp();

  // Avatar reflete quem está conectado (candidato OU empresa).
  const ehEmpresa = empresa.registrada;
  const nome = candidato.registrado ? candidato.nome : ehEmpresa ? empresa.nome : "";
  const destino = ehEmpresa ? "/empresa" : "/perfil";
  const rotulo = ehEmpresa
    ? `Empresa conectada: ${empresa.nome}`
    : candidato.registrado
      ? "Meu perfil"
      : "Entrar / meu perfil";

  return (
    <header className="topbar">
      <div className="brand">
        <Link href="/" className="mark" aria-hidden="true" tabIndex={-1} />
        <div>
          <Link href="/" style={{ textDecoration: "none", color: "inherit" }}>
            <b>
              Trampo<span>PB</span>
            </b>
          </Link>
          <div className="loc">
            <IconPin width={11} height={11} />
            {CIDADE}
          </div>
        </div>
      </div>
      <Link
        href={destino}
        className={`avatar${ehEmpresa ? " avatar-empresa" : ""}`}
        aria-label={rotulo}
        title={rotulo}
      >
        {nome ? iniciais(nome) : <IconUser width={18} height={18} />}
      </Link>
    </header>
  );
}
