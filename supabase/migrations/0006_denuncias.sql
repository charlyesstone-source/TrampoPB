-- ----------------------------------------------------------------------------
-- Denúncias de vagas (moderação anti-golpe).
-- Qualquer pessoa que vê uma vaga pode denunciá-la. As denúncias entram APENAS
-- pela rota /api/denunciar (service role, ignora a RLS); ninguém lê/grava direto.
-- A moderação é feita pelo fundador (Supabase Dashboard ou painel futuro).
--
-- vaga_titulo/empresa_nome são desnormalizados para o registro sobreviver caso a
-- vaga seja removida (vaga_id vira null), preservando o histórico de moderação.
-- ----------------------------------------------------------------------------
create table if not exists public.denuncias (
  id             bigint generated always as identity primary key,
  vaga_id        bigint references public.vagas (id) on delete set null,
  vaga_titulo    text not null default '',
  empresa_nome   text not null default '',
  motivo         text not null,
  detalhe        text not null default '',
  denunciante_id uuid references auth.users (id) on delete set null,
  status         text not null default 'aberta'
                   check (status in ('aberta','revisada','arquivada')),
  criado_em      timestamptz not null default now()
);
create index if not exists denuncias_status_idx on public.denuncias (status, criado_em desc);
create index if not exists denuncias_vaga_idx on public.denuncias (vaga_id);

-- RLS ligada e SEM políticas de propósito: a tabela não é legível nem gravável
-- pelos clientes anon/authenticated. Só o service role (rota /api/denunciar)
-- acessa, o que evita que golpistas leiam ou apaguem denúncias.
alter table public.denuncias enable row level security;
