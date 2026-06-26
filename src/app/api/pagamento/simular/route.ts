import { ehSandbox } from "@/lib/mercadopago";
import { promoverVaga } from "@/lib/promover-vaga";
import { createClient } from "@/lib/supabase/server";

/**
 * SOMENTE SANDBOX: confirma o pagamento manualmente, já que no ambiente de teste
 * não há banco real para pagar o Pix. Em produção (token sem TEST-) é bloqueada.
 */
export async function POST(req: Request) {
  if (!ehSandbox()) {
    return Response.json(
      { erro: "Simulação só disponível em sandbox." },
      { status: 403 }
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.papel !== "empresa") {
    return Response.json({ erro: "Não autorizado." }, { status: 403 });
  }

  const { vagaId, mpPaymentId } = await req.json();
  if (typeof vagaId !== "number" || !mpPaymentId) {
    return Response.json({ erro: "Parâmetros inválidos." }, { status: 400 });
  }

  await promoverVaga(supabase, vagaId, String(mpPaymentId));
  return Response.json({ ok: true });
}
