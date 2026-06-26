# TrampoPB — Especificação do produto

Documento de referência para reconstruir o protótipo (`trampo-jp.html`) como aplicação real.
Use junto com `CLAUDE.md`. O protótipo HTML é a **planta visual**; tudo aqui descreve o
comportamento esperado no app de verdade (com backend, login real e pagamento real).

---

## 1. Visão geral

App web mobile-first com dois tipos de usuário:

- **Candidato** — busca vagas, monta currículo, candidata-se.
- **Empresa (anunciante)** — cria conta, anuncia vagas pagas, recebe candidaturas.
- **(Futuro) Admin** — moderação de vagas, métricas, suporte.

Navegação principal (barra inferior, estilo app): **Início · Buscar · [Anunciar vaga] · Salvas · Perfil**.
O item central ("Anunciar vaga", botão preto) leva ao fluxo da empresa.

---

## 2. Telas e fluxos

### 2.1 Início (feed)
- Saudação dinâmica. Se visitante (sem conta): mostra CTA **"Sou candidato, quero me inscrever"**
  e link **"Já tem conta? Entrar"**. Se logado: "Bom dia/Boa tarde/Boa noite, {primeiro nome}".
- Barra de busca (abre a aba Buscar).
- **Carrossel de provas sociais** que passa sozinho: 1º slide "+ de {N} empregos contratados"
  (N real), seguido de depoimentos (nome, bairro, frase, estrelas). Indicadores clicáveis.
- Lista de vagas ("Vagas perto de você"), com filtro por categoria (chips horizontais).

### 2.2 Buscar
- Campo de busca por cargo, empresa ou bairro + mesmos chips de categoria.
- Resultados em tempo real.

### 2.3 Vaga — card e detalhe
- **Card:** logo (inicial), título, empresa, bairro, salário, tipo de contrato, "há X tempo",
  botão de salvar (coração). Marca "Candidatura enviada" quando aplicável.
- **Detalhe (sheet):** título, empresa, tags (bairro, salário, tipo, categoria), descrição,
  requisitos, benefícios, contato da empresa, e status do anúncio ("ativo, expira em N dias").
- Ações: **Salvar** e **Candidatar-se**.

### 2.4 Candidatar-se
- Exige candidato logado (senão, leva à inscrição).
- Registra uma **candidatura** com um *snapshot* do currículo do candidato no momento.
- Pede **consentimento** (dados enviados à empresa). Notifica a empresa (ver §5).

### 2.5 Salvas
- Lista de vagas que o candidato salvou.

### 2.6 Inscrição do candidato (cadastro + currículo juntos)
- Campos: nome, WhatsApp, e-mail, **senha** (com botão "olho" para mostrar/ocultar),
  área de interesse, bairro, sobre, experiência.
- Link **"Já tem conta? Entrar"** (vai ao login).
- Ao concluir: cria a conta (e-mail+senha) e o currículo; usuário fica logado.
- E-mail + senha são a "conta" (autenticação); o resto é o "currículo" (o que a empresa vê).

### 2.7 Login do candidato
- E-mail + senha (com "olho"). Link "Não tem conta? Inscreva-se".
- **Falta no protótipo, incluir no app real:** "Esqueci minha senha" (recuperação por e-mail).

### 2.8 Perfil do candidato
- Cabeçalho com nome, área, bairro. Estatísticas: candidaturas, salvas, % de perfil.
- Menu: Meu currículo (edição), Alertas de vaga (futuro), Candidaturas recebidas (empresa),
  "Sou empresa, quero publicar".

### 2.9 Meu currículo (edição)
- Mesmos campos da inscrição, **sem** o campo de senha (já é conta existente).
- É exatamente o que a empresa recebe ao receber uma candidatura.

### 2.10 Conta da empresa — cadastro
- Campos: nome da empresa, e-mail, **senha** (com "olho"). Link "Já tem conta? Entrar".
- Acesso exigido **antes** de anunciar a primeira vaga (porta de entrada do anunciante).

### 2.11 Conta da empresa — login
- E-mail + senha (com "olho"). Link "Não tem conta? Criar conta".
- **Incluir no app real:** "Esqueci minha senha".

### 2.12 Anunciar vaga (empresa logada)
- Barra "Anunciando como {empresa} · Sair".
- **Cartão do plano:** "Plano único — R$ 39,90 por vaga", "Sua vaga fica 15 dias no ar",
  e benefícios (destaque por 15 dias, candidaturas no painel, contato por e-mail/WhatsApp).
- Formulário: cargo, empresa (pré-preenchida), bairro, tipo de contrato, categoria, salário,
  descrição, requisitos (um por linha), e-mail e WhatsApp de contato.
- Botão "Publicar vaga • R$ 39,90" → leva ao **pagamento**.

### 2.13 Pagamento Pix
- Resumo do pedido (cargo, plano único 15 dias, total R$ 39,90).
- QR Code dinâmico + "Pix copia e cola" (gerados pelo gateway) + contador de expiração.
- Passo a passo de pagamento.
- **No app real:** a vaga é publicada **somente** quando o gateway confirmar o pagamento via
  webhook — não com um botão "já paguei". O botão do protótipo é só simulação.

### 2.14 Candidaturas recebidas (empresa)
- Lista agrupada por vaga, mostrando os candidatos com nome, área, bairro, resumo,
  e-mail e WhatsApp (com link wa.me) e botão de status.
