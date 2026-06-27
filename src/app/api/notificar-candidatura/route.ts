import { createClient } from "@/lib/supabase/server";
import { createAdminClient, temServiceRole } from "@/lib/supabase/admin";
import { enviarEmail, temEmail } from "@/lib/email";

/**
 * Avisa a empresa, por e-mail, que recebeu uma nova candidatura.
 *
 * Chamado pelo cliente logo após o candidato se candidatar (best-effort: se
 * falhar, a candidatura já está gravada e o aviso só não sai).
 *
 * Segurança:
 *  - Exige sessão (o candidato logado) — bloqueia disparo anônimo.
 *  - Confirma, pela RLS do próprio candidato, que a candidatura existe mesmo
 *    para (vaga, candidato) — assim ninguém dispara e-mail para vaga alheia.
 *  - O e-mail da empresa só é lido pelo client admin (service role), no
 *    servidor; o candidato nunca tem acesso a ele.
 */
export async function POST(req: Request) {
  // Sem chaves (ambiente local/sem configurar), vira no-op — não quebra nada.
  if (!temEmail() || !temServiceRole()) {
    return Response.json({ enviado: false, motivo: "sem-config" });
  }

  let vagaId: number | null = null;
  try {
    const body = await req.json();
    vagaId = Number(body?.vagaId);
  } catch {
    /* corpo inválido */
  }
  if (!vagaId || Number.isNaN(vagaId)) {
    return Response.json({ erro: "vagaId inválido" }, { status: 400 });
  }

  // 1) Quem está chamando precisa estar logado.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ erro: "não autenticado" }, { status: 401 });
  }

  // 2) A candidatura tem que existir de fato (RLS já restringe ao próprio).
  const { data: cand } = await supabase
    .from("candidaturas")
    .select("snapshot_curriculo")
    .eq("vaga_id", vagaId)
    .eq("candidato_id", user.id)
    .maybeSingle();
  if (!cand) {
    return Response.json({ erro: "candidatura não encontrada" }, { status: 404 });
  }

  // 3) Dados da vaga + e-mail da empresa, via service role (ignora a RLS).
  const admin = createAdminClient();
  const { data: vaga } = await admin
    .from("vagas")
    .select("titulo, empresa_id, empresa_nome, email_contato")
    .eq("id", vagaId)
    .maybeSingle();
  if (!vaga) {
    return Response.json({ erro: "vaga não encontrada" }, { status: 404 });
  }

  // Destino: o "E-mail de cadastro" informado na vaga. Se estiver vazio, cai
  // para o e-mail da conta da empresa (para o aviso não se perder).
  let destino = vaga.email_contato?.trim();
  if (!destino) {
    const { data: empresa } = await admin
      .from("empresas")
      .select("email")
      .eq("id", vaga.empresa_id)
      .maybeSingle();
    destino = empresa?.email?.trim();
  }
  if (!destino) {
    return Response.json({ enviado: false, motivo: "sem-email-destino" });
  }

  // 4) Monta e envia o aviso.
  const snap = (cand.snapshot_curriculo ?? {}) as {
    nome?: string;
    area?: string;
    bairro?: string;
  };
  const nome = snap.nome?.trim() || "Um candidato";
  const link = `${new URL(req.url).origin}/candidaturas`;

  const enviado = await enviarEmail({
    para: destino,
    assunto: `${nome} se candidatou à vaga "${vaga.titulo}"`,
    html: montarHtml({
      empresaNome: vaga.empresa_nome,
      vagaTitulo: vaga.titulo,
      candidatoNome: nome,
      candidatoArea: snap.area?.trim() || "",
      candidatoBairro: snap.bairro?.trim() || "",
      link,
    }),
  });

  return Response.json({ enviado });
}

/** E-mail simples, inline-styled (clientes de e-mail ignoram CSS externo). */
function montarHtml(d: {
  empresaNome: string;
  vagaTitulo: string;
  candidatoNome: string;
  candidatoArea: string;
  candidatoBairro: string;
  link: string;
}): string {
  const detalhe = [d.candidatoArea, d.candidatoBairro].filter(Boolean).join(" · ");
  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;background:#F4F2EC;font-family:Inter,Arial,sans-serif;color:#14201D">
  <div style="max-width:480px;margin:0 auto;padding:24px">
    <div style="font-size:20px;font-weight:700;color:#0E7C66;margin-bottom:16px">TrampoPB</div>
    <div style="background:#fff;border-radius:16px;padding:24px">
      <p style="margin:0 0 8px;font-size:16px">Olá, ${escapar(d.empresaNome)}!</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.5">
        Você recebeu uma nova candidatura para a vaga
        <b>${escapar(d.vagaTitulo)}</b>.
      </p>
      <div style="background:#F4F2EC;border-radius:12px;padding:16px;margin-bottom:20px">
        <div style="font-size:16px;font-weight:700">${escapar(d.candidatoNome)}</div>
        ${detalhe ? `<div style="font-size:14px;color:#4a5b56;margin-top:4px">${escapar(detalhe)}</div>` : ""}
      </div>
      <a href="${d.link}"
         style="display:inline-block;background:#0E7C66;color:#fff;text-decoration:none;
                font-weight:600;padding:12px 20px;border-radius:999px;font-size:15px">
        Ver candidatura
      </a>
    </div>
    <p style="font-size:12px;color:#7a8884;text-align:center;margin-top:20px">
      Você recebeu este aviso porque tem uma vaga publicada no TrampoPB.
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
