"use client";

import { useRouter } from "next/navigation";
import { IconBack } from "./icons";

/** Cabeçalho de sub-tela com botão "voltar". */
export function SubHead({
  titulo,
  sub,
  voltarPara,
}: {
  titulo: string;
  sub?: string;
  /** Rota de destino do botão voltar; se omitido, usa o histórico. */
  voltarPara?: string;
}) {
  const router = useRouter();
  return (
    <div className="subhead">
      <button
        type="button"
        className="back"
        aria-label="Voltar"
        onClick={() => (voltarPara ? router.push(voltarPara) : router.back())}
      >
        <IconBack width={18} height={18} />
      </button>
      <div>
        <h2>{titulo}</h2>
        {sub && <div className="sh-sub">{sub}</div>}
      </div>
    </div>
  );
}