- Status cicla: **Novo → Em análise → Contratado**. O status "Contratado" alimenta a métrica
  real de contratações.
- **Regra:** a empresa só vê candidaturas das **próprias** vagas (filtrar por empresa logada).

---

## 3. Modelo de dados (sugerido — Postgres/Supabase)

**candidatos** (1:1 com usuário de auth)
- id, nome, whatsapp, email (único), area, bairro, sobre, experiencia, criado_em

**empresas** (1:1 com usuário de auth)
- id, nome, email (único), criado_em

**vagas**
- id, empresa_id (fk), titulo, bairro, salario, tipo, categoria, descricao,
  requisitos (array), beneficios (array), email_contato, whatsapp_contato,
  status ('rascunho' | 'aguardando_pagamento' | 'ativa' | 'expirada'),
  data_publicacao, data_expiracao (publicacao + 15 dias), criado_em

**candidaturas**
- id, vaga_id (fk), candidato_id (fk), status ('novo' | 'em_analise' | 'contratado'),
  snapshot_curriculo (json — dados do candidato no momento), criado_em
- restrição: único por (vaga_id, candidato_id)

**pagamentos**
- id, vaga_id (fk), empresa_id (fk), valor (3990 em centavos), metodo ('pix'),
  status ('pendente' | 'aprovado' | 'expirado' | 'falhou'),
  id_externo_gateway, criado_em, confirmado_em

> Senhas NÃO ficam nessas tabelas — ficam no provedor de auth (Supabase Auth).

### Listas de domínio (de João Pessoa)
- **Tipos de contrato:** CLT, Temporário, Estágio, Meio período, Freelancer.
- **Categorias:** Comércio, Serviços Gerais, Atendimento, Administrativo, Saúde, TI, Estágio.
- **Bairros (exemplos):** Manaíra, Tambaú, Bessa, Bancários, Mangabeira, Centro, Cabo Branco,
  Valentina, Geisel, Jaguaribe. (Idealmente uma lista completa dos bairros da cidade.)

---

## 4. Regras de negócio

- **Preço:** R$ 39,90 por vaga (plano único, sem assinatura no MVP). Centralizar num config.
- **Validade:** 15 dias. Expirar automaticamente (job agendado ou checagem por data).
  Oferecer "renovar" (gera nova cobrança).
- **Publicação condicionada ao pagamento:** vaga nasce 'aguardando_pagamento'; vira 'ativa'
  só no webhook de aprovação. Se o Pix expirar, vaga não é publicada.
- **Isolamento por empresa:** consultas de vagas/candidaturas sempre filtradas pela empresa logada
  (usar Row Level Security do Supabase).
- **Métrica de contratados:** contar candidaturas com status 'contratado'.

---

## 5. Integrações

### 5.1 Autenticação (Supabase Auth)
- E-mail/senha para os dois tipos de conta; opcionalmente login com Google.
- Recuperação de senha ("esqueci minha senha") por e-mail.
- Sessão persistente. Papéis distintos: candidato vs empresa.

### 5.2 Pagamento Pix (Mercado Pago ou Asaas)
- Criar cobrança Pix com valor R$ 39,90 → receber QR dinâmico + copia e cola.
- Configurar **webhook** que recebe a confirmação e dispara a publicação da vaga.
- Nunca lidar com dados de cartão diretamente (quando adicionar cartão, usar o checkout/SDK
  do gateway, que tokeniza).

### 5.3 Notificações (fase posterior)
- E-mail para a empresa quando recebe uma candidatura (gatilho principal).
- WhatsApp (via API oficial do WhatsApp Business) como evolução.

---

## 6. Roadmap sugerido (fases pequenas e testáveis)

1. **Frontend base:** recriar as telas do `trampo-jp.html` em Next.js + Tailwind, com dados
   de exemplo (mock), mantendo os tokens de design e o layout mobile-first.
2. **Auth real (Supabase):** cadastro/login de candidato e de empresa, com "esqueci minha senha".
   Separar os dois papéis.
3. **Banco de dados:** criar as tabelas do §3 e ligar o frontend a dados reais (CRUD de vagas,
   currículo, candidaturas). Aplicar Row Level Security.
4. **Candidatura ponta a ponta:** candidato se candidata → empresa vê no painel → muda status.
   Incluir consentimento LGPD.
5. **Pagamento Pix:** integrar o gateway, publicar a vaga só após o webhook, validade de 15 dias
   e expiração automática.
6. **Lançamento:** política de privacidade e termos, deploy (Netlify + Supabase) — usar a conta
   Netlify existente do fundador —, domínio,
   e ajustes finais. Avaliar período gratuito inicial antes de ligar a cobrança.
7. **Evoluções:** notificações por e-mail/WhatsApp, alertas de vaga para candidatos,
   pagamento com cartão, painel admin, renovação de vagas, métricas reais.

---

## 7. Itens deixados de fora do protótipo (lembrar no app real)

- "Esqueci minha senha" (candidato e empresa).
- Verificação de e-mail no cadastro.
- Política de privacidade e termos de uso (obrigatórios pela LGPD).
- Moderação de vagas (evitar golpes/spam) e denúncia.
- Publicação só após pagamento confirmado (no protótipo está invertido).
- Número de "contratados" e depoimentos **reais e autorizados** (no protótipo são exemplos).
