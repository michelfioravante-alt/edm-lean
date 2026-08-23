-- Roteiro híbrido (marcos sem kanban) + rastreio de serviço externo / têmpera.
create table if not exists public.fornecedores (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null,
  nome text not null,
  tipo text not null default 'tempera',
  prazo_dias integer,
  created_at timestamptz not null default now()
);

alter table public.fornecedores enable row level security;

drop policy if exists "Usuários veem fornecedores da sua empresa" on public.fornecedores;
drop policy if exists "Usuários gerenciam fornecedores da sua empresa" on public.fornecedores;

create policy "Usuários veem fornecedores da sua empresa"
on public.fornecedores for select
using (empresa_id = public.get_user_empresa_id());

create policy "Usuários gerenciam fornecedores da sua empresa"
on public.fornecedores for all
using (empresa_id = public.get_user_empresa_id())
with check (empresa_id = public.get_user_empresa_id());

grant select, insert, update, delete on public.fornecedores to authenticated;

alter table public.ordens_servico add column if not exists roteiro jsonb default '[]'::jsonb;
alter table public.ordens_servico add column if not exists fornecedor_id uuid;
alter table public.ordens_servico add column if not exists fornecedor_nome text;
alter table public.ordens_servico add column if not exists tipo_servico_externo text;
alter table public.ordens_servico add column if not exists enviado_em timestamptz;
alter table public.ordens_servico add column if not exists voltou_em timestamptz;
