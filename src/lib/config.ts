/**
 * Configuração central do TrampoPB.
 * Valores de negócio ficam aqui para serem alterados num único lugar
 * (preço da vaga, validade do anúncio, contatos da marca).
 */

/** Preço de uma vaga, em centavos (R$ 39,90). */
export const PRECO_VAGA_CENTAVOS = 3990;

/** Dias que uma vaga fica no ar antes de expirar. */
export const VALIDADE_DIAS = 15;

/**
 * Cobrança ligada? No período de lançamento fica `false` — as vagas são
 * publicadas de graça (sem Pix). Quando for ligar a cobrança de R$ 39,90,
 * basta mudar para `true` e fazer o deploy.
 */
export const COBRANCA_ATIVA = false;

/** Tempo de expiração do Pix, em segundos (15 minutos). */
export const PIX_EXPIRA_SEGUNDOS = 15 * 60;

/** Cidade/UF atendida (exibida no cabeçalho). */
export const CIDADE = "João Pessoa, PB";

/**
 * ⚠️ DEMONSTRAÇÃO — base somada ao número de "empregos contratados" no carrossel.
 *
 * O CLAUDE.md define como princípio do fundador que esse número deve ser REAL
 * (vem do status 'contratado' das candidaturas) e que NÃO se deve inflar.
 * Este valor é um PLACEHOLDER apenas para a demonstração atual e **DEVE VOLTAR
 * A 0 ANTES DO LANÇAMENTO**, para o número refletir só contratações reais.
 */
export const CONTRATADOS_DEMO_BASE = 70;

/** Formata centavos como moeda brasileira: 3990 -> "R$ 39,90". */
export function formatarPreco(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Preço da vaga já formatado, para uso direto na interface. */
export const PRECO_VAGA_LABEL = formatarPreco(PRECO_VAGA_CENTAVOS);

/** Tempo relativo curto em PT-BR: "agora", "há 3 horas", "há 2 dias". */
export function formatarHa(data: string | Date): string {
  const d = typeof data === "string" ? new Date(data) : data;
  const seg = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (seg < 60) return "agora";
  const min = Math.floor(seg / 60);
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} hora${h > 1 ? "s" : ""}`;
  const dias = Math.floor(h / 24);
  return `há ${dias} dia${dias > 1 ? "s" : ""}`;
}
