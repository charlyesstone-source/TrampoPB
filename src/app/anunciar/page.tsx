"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { SubHead } from "@/components/sub-head";
import { useApp } from "@/context/app-context";
import {
  COBRANCA_ATIVA,
  PRECO_VAGA_LABEL,
  VALIDADE_DIAS,
} from "@/lib/config";
import { CATEGORIAS, TIPOS_CONTRATO } from "@/lib/mock-data";

export default function AnunciarPage() {
  const router = useRouter();
  const {
    empresa,
    carregandoSessao,
    definirCobranca,
    recarregarVagas,
    sairConta,
    mostrarToast,
  } = useApp();
  const [publicando, setPublicando] = useState(false);

  // Localização: o CEP preenche cidade e bairro automaticamente (ViaCEP).
  // Tipo de contrato é controlado para revelar o campo "Outro".
  const [cep, setCep] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [tipo, setTipo] = useState<string>(TIPOS_CONTRATO[0]);
  const [tipoOutro, setTipoOutro] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);

  const formatarCep = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  };

  /** Busca cidade e bairro pelo CEP (ViaCEP). Só dispara com 8 dígitos. */
  const buscarCep = async (valor: string) => {
    const d = valor.replace(/\D/g, "");
    if (d.length !== 8) return;
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const data = await res.json();
      if (data.erro) {
        mostrarToast("CEP não encontrado. Preencha cidade e bairro à mão.");
        return;
      }
      if (data.localidade) setCidade(data.localidade);
      if (data.bairro) {
        setBairro(data.bairro);
        mostrarToast("Cidade e bairro preenchidos ✓ Confira.");
      } else {
        // Cidades menores costumam ter só o CEP geral (sem bairro no ViaCEP).
        mostrarToast("Cidade preenchida ✓ Informe o bairro.");
      }
    } catch {
      mostrarToast("Não foi possível buscar o CEP agora.");
    } finally {
      setBuscandoCep(false);
    }
  };

  // Porta de entrada do anunciante: exige conta de empresa (após carregar a sessão).
  useEffect(() => {
    if (!carregandoSessao && !empresa.registrada) router.replace("/empresa/cadastro");
  }, [carregandoSessao, empresa.registrada, router]);

  if (carregandoSessao || !empresa.registrada) return null;

  const aoPublicar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const txt = (k: string) => (f.get(k) as string)?.trim() ?? "";
    const requisitos = txt("requisitos")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    const tipoFinal = tipo === "Outro" ? tipoOutro.trim() : tipo;
    if (!cidade.trim()) {
      mostrarToast("Informe a cidade (ou digite o CEP).");
      return;
    }
    if (tipo === "Outro" && !tipoOutro.trim()) {
      mostrarToast("Descreva o tipo de contrato.");
      return;
    }

    setPublicando(true);
    try {
      const res = await fetch("/api/pagamento/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: txt("titulo"),
          empresa: txt("empresa"),
          cidade: cidade.trim(),
          bairro: bairro.trim(),
          salario: txt("salario"),
          tipo: tipoFinal,
          categoria: txt("categoria"),
          descricao: txt("descricao"),
          requisitos,
          emailContato: txt("email"),
          whatsappContato: txt("whatsapp"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.erro ?? "Não foi possível publicar.");

      // Período gratuito: a vaga já foi publicada.
      if (data.publicada) {
        await recarregarVagas();
        mostrarToast("Vaga publicada ✓ No ar por 15 dias.");
        router.push("/");
        return;
      }

      // Cobrança ligada: segue para o Pix.
      definirCobranca({
        vagaId: data.vagaId,
        titulo: data.titulo,
        mpPaymentId: data.mpPaymentId,
        qrCodeBase64: data.qrCodeBase64,
        copiaECola: data.copiaECola,
        expiraEm: data.expiraEm,
        sandbox: data.sandbox,
      });
      router.push("/pagamento");
    } catch (err) {
      mostrarToast(err instanceof Error ? err.message : "Erro ao publicar.");
      setPublicando(false);
    }
  };

  return (
    <section className="view">
      <div className="pad">
        <SubHead
          titulo="Anunciar vaga"
          sub="Para empresas de toda a Paraíba."
          voltarPara="/empresa"
        />

        <div className="biz-bar">
          Anunciando como <b>{empresa.nome}</b> ·{" "}
          <a
            onClick={async () => {
              await sairConta();
              router.push("/");
            }}
          >
            Sair
          </a>
        </div>

        <div className="plan">
          <div className="ptop">
            <div>
              <span className="ptag">
                {COBRANCA_ATIVA ? "Plano único" : "Lançamento"}
              </span>
              <div className="price" style={{ marginTop: 8 }}>
                {COBRANCA_ATIVA ? (
                  <>
                    <b>{PRECO_VAGA_LABEL}</b> <small>por vaga</small>
                  </>
                ) : (
                  <>
                    <b>Grátis</b> <small>no período de lançamento</small>
                  </>
                )}
              </div>
            </div>
            <div className="price" style={{ textAlign: "right" }}>
              <small>Sua vaga fica</small>
              <br />
              <b style={{ fontSize: 20 }}>{VALIDADE_DIAS} dias</b>
              <br />
              <small>no ar</small>
            </div>
          </div>
          <ul>
            <li>Destaque no app por {VALIDADE_DIAS} dias</li>
            <li>Candidaturas organizadas no seu painel</li>
            <li>Contato direto por e-mail e WhatsApp</li>
          </ul>
        </div>

        <form onSubmit={aoPublicar}>
          <div className="field">
            <label htmlFor="titulo">Cargo</label>
            <input
              className="in"
              id="titulo"
              name="titulo"
              required
              placeholder="Ex.: Auxiliar de atendimento"
            />
          </div>
          <div className="field">
            <label htmlFor="empresa">Empresa</label>
            <input
              className="in"
              id="empresa"
              name="empresa"
              required
              placeholder="Nome da sua empresa"
              defaultValue={empresa.nome}
            />
          </div>
          <div className="field">
            <label htmlFor="cep">CEP</label>
            <input
              className="in"
              id="cep"
              name="cep"
              inputMode="numeric"
              placeholder="58000-000"
              value={cep}
              onChange={(e) => setCep(formatarCep(e.target.value))}
              onBlur={(e) => buscarCep(e.target.value)}
            />
            <small className="hint">
              {buscandoCep
                ? "Buscando endereço…"
                : "Digite o CEP para preencher cidade e bairro."}
            </small>
          </div>
          <div className="row2">
            <div className="field">
              <label htmlFor="cidade">Cidade</label>
              <input
                className="in"
                id="cidade"
                name="cidade"
                required
                placeholder="Ex.: Campina Grande"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="bairro">Bairro</label>
              <input
                className="in"
                id="bairro"
                name="bairro"
                placeholder="Ex.: Centro"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
              />
            </div>
          </div>
          <div className="row2">
            <div className="field">
              <label htmlFor="tipo">Contrato</label>
              <select
                className="in"
                id="tipo"
                name="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
              >
                {TIPOS_CONTRATO.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="categoria">Categoria</label>
              <select
                className="in"
                id="categoria"
                name="categoria"
                defaultValue={CATEGORIAS[0]}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          {tipo === "Outro" && (
            <div className="field">
              <label htmlFor="tipoOutro">Qual o tipo de contrato?</label>
              <input
                className="in"
                id="tipoOutro"
                name="tipoOutro"
                placeholder="Ex.: PJ, Diária, Comissionado…"
                value={tipoOutro}
                onChange={(e) => setTipoOutro(e.target.value)}
              />
            </div>
          )}
          <div className="field">
            <label htmlFor="salario">Salário (R$)</label>
            <input
              className="in"
              id="salario"
              name="salario"
              placeholder="Ex.: 1.600"
              inputMode="numeric"
            />
          </div>
          <div className="field">
            <label htmlFor="descricao">Descrição da vaga</label>
            <textarea
              className="in"
              id="descricao"
              name="descricao"
              required
              placeholder="Conte o dia a dia da função, jornada e o que esperar."
            />
          </div>
          <div className="field">
            <label htmlFor="requisitos">Requisitos (um por linha)</label>
            <textarea
              className="in"
              id="requisitos"
              name="requisitos"
              placeholder={
                "Ensino médio completo\nExperiência com atendimento\nDisponibilidade aos sábados"
              }
            />
          </div>
          <div className="row2">
            <div className="field">
              <label htmlFor="email">E-mail para contato</label>
              <input
                className="in"
                id="email"
                name="email"
                type="email"
                required
                placeholder="rh@suaempresa.com.br"
              />
            </div>
            <div className="field">
              <label htmlFor="whatsapp">WhatsApp</label>
              <input
                className="in"
                id="whatsapp"
                name="whatsapp"
                required
                placeholder="(83) 99999-9999"
                inputMode="tel"
              />
            </div>
          </div>
          <button className="submit" type="submit" disabled={publicando}>
            {publicando
              ? COBRANCA_ATIVA
                ? "Gerando cobrança…"
                : "Publicando…"
              : COBRANCA_ATIVA
                ? `Publicar vaga • ${PRECO_VAGA_LABEL}`
                : "Publicar vaga (grátis)"}
          </button>
          <p className="pay-note">
            {COBRANCA_ATIVA
              ? "Você será levado ao Pix. A vaga só vai ao ar após a confirmação do pagamento."
              : "Período de lançamento: a publicação está gratuita por enquanto."}
          </p>
        </form>
      </div>
    </section>
  );
}
