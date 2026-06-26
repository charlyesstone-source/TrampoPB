"use client";

/**
 * Estado da aplicação (Fase 3).
 *
 * - Autenticação: Supabase (Fase 2).
 * - Dados (vagas, candidaturas, perfis, pagamentos): REAIS no Supabase, com RLS.
 *
 * "salvas" continua só no cliente (não há tabela para isso na especificação).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { perfilDoUsuario, sair, type PerfilSessao } from "@/lib/auth";
import {
  atualizarCandidatoDb,
  candidatarDb,
  getCandidato,
  listarVagasAtivas,
  listarVagasCandidatadas,
  totalContratados as totalContratadosDb,
} from "@/lib/db";
import { createClient } from "@/lib/supabase/client";
import type { Candidato, CobrancaPix, Empresa, Vaga } from "@/lib/types";

const TEM_SUPABASE = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/** Campos de currículo (tabela candidatos), hidratados após o login. */
interface CurriculoLocal {
  whatsapp: string;
  area: string;
  bairro: string;
  sobre: string;
  experiencia: string;
}

const CURRICULO_VAZIO: CurriculoLocal = {
  whatsapp: "",
  area: "",
  bairro: "",
  sobre: "",
  experiencia: "",
};

interface AppState {
  vagas: Vaga[];
  carregandoVagas: boolean;
  candidato: Candidato;
  empresa: Empresa;
  salvas: Set<number>;
  candidaturasEnviadas: Set<number>;
  cobranca: CobrancaPix | null;
  vagaAberta: number | null;
  totalContratados: number;
  toastMsg: string | null;
  toastSeq: number;
  carregandoSessao: boolean;
  temSupabase: boolean;

  mostrarToast: (msg: string) => void;
  abrirSheet: (id: number) => void;
  fecharSheet: () => void;
  alternarSalva: (id: number) => void;
  candidatarVagaAberta: () => Promise<void>;
  atualizarCurriculo: (
    dados: Partial<Candidato>,
    opcoes?: { silencioso?: boolean }
  ) => Promise<void>;
  sairConta: () => Promise<void>;
  definirCobranca: (c: CobrancaPix | null) => void;
  recarregarVagas: () => Promise<void>;
}

