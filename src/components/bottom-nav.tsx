"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import {
  IconBookmark,
  IconHome,
  IconPlus,
  IconSearch,
  IconUser,
} from "./icons";

/** Navegação inferior estilo app, com botão central preto "Anunciar vaga". */
export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { empresa } = useApp();

  /** Rotas que mantêm uma aba acesa mesmo sem serem a aba em si. */
  const aba = (() => {
    if (pathname === "/") return "inicio";
    if (pathname.startsWith("/buscar")) return "buscar";
    if (pathname.startsWith("/salvas")) return "salvas";
    if (
      pathname.startsWith("/perfil") ||
      pathname.startsWith("/curriculo") ||
      pathname.startsWith("/entrar") ||
      pathname.startsWith("/candidaturas")
    )
      return "perfil";
    return "";
  })();

  /** Empresa logada vai direto anunciar; senão, passa pelo cadastro. */
  const irAnunciar = () => {
    router.push(empresa.registrada ? "/anunciar" : "/empresa/cadastro");
  };

  return (
    <nav className="bottomnav">
      <Link
        href="/"
        className={`nav-btn${aba === "inicio" ? " active" : ""}`}
        aria-current={aba === "inicio" ? "page" : undefined}
      >
        <IconHome />
        Início
      </Link>
      <Link
        href="/buscar"
        className={`nav-btn${aba === "buscar" ? " active" : ""}`}
        aria-current={aba === "buscar" ? "page" : undefined}
      >
        <IconSearch />
        Buscar
      </Link>
      <div className="nav-fab">
        <button
          className="fab"
          onClick={irAnunciar}
          aria-label="Anunciar vaga (empresa)"
        >
          <IconPlus />
        </button>
        <span className="fab-label">Anunciar vaga</span>
      </div>
      <Link
        href="/salvas"
        className={`nav-btn${aba === "salvas" ? " active" : ""}`}
        aria-current={aba === "salvas" ? "page" : undefined}
      >
        <IconBookmark />
        Salvas
      </Link>
      <Link
        href="/perfil"
        className={`nav-btn${aba === "perfil" ? " active" : ""}`}
        aria-current={aba === "perfil" ? "page" : undefined}
      >
        <IconUser />
        Perfil
      </Link>
    </nav>
  );
}
