"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconUser } from "@/components/icons";
import { useApp } from "@/context/app-context";
import { iniciais } from "@/lib/mock-data";

export default function PerfilPage() {
  const router = useRouter();
  const {
    candidato,
    empresa,
    candidaturasEnviadas,
    mostrarToast,
    sairConta,
    excluirConta,
  } = useApp();
  const reg = candidato.registrado;

  // Exclusão de conta: confirmação deliberada (a ação é irreversível).
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const aoExcluirConta = async () => {
    setExcluindo(true);
    const ok = await excluirConta();
    if (ok) {
      router.push("/");
    } else {
      setExcluindo(false);
      setConfirmandoExclusao(false);
    }
  };

  // Atalho de moderação só aparece para o dono do app (checado no servidor).
  const [ehDono, setEhDono] = useState(false);
  useEffect(() => {
    let ativo = true;
    fetch("/api/admin/sessao")
      .then((r) => (r.ok ? r.json() : { dono: false }))
      .then((j) => {
        if (ativo) setEhDono(Boolean(j.dono));
      })
      .catch(() => {});
    return () => {
      ativo = false;
    };
  }, [candidato.registrado, empresa.registrada]);

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
          {ehDono && (
            <Link href="/admin">
              🚩 Moderação (denúncias) <span>›</span>
            </Link>
          )}
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
          {(reg || empresa.registrada) && (
            <a
              className="menu-perigo"
              onClick={() => setConfirmandoExclusao(true)}
            >
              Excluir minha conta <span>›</span>
            </a>
          )}
        </div>

        {confirmandoExclusao && (
          <div className="excluir-box" role="alertdialog" aria-label="Confirmar exclusão de conta">
            <b>Excluir sua conta?</b>
            <p>
              Esta ação é <b>permanente</b> e apaga todos os seus dados
              {empresa.registrada
                ? ", incluindo suas vagas publicadas e as candidaturas recebidas"
                : ", incluindo suas candidaturas"}
              . Não dá para desfazer.
            </p>
            <div className="excluir-acoes">
              <button
                type="button"
                className="btn-mini"
                onClick={() => setConfirmandoExclusao(false)}
                disabled={excluindo}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-mini danger"
                onClick={aoExcluirConta}
                disabled={excluindo}
              >
                {excluindo ? "Excluindo…" : "Sim, excluir minha conta"}
              </button>
            </div>
          </div>
        )}

        <p className="demo-note">
          Este é um protótipo navegável. Os dados ficam só nesta sessão e somem ao
          recarregar a página.
        </p>
      </div>
    </section>
  );
}
