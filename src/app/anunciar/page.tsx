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
import { BAIRROS, CATEGORIAS, TIPOS_CONTRATO } from "@/lib/mock-data";

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

  // Importação assistida (link ou texto do OLX) → pré-preenche o formulário.
  const [entrada, setEntrada] = useState("");
  const [importando, setImportando] = useState(false);
  const [preench, setPreench] = useState({
    titulo: "",
    empresa: "",
    bairro: "",
    tipo: "",
    categoria: "",
    salario: "",
    descricao: "",
    requisitos: "",
  });
  const [formKey, setFormKey] = useState(0);

  const importar = async () => {
    const v = entrada.trim();
    if (!v) {
      mostrarToast("Cole o link ou o texto da vaga.");
      return;
    }
    const ehUrl = /^https?:\/\/\S+$/i.test(v) && !v.includes("\n") && v.length < 400;
    setImportando(true);
    try {
      const res = await fetch("/api/importar-olx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ehUrl ? { url: v } : { texto: v }),
      });
      const data = await res.json();
      if (data.ok && data.vaga) {
        const vg = data.vaga;
        setPreench((p) => ({
          ...p,
          titulo: vg.titulo || p.titulo,
          bairro: vg.bairro || p.bairro,
          tipo: vg.tipo || p.tipo,
          categoria: vg.categoria || p.categoria,
          salario: vg.salario || p.salario,
          descricao: vg.descricao || p.descricao,
        }));
        setFormKey((k) => k + 1);
        mostrarToast("Campos preenchidos ✓ Revise antes de publicar.");
      } else if (data.bloqueado) {
        mostrarToast(
          "O OLX bloqueou a leitura do link. Cole aqui o TEXTO da vaga."
        );
      } else {
        mostrarToast(data.erro ?? "Não foi possível importar.");
      }
    } catch {
      mostrarToast("Não foi possível importar.");
    } finally {
      setImportando(false);
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

    setPublicando(true);
    try {
      const res = await fetch("/api/pagamento/criar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: txt("titulo"),
          empresa: txt("empresa"),
          bairro: txt("bairro"),
          salario: txt("salario"),
          tipo: txt("tipo"),
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
          sub="Para empresas de João Pessoa e região."
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

        <div className="import-box">
          <b>Já tem essa vaga no OLX?</b>
          <span>
            Cole o <b>link</b> da sua vaga. Se o OLX bloquear a leitura, cole o{" "}
            <b>texto completo</b> da vaga aqui — a gente preenche o formulário pra você
            revisar.
          </span>
          <textarea
            className="in"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value)}
            placeholder={"Cole o link da vaga do OLX\nou o texto completo da vaga…"}
            rows={3}
          />
          <button
            type="button"
            className="btn-mini primary"
            onClick={importar}
            disabled={importando}
          >
            {importando ? "Importando…" : "Preencher automaticamente"}
          </button>
        </div>

        <form key={formKey} onSubmit={aoPublicar}>
          <div className="field">
            <label htmlFor="titulo">Cargo</label>
            <input
              className="in"
              id="titulo"
              name="titulo"
              required
              placeholder="Ex.: Auxiliar de atendimento"
              defaultValue={preench.titulo}
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
              defaultValue={preench.empresa || empresa.nome}
            />
          </div>
          <div className="row2">
            <div className="field">
              <label htmlFor="bairro">Bairro</label>
              <select
                className="in"
                id="bairro"
                name="bairro"
                defaultValue={preench.bairro || BAIRROS[0]}
              >
                {BAIRROS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="tipo">Contrato</label>
              <select
                className="in"
                id="tipo"
                name="tipo"
                defaultValue={preench.tipo || TIPOS_CONTRATO[0]}
              >
                {TIPOS_CONTRATO.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="row2">
            <div className="field">
              <label htmlFor="categoria">Categoria</label>
              <select
                className="in"
                id="categoria"
                name="categoria"
                defaultValue={preench.categoria || CATEGORIAS[0]}
              >
                {CATEGORIAS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="salario">Salário (R$)</label>
              <input
                className="in"
                id="salario"
                name="salario"
                placeholder="Ex.: 1.600"
                inputMode="numeric"
                defaultValue={preench.salario}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="descricao">Descrição da vaga</label>
            <textarea
              className="in"
              id="descricao"
              name="descricao"
              required
              placeholder="Conte o dia a dia da função, jornada e o que esperar."
              defaultValue={preench.descricao}
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
              defaultValue={preench.requisitos}
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
