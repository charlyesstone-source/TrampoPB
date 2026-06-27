-- ----------------------------------------------------------------------------
-- "Badge" de candidaturas novas na aba Empresa, SINCRONIZADO entre dispositivos.
-- Guarda quando a empresa abriu o painel pela última vez; o contador mostra as
-- candidaturas que chegaram depois disso. (Antes era só localStorage, por device.)
-- ----------------------------------------------------------------------------
alter table public.empresas
  add column if not exists candidaturas_vistas_em timestamptz;
