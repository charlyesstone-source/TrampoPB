import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Proxy (antigo "middleware"): mantém a sessão do Supabase renovada em todas as
 * rotas (exceto estáticos), propagando os cookies de autenticação.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Todas as rotas, menos:
     * - _next/static, _next/image (assets)
     * - favicon e arquivos de imagem
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
