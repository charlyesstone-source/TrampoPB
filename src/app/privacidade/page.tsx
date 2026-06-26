"use client";

import { SubHead } from "@/components/sub-head";

/**
 * Política de Privacidade — base LGPD (Lei 13.709/2018).
 * Texto inicial; revisar com apoio jurídico antes do lançamento (Fase 6).
 */
export default function PrivacidadePage() {
  return (
    <section className="view">
      <div className="pad">
        <SubHead
          titulo="Política de Privacidade"
          sub="Como tratamos seus dados na TrampoPB."
          voltarPara="/"
        />

        <div className="block">
          <h4>Quem somos</h4>
          <p>
            A TrampoPB é uma plataforma que conecta candidatos e empresas em João
            Pessoa e na Paraíba. Tratamos dados pessoais conforme a Lei Geral de
            Proteção de Dados (LGPD, Lei nº 13.709/2018).
          </p>
        </div>

        <div className="block">
          <h4>Dados que coletamos</h4>
          <ul>
            <li>Conta: e-mail e senha (a senha é guardada de forma cifrada).</li>
            <li>
              Currículo do candidato: nome, WhatsApp, bairro, área de interesse,
              resumo e experiência.
            </li>
            <li>Empresa: nome e e-mail de contato.</li>
            <li>Vagas e candidaturas geradas pelo seu uso da plataforma.</li>
          </ul>
        </div>

        <div className="block">
          <h4>Como usamos</h4>
          <p>
            Usamos seus dados para operar a plataforma: exibir vagas, permitir
            candidaturas e conectar candidatos às empresas. Não vendemos seus dados.
          </p>
        </div>

        <div className="block">
          <h4>Compartilhamento com empresas</h4>
          <p>
            Ao se candidatar a uma vaga, e <b>somente com o seu consentimento
            explícito</b> no momento da candidatura, seus dados de currículo (nome,
            contato e resumo) são enviados à empresa responsável por aquela vaga,
            para que ela entre em contato. A empresa só recebe os dados de quem se
            candidatou às vagas dela.
          </p>
        </div>

        <div className="block">
          <h4>Seus direitos (LGPD)</h4>
          <ul>
            <li>Acessar, corrigir ou atualizar seus dados (edite seu currículo).</li>
            <li>Revogar o consentimento e solicitar a exclusão da conta.</li>
            <li>Saber com quais empresas seus dados foram compartilhados.</li>
          </ul>
        </div>

        <div className="block">
          <h4>Retenção e segurança</h4>
          <p>
            Mantemos seus dados enquanto sua conta existir. A autenticação e o
            armazenamento usam provedores que cifram dados em trânsito e em repouso.
          </p>
        </div>

        <div className="block">
          <h4>Contato</h4>
          <p>
            Dúvidas sobre privacidade ou para exercer seus direitos, fale com a gente
            pelo e-mail de suporte da TrampoPB.
          </p>
        </div>

        <p className="demo-note">
          Versão inicial — revisar com apoio jurídico antes do lançamento.
        </p>
      </div>
    </section>
  );
}
