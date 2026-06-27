"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { SubHead } from "@/components/sub-head";
import { useApp } from "@/context/app-context";
import { atualizarVaga, getMinhaVaga, type VagaEditavel } from "@/lib/db";
import { CATEGORIAS, TIPOS_CONTRATO } from "@/lib/mock-data";

export default function EditarAnuncioPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { empresa, carregandoSessao, recarregarVagas, mostrarToast } = useApp();

  const [vaga, setVaga] = useState<VagaEditavel | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Localização (CEP preenche cidade/bairro) e contrato controlados.
  const [cep, setCep] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [tipo, setTipo] = useState<string>(TIPOS_CONTRATO[0]);
  const [tipoOutro, setTipoOutro] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);

  // Porta de entrada: exige conta de empresa.
  useEffect(() => {
    if (!carregandoSessao && !empresa.registrada) router.replace("/empresa/cadastro");
  }, [carregandoSessao, empresa.registrada, router]);

  // Carrega a vaga e pré-preenche os campos controlados.
  useEffect(() => {
    if (carregandoSessao || !empresa.registrada || !Number.isFinite(id)) return;
    getMinhaVaga(id)
      .then((v) => {
        if (!v) {
          mostrarToast("Anúncio não encontrado.");
          router.replace("/anuncios");
          return;
        }
        setVaga(v);
        setCidade(v.cidade);
        setBairro(v.bairro);
        if ((TIPOS_CONTRATO as string[]).includes(v.tipo)) {
          setTipo(v.tipo);
        } else {
          setTipo("Outro");
          setTipoOutro(v.tipo);
        }
      })
      .catch(() => {
        mostrarToast("Não foi possível carregar o anúncio.");
        router.replace("/anuncios");
      })
      .finally(() => setCarregando(false));
  }, [id, empresa.registrada, carregandoSessao, mostrarToast, router]);

  const formatarCep = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  };

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
        mostrarToast("Cidade preenchida ✓ Informe o bairro.");
      }
    } catch {
      mostrarToast("Não foi possível buscar o CEP agora.");
    } finally {
      setBuscandoCep(false);
    }
  };

  const aoSalvar = async (e: FormEvent<HTMLFormElement>) => {
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

    setSalvando(true);
    try {
      await atualizarVaga(id, {
        titulo: txt("titulo"),
        empresaNome: txt("empresa"),
        cidade: cidade.trim(),
        bairro: bairro.trim(),
        salario: txt("salario"),
        tipo: tipoFinal,
        categoria: txt("categoria"),
        descricao: txt("descricao"),
        requisitos,
        emailContato: txt("email"),
        whatsappContato: txt("whatsapp"),
      });
      await recarregarVagas();
      mostrarToast("Anúncio atualizado ✓");
      router.push("/anuncios");
    } catch (err) {
      mostrarToast(err instanceof Error ? err.message : "Erro ao salvar.");
      setSalvando(false);
    }
  };

  if (carregandoSessao || !empresa.registrada) return null;

  return (
    <section className="view">
      <div className="pad">
        <SubHead
          titulo="Editar anúncio"
          sub="Altere os dados e salve."
          voltarPara="/anuncios"
        />

        {carregando || !vaga ? (
          <div className="empty">
            <b>Carregando…</b>
          </div>
        ) : (
          <form onSubmit={aoSalvar}>
            <div className="field">
              <label htmlFor="titulo">Cargo</label>
              <input
                className="in"
                id="titulo"
                name="titulo"
                required
                placeholder="Ex.: Auxiliar de atendimento"
                defaultValue={vaga.titulo}
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
                defaultValue={vaga.empresaNome}
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
                  : "Digite o CEP para atualizar cidade e bairro."}
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
                  defaultValue={vaga.categoria}
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
                defaultValue={vaga.salario === "A combinar" ? "" : vaga.salario}
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
                defaultValue={vaga.descricao}
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
                defaultValue={vaga.requisitos
                  .filter((r) => r !== "Não informado")
                  .join("\n")}
              />
            </div>
            <div className="row2">
              <div className="field">
                <label htmlFor="email">E-mail de cadastro</label>
                <input
                  className="in"
                  id="email"
                  name="email"
                  type="email"
                  placeholder="rh@suaempresa.com.br"
                  defaultValue={vaga.emailContato}
                />
              </div>
              <div className="field">
                <label htmlFor="whatsapp">WhatsApp</label>
                <input
                  className="in"
                  id="whatsapp"
                  name="whatsapp"
                  placeholder="(83) 99999-9999"
                  inputMode="tel"
                  defaultValue={vaga.whatsappContato}
                />
              </div>
            </div>
            <p className="campo-privado">
              🔒 Os candidatos não veem seu e-mail nem seu WhatsApp.
            </p>
            <button className="submit" type="submit" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar alterações"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