const AppCtx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => (TEM_SUPABASE ? createClient() : null), []);

  const [sessao, setSessao] = useState<PerfilSessao | null>(null);
  const [carregandoSessao, setCarregandoSessao] = useState(TEM_SUPABASE);
  const [curriculo, setCurriculo] = useState<CurriculoLocal>(CURRICULO_VAZIO);

  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [carregandoVagas, setCarregandoVagas] = useState(true);
  const [salvas, setSalvas] = useState<Set<number>>(new Set());
  const [candidaturasEnviadas, setCandidaturasEnviadas] = useState<Set<number>>(
    new Set()
  );
  const [totalContratados, setTotalContratados] = useState(0);
  const [cobranca, setCobranca] = useState<CobrancaPix | null>(null);
  const [vagaAberta, setVagaAberta] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastSeq, setToastSeq] = useState(0);

  const notificar = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastSeq((s) => s + 1);
  }, []);

  // --- Sessão ---------------------------------------------------------------
  useEffect(() => {
    if (!supabase) {
      setCarregandoSessao(false);
      return;
    }
    let ativo = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!ativo) return;
      setSessao(perfilDoUsuario(data.user));
      setCarregandoSessao(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setSessao(perfilDoUsuario(session?.user ?? null));
      setCarregandoSessao(false);
    });
    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // --- Vagas (público) + métrica de contratados -----------------------------
  const recarregarVagas = useCallback(async () => {
    if (!supabase) {
      setCarregandoVagas(false);
      return;
    }
    setCarregandoVagas(true);
    try {
      const [lista, total] = await Promise.all([
        listarVagasAtivas(),
        totalContratadosDb(),
      ]);
      setVagas(lista);
      setTotalContratados(total);
    } catch {
      // mantém o que tinha; o feed só fica vazio
    } finally {
      setCarregandoVagas(false);
    }
  }, [supabase]);

  useEffect(() => {
    void recarregarVagas();
  }, [recarregarVagas]);

  // --- Dados do candidato logado (currículo + candidaturas já enviadas) -----
  useEffect(() => {
    let ativo = true;
    if (sessao?.papel === "candidato") {
      Promise.all([getCandidato(sessao.id), listarVagasCandidatadas()])
        .then(([cv, ids]) => {
          if (!ativo) return;
          setCurriculo({
            whatsapp: cv.whatsapp ?? "",
            area: cv.area ?? "",
            bairro: cv.bairro ?? "",
            sobre: cv.sobre ?? "",
            experiencia: cv.experiencia ?? "",
          });
          setCandidaturasEnviadas(new Set(ids));
        })
        .catch(() => {});
    } else {
      setCurriculo(CURRICULO_VAZIO);
      setCandidaturasEnviadas(new Set());
    }
    return () => {
      ativo = false;
    };
  }, [sessao]);

  // --- Derivações -----------------------------------------------------------
  const candidato: Candidato = useMemo(() => {
    const ehCandidato = sessao?.papel === "candidato";
    return {
      registrado: ehCandidato,
      nome: ehCandidato ? sessao!.nome : "",
      email: ehCandidato ? sessao!.email : "",
      whatsapp: curriculo.whatsapp,
      area: curriculo.area,
      bairro: curriculo.bairro,
      sobre: curriculo.sobre,
      experiencia: curriculo.experiencia,
    };
  }, [sessao, curriculo]);

  const empresa: Empresa = useMemo(() => {
    const ehEmpresa = sessao?.papel === "empresa";
    return {
      registrada: ehEmpresa,
      nome: ehEmpresa ? sessao!.nome : "",
      email: ehEmpresa ? sessao!.email : "",
    };
  }, [sessao]);

  // --- Ações ----------------------------------------------------------------
  const mostrarToast = notificar;
  const abrirSheet = useCallback((id: number) => setVagaAberta(id), []);
  const fecharSheet = useCallback(() => setVagaAberta(null), []);

  const alternarSalva = useCallback(
    (id: number) => {
      let salvaAgora = false;
      setSalvas((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else {
          next.add(id);
          salvaAgora = true;
        }
        return next;
      });
      notificar(salvaAgora ? "Vaga salva" : "Removida das salvas");
    },
    [notificar]
  );

  const candidatarVagaAberta = useCallback(async () => {
    if (vagaAberta == null || !sessao) return;
    const id = vagaAberta;
    if (candidaturasEnviadas.has(id)) {
      notificar("Você já se candidatou a esta vaga");
      return;
    }
    const vaga = vagas.find((v) => v.id === id);
    try {
      // Snapshot a partir do currículo SALVO no banco (fonte da verdade),
      // garantindo que a empresa receba o currículo completo e atual.
      const cv = await getCandidato(sessao.id);
      await candidatarDb(id, sessao.id, {
        nome: sessao.nome || cv.nome || "",
        area: cv.area ?? "",
        bairro: cv.bairro ?? "",
        whatsapp: cv.whatsapp ?? "",
        email: sessao.email || cv.email || "",
        sobre: cv.sobre ?? "",
        experiencia: cv.experiencia ?? "",
      });
      setCandidaturasEnviadas((prev) => new Set(prev).add(id));
      notificar(
        `Candidatura enviada ✓ ${vaga ? vaga.empresa + " foi avisada." : ""}`.trim()
      );
    } catch {
      notificar("Não foi possível enviar a candidatura.");
    }
  }, [vagaAberta, sessao, candidaturasEnviadas, vagas, notificar]);

  const atualizarCurriculo = useCallback(
    async (dados: Partial<Candidato>, opcoes?: { silencioso?: boolean }) => {
      setCurriculo((prev) => ({
        whatsapp: dados.whatsapp ?? prev.whatsapp,
        area: dados.area ?? prev.area,
        bairro: dados.bairro ?? prev.bairro,
        sobre: dados.sobre ?? prev.sobre,
        experiencia: dados.experiencia ?? prev.experiencia,
      }));
      // Usa o usuário ATUAL do Supabase (não o estado React), pois logo após o
      // cadastro o `sessao` ainda não propagou — evita perder o currículo.
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await atualizarCandidatoDb(user.id, dados);
          if (dados.nome && dados.nome !== user.user_metadata?.nome) {
            await supabase.auth.updateUser({ data: { nome: dados.nome } });
          }
        }
      }
      if (!opcoes?.silencioso) notificar("Currículo salvo ✓");
    },
    [supabase, notificar]
  );

  const sairConta = useCallback(async () => {
    await sair();
    setCurriculo(CURRICULO_VAZIO);
    setCandidaturasEnviadas(new Set());
    notificar("Você saiu da sua conta");
  }, [notificar]);

  const definirCobranca = useCallback((c: CobrancaPix | null) => {
    setCobranca(c);
  }, []);

  const value: AppState = {
    vagas,
    carregandoVagas,
    candidato,
    empresa,
    salvas,
    candidaturasEnviadas,
    cobranca,
    vagaAberta,
    totalContratados,
    toastMsg,
    toastSeq,
    carregandoSessao,
    temSupabase: TEM_SUPABASE,
    mostrarToast,
    abrirSheet,
    fecharSheet,
    alternarSalva,
    candidatarVagaAberta,
    atualizarCurriculo,
    sairConta,
    definirCobranca,
    recarregarVagas,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp deve ser usado dentro de <AppProvider>");
  return ctx;
}
