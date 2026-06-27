-- ----------------------------------------------------------------------------
-- Expansão de João Pessoa para TODA a Paraíba.
-- A vaga passa a ter CIDADE (além do bairro). As vagas antigas eram todas de
-- João Pessoa, então esse é o default das linhas já existentes.
-- ----------------------------------------------------------------------------
alter table public.vagas
  add column if not exists cidade text not null default 'João Pessoa';
