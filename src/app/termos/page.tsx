"use client";

import { SubHead } from "@/components/sub-head";

/**
 * Termos de Uso — versão inicial. Revisar com apoio jurídico antes do
 * lançamento definitivo (Fase 6).
 */
export default function TermosPage() {
  return (
    <section className="view">
      <div className="pad">
        <SubHead
          titulo="Termos de Uso"
          sub="As regras para usar a TrampoPB."
          voltarPara="/"
        />

        <div className="block">
          <h4>1. O que é a TrampoPB</h4>
          <p>
            A TrampoPB é uma plataforma que conecta candidatos e empresas em João
            Pessoa e na Paraíba. Não somos empregadores nem agência de empregos:
            apenas intermediamos o contato entre quem oferece e quem procura vagas.
          </p>
        </div>

        <div className="block">
          <h4>2. Cadastro e conta</h4>
          <ul>
            <li>Você é responsável pelas informações que cadastra e por mantê-las verdadeiras.</li>
            <li>A senha é pessoal e intransferível; mantenha-a em segurança.</li>
            <li>É proibido criar contas falsas ou se passar por outra pessoa/empresa.</li>
          </ul>
        </div>

        <div className="block">
          <h4>3. Vagas e candidaturas</h4>
          <ul>
            <li>A empresa é responsável pelo conteúdo e pela veracidade das vagas que publica.</li>
            <li>Cada vaga fica no ar por {15} dias e depois expira.</li>
            <li>
              É proibido publicar vagas falsas, golpes, conteúdo ofensivo, ilegal ou
              que peça pagamento do candidato para se candidatar.
            </li>
            <li>Podemos remover vagas que violem estas regras.</li>
          </ul>
        </div>

        <div className="block">
          <h4>4. Pagamentos</h4>
          <p>
            Quando a cobrança estiver ativa, a publicação de vaga é paga (plano único
            por vaga, via Pix). No período de lançamento, a publicação pode ser
            gratuita. O processamento do pagamento é feito por um gateway parceiro; a
            TrampoPB não armazena dados de cartão.
          </p>
        </div>

        <div className="block">
          <h4>5. Responsabilidades</h4>
          <p>
            A TrampoPB não garante contratação nem se responsabiliza por acordos feitos
            diretamente entre empresas e candidatos. Recomendamos cautela e bom senso ao
            compartilhar dados e ao comparecer a entrevistas.
          </p>
        </div>

        <div className="block">
          <h4>6. Privacidade</h4>
          <p>
            O tratamento de dados pessoais segue a nossa Política de Privacidade e a
            LGPD (Lei nº 13.709/2018).
          </p>
        </div>

        <div className="block">
          <h4>7. Alterações</h4>
          <p>
            Estes termos podem ser atualizados. Mudanças relevantes serão comunicadas na
            plataforma.
          </p>
        </div>

        <p className="demo-note">
          Versão inicial — revisar com apoio jurídico antes do lançamento.
        </p>
      </div>
    </section>
  );
}
