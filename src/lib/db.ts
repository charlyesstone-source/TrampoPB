/**
 * Camada de acesso a dados (Fase 3).
 * Lê/grava no Supabase respeitando a RLS. Mapeia linhas do banco para os
 * tipos de domínio usados na interface.
 */

import { formatarHa } from "./config";
import { createClient } from "./supabase/client";
import type {
  Candidato,
  Candidatura,
  Categoria,
  StatusCandidatura,
  StatusVaga,
  TipoContrato,
  Vaga,
} from "./types";

// ---- Formatos de linha do banco -------------------------------------------

interface VagaRow {
  id: number;
  empresa_id: string;
  empresa_nome: string;
  titulo: string;
  bairro: string;
  salario: string;
  tipo: string;
  categoria: string;
  descricao: string;
  requisitos: string[];
  beneficios: string[];
  email_contato: string | null;
  whatsapp_contato: string | null;
  status: string;
  data_publicacao: string | null;
  data_expiracao: string | null;
  criado_em: string;
}

interface CandidatoRow {
  id: string;
  nome: string;
  whatsapp: string;
  email: string;
  area: string;
  bairro: string;
  sobre: string;
  experiencia: string;
}

interface SnapshotCurriculo {
  nome: string;
  area: string;
  bairro: string;
  whatsapp: string;
  email: string;
  sobre: string;
  experiencia?: string;
}

interface CandidaturaRow {
  id: number;
  vaga_id: number;
  status: StatusCandidatura;
  snapshot_curriculo: SnapshotCurriculo;
  criado_em: string;
  vagas?: { titulo: string } | null;
}

// ---- Mapeamentos -----------------------------------------------------------

function vagaDeRow(r: VagaRow): Vaga {
  const validade = r.data_expiracao
    ? Math.max(
        0,
        Math.ceil(
          (new Date(r.data_expiracao).getTime() - Date.now()) / 86_400_000
        )
      )
    : undefined;
  return {
    id: r.id,
    titulo: r.titulo,
    empresa: r.empresa_nome,
    bairro: r.bairro,
    salario: r.salario,
    tipo: r.tipo as TipoContrato,
    categoria: r.categoria as Categoria,
    publicadaHa: formatarHa(r.data_publicacao ?? r.criado_em),
    descricao: r.descricao,
    requisitos: r.requisitos,
    beneficios: r.beneficios?.length ? r.beneficios : undefined,
    emailContato: r.email_contato ?? undefined,
    whatsappContato: r.whatsapp_contato ?? undefined,
    validadeDias: validade,
  };
}

// ---- Vagas -----------------------------------------------------------------

/** Vagas ativas e dentro da validade (feed público). */
export async function listarVagasAtivas(): Promise<Vaga[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("vagas")
    .select("*")
    .eq("status", "ativa")
    .gt("data_expiracao", new Date().toISOString()) // esconde vagas vencidas na hora
    .order("criado_em", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as VagaRow[]).map(vagaDeRow);
}

// ---- Gerenciamento de vagas (empresa) --------------------------------------

/** Vaga na visão de gestão do anunciante (com status e nº de candidaturas). */
export interface VagaGerenciada {
  id: number;
  titulo: string;
  bairro: string;
  salario: string;
  tipo: string;
  status: StatusVaga;
  publicadaHa: string;
  validadeDias?: number;
  nCandidaturas: number;
}

/** Vagas da empresa logada, em qualquer status (para "Meus anúncios"). */
export async function listarMinhasVagas(): Promise<VagaGerenciada[]> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("vagas")
    .select("*, candidaturas(count)")
    .eq("empresa_id", user.id)
    .order("criado_em", { ascending: false });
  if (error) throw new Error(error.message);

  type Row = VagaRow & { candidaturas?: { count: number }[] };
  return (data as Row[]).map((r) => ({
    id: r.id,
    titulo: r.titulo,
    bairro: r.bairro,
    salario: r.salario,
    tipo: r.tipo,
    status: r.status as StatusVaga,
    publicadaHa: formatarHa(r.data_publicacao ?? r.criado_em),
    validadeDias: r.data_expiracao
      ? Math.max(
          0,
          Math.ceil(
            (new Date(r.data_expiracao).getTime() - Date.now()) / 86_400_000
          )
        )
      : undefined,
    nCandidaturas: r.candidaturas?.[0]?.count ?? 0,
  }));
}

