import { createClient } from "@/lib/supabase/server";
import { createAdminClient, temServiceRole } from "@/lib/supabase/admin";

/**
 * Exclui a conta do usuário logado e TODOS os seus dados (direito da LGPD).
 *
 * Apaga o usuário de auth via service role; a cascata do schema cuida do resto:
 *   auth.users → candidatos/empresas → vagas → candidaturas/pagamentos.
 * (As denúncias sobrevivem com o vínculo anulado — histórico de moderação.)
 *
 * Segurança: exige sessão e só apaga o PRÓPRIO usuário (o id vem da sessão,
 * nunca do corpo da requisição).
 */
export async function POST() {
  if (!temServiceRole()) {
    return Response.json({ erro: "indisponível" }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ erro: "não autenticado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("Falha ao excluir conta:", error.message);
    return Response.json({ erro: "falha ao excluir" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
