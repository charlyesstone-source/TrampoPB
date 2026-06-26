# Deploy da TrampoPB (Netlify + Supabase)

Guia passo a passo para colocar o app no ar. O código já está pronto para deploy
(Next.js + `netlify.toml`). As partes abaixo são feitas nas **suas contas**.

---

## 1. Subir o código para o GitHub

1. Crie um repositório novo (privado) em <https://github.com/new> — ex.: `trampopb`.
   **Não** marque "Add README" (o projeto já tem arquivos).
2. No terminal, dentro de `D:\TrampoPB`, conecte e envie:

   ```bash
   git remote add origin https://github.com/SEU-USUARIO/trampopb.git
   git branch -M main
   git push -u origin main
   ```

> O `.gitignore` já protege `.env.local`, `node_modules` e `.next` — segredos não
> vão para o GitHub.

## 2. Conectar na Netlify

1. Em <https://app.netlify.com> → **Add new site** → **Import an existing project**.
2. Escolha **GitHub** e selecione o repositório `trampopb`.
3. A Netlify detecta o Next.js sozinho (graças ao `netlify.toml`). Deixe:
   - **Build command:** `npm run build`
   - **Branch:** `main`
4. **Antes de finalizar**, vá em **Environment variables** e adicione (passo 3).

## 3. Variáveis de ambiente na Netlify

Em **Site settings → Environment variables**, adicione:

| Variável | Valor | Quando |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://jvawzyeauvqsaijgucuc.supabase.co` | sempre |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | a chave publishable (`sb_publishable_...`) | sempre |
| `MERCADOPAGO_ACCESS_TOKEN` | token do Mercado Pago | só quando ligar a cobrança |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role do Supabase | só quando ligar a cobrança (webhook) |

> No **período de lançamento (grátis)** o app publica vagas sem Pix, então as duas
> últimas não são obrigatórias ainda. Mas pode já deixar configuradas.

Depois clique em **Deploy**.

## 4. Ajustes no Supabase (autenticação)

No painel do Supabase → **Authentication → URL Configuration**:

- **Site URL:** a URL da Netlify (ex.: `https://trampopb.netlify.app`).
- **Redirect URLs:** adicione `https://SEU-SITE.netlify.app/redefinir-senha`
  (para o "esqueci minha senha" funcionar no ar).

## 5. Quando for LIGAR a cobrança (R$ 39,90)

1. Em `src/lib/config.ts`, mude `COBRANCA_ATIVA` para `true` e faça commit/push
   (a Netlify redeploya sozinha).
2. Na Netlify, garanta `MERCADOPAGO_ACCESS_TOKEN` (de **produção**) e
   `SUPABASE_SERVICE_ROLE_KEY` preenchidas.
3. No painel do **Mercado Pago** → sua aplicação → **Webhooks**, cadastre a URL:
   `https://SEU-SITE.netlify.app/api/pagamento/webhook` (evento: pagamentos).
4. Teste uma publicação real de ponta a ponta.

## 6. Conferências pós-deploy

- [ ] Site abre e o feed carrega as vagas.
- [ ] Cadastro/login de candidato e de empresa funcionam.
- [ ] Publicar vaga (grátis) coloca a vaga no ar.
- [ ] "Esqueci minha senha" envia o e-mail (Redirect URL configurada).
- [ ] Importar do OLX por link — **conferir se o `curl` funciona na Netlify**
      (as funções rodam em Lambda; o `curl` costuma estar disponível). Se não
      funcionar, o caminho do **texto colado** continua valendo.
- [ ] Expiração: `pg_cron` já roda de hora em hora no Supabase; o feed também
      filtra vagas vencidas na hora.

## Domínio próprio (opcional)

Na Netlify → **Domain settings** → **Add a custom domain**, aponte seu domínio
(ex.: `trampopb.com.br`) e atualize a Site URL/Redirect URLs do Supabase para ele.
