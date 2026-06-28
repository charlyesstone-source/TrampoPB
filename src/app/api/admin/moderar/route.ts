import { getDono, modoDemoLocal } from "@/lib/admin-auth";
import { createAdminClient, temServiceRole } from "@/lib/supabase/admin";

/**
 * Ações de moderação sobre uma denúncia. Só o dono do app executa.
 *
 *  - tirar_do_ar : esconde a vaga do feed (status 'expirada'), reversível;
 *                  marca a denúncia como 'revisada'.
 *  - excluir_vaga: apaga a vaga de vez (cascata remove candidaturas);
 *                  marca a denúncia como 'revisada'.
 *  - arquivar    : denúncia improcedente → 'arquivada' (vaga intacta).
 *  - reabrir     : volta a denúncia para 'aberta'.
 */
const ACOES = ["tirar_do_ar", "excluir_vaga", "arquivar", "reabrir"] as const;
type Acao = (typeof ACOES)[number];

export async function POST(req: Request) {
  // Modo demonstração local: aceita a ação como no-op (não há banco real).
  if (modoDemoLocal()) {
    return Response.json({ ok: true, demo: true });
  }
  if (!temServiceRole()) {
    return Response.json({ erro: "indisponível" }, { status: 503 });
  }
  const dono = await getDono();
  if (!dono) {
    return Response.json({ erro: "acesso restrito" }, { status: 403 });
  }

  let denunciaId: number | null = null;
  let acao = "";
  try {
    const body = await req.json();
    denunciaId = Number(body?.denunciaId);
    acao = String(body?.acao ?? "");
  } catch {
    /* corpo inválido */
  }
  if (!denunciaId || Number.isNaN(denunciaId)) {
    return Response.json({ erro: "denunciaId inválido" }, { status: 400 });
  }
  if (!ACOES.includes(acao as Acao)) {
    return Response.json({ erro: "ação inválida" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Carrega a denúncia para descobrir a vaga alvo.
  const { data: den } = await admin
    .from("denuncias")
    .select("id, vaga_id")
    .eq("id", denunciaId)
    .maybeSingle();
  if (!den) {
    return Response.json({ erro: "denúncia não encontrada" }, { status: 404 });
  }
  const vagaId = (den as { vaga_id: number | null }).vaga_id;

  if (acao === "arquivar" || acao === "reabrir") {
    const novo = acao === "arquivar" ? "arquivada" : "aberta";
    const { error } = await admin
      .from("denuncias")
      .update({ status: novo })
      .eq("id", denunciaId);
    if (error) return falha(error.message);
    return Response.json({ ok: true });
  }

  // Ações que mexem na vaga.
  if (!vagaId) {
    return Response.json(
      { erro: "a vaga já foi removida" },
      { status: 409 }
    );
  }

  if (acao === "tirar_do_ar") {
    const { error } = await admin
      .from("vagas")
      .update({ status: "expirada" })
      .eq("id", vagaId);
    if (error) return falha(error.message);
  } else if (acao === "excluir_vaga") {
    const { error } = await admin.from("vagas").delete().eq("id", vagaId);
    if (error) return falha(error.message);
  }

  // Após agir na vaga, a denúncia fica 'revisada'.
  await admin
    .from("denuncias")
    .update({ status: "revisada" })
    .eq("id", denunciaId);

  return Response.json({ ok: true });
}

function falha(msg: string) {
  console.error("Falha na moderação:", msg);
  return Response.json({ erro: "falha ao moderar" }, { status: 500 });
}
