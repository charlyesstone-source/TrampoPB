"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/context/app-context";
import { corLogo } from "@/lib/mock-data";

/** Sheet (modal inferior) com o detalhe da vaga e a ação de candidatar. */
export function JobSheet() {
  const router = useRouter();
  const {
    vagas,
    vagaAberta,
    candidaturasEnviadas,
    candidato,
    empresa,
    fecharSheet,
    candidatarVagaAberta,
    mostrarToast,
  } = useApp();

  const [consentiu, setConsentiu] = useState(false);

  // Reseta o consentimento ao trocar de vaga.
  useEffect(() => {
    setConsentiu(false);
  }, [vagaAberta]);

  if (vagaAberta == null) return null;
  const vaga = vagas.find((v) => v.id === vagaAberta);
  if (!vaga) return null;

  const candidatou = candidaturasEnviadas.has(vaga.id);

  const aoCandidatar = async () => {
    // Conta de empresa não pode se candidatar.
    if (empresa.registrada) {
      mostrarToast(
        "Você está com uma conta de empresa. Entre como candidato para se candidatar."
      );
      return;
    }
    // Visitante: leva à inscrição.
    if (!candidato.registrado) {
      fecharSheet();
      mostrarToast("Inscreva-se como candidato para se candidatar");
      router.push("/curriculo");
      return;
    }
    // O currículo é checado no banco (fonte da verdade) dentro de candidatar.
    const resultado = await candidatarVagaAberta();
    if (resultado === "incompleto") {
      fecharSheet();
      mostrarToast("Complete seu currículo (WhatsApp) antes de se candidatar");
      router.push("/curriculo");
    } else if (resultado === "ok") {
      // Candidatura enviada: fecha o detalhe e volta para o início.
      fecharSheet();
      router.push("/");
    }
  };

  // Só pede consentimento de quem já é candidato (visitante vai ao cadastro antes).
  const precisaConsentir = candidato.registrado && !candidatou;
  const botaoDesabilitado = candidatou || (precisaConsentir && !consentiu);

  return (
    <div className="sheet-wrap open">
      <div className="scrim" onClick={fecharSheet} />
      <div className="sheet" role="dialog" aria-modal="true" aria-label={vaga.titulo}>
        <div className="bar" onClick={fecharSheet}>
          <span className="grip" />
        </div>
        <div className="sheet-body">
          <h2>{vaga.titulo}</h2>
          <div className="co2">
            <div
              className="logo"
              style={{
                width: 24,
                height: 24,
                borderRadius: 7,
                fontSize: 12,
                background: corLogo(vaga.id),
              }}
            >
              {vaga.empresa[0]}
            </div>
            {vaga.empresa}
          </div>
          <div className="meta" style={{ marginTop: 14 }}>
            <span className="tag">📍 {vaga.bairro}, João Pessoa</span>
            <span className="tag sal">R$ {vaga.salario}</span>
            <span className="tag muted">{vaga.tipo}</span>
            <span className="tag muted">{vaga.categoria}</span>
          </div>

          <div className="block">
            <h4>Sobre a vaga</h4>
            <p>{vaga.descricao}</p>
          </div>

          <div className="block">
            <h4>Requisitos</h4>
            <ul>
              {vaga.requisitos.map((r, k) => (
                <li key={k}>{r}</li>
              ))}
            </ul>
          </div>

          {vaga.beneficios && vaga.beneficios.length > 0 && (
            <div className="block">
              <h4>Benefícios</h4>
              <ul>
                {vaga.beneficios.map((b, k) => (
                  <li key={k}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          {(vaga.emailContato || vaga.whatsappContato) && (
            <div className="block">
              <h4>Contato da empresa</h4>
              <ul>
                {vaga.emailContato && <li>E-mail: {vaga.emailContato}</li>}
                {vaga.whatsappContato && <li>WhatsApp: {vaga.whatsappContato}</li>}
              </ul>
            </div>
          )}

          <div className="block">
            <h4>Publicado</h4>
            <p>
              {vaga.publicadaHa} • via TrampoPB
              {vaga.validadeDias
                ? ` • anúncio ativo, expira em ${vaga.validadeDias} dias`
                : ""}
            </p>
          </div>

          {precisaConsentir && (
            <label className="consent consent-check">
              <input
                type="checkbox"
                checked={consentiu}
                onChange={(e) => setConsentiu(e.target.checked)}
              />
              <span>
                Autorizo o envio dos meus dados de currículo para a{" "}
                <b>{vaga.empresa}</b> para fins de contato sobre esta vaga, conforme a{" "}
                <Link href="/privacidade" onClick={fecharSheet}>
                  Política de Privacidade
                </Link>
                .
              </span>
            </label>
          )}
        </div>

        <div className="sheet-foot">
          <button
            className={`btn btn-primary${candidatou ? " done" : ""}`}
            onClick={aoCandidatar}
            disabled={botaoDesabilitado}
          >
            {candidatou ? "Candidatura enviada ✓" : "Candidatar-se"}
          </button>
        </div>
      </div>
    </div>
  );
}
