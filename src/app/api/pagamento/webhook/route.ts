import { createAdminClient, temServiceRole } from "@/lib/supabase/admin";
import { getStatusPagamento } from "@/lib/mercadopago";
import { promoverVaga } from "@/lib/promover-vaga";

/**
 * Webhook do Mercado Pago (produção): chamado quando o pagamento muda de estado.
 * Confirma o status na API e publica a vaga via service role (sem sessão).
 *
 * Configurar a URL pública desta rota em: Mercado Pago > sua aplicação > Webhooks.
 */
export async function POST(req: Request) {
  if (!temServiceRole()) {
    // Sem service role, o webhook não consegue publicar (use a confirmação local).
    return new Response(null, { status: 200 });
  }

  let paymentId: string | null = null;
  try {
    const url = new URL(req.url);
    paymentId = url.searchParams.get("data.id");
    if (!paymentId) {
      const body = await req.json().catch(() => null);
      paymentId = body?.data?.id ? String(body.data.id) : null;
    }
  } catch {
    /* ignora corpo malformado */
  }
  if (!paymentId) return new Response(null, { status: 200 });

  try {
    const status = await getStatusPagamento(paymentId);
    if (status === "approved") {
      const admin = createAdminClient();
      const { data: pag } = await admin
        .from("pagamentos")
        .select("vaga_id")
        .eq("id_externo_gateway", paymentId)
        .maybeSingle();
      if (pag?.vaga_id) {
        await promoverVaga(admin, pag.vaga_id as number, paymentId);
      }
    }
  } catch {
    /* Responde 200 mesmo assim para o MP não reenviar em loop por erro nosso. */
  }

  return new Response(null, { status: 200 });
}
