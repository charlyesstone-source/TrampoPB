import { createClient } from "@/lib/supabase/server";
import { createAdminClient, temServiceRole } from "@/lib/supabase/admin";
import { enviarEmail, temEmail } from "@/lib/email";
import { MOTIVOS_DENUNCIA } from "@/lib/config";

/**
 * Registra a denúncia de uma vaga (moderação anti-golpe).
 *
 * Aberto a qualquer visitante (não exige login): num site público de vagas,
 * quem percebe um golpe pode não ter conta. Por isso a gravação passa pelo
 * client admin (service role) — a tabela `denuncias` tem RLS sem políticas,
 * então só esta rota escreve nela, e ninguém consegue ler/apagar denúncias.
 *
 * O fundador recebe um aviso por e-mail (best-effort) e modera pelo Supabase.
 */

/** Para onde vai o aviso de denúncia (fundador). Configurável por env. */
const EMAIL_DENUNCIAS =
  process.env.EMAIL_DENUNCIAS || "charlyes.stone@gmail.com";

const LIMITE_DETALHE = 600;

export async function POST(req: Request) {
  if (!temServiceRole()) {
    // Sem service role não há como gravar com segurança. Em produção a chave
    // está configurada; localmente vira aviso claro no log.
    console.error("Denúncia: SUPABASE_SERVICE_ROLE_KEY não configurada.");
    return Response.json({ erro: "indisponível" }, { status: 503 });
  }

  // 1) Lê e valida o corpo.
  let vagaId: number | null = null;
  let motivo = "";
  let detalhe = "";
  try {
    const body = await req.json();
    vagaId = Number(body?.vagaId);
    motivo = String(body?.motivo ?? "").trim();
    detalhe = String(body?.detalhe ?? "").trim().slice(0, LIMITE_DETALHE);
  } catch {
    /* corpo inválido */
  }
  if (!vagaId || Number.isNaN(vagaId)) {
    return Response.json({ erro: "vagaId inválido" }, { status: 400 });
  }
  if (!MOTIVOS_DENUNCIA.includes(motivo as never)) {
    return Response.json({ erro: "motivo inválido" }, { status: 400 });
  }

  const admin = createAdminClient();

  // 2) Confirma que a vaga existe e captura nome/título (desnormalizados).
  const { data: vaga } = await admin
    .from("vagas")
    .select("id, titulo, empresa_nome")
    .eq("id", vagaId)
    .maybeSingle();
  if (!vaga) {
    return Response.json({ erro: "vaga não encontrada" }, { status: 404 });
  }

  // 3) Quem denuncia pode estar logado — guarda o id (opcional) para contexto.
  let denuncianteId: string | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    denuncianteId = user?.id ?? null;
  } catch {
    /* sem sessão: denúncia anônima, segue normal */
  }

  // 4) Grava a denúncia.
  const { error } = await admin.from("denuncias").insert({
    vaga_id: vaga.id,
    vaga_titulo: vaga.titulo,
    empresa_nome: vaga.empresa_nome,
    motivo,
    detalhe,
    denunciante_id: denuncianteId,
  });
  if (error) {
    console.error("Falha ao gravar denúncia:", error.message);
    return Response.json({ erro: "falha ao registrar" }, { status: 500 });
  }

  // 5) Avisa o fundador por e-mail (best-effort: não quebra se falhar).
  if (temEmail()) {
    const link = `${new URL(req.url).origin}/anuncios`;
    await enviarEmail({
      para: EMAIL_DENUNCIAS,
      assunto: `🚩 Denúncia de vaga: "${vaga.titulo}"`,
      html: montarHtml({
        vagaId: vaga.id,
        vagaTitulo: vaga.titulo,
        empresaNome: vaga.empresa_nome,
        motivo,
        detalhe,
        denuncianteId,
        link,
      }),
    });
  }

  return Response.json({ ok: true });
}

/** E-mail simples, inline-styled, para o fundador moderar. */
function montarHtml(d: {
  vagaId: number;
  vagaTitulo: string;
  empresaNome: string;
  motivo: string;
  detalhe: string;
  denuncianteId: string | null;
  link: string;
}): string {
  const linhas = [
    ["Vaga", `${escapar(d.vagaTitulo)} (#${d.vagaId})`],
    ["Empresa", escapar(d.empresaNome)],
    ["Motivo", escapar(d.motivo)],
    ["Detalhe", d.detalhe ? escapar(d.detalhe) : "—"],
    ["Denunciante", d.denuncianteId ? escapar(d.denuncianteId) : "anônimo"],
  ]
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 10px 4px 0;color:#7a8884;font-size:13px;vertical-align:top">${k}</td><td style="padding:4px 0;font-size:14px">${v}</td></tr>`
    )
    .join("");
  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;background:#F4F2EC;font-family:Inter,Arial,sans-serif;color:#14201D">
  <div style="max-width:480px;margin:0 auto;padding:24px">
    <div style="font-size:20px;font-weight:700;color:#0E7C66;margin-bottom:16px">TrampoPB · Moderação</div>
    <div style="background:#fff;border-radius:16px;padding:24px">
      <p style="margin:0 0 16px;font-size:15px;line-height:1.5">
        Uma vaga foi <b>denunciada</b>. Revise e, se for o caso, remova o anúncio.
      </p>
      <table style="border-collapse:collapse;width:100%">${linhas}</table>
    </div>
    <p style="font-size:12px;color:#7a8884;text-align:center;margin-top:20px">
      Aviso automático de denúncia. Modere pelo Supabase (tabela <b>denuncias</b>).
    </p>
  </div>
</body></html>`;
}

/** Escapa texto para interpolar com segurança no HTML do e-mail. */
function escapar(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
