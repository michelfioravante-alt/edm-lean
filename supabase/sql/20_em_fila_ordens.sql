-- Fila do molde: peça fica fora do kanban do setor até o gestor liberar.
-- Idempotente — seguro rodar se o 03_cnc_campos.sql não tiver sido aplicado no projeto.

alter table public.ordens_servico add column if not exists em_fila boolean default false;

comment on column public.ordens_servico.em_fila is
  'Fila do molde: fora do kanban do setor até o gestor liberar';

notify pgrst, 'reload schema';
