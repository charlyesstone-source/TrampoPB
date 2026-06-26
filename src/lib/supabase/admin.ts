import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a service_role (ignora a RLS) — SOMENTE servidor.
 * Usado pelo webhook do Pix, que não tem sessão de usuário e precisa
 * publicar a vaga após a confirmação do pagamento.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function temServiceRole(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
