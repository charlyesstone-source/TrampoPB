"use client";

/**
 * Estado da aplicação (Fase 3).
 *
 * - Autenticação: Supabase (Fase 2).
 * - Dados (vagas, candidaturas, perfis, pagamentos): REAIS no Supabase, com RLS.
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
  contarCandidaturasNovas,
  getCandidato,
  listarVagasAtivas,
  listarVagasCandidatadas,
  marcarCandidaturasVistasDb,
  totalContratados as totalContratadosDb,
} from "@/lib/db";
import { createClient } from "@/lib/supabase/client";
import type { Candidato, CobrancaPix, Empresa, Vaga } from "@/lib/types";

const TEM_SUPABASE = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/** Resultado de tentar candidatar (decide o que a interface faz em seguida). */
export type ResultadoCandidatura = "ok" | "incompleto" | "duplicado" | "erro";

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
  candidaturasEnviadas: Set<number>;
  cobranca: CobrancaPix | null;
  vagaAberta: number | null;
  totalContratados: number;
  candidaturasNovas: number;
  toastMsg: string | null;
  toastSeq: number;
  carregandoSessao: boolean;
  temSupabase: boolean;

  mostrarToast: (msg: string) => void;
  abrirSheet: (id: number) => void;
  fecharSheet: () => void;
  candidatarVagaAberta: () => Promise<ResultadoCandidatura>;
  atualizarCurriculo: (
    dados: Partial<Candidato>,
    opcoes?: { silencioso?: boolean }
  ) => Promise<void>;
  sairConta: () => Promise<void>;
  excluirConta: () => Promise<boolean>;
  definirCobranca: (c: CobrancaPix | null) => void;
  recarregarVagas: (opcoes?: { silencioso?: boolean }) => Promise<void>;
  marcarCandidaturasVistas: () => void;
}

