"use client";

import { useState } from "react";
import { useApp } from "@/context/app-context";
import { MOTIVOS_DENUNCIA } from "@/lib/config";

/**
 * "Denunciar vaga" — link discreto que abre um formulário curto (motivo +
 * detalhe opcional). Envia para /api/denunciar. Aberto a qualquer visitante.
 */
export function DenunciarVaga({ vagaId }: { vagaId: number }) {
  const { mostrarToast } = useApp();
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [detalhe, setDetalhe] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const enviar = async () => {
    if (!motivo || enviando) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/denunciar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vagaId, motivo, detalhe }),
      });
      if (!res.ok) throw new Error();
      setEnviado(true);
      mostrarToast("Denúncia enviada. Obrigado por avisar 🙏");
    } catch {
      mostrarToast("Não foi possível enviar agora. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <p className="denuncia-ok">
        Denúncia registrada. Nossa equipe vai revisar este anúncio. Obrigado!
      </p>
    );
  }

  if (!aberto) {
    return (
      <button
        type="button"
        className="denuncia-link"
        onClick={() => setAberto(true)}
      >
        🚩 Denunciar esta vaga
      </button>
    );
  }

  return (
    <div className="denuncia-box">
      <h4>Denunciar vaga</h4>
      <p className="denuncia-sub">
        Achou suspeito ou golpe? Conte o motivo — vamos revisar.
      </p>
      <div className="denuncia-motivos">
        {MOTIVOS_DENUNCIA.map((m) => (
          <label key={m} className="denuncia-opt">
            <input
              type="radio"
              name="motivo"
              value={m}
              checked={motivo === m}
              onChange={() => setMotivo(m)}
            />
            <span>{m}</span>
          </label>
        ))}
      </div>
      <textarea
        className="in"
        placeholder="Detalhe (opcional)"
        value={detalhe}
        maxLength={600}
        onChange={(e) => setDetalhe(e.target.value)}
      />
      <div className="denuncia-acoes">
        <button
          type="button"
          className="btn-mini"
          onClick={() => setAberto(false)}
          disabled={enviando}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="btn-mini primary"
          onClick={enviar}
          disabled={!motivo || enviando}
        >
          {enviando ? "Enviando…" : "Enviar denúncia"}
        </button>
      </div>
    </div>
  );
}
