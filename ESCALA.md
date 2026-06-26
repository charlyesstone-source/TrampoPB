# Guia de escala — TrampoPB

Quanto a aplicação aguenta, onde estão os gargalos e como crescer quando precisar.

> ⚠️ Os números são **estimativas** baseadas nos planos grátis atuais de Netlify e
> Supabase. Servem de referência — a capacidade real depende do padrão de uso e
> os limites das plataformas mudam com o tempo. O número exato de acessos
> simultâneos só um teste de carga confirma.

---

## 1. Por que a arquitetura escala bem

- **Frontend estático na CDN da Netlify:** as páginas e o JavaScript são servidos
  por uma rede global de cache. Isso aguenta praticamente qualquer número de
  acessos simultâneos sem esforço.
- **O navegador fala direto com o Supabase:** o feed, as candidaturas, etc. são
  lidos pelo próprio celular do usuário direto da API do Supabase (com a RLS
  protegendo os dados). Ou seja, **não passa por um servidor nosso** — isso escala
  muito melhor que um app tradicional.
- **Funções (Netlify) só no essencial:** pagamento (Pix) e importação do OLX. O
  resto não consome função.
- **Consultas indexadas:** as tabelas têm índices (`vagas_status_idx`, etc.), então
  as buscas continuam rápidas mesmo com muitas linhas.

Resultado: o ponto que mais "sente" o crescimento é o **Supabase** (banco + auth).

---

## 2. Capacidade atual (planos grátis)

| Dimensão | Capacidade aproximada | O que limita |
|---|---|---|
| Cadastros (anunciantes + candidatos) | **~50.000 usuários ativos/mês** | Supabase Auth (50k MAU no grátis) |
| Anúncios (vagas) armazenados | **~50.000 a 100.000 vagas** | Armazenamento do banco (500 MB; ~1–2 KB por vaga) |
| Candidaturas | **dezenas de milhares** | mesmo armazenamento (~2–4 KB com o currículo) |
| Pessoas ao mesmo tempo (simultâneas) | **~100 a 300 navegando confortável** | Compute grátis do Supabase ⟵ ponto mais sensível |
| Aberturas de feed / mês | **centenas de milhares** | Banda (Supabase 5 GB + Netlify 100 GB) |
| Publicações/importações (funções) | **dezenas de milhares/mês** | Netlify Functions (~125k execuções/mês) |

> "100 pessoas no app" ≠ "100 consultas por segundo". Navegar é em rajadas (carrega
> o feed e fica lendo), então **algumas centenas online** ficam tranquilas; o aperto
> aparece em **picos de muitas ações ao mesmo tempo**.

---

## 3. Os gargalos, em ordem

1. **Compute grátis do Supabase** — sob muitos acessos simultâneos, é o primeiro a
   sentir. Sintoma: feed e login lentos nos horários de pico.
2. **Armazenamento (500 MB)** — no longo prazo, conforme acumulam vagas, candidaturas
   e currículos.
3. **Banda do Supabase (5 GB/mês)** — só viraria problema com tráfego muito alto.
4. **Funções da Netlify** — só se houver muitas publicações/importações por mês.

---

## 4. Como perceber que está na hora de escalar

- **Supabase → Dashboard → Reports/Usage:** acompanhe *Database size*, *Egress* e o
  uso de *Compute*. Se o banco passar de ~400 MB ou o compute viver no teto, é hora.
- **Lentidão nos horários de pico** (feed/login demorando) = compute no limite.
- **Netlify → Analytics/Usage:** banda e execuções de função.
- Avisos por e-mail das próprias plataformas quando chega perto do limite.

---

## 5. Caminho de upgrade (quando crescer)

| Passo | Plano | O que ganha | Custo |
|---|---|---|---|
| 1º (principal) | **Supabase Pro** | 8 GB de banco, compute maior, mais conexões, sem pausa | **US$ 25/mês** |
| Se precisar de mais | Supabase — compute add-on | Instância maior (mais simultâneos) | a partir de ~US$ 10/mês extra |
| Frontend | **Netlify Pro** (só se passar do grátis) | Mais banda e execuções de função | ~US$ 19/mês |

Com o **Supabase Pro (~US$ 25/mês)** a capacidade salta para **milhares de
simultâneos** e **centenas de milhares de cadastros** — folga grande para o porte
de João Pessoa/PB. A migração é só um clique no painel; **não precisa mexer no
código**.

---

## 6. Avisos importantes

1. **Projeto grátis do Supabase pausa após ~7 dias sem nenhum acesso.** No comecinho,
   se ficar uma semana sem uso, ele "dorme" e a primeira visita depois fica lenta até
   acordar. Some quando houver uso regular. (O plano Pro não pausa.)
2. Os **dados do Mercado Pago** (quando ligar a cobrança) e o uso de funções crescem
   junto — revisar os limites lá também.
3. Estes números são referência, não garantia. Quando o uso crescer de verdade, vale
   um **teste de carga** simples para confirmar o ponto de virada.

---

## 7. Resumo prático

- **Para lançar e crescer em João Pessoa:** o plano grátis aguenta de boa **centenas
  a alguns milhares de usuários** e **milhares de anúncios** sem lentidão perceptível.
- **Quando começar a dar picos de lentidão ou o banco encher:** suba o **Supabase Pro
  (~US$ 25/mês)** — resolve por muito tempo.
- A arquitetura não precisa ser reescrita para escalar; é só subir o plano.
