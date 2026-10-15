-- Kanban de retrabalho a partir de O.S. refugada. Idempotente.

alter table public.ordens_servico add column if not exists is_retrabalho boolean default false;

comment on column public.ordens_servico.is_retrabalho is 'True quando o cartão é retrabalho de uma O.S. refugada (parent_id = origem).';
comment on column public.ordens_servico.parent_id is 'O.S. de origem quando is_retrabalho = true.';
