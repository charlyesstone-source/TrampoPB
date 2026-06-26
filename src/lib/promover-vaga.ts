import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { VALIDADE_DIAS } from "./config";

/**
 * Publica a vaga após o pagamento confirmado: status 'ativa', define publicação
 * e expiração (15 dias), e marca o pagamento como 'aprovado'. Idempotente.
 *
 * Funciona tanto com o client autenticado da empresa (RLS) quanto com o client
 * admin do webhook (service role).
 */
export async function promoverVaga(
  supabase: SupabaseClient,
  vagaId: number,
  paymentId: string
): Promise<void> {
  const agora = new Date();
  const expira = new Date(agora.getTime() + VALIDADE_DIAS * 86_400_000);

  await supabase
    .from("vagas")
    .update({
      status: "ativa",
      data_publicacao: agora.toISOString(),
      data_expiracao: expira.toISOString(),
    })
    .eq("id", vagaId)
    .eq("status", "aguardando_pagamento"); // idempotência

  await supabase
    .from("pagamentos")
    .update({ status: "aprovado", confirmado_em: agora.toISOString() })
    .eq("id_externo_gateway", paymentId);
}
