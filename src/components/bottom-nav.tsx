"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import {
  IconBriefcase,
  IconClipboardCheck,
  IconHome,
  IconPlus,
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
    if (pathname.startsWith("/minhas-vagas")) return "minhasvagas";
    if (
      pathname.startsWith("/empresa") ||
      pathname.startsWith("/anuncios") ||
      pathname.startsWith("/candidaturas")
    )
      return "empresa";
    if (
      pathname.startsWith("/perfil") ||
      pathname.startsWith("/curriculo") ||
      pathname.startsWith("/entrar")
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
        href="/empresa"
        className={`nav-btn${aba === "empresa" ? " active" : ""}`}
        aria-current={aba === "empresa" ? "page" : undefined}
      >
        <IconBriefcase />
        Empresa
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
        href="/minhas-vagas"
        className={`nav-btn${aba === "minhasvagas" ? " active" : ""}`}
        aria-current={aba === "minhasvagas" ? "page" : undefined}
      >
        <IconClipboardCheck />
        Minhas vagas
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
