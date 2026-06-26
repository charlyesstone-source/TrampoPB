-- ============================================================================
-- TrampoPB — Fase 4: registrar o consentimento LGPD na candidatura.
-- O candidato precisa consentir explicitamente em enviar seus dados à empresa;
-- guardamos um carimbo de data/hora como trilha de auditoria.
-- ============================================================================

alter table public.candidaturas
  add column if not exists consentimento_lgpd boolean not null default false,
  add column if not exists consentimento_em   timestamptz;
