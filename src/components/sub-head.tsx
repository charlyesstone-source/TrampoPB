"use client";

import { useRouter } from "next/navigation";
import { IconBack } from "./icons";

/** Cabeçalho de sub-tela com botão "voltar" (volta sempre para a tela anterior). */
export function SubHead({
  titulo,
  sub,
  voltarPara,
}: {
  titulo: string;
  sub?: string;
  /** Destino de reserva quando não há tela anterior (ex.: link aberto direto). */
  voltarPara?: string;
}) {
  const router = useRouter();

  const voltar = () => {
    // Sempre volta para a tela anterior; só usa o destino de reserva quando
    // não há histórico (ex.: a pessoa abriu o link direto nessa tela).
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(voltarPara ?? "/");
    }
  };

  return (
    <div className="subhead">
      <button type="button" className="back" aria-label="Voltar" onClick={voltar}>
        <IconBack width={18} height={18} />
      </button>
      <div>
        <h2>{titulo}</h2>
        {sub && <div className="sh-sub">{sub}</div>}
      </div>
    </div>
  );
}
