/**
 * Dados de exemplo (Fase 1 — sem backend).
 * Vagas, candidaturas e depoimentos extraídos do protótipo trampo-jp.html.
 *
 * IMPORTANTE (princípios de honestidade do CLAUDE.md):
 * - Os depoimentos abaixo são FICTÍCIOS, apenas para demonstração visual.
 *   No app real, só exibir pessoas reais com autorização.
 * - O número de "empregos contratados" NÃO é fixo aqui: é derivado das
 *   candidaturas com status 'contratado' (ver app-context).
 */

import type {
  Candidatura,
  Categoria,
  Depoimento,
  TipoContrato,
  Vaga,
} from "./types";

export const CORES_LOGO = [
  "#0E7C66",
  "#FF7A4D",
  "#3F6FB0",
  "#C2491F",
  "#7A5BB0",
  "#0E7C66",
  "#D08A1E",
  "#3FA08C",
];

/** Cor estável da logo a partir do id da vaga. */
export function corLogo(id: number): string {
  return CORES_LOGO[id % CORES_LOGO.length];
}

export const CATEGORIAS: Categoria[] = [
  "Comércio",
  "Serviços Gerais",
  "Atendimento",
  "Administrativo",
  "Saúde",
  "TI",
  "Estágio",
];

/** Chips de filtro (inclui "Todas"). */
export const CHIPS_CATEGORIA = ["Todas", ...CATEGORIAS] as const;

export const TIPOS_CONTRATO: TipoContrato[] = [
  "CLT",
  "Temporário",
  "Estágio",
  "Meio período",
  "Freelancer",
];

/** Bairros de João Pessoa usados no protótipo. */
export const BAIRROS = [
  "Manaíra",
  "Tambaú",
  "Bessa",
  "Bancários",
  "Mangabeira",
  "Centro",
  "Cabo Branco",
  "Valentina",
  "Geisel",
  "Jaguaribe",
];

export const VAGAS_INICIAIS: Vaga[] = [
  {
    id: 1,
    titulo: "Atendente de loja",
    empresa: "Rede Manaíra Calçados",
    bairro: "Manaíra",
    salario: "1.500 + comissão",
    tipo: "CLT",
    categoria: "Comércio",
    publicadaHa: "há 2 dias",
    descricao:
      "Atendimento ao cliente no salão de vendas, organização de vitrine e fechamento de caixa. Loja em shopping, escala 6x1.",
    requisitos: [
      "Ensino médio completo",
      "Experiência com vendas (desejável)",
      "Disponibilidade para trabalhar aos sábados",
    ],
    beneficios: ["Vale-transporte", "Comissão sobre vendas", "Desconto em produtos"],
  },
  {
    id: 2,
    titulo: "Auxiliar de serviços gerais",
    empresa: "Condomínio Altiplano Park",
    bairro: "Cabo Branco",
    salario: "1.412",
    tipo: "CLT",
    categoria: "Serviços Gerais",
    publicadaHa: "há 5 horas",
    descricao:
      "Limpeza e conservação das áreas comuns do condomínio, apoio à zeladoria e pequenos reparos.",
    requisitos: [
      "Ensino fundamental completo",
      "Experiência em limpeza",
      "Morar próximo à região (desejável)",
    ],
    beneficios: ["Vale-alimentação R$ 550", "Vale-transporte", "Uniforme"],
  },
  {
    id: 3,
    titulo: "Recepcionista de clínica",
    empresa: "Clínica Vida Bessa",
    bairro: "Bessa",
    salario: "1.600",
    tipo: "CLT",
    categoria: "Saúde",
    publicadaHa: "há 1 dia",
    descricao:
      "Recepção de pacientes, agendamento de consultas por telefone e WhatsApp, organização de prontuários.",
    requisitos: [
      "Informática básica",
      "Boa comunicação",
      "Experiência em recepção (desejável)",
    ],
    beneficios: ["Plano de saúde", "Vale-transporte", "Vale-alimentação"],
  },
  {
    id: 4,
    titulo: "Vendedor(a) externo",
    empresa: "Distribuidora Tambiá",
    bairro: "Centro",
    salario: "1.800 + comissão",
    tipo: "CLT",
    categoria: "Comércio",
    publicadaHa: "há 3 dias",
    descricao:
      "Visita a clientes na Grande João Pessoa, prospecção e fechamento de pedidos. Roteiro definido pela empresa.",
    requisitos: [
      "CNH categoria A ou B",
      "Experiência com vendas externas",
      "Perfil comunicativo",
    ],
    beneficios: ["Ajuda de custo combustível", "Comissão", "Celular corporativo"],
  },
  {
    id: 5,
    titulo: "Auxiliar administrativo",
    empresa: "Xcon Construção e Serviços",
    bairro: "Jaguaribe",
    salario: "1.550",
    tipo: "CLT",
    categoria: "Administrativo",
    publicadaHa: "há 4 dias",
    descricao:
      "Atender telefones, organizar documentos, lançar notas e dar apoio ao setor financeiro.",
    requisitos: [
      "Ensino médio completo",
      "Pacote Office",
      "Organização e proatividade",
    ],
    beneficios: ["Vale-transporte", "Vale-refeição"],
  },
  {
    id: 6,
    titulo: "Estágio em marketing",
    empresa: "Agência Litoral Digital",
    bairro: "Tambaú",
    salario: "800 (bolsa)",
    tipo: "Estágio",
    categoria: "Estágio",
    publicadaHa: "há 6 dias",
    descricao:
      "Apoio na criação de conteúdo para redes sociais, agendamento de posts e acompanhamento de métricas.",
    requisitos: [
      "Cursando Publicidade, Marketing ou ADM",
      "Noção de Canva / redes sociais",
      "Disponibilidade de 6h/dia",
    ],
    beneficios: ["Bolsa-auxílio", "Vale-transporte", "Horário flexível"],
  },
  {
    id: 7,
    titulo: "Desenvolvedor(a) front-end Jr",
    empresa: "Paraíba Tech Hub",
    bairro: "Bancários",
    salario: "2.800",
    tipo: "CLT",
    categoria: "TI",
    publicadaHa: "há 1 dia",
    descricao:
      "Manutenção e evolução de interfaces web em React, trabalho híbrido com 2 dias presenciais no bairro dos Bancários.",
    requisitos: ["HTML, CSS e JavaScript", "Noção de React", "Versionamento com Git"],
    beneficios: ["Híbrido", "Plano de saúde", "Auxílio home office"],
  },
  {
    id: 8,
    titulo: "Operador(a) de caixa",
    empresa: "Supermercado Mangabeira",
    bairro: "Mangabeira",
    salario: "1.412",
    tipo: "CLT",
    categoria: "Comércio",
    publicadaHa: "há 8 horas",
    descricao:
      "Registro de produtos, recebimento de pagamentos e atendimento no caixa. Escala 6x1 com folga rotativa.",
    requisitos: [
      "Ensino médio completo",
      "Agilidade com números",
      "Disponibilidade de horário",
    ],
    beneficios: ["Vale-alimentação", "Cesta básica", "Vale-transporte"],
  },
];

