import { COBRANCA_ATIVA, PRECO_VAGA_CENTAVOS, VALIDADE_DIAS } from "@/lib/config";
import { criarCobrancaPix, ehSandbox, temMercadoPago } from "@/lib/mercadopago";
import { createClient } from "@/lib/supabase/server";

/**
 * Publica uma vaga.
 * - Período gratuito (COBRANCA_ATIVA = false): cria a vaga já ATIVA, sem Pix.
 * - Cobrança ligada: cria 'aguardando_pagamento' e abre a cobrança Pix; a vaga
 *   só vai ao ar após a confirmação (status/route ou webhook).
 */
export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.papel !== "empresa") {
    return Response.json({ erro: "Apenas empresas podem anunciar." }, { status: 403 });
  }

  const b = await req.json();
  const requisitos: string[] = Array.isArray(b.requisitos) ? b.requisitos : [];

  const dadosVaga = {
    empresa_id: user.id,
    empresa_nome: String(b.empresa ?? "").trim(),
    titulo: String(b.titulo ?? "").trim(),
    bairro: String(b.bairro ?? "").trim(),
    salario: String(b.salario ?? "").trim() || "A combinar",
    tipo: String(b.tipo ?? "").trim(),
    categoria: String(b.categoria ?? "").trim(),
    descricao: String(b.descricao ?? "").trim(),
    requisitos: requisitos.length ? requisitos : ["Não informado"],
    beneficios: [] as string[],
    email_contato: b.emailContato ?? null,
    whatsapp_contato: b.whatsappContato ?? null,
  };

  // ----- Período gratuito: publica direto -----------------------------------
  if (!COBRANCA_ATIVA) {
    const agora = new Date();
    const expira = new Date(agora.getTime() + VALIDADE_DIAS * 86_400_000);
    const { data: vaga, error } = await supabase
      .from("vagas")
      .insert({
        ...dadosVaga,
        status: "ativa",
        data_publicacao: agora.toISOString(),
        data_expiracao: expira.toISOString(),
      })
      .select("id, titulo")
      .single();
    if (error || !vaga) {
      return Response.json(
        { erro: error?.message ?? "Falha ao publicar a vaga." },
        { status: 400 }
      );
    }
    return Response.json({ publicada: true, vagaId: vaga.id, titulo: vaga.titulo });
  }

  // ----- Cobrança ligada: vaga aguardando pagamento + Pix -------------------
  if (!temMercadoPago()) {
    return Response.json(
      { erro: "Pagamento não configurado (MERCADOPAGO_ACCESS_TOKEN)." },
      { status: 503 }
    );
  }

  const { data: vaga, error: erroVaga } = await supabase
    .from("vagas")
    .insert({ ...dadosVaga, status: "aguardando_pagamento" })
    .select("id, titulo")
    .single();
  if (erroVaga || !vaga) {
    return Response.json(
      { erro: erroVaga?.message ?? "Falha ao criar a vaga." },
      { status: 400 }
    );
  }

  let cobranca;
  try {
    cobranca = await criarCobrancaPix({
      valorCentavos: PRECO_VAGA_CENTAVOS,
      descricao: `TrampoPB — anúncio: ${vaga.titulo}`,
      emailPagador: user.email ?? "sem-email@trampopb.com",
      referenciaExterna: `vaga-${vaga.id}`,
    });
  } catch (e) {
    await supabase.from("vagas").delete().eq("id", vaga.id); // desfaz vaga órfã
    return Response.json(
      { erro: e instanceof Error ? e.message : "Falha no Mercado Pago." },
      { status: 502 }
    );
  }

  await supabase.from("pagamentos").insert({
    vaga_id: vaga.id,
    empresa_id: user.id,
    valor: PRECO_VAGA_CENTAVOS,
    metodo: "pix",
    status: "pendente",
    id_externo_gateway: cobranca.paymentId,
  });

  return Response.json({
    vagaId: vaga.id,
    titulo: vaga.titulo,
    mpPaymentId: cobranca.paymentId,
    qrCodeBase64: cobranca.qrCodeBase64,
    copiaECola: cobranca.copiaECola,
    expiraEm: cobranca.expiraEm,
    sandbox: ehSandbox(),
  });
}
