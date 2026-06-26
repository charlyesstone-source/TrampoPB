/**
 * Integração com o Mercado Pago (Pix) — SOMENTE servidor.
 * Usa a REST API diretamente; o Access Token nunca sai do servidor.
 */
import "server-only";
import { randomUUID } from "node:crypto";

const MP_BASE = "https://api.mercadopago.com";

const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

function token(): string {
  const t = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!t) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado.");
  return t;
}

/** True se está em ambiente de teste (token começa com TEST-). */
export function ehSandbox(): boolean {
  return (process.env.MERCADOPAGO_ACCESS_TOKEN ?? "").startsWith("TEST-");
}

export function temMercadoPago(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

export interface CobrancaPixMP {
  paymentId: string;
  status: string;
  /** EMV "copia e cola". */
  copiaECola: string;
  /** PNG do QR em base64 (sem o prefixo data:). */
  qrCodeBase64: string;
  ticketUrl: string | null;
  expiraEm: string | null;
}

interface MPPaymentResponse {
  id: number;
  status: string;
  date_of_expiration?: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
}

/**
 * Cria uma cobrança Pix e devolve o QR + copia-e-cola.
 *
 * Repete automaticamente em erros transitórios do Mercado Pago (5xx/rede), que
 * acontecem de forma intermitente. A chave de idempotência é estável entre as
 * tentativas, então o MP não cria cobrança duplicada se uma tentativa tiver
 * passado parcialmente.
 */
export async function criarCobrancaPix(args: {
  valorCentavos: number;
  descricao: string;
  emailPagador: string;
  referenciaExterna: string;
}): Promise<CobrancaPixMP> {
  const idempotencyKey = `${args.referenciaExterna}-${randomUUID()}`;
  const corpo = JSON.stringify({
    transaction_amount: args.valorCentavos / 100,
    description: args.descricao,
    payment_method_id: "pix",
    external_reference: args.referenciaExterna,
    payer: { email: args.emailPagador },
  });

  const MAX_TENTATIVAS = 3;
  let ultimoErro = "erro desconhecido";

  for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
    try {
      const res = await fetch(`${MP_BASE}/v1/payments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": idempotencyKey,
        },
        body: corpo,
      });

      const data = (await res.json()) as MPPaymentResponse & {
        message?: string;
        error?: string;
      };

      if (res.ok) {
        const td = data.point_of_interaction?.transaction_data;
        return {
          paymentId: String(data.id),
          status: data.status,
          copiaECola: td?.qr_code ?? "",
          qrCodeBase64: td?.qr_code_base64 ?? "",
          ticketUrl: td?.ticket_url ?? null,
          expiraEm: data.date_of_expiration ?? null,
        };
      }

      ultimoErro = data.message ?? data.error ?? res.statusText;
      // 4xx é erro da requisição: repetir não adianta.
      if (res.status < 500) break;
    } catch (e) {
      // Falha de rede — tratada como transitória.
      ultimoErro = e instanceof Error ? e.message : "falha de rede";
    }

    if (tentativa < MAX_TENTATIVAS) await espera(500 * tentativa);
  }

  throw new Error(`Mercado Pago: ${ultimoErro}`);
}

/** Consulta o status atual de um pagamento. */
export async function getStatusPagamento(paymentId: string): Promise<string> {
  const res = await fetch(`${MP_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token()}` },
    cache: "no-store",
  });
  const data = (await res.json()) as MPPaymentResponse & { message?: string };
  if (!res.ok) throw new Error(`Mercado Pago: ${data.message ?? res.statusText}`);
  return data.status;
}
