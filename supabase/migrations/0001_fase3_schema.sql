-- ============================================================================
-- TrampoPB — Fase 3: schema + Row Level Security
-- Cole e rode no Supabase Dashboard > SQL Editor (uma vez).
-- Alinhado ao §3 da ESPECIFICACAO.md.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Perfis (1:1 com auth.users). O id é o próprio id do usuário de auth.
-- ----------------------------------------------------------------------------
create table if not exists public.candidatos (
  id          uuid primary key references auth.users (id) on delete cascade,
  nome        text not null default '',
  whatsapp    text not null default '',
  email       text not null default '',
  area        text not null default '',
  bairro      text not null default '',
  sobre       text not null default '',
  experiencia text not null default '',
  criado_em   timestamptz not null default now()
);

create table if not exists public.empresas (
  id        uuid primary key references auth.users (id) on delete cascade,
  nome      text not null default '',
  email     text not null default '',
  criado_em timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Vagas. empresa_nome é desnormalizado (nome público do anúncio), para o feed
-- exibir sem precisar ler a tabela privada de empresas.
-- ----------------------------------------------------------------------------
create table if not exists public.vagas (
  id               bigint generated always as identity primary key,
  empresa_id       uuid not null references public.empresas (id) on delete cascade,
  empresa_nome     text not null,
  titulo           text not null,
  bairro           text not null,
  salario          text not null default 'A combinar',
  tipo             text not null,
  categoria        text not null,
  descricao        text not null,
  requisitos       text[] not null default '{}',
  beneficios       text[] not null default '{}',
  email_contato    text,
  whatsapp_contato text,
  status           text not null default 'aguardando_pagamento'
                     check (status in ('rascunho','aguardando_pagamento','ativa','expirada')),
  data_publicacao  timestamptz,
  data_expiracao   timestamptz,
  criado_em        timestamptz not null default now()
);
create index if not exists vagas_status_idx on public.vagas (status, criado_em desc);
create index if not exists vagas_empresa_idx on public.vagas (empresa_id);

-- ----------------------------------------------------------------------------
-- Candidaturas. snapshot_curriculo guarda o currículo no momento da candidatura.
-- ----------------------------------------------------------------------------
create table if not exists public.candidaturas (
  id                 bigint generated always as identity primary key,
  vaga_id            bigint not null references public.vagas (id) on delete cascade,
  candidato_id       uuid not null references public.candidatos (id) on delete cascade,
  status             text not null default 'novo'
                       check (status in ('novo','analise','contratado')),
  snapshot_curriculo jsonb not null default '{}',
  criado_em          timestamptz not null default now(),
  unique (vaga_id, candidato_id)
);
create index if not exists candidaturas_vaga_idx on public.candidaturas (vaga_id);

-- ----------------------------------------------------------------------------
-- Pagamentos (valor em centavos). No MVP o Pix é simulado (Fase 5 liga o real).
-- ----------------------------------------------------------------------------
create table if not exists public.pagamentos (
  id               bigint generated always as identity primary key,
  vaga_id          bigint not null references public.vagas (id) on delete cascade,
  empresa_id       uuid not null references public.empresas (id) on delete cascade,
  valor            integer not null default 3990,
  metodo           text not null default 'pix',
  status           text not null default 'pendente'
                     check (status in ('pendente','aprovado','expirado','falhou')),
  id_externo_gateway text,
  criado_em        timestamptz not null default now(),
  confirmado_em    timestamptz
);

-- ----------------------------------------------------------------------------
-- Cria o perfil automaticamente quando um usuário de auth é criado,
-- escolhendo a tabela pelo papel guardado no metadata.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.raw_user_meta_data ->> 'papel') = 'empresa' then
    insert into public.empresas (id, nome, email)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', ''), new.email)
    on conflict (id) do nothing;
  else
    insert into public.candidatos (id, nome, email)
    values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', ''), new.email)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Métrica honesta de contratações: contagem pública via função security definer
-- (respeita a RLS das candidaturas, expondo só o número).
-- ----------------------------------------------------------------------------
create or replace function public.total_contratados()
returns integer
language sql
security definer
set search_path = public
as $$
  select count(*)::int from public.candidaturas where status = 'contratado';
$$;
grant execute on function public.total_contratados() to anon, authenticated;

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.candidatos   enable row level security;
alter table public.empresas     enable row level security;
alter table public.vagas        enable row level security;
alter table public.candidaturas enable row level security;
alter table public.pagamentos   enable row level security;

-- candidatos: cada um só vê/edita o próprio
create policy "candidato lê o próprio"   on public.candidatos for select using (auth.uid() = id);
create policy "candidato cria o próprio" on public.candidatos for insert with check (auth.uid() = id);
create policy "candidato edita o próprio" on public.candidatos for update using (auth.uid() = id) with check (auth.uid() = id);

-- empresas: cada uma só vê/edita a própria
create policy "empresa lê a própria"   on public.empresas for select using (auth.uid() = id);
create policy "empresa cria a própria" on public.empresas for insert with check (auth.uid() = id);
create policy "empresa edita a própria" on public.empresas for update using (auth.uid() = id) with check (auth.uid() = id);

-- vagas: todos leem as ATIVAS; a empresa vê/gere as próprias (qualquer status)
create policy "todos leem vagas ativas"      on public.vagas for select using (status = 'ativa');
create policy "empresa lê as próprias vagas" on public.vagas for select using (auth.uid() = empresa_id);
create policy "empresa cria vaga"            on public.vagas for insert with check (auth.uid() = empresa_id);
create policy "empresa edita vaga"           on public.vagas for update using (auth.uid() = empresa_id) with check (auth.uid() = empresa_id);
create policy "empresa apaga vaga"           on public.vagas for delete using (auth.uid() = empresa_id);

-- candidaturas: candidato cria/lê as próprias; empresa lê e muda status das suas vagas
create policy "candidato cria candidatura" on public.candidaturas for insert
  with check (auth.uid() = candidato_id);
create policy "candidato lê as próprias candidaturas" on public.candidaturas for select
  using (auth.uid() = candidato_id);
create policy "empresa lê candidaturas das suas vagas" on public.candidaturas for select
  using (exists (select 1 from public.vagas v where v.id = vaga_id and v.empresa_id = auth.uid()));
create policy "empresa muda status das candidaturas" on public.candidaturas for update
  using (exists (select 1 from public.vagas v where v.id = vaga_id and v.empresa_id = auth.uid()))
  with check (exists (select 1 from public.vagas v where v.id = vaga_id and v.empresa_id = auth.uid()));

-- pagamentos: só a empresa dona
create policy "empresa lê os próprios pagamentos" on public.pagamentos for select using (auth.uid() = empresa_id);
create policy "empresa cria pagamento"            on public.pagamentos for insert with check (auth.uid() = empresa_id);
create policy "empresa atualiza pagamento"        on public.pagamentos for update using (auth.uid() = empresa_id) with check (auth.uid() = empresa_id);
