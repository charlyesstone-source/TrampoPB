import { getStatusPagamento } from "@/lib/mercadopago";
import { promoverVaga } from "@/lib/promover-vaga";
import { createClient } from "@/lib/supabase/server";

/**
 * Consulta o status do pagamento no Mercado Pago. Se aprovado, publica a vaga
 * (usando a sessão da empresa logada — funciona localmente sem webhook público).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const paymentId = url.searchParams.get("paymentId");
  const vagaId = Number(url.searchParams.get("vagaId"));
  if (!paymentId || Number.isNaN(vagaId)) {
    return Response.json({ erro: "Parâmetros inválidos." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ erro: "Não autenticado." }, { status: 401 });

  let status: string;
  try {
    status = await getStatusPagamento(paymentId);
  } catch (e) {
    return Response.json(
      { erro: e instanceof Error ? e.message : "Falha ao consultar." },
      { status: 502 }
    );
  }

  let publicada = false;
  if (status === "approved") {
    await promoverVaga(supabase, vagaId, paymentId);
    publicada = true;
  }

  return Response.json({ status, publicada });
}