/** Encerra uma vaga (sai do feed, mantém o histórico de candidaturas). */
export async function encerrarVaga(id: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("vagas")
    .update({ status: "expirada" })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Exclui a vaga de vez (remove também as candidaturas, por cascata). */
export async function excluirVaga(id: number): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("vagas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Perfil do candidato ---------------------------------------------------

export async function getCandidato(id: string): Promise<Partial<Candidato>> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("candidatos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return {};
  const r = data as CandidatoRow;
  return {
    nome: r.nome,
    whatsapp: r.whatsapp,
    email: r.email,
    area: r.area,
    bairro: r.bairro,
    sobre: r.sobre,
    experiencia: r.experiencia,
  };
}

export async function atualizarCandidatoDb(
  id: string,
  dados: Partial<Candidato>
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("candidatos")
    .update({
      nome: dados.nome,
      whatsapp: dados.whatsapp,
      area: dados.area,
      bairro: dados.bairro,
      sobre: dados.sobre,
      experiencia: dados.experiencia,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Candidaturas ----------------------------------------------------------

/** Ids das vagas a que o candidato logado já se candidatou. */
export async function listarVagasCandidatadas(): Promise<number[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("candidaturas").select("vaga_id");
  if (error) throw new Error(error.message);
  return (data as { vaga_id: number }[]).map((r) => r.vaga_id);
}

/** Item de "Minhas vagas": a candidatura do candidato + dados da vaga. */
export interface MinhaCandidatura {
  vagaId: number;
  vagaTitulo: string;
  empresaNome: string;
  bairro: string;
  salario: string;
  tipo: string;
  statusCandidatura: StatusCandidatura;
  quando: string;
  vagaAtiva: boolean;
}

/** Candidaturas do candidato logado, com os dados da vaga (RLS filtra as próprias). */
export async function listarMinhasCandidaturas(): Promise<MinhaCandidatura[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("candidaturas")
    .select(
      "vaga_id, status, criado_em, vagas(titulo, empresa_nome, bairro, salario, tipo)"
    )
    .order("criado_em", { ascending: false });
  if (error) throw new Error(error.message);

  type Row = {
    vaga_id: number;
    status: StatusCandidatura;
    criado_em: string;
    vagas: {
      titulo: string;
      empresa_nome: string;
      bairro: string;
      salario: string;
      tipo: string;
    } | null;
  };
  return (data as unknown as Row[]).map((r) => ({
    vagaId: r.vaga_id,
    vagaTitulo: r.vagas?.titulo ?? "Vaga encerrada",
    empresaNome: r.vagas?.empresa_nome ?? "",
    bairro: r.vagas?.bairro ?? "",
    salario: r.vagas?.salario ?? "",
    tipo: r.vagas?.tipo ?? "",
    statusCandidatura: r.status,
    quando: formatarHa(r.criado_em),
    vagaAtiva: !!r.vagas,
  }));
}

export async function candidatarDb(
  vagaId: number,
  candidatoId: string,
  snapshot: SnapshotCurriculo
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("candidaturas").insert({
    vaga_id: vagaId,
    candidato_id: candidatoId,
    status: "novo",
    snapshot_curriculo: snapshot,
    consentimento_lgpd: true,
    consentimento_em: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

/** Candidatura para o painel da empresa (inclui título da vaga e experiência). */
export type CandidaturaPainel = Candidatura & {
  id: number;
  vagaTitulo: string;
  experiencia: string;
};

function candidaturaPainelDeRow(r: CandidaturaRow): CandidaturaPainel {
  const s = r.snapshot_curriculo;
  return {
    id: r.id,
    vagaId: r.vaga_id,
    vagaTitulo: r.vagas?.titulo ?? "Vaga removida",
    nome: s.nome,
    area: s.area,
    bairro: s.bairro,
    whatsapp: s.whatsapp,
    email: s.email,
    sobre: s.sobre,
    experiencia: s.experiencia ?? "",
    quando: formatarHa(r.criado_em),
    status: r.status,
  };
}

/** Candidaturas das vagas da empresa logada (visão painel). */
export async function listarCandidaturasDaEmpresa(): Promise<CandidaturaPainel[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("candidaturas")
    .select("id, vaga_id, status, snapshot_curriculo, criado_em, vagas(titulo)")
    .order("criado_em", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as unknown as CandidaturaRow[]).map(candidaturaPainelDeRow);
}

/**
 * Uma candidatura específica (para a página de currículo completo).
 * A RLS garante que só a empresa dona da vaga consegue lê-la.
 */
export async function getCandidaturaById(
  id: number
): Promise<CandidaturaPainel | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("candidaturas")
    .select("id, vaga_id, status, snapshot_curriculo, criado_em, vagas(titulo)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return candidaturaPainelDeRow(data as unknown as CandidaturaRow);
}

export async function atualizarStatusCandidaturaDb(
  id: number,
  status: StatusCandidatura
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("candidaturas")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

// ---- Métrica pública -------------------------------------------------------

/** Total honesto de contratações (status 'contratado'), via função pública. */
export async function totalContratados(): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("total_contratados");
  if (error) throw new Error(error.message);
  return (data as number) ?? 0;
}
