import { getDono, modoDemoLocal } from "@/lib/admin-auth";

/**
 * Diz se o usuário logado é dono do app. Usado para mostrar (ou não) o atalho
 * de "Moderação" no perfil, sem expor a lista de e-mails de dono ao cliente.
 */
export async function GET() {
  // No modo demonstração local, libera o atalho para o dono ver a tela.
  if (modoDemoLocal()) {
    return Response.json({ dono: true, demo: true });
  }
  const dono = await getDono();
  return Response.json({ dono: Boolean(dono) });
}