const AppCtx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => (TEM_SUPABASE ? createClient() : null), []);

  const [sessao, setSessao] = useState<PerfilSessao | null>(null);
  const [carregandoSessao, setCarregandoSessao] = useState(TEM_SUPABASE);
  const [curriculo, setCurriculo] = useState<CurriculoLocal>(CURRICULO_VAZIO);

  const [vagas, setVagas] = useState<Vaga[]>([]);
  const [carregandoVagas, setCarregandoVagas] = useState(true);
  const [candidaturasEnviadas, setCandidaturasEnviadas] = useState<Set<number>>(
    new Set()
  );
  const [totalContratados, setTotalContratados] = useState(0);
  const [cobranca, setCobranca] = useState<CobrancaPix | null>(null);
  const [vagaAberta, setVagaAberta] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastSeq, setToastSeq] = useState(0);
  const [candidaturasNovas, setCandidaturasNovas] = useState(0);

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
  const recarregarVagas = useCallback(
    async (opcoes?: { silencioso?: boolean }) => {
      if (!supabase) {
        setCarregandoVagas(false);
        return;
      }
      // Em recarga silenciosa (ao voltar pro app) não pisca "Carregando".
      if (!opcoes?.silencioso) setCarregandoVagas(true);
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
        if (!opcoes?.silencioso) setCarregandoVagas(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    void recarregarVagas();
  }, [recarregarVagas]);

  // Atualiza o feed quando o usuário volta pro app/aba (sem piscar a tela).
  useEffect(() => {
    if (!supabase) return;
    let ultimo = Date.now();
    const aoVoltar = () => {
      if (document.visibilityState !== "visible") return;
      const agora = Date.now();
      if (agora - ultimo < 3000) return; // evita recarga duplicada
      ultimo = agora;
      void recarregarVagas({ silencioso: true });
    };
    window.addEventListener("focus", aoVoltar);
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      window.removeEventListener("focus", aoVoltar);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [supabase, recarregarVagas]);

  // --- Dados do candidato logado (currículo + candidaturas já enviadas) -----
  useEffect(() => {
    let ativo = true;
    if (sessao?.papel === "candidato") {
      Promise.all([getCandidato(sessao.id), listarVagasCandidatadas()])
        .then(([cv, ids]) => {
          if (!ativo) return;
          // Só hidrata se o banco tem dados — evita que uma leitura logo após o
          // cadastro (linha ainda vazia) apague o currículo recém-preenchido.
          const temDados =
            cv.whatsapp || cv.area || cv.bairro || cv.sobre || cv.experiencia;
          if (temDados) {
            setCurriculo({
              whatsapp: cv.whatsapp ?? "",
              area: cv.area ?? "",
              bairro: cv.bairro ?? "",
              sobre: cv.sobre ?? "",
              experiencia: cv.experiencia ?? "",
            });
          }
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

  // --- Badge de candidaturas novas (visão empresa) --------------------------
  // Conta as candidaturas chegadas depois da última vez que a empresa abriu o
  // painel (carimbo no banco — sincroniza entre dispositivos). Zera ao visitar
  // /candidaturas.
  const recarregarCandidaturasNovas = useCallback(async () => {
    if (!supabase || sessao?.papel !== "empresa") {
      setCandidaturasNovas(0);
      return;
    }
    try {
      setCandidaturasNovas(await contarCandidaturasNovas());
    } catch {
      /* silencioso: o badge só não atualiza */
    }
  }, [supabase, sessao]);

  const marcarCandidaturasVistas = useCallback(() => {
    if (sessao?.papel !== "empresa") return;
    setCandidaturasNovas(0); // otimista; o carimbo no banco confirma
    void marcarCandidaturasVistasDb().catch(() => {});
  }, [sessao]);

  // Carrega ao logar/trocar de sessão e quando o usuário volta pro app/aba.
  useEffect(() => {
    void recarregarCandidaturasNovas();
  }, [recarregarCandidaturasNovas]);

  useEffect(() => {
    if (!supabase) return;
    const aoVoltar = () => {
      if (document.visibilityState === "visible") {
        void recarregarCandidaturasNovas();
      }
    };
    window.addEventListener("focus", aoVoltar);
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      window.removeEventListener("focus", aoVoltar);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [supabase, recarregarCandidaturasNovas]);

  // --- Ações ----------------------------------------------------------------
  const mostrarToast = notificar;
  const abrirSheet = useCallback((id: number) => setVagaAberta(id), []);
  const fecharSheet = useCallback(() => setVagaAberta(null), []);

  const candidatarVagaAberta = useCallback(async (): Promise<ResultadoCandidatura> => {
    if (vagaAberta == null || !sessao) return "erro";
    const id = vagaAberta;
    if (candidaturasEnviadas.has(id)) {
      notificar("Você já se candidatou a esta vaga");
      return "duplicado";
    }
    const vaga = vagas.find((v) => v.id === id);
    try {
      // Currículo SALVO no banco é a fonte da verdade (evita estado defasado
      // logo após o cadastro). O WhatsApp é checado aqui, com o dado real.
      const cv = await getCandidato(sessao.id);
      if (!cv.whatsapp || !cv.whatsapp.trim()) {
        return "incompleto";
      }
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
      // Avisa a empresa por e-mail (best-effort: não trava nem reverte a
      // candidatura se o aviso falhar; a candidatura já está gravada).
      void fetch("/api/notificar-candidatura", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vagaId: id }),
      }).catch(() => {});
      notificar(
        `Candidatura enviada ✓ ${vaga ? vaga.empresa + " foi avisada." : ""}`.trim()
      );
      return "ok";
    } catch {
      notificar("Não foi possível enviar a candidatura.");
      return "erro";
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

  const excluirConta = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/conta/excluir", { method: "POST" });
      if (!res.ok) throw new Error();
      // Conta apagada no servidor (com cascata). Encerra a sessão e limpa o local.
      await sair();
      setCurriculo(CURRICULO_VAZIO);
      setCandidaturasEnviadas(new Set());
      notificar("Conta excluída. Seus dados foram removidos.");
      return true;
    } catch {
      notificar("Não foi possível excluir a conta agora. Tente de novo.");
      return false;
    }
  }, [notificar]);

  const definirCobranca = useCallback((c: CobrancaPix | null) => {
    setCobranca(c);
  }, []);

  const value: AppState = {
    vagas,
    carregandoVagas,
    candidato,
    empresa,
    candidaturasEnviadas,
    cobranca,
    vagaAberta,
    totalContratados,
    candidaturasNovas,
    toastMsg,
    toastSeq,
    carregandoSessao,
    temSupabase: TEM_SUPABASE,
    mostrarToast,
    abrirSheet,
    fecharSheet,
    candidatarVagaAberta,
    atualizarCurriculo,
    sairConta,
    excluirConta,
    definirCobranca,
    recarregarVagas,
    marcarCandidaturasVistas,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp deve ser usado dentro de <AppProvider>");
  return ctx;
}
