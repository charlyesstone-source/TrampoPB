"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { PixQRCode } from "@/components/pix-qrcode";
import { SubHead } from "@/components/sub-head";
import { useApp } from "@/context/app-context";
import { PIX_EXPIRA_SEGUNDOS, PRECO_VAGA_LABEL, VALIDADE_DIAS } from "@/lib/config";

function formatarTempo(seg: number): string {
  if (seg < 0) return "Expirado";
  const mm = String(Math.floor(seg / 60)).padStart(2, "0");
  const ss = String(seg % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function PagamentoPage() {
  const router = useRouter();
  const { cobranca, definirCobranca, recarregarVagas, mostrarToast } = useApp();
  const [restante, setRestante] = useState(PIX_EXPIRA_SEGUNDOS);
  const [confirmando, setConfirmando] = useState(false);
  const concluido = useRef(false);

  // Guarda: sem cobrança aberta, volta ao formulário.
  useEffect(() => {
    if (!cobranca) router.replace("/anunciar");
  }, [cobranca, router]);

  // Tempo de expiração a partir do expiraEm do gateway (ou 15 min).
  useEffect(() => {
    if (!cobranca) return;
    const fim = cobranca.expiraEm
      ? new Date(cobranca.expiraEm).getTime()
      : Date.now() + PIX_EXPIRA_SEGUNDOS * 1000;
    const tick = () =>
      setRestante(Math.round((fim - Date.now()) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [cobranca]);

  const aoAprovar = useCallback(async () => {
    if (concluido.current) return;
    concluido.current = true;
    definirCobranca(null);
    await recarregarVagas();
    mostrarToast("Pagamento aprovado ✓ Vaga no ar por 15 dias.");
    router.push("/");
  }, [definirCobranca, recarregarVagas, mostrarToast, router]);

  // Poll do status do pagamento (confirmação local sem webhook público).
  useEffect(() => {
    if (!cobranca) return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/pagamento/status?paymentId=${cobranca.mpPaymentId}&vagaId=${cobranca.vagaId}`
        );
        const data = await res.json();
        if (data.publicada) await aoAprovar();
      } catch {
        /* tenta de novo no próximo tick */
      }
    }, 4000);
    return () => clearInterval(id);
  }, [cobranca, aoAprovar]);

  if (!cobranca) return null;

  const copiar = async () => {
    try {
      await navigator.clipboard?.writeText(cobranca.copiaECola);
    } catch {
      /* clipboard pode estar indisponível */
    }
    mostrarToast("Código Pix copiado");
  };

  const simular = async () => {
    setConfirmando(true);
    try {
      const res = await fetch("/api/pagamento/simular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vagaId: cobranca.vagaId,
          mpPaymentId: cobranca.mpPaymentId,
        }),
      });
      if (!res.ok) throw new Error();
      await aoAprovar();
    } catch {
      mostrarToast("Não foi possível simular o pagamento.");
      setConfirmando(false);
    }
  };

  return (
    <section className="view">
      <div className="pad">
        <SubHead
          titulo="Pagamento via Pix"
          sub={`Pague para publicar sua vaga por ${VALIDADE_DIAS} dias.`}
          voltarPara="/anunciar"
        />

        <div className="pay-summary">
          <div className="ps-row">
            <span>Anúncio de vaga</span>
            <b>{cobranca.titulo}</b>
          </div>
          <div className="ps-row">
            <span>Plano único • {VALIDADE_DIAS} dias no ar</span>
            <b>{PRECO_VAGA_LABEL}</b>
          </div>
          <div className="ps-total">
            <span>Total</span>
            <b>{PRECO_VAGA_LABEL}</b>
          </div>
        </div>

        <div className="pix-box">
          {cobranca.qrCodeBase64 ? (
            <div className="pix-qr">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`data:image/png;base64,${cobranca.qrCodeBase64}`}
                alt="QR Code Pix"
                style={{ width: "100%", height: "100%", display: "block" }}
              />
            </div>
          ) : (
            <PixQRCode />
          )}

          <div className="pix-timer-wrap">
            Este Pix expira em <b>{formatarTempo(restante)}</b>
          </div>

          <label className="pix-label">Pix copia e cola</label>
          <div className="pix-code-row">
            <span className="pix-code">{cobranca.copiaECola}</span>
            <button type="button" className="pix-copy" onClick={copiar}>
              Copiar
            </button>
          </div>

          <ol className="pix-steps">
            <li>Abra o app do seu banco e escolha pagar com Pix.</li>
            <li>Escaneie o QR Code ou use o &ldquo;copia e cola&rdquo;.</li>
            <li>Confirme o valor de {PRECO_VAGA_LABEL} e finalize.</li>
          </ol>
        </div>

        <p className="pay-note" style={{ marginTop: 14 }}>
          Assim que o pagamento for confirmado, a vaga vai ao ar automaticamente —
          esta tela detecta sozinha.
        </p>

        {cobranca.sandbox && (
          <>
            <button
              type="button"
              className="submit"
              onClick={simular}
              disabled={confirmando}
              style={{ background: "var(--ink)" }}
            >
              {confirmando ? "Confirmando…" : "Simular pagamento aprovado (sandbox)"}
            </button>
            <p className="pay-note">
              Ambiente de teste: o Pix não é cobrança real. Use o botão acima para
              simular a confirmação.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
