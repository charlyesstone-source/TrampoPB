import "server-only";
import { createClient } from "./supabase/server";
import { temServiceRole } from "./supabase/admin";

/**
 * Modo demonstração LOCAL: ligado só em desenvolvimento e quando NÃO há service
 * role (ex.: `.env.local` sem a chave). Serve para o dono VER a tela /admin com
 * dados de exemplo, sem tocar no banco de produção. Em produção é sempre `false`
 * (lá NODE_ENV=production e a service role existe).
 */
export function modoDemoLocal(): boolean {
  return process.env.NODE_ENV === "development" && !temServiceRole();
}

/**
 * Controle de acesso do painel de moderação (/admin).
 *
 * Só o(s) dono(s) do app entram. A lista vem da env `ADMIN_EMAILS`
 * (e-mails separados por vírgula); se não houver, cai no e-mail do fundador.
 * A checagem é SEMPRE no servidor — a lista nunca vai para o cliente.
 */
const EMAILS_DONO = (process.env.ADMIN_EMAILS || "charlyes.stone@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function ehEmailDono(email: string | null | undefined): boolean {
  return Boolean(email && EMAILS_DONO.includes(email.toLowerCase()));
}

/**
 * Devolve o usuário logado se ele for dono do app; senão `null`.
 * Use no início de cada rota /api/admin para barrar quem não é dono.
 */
export async function getDono() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !ehEmailDono(user.email)) return null;
  return user;
}
