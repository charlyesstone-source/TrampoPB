"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconUser } from "@/components/icons";
import { useApp } from "@/context/app-context";
import { iniciais } from "@/lib/mock-data";

export default function PerfilPage() {
  const router = useRouter();
  const { candidato, empresa, candidaturasEnviadas, mostrarToast, sairConta } =
    useApp();
  const reg = candidato.registrado;

  const irAnunciar = () =>
    router.push(empresa.registrada ? "/anunciar" : "/empresa/cadastro");

  return (
    <section className="view">
      <div className="pad">
        <div className="profhead">
          <div className="big">
            {reg ? iniciais(candidato.nome) : <IconUser width={26} height={26} />}
          </div>
          <div>
            <div className="name">
              {reg ? candidato.nome : "Você ainda não tem conta"}
            </div>
            <div className="sub">
              {reg
                ? `${candidato.area || "Candidato"} • ${
                    candidato.bairro || "JP"
                  }, JP`
                : "Inscreva-se para se candidatar às vagas"}
            </div>
          </div>
        </div>

        <div className="stats">
          <div className="stat">
            <b>{candidaturasEnviadas.size}</b>
            <span>Candidaturas</span>
          </div>
          <div className="stat">
            <b>{reg ? "87%" : "0%"}</b>
            <span>Perfil completo</span>
          </div>
        </div>

        <div className="menu">
          {!empresa.registrada && (
            <Link href="/curriculo">
              {reg ? "Alterar meu currículo" : "Meu currículo"} <span>›</span>
            </Link>
          )}
          <a onClick={() => mostrarToast("Em construção (próxima fase)")}>
            Alertas de vaga <span>›</span>
          </a>
          <a onClick={irAnunciar}>
            Sou empresa, quero publicar <span>›</span>
          </a>
          <Link href="/privacidade">
            Política de privacidade <span>›</span>
          </Link>
          <Link href="/termos">
            Termos de uso <span>›</span>
          </Link>
          {(reg || empresa.registrada) && (
            <a
              onClick={async () => {
                await sairConta();
                router.push("/");
              }}
            >
              Sair da conta <span>›</span>
            </a>
          )}
        </div>

        <p className="demo-note">
          Este é um protótipo navegável. Os dados ficam só nesta sessão e somem ao
          recarregar a página.
        </p>
      </div>
    </section>
  );
}