/** Candidaturas-semente (visão empresa). Inclui uma 'contratado' p/ a métrica real. */
export const CANDIDATURAS_INICIAIS: Candidatura[] = [
  {
    vagaId: 1,
    nome: "João Marques",
    area: "Comércio",
    bairro: "Mangabeira",
    whatsapp: "(83) 99654-2210",
    email: "joao.marques@email.com",
    sobre: "Experiência em vendas e atendimento ao público.",
    quando: "há 1 dia",
    status: "novo",
  },
  {
    vagaId: 1,
    nome: "Beatriz Lima",
    area: "Atendimento",
    bairro: "Cristo Redentor",
    whatsapp: "(83) 98123-7745",
    email: "bia.lima@email.com",
    sobre: "Comunicativa, com foco em metas de venda.",
    quando: "há 3 horas",
    status: "analise",
  },
  {
    vagaId: 8,
    nome: "Rafael Nunes",
    area: "Comércio",
    bairro: "Valentina",
    whatsapp: "(83) 99777-1188",
    email: "rafael.nunes@email.com",
    sobre: "Operador de caixa há 3 anos no varejo.",
    quando: "há 5 horas",
    status: "contratado",
  },
];

/**
 * Depoimentos FICTÍCIOS — apenas demonstração visual do carrossel.
 * Substituir por depoimentos reais e autorizados antes do lançamento.
 */
export const DEPOIMENTOS: Depoimento[] = [
  {
    iniciais: "MV",
    frase: "Contratado como auxiliar de logística em 1 semana. Deu super certo!",
    nome: "Marcos Vinícius",
    bairro: "Mangabeira, JP",
  },
  {
    iniciais: "JS",
    frase: "Em 5 dias já estava empregada como recepcionista. Recomendo demais.",
    nome: "Juliana Santos",
    bairro: "Bessa, JP",
  },
  {
    iniciais: "AP",
    frase: "Achei vaga de vendedor pertinho de casa. Mudou minha vida.",
    nome: "Anderson Pereira",
    bairro: "Bancários, JP",
  },
];

/** Iniciais a partir de um nome: "Carla Souza" -> "CS". */
export function iniciais(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
