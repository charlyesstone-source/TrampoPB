/**
 * Envio de e-mail transacional — SOMENTE servidor.
 * Usa a REST API do Resend (https://resend.com) direto via fetch, então não
 * precisa de dependência nova. A chave nunca sai do servidor.
 *
 * Sem RESEND_API_KEY configurada o envio vira um no-op silencioso: o app
 * funciona normalmente (a candidatura é gravada), só não dispara o aviso.
 */
import "server-only";

const RESEND_BASE = "https://api.resend.com";

/** Remetente padrão. O domínio onboarding@resend.dev funciona sem verificar
 *  domínio (bom para testar). Em produção, configure EMAIL_REMETENTE com um
 *  endereço de domínio verificado no Resend. */
const REMETENTE_PADRAO = "TrampoPB <onboarding@resend.dev>";

export function temEmail(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export interface Email {
  para: string;
  assunto: string;
  html: string;
}

/**
 * Envia um e-mail. Devolve `true` se foi aceito pelo provedor.
 * Nunca lança: erros são registrados e a função devolve `false`, para que o
 * fluxo que chamou (ex.: candidatura) não quebre por causa do aviso.
 */
export async function enviarEmail(email: Email): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;

  try {
    const res = await fetch(`${RESEND_BASE}/emails`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_REMETENTE || REMETENTE_PADRAO,
        to: email.para,
        subject: email.assunto,
        html: email.html,
      }),
    });
    if (!res.ok) {
      const detalhe = await res.text().catch(() => res.statusText);
      console.error("Resend recusou o e-mail:", res.status, detalhe);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Falha ao enviar e-mail:", e);
    return false;
  }
}
