-- ============================================================================
-- TrampoPB — Fase 6: expiração automática das vagas após a validade (15 dias).
-- O feed já esconde vagas vencidas (filtro por data_expiracao). Esta rotina
-- marca o status como 'expirada' para refletir em "Meus anúncios" e limpar.
-- ============================================================================

create or replace function public.expirar_vagas()
returns void
language sql
security definer
set search_path = public
as $$
  update public.vagas
     set status = 'expirada'
   where status = 'ativa'
     and data_expiracao is not null
     and data_expiracao < now();
$$;

-- Tenta agendar de hora em hora via pg_cron. Se a extensão não estiver
-- disponível, não falha a migração — o feed já filtra vagas vencidas.
do $$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'expirar-vagas-trampopb',
    '0 * * * *',
    'select public.expirar_vagas();'
  );
exception when others then
  raise notice 'pg_cron indisponivel (%). Agende expirar_vagas() manualmente se quiser.', sqlerrm;
end
$$;
