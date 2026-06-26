/**
 * Modelos de dados do TrampoPB (Fase 1 — mock em memória).
 * Alinhados ao §3 da ESPECIFICACAO.md para facilitar a ligação futura ao Supabase.
 */

export type TipoContrato =
  | "CLT"
  | "Temporário"
  | "Estágio"
  | "Meio período"
  | "Freelancer";

export type Categoria =
  | "Comércio"
  | "Serviços Gerais"
  | "Atendimento"
  | "Administrativo"
  | "Saúde"
  | "TI"
  | "Estágio";

/** Status do ciclo de vida de uma candidatura (visão empresa). */
export type StatusCandidatura = "novo" | "analise" | "contratado";

/** Status do anúncio de vaga. No mock só usamos 'ativa'. */
export type StatusVaga = "rascunho" | "aguardando_pagamento" | "ativa" | "expirada";

export interface Vaga {
  id: number;
  titulo: string;
  empresa: string;
  bairro: string;
  salario: string;
  tipo: TipoContrato;
  categoria: Categoria;
  publicadaHa: string;
  descricao: string;
  requisitos: string[];
  beneficios?: string[];
  emailContato?: string;
  whatsappContato?: string;
  /** Dias de validade restantes (quando aplicável). */
  validadeDias?: number;
}

/** O que vira "currículo" enviado à empresa quando o candidato se candidata. */
export interface Candidato {
  registrado: boolean;
  nome: string;
  whatsapp: string;
  email: string;
  area: string;
  bairro: string;
  sobre: string;
  experiencia: string;
}

export interface Empresa {
  registrada: boolean;
  nome: string;
  email: string;
}

export interface Candidatura {
  vagaId: number;
  nome: string;
  area: string;
  bairro: string;
  whatsapp: string;
  email: string;
  sobre: string;
  quando: string;
  status: StatusCandidatura;
}

/** Dados de uma vaga em criação, antes da confirmação do pagamento. */
export type VagaPendente = Omit<Vaga, "id">;

/** Cobrança Pix aberta no gateway (Mercado Pago), exibida na tela de pagamento. */
export interface CobrancaPix {
  vagaId: number;
  titulo: string;
  mpPaymentId: string;
  /** PNG do QR em base64 (sem prefixo data:). */
  qrCodeBase64: string;
  /** EMV "copia e cola". */
  copiaECola: string;
  expiraEm: string | null;
  /** Ambiente de teste do gateway (mostra o botão de simular pagamento). */
  sandbox: boolean;
}

export interface Depoimento {
  iniciais: string;
  frase: string;
  nome: string;
  bairro: string;
}
