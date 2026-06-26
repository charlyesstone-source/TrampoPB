# TrampoPB — Plataforma de empregos de João Pessoa/PB

> Este arquivo orienta o Claude Code sobre o projeto. Leia-o no início de cada sessão.
> A planta visual está em `trampo-jp.html` (protótipo navegável feito em HTML/CSS/JS puro).
> A especificação completa (telas, regras, dados, roadmap) está em `ESPECIFICACAO.md`.

## O que é

App web **mobile-first** que conecta candidatos e empresas em João Pessoa e na Paraíba.
Candidatos se inscrevem, montam um currículo e se candidatam a vagas. Empresas criam conta,
anunciam vagas pagando **R$ 39,90 por vaga** (Pix), e recebem as candidaturas num painel.

O público é majoritariamente local e de celular: muito comércio, serviços, atendimento e
funções operacionais. Simplicidade e baixo atrito são prioridade sobre sofisticação.

## Stack recomendado

- **Frontend:** Next.js (App Router) + React + TypeScript, mobile-first.
- **Estilo:** Tailwind CSS, mantendo os tokens de design do protótipo (ver abaixo).
- **Auth + Banco:** Supabase (Postgres + Supabase Auth). Dois tipos de conta: candidato e empresa.
- **Pagamento:** gateway Pix brasileiro (Mercado Pago ou Asaas), com confirmação via **webhook**.
- **Deploy:** Netlify (frontend + funções serverless) + Supabase (backend). O fundador já tem
  conta e projeto na Netlify. Next.js roda na Netlify pelo runtime oficial; o webhook do Pix
  fica numa Netlify Function (ou rota de API do Next.js publicada como função). Plano grátis para começar.

> Não reimplementar autenticação ou processamento de pagamento "na mão". Usar os serviços acima.

## Convenções de código

- Componentes funcionais com hooks; nomes de arquivo em kebab-case.
- TypeScript em tudo; tipar os modelos de dados (ver `ESPECIFICACAO.md`).
- Texto da interface em **português do Brasil**.
- Acessibilidade básica: labels, foco visível, contraste, `aria-label` em botões de ícone.
- Mobile-first: projetar para ~390px de largura primeiro; o desktop é adaptação.

## Tokens de design (manter a identidade do protótipo)

- Marca: verde tropical `#0E7C66` (e `#0A5547` escuro); fundo `#F4F2EC`; texto `#14201D`.
- Acento "sol nascente": coral `#FF7A4D` e âmbar `#FFB347`.
- Tipografia: **Bricolage Grotesque** (títulos) + **Inter** (texto/UI).
- Identidade: João Pessoa é "onde o sol nasce primeiro" — daí o símbolo de sol nascente e o
  slogan **"Onde o trabalho nasce primeiro"**.
- Navegação inferior estilo app, com botão central preto "Anunciar vaga".

## Regras de negócio (resumo — detalhe em ESPECIFICACAO.md)

- Plano único: **R$ 39,90 por vaga**. Sem assinatura no MVP.
- Cada vaga fica **15 dias** no ar e depois expira (com opção de renovar = nova cobrança).
- A vaga só é **publicada após a confirmação do pagamento** (webhook do gateway).
  No protótipo a ordem está invertida só para demonstração — corrigir no app real.
- Empresa só vê e gerencia **as próprias vagas e candidaturas**.

## Regras de segurança e LGPD (não negociáveis)

- Senha **nunca** em texto puro: usar o hash do provedor de auth (Supabase cuida disso).
- **Não armazenar dados de cartão**: o gateway tokeniza; o app nunca recebe número/CVV.
- Pedir **consentimento** do candidato ao se candidatar ("seus dados serão enviados à empresa X")
  e ter uma política de privacidade. Dados pessoais são protegidos pela LGPD.
- Chaves de API e segredos vão em variáveis de ambiente, nunca commitados no repositório.

## Princípios de honestidade (decisões já tomadas pelo fundador)

- O número de "empregos contratados" exibido deve ser **real** (vem do status "Contratado"
  das candidaturas). Não inflar. No protótipo aparece "+ de 270" como exemplo.
- Depoimentos/provas sociais só com **pessoas reais e autorização**. Os do protótipo são fictícios.

## Como trabalhar neste projeto

Construir em fases pequenas e testáveis, não tudo de uma vez. A ordem sugerida está no
final de `ESPECIFICACAO.md`. Sempre que possível, deixar valores como preço (39,90) e
validade (15 dias) em um único lugar de configuração, fáceis de alterar.
