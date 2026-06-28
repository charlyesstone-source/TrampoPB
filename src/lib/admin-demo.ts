import "server-only";

/**
 * Denúncias de EXEMPLO para o modo demonstração local do painel /admin.
 * Só são servidas quando `modoDemoLocal()` é verdadeiro (dev sem service role).
 * Nunca aparecem em produção.
 */
const agora = Date.now();
const horasAtras = (h: number) => new Date(agora - h * 3_600_000).toISOString();

export const DENUNCIAS_DEMO = [
  {
    id: 9001,
    vagaId: 101,
    vagaTitulo: "Ganhe R$ 5.000/dia trabalhando de casa",
    empresaNome: "Renda Fácil JP",
    motivo: "Vaga falsa ou golpe",
    detalhe: "Pediram um depósito de R$ 80 para 'liberar o cadastro'.",
    anonima: false,
    status: "aberta",
    criadoEm: horasAtras(2),
    vagaStatus: "ativa",
  },
  {
    id: 9002,
    vagaId: 102,
    vagaTitulo: "Vendedor(a) — Centro",
    empresaNome: "Loja do Centro",
    motivo: "Pede dinheiro ou depósito",
    detalhe: "",
    anonima: true,
    status: "aberta",
    criadoEm: horasAtras(20),
    vagaStatus: "ativa",
  },
  {
    id: 9003,
    vagaId: null,
    vagaTitulo: "Auxiliar de cozinha (anúncio já removido)",
    empresaNome: "Restaurante Maré",
    motivo: "Conteúdo ofensivo",
    detalhe: "Texto com termos preconceituosos.",
    anonima: false,
    status: "revisada",
    criadoEm: horasAtras(50),
    vagaStatus: "removida",
  },
] as const;
