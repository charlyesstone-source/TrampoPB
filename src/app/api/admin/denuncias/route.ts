import { getDono, modoDemoLocal } from "@/lib/admin-auth";
import { DENUNCIAS_DEMO } from "@/lib/admin-demo";
import { createAdminClient, temServiceRole } from "@/lib/supabase/admin";

/**
 * Lista as denúncias para o painel de moderação. Só o dono do app acessa.
 * Lê via service role (a tabela `denuncias` tem RLS sem políticas), e embute o
 * status atual da vaga para a tela mostrar se ela ainda está no ar.
 */
export async function GET() {
  // Modo demonstração local: devolve exemplos para o dono ver a tela.
  if (modoDemoLocal()) {
    return Response.json({ denuncias: DENUNCIAS_DEMO, demo: true });
  }
  if (!temServiceRole()) {
    return Response.json({ erro: "indisponível" }, { status: 503 });
  }
  const dono = await getDono();
  if (!dono) {
    return Response.json({ erro: "acesso restrito" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("denuncias")
    .select(
      "id, vaga_id, vaga_titulo, empresa_nome, motivo, detalhe, denunciante_id, status, criado_em, vagas(status)"
    )
    .order("criado_em", { ascending: false });
  if (error) {
    console.error("Falha ao listar denúncias:", error.message);
    return Response.json({ erro: "falha ao listar" }, { status: 500 });
  }

  type Row = {
    id: number;
    vaga_id: number | null;
    vaga_titulo: string;
    empresa_nome: string;
    motivo: string;
    detalhe: string;
    denunciante_id: string | null;
    status: string;
    criado_em: string;
    vagas: { status: string } | null;
  };

  const denuncias = (data as unknown as Row[]).map((r) => ({
    id: r.id,
    vagaId: r.vaga_id,
    vagaTitulo: r.vaga_titulo,
    empresaNome: r.empresa_nome,
    motivo: r.motivo,
    detalhe: r.detalhe,
    anonima: !r.denunciante_id,
    status: r.status,
    criadoEm: r.criado_em,
    // Estado atual da vaga: 'removida' se a vaga já não existe; senão o status.
    vagaStatus: r.vaga_id ? r.vagas?.status ?? "removida" : "removida",
  }));

  return Response.json({ denuncias });
}
