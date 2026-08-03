-- ========================================================
-- CNC LEAN — Extensão de Ferramental (Centro de Usinagem)
-- Execute APÓS o supabase_schema.sql principal
-- ========================================================

-- Ferramentas cadastradas (fresas, brocas, inserts, etc.)
create table if not exists public.ferramental (
    id uuid primary key default uuid_generate_v4(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    nome text not null,
    tipo text default 'Fresa',
    codigo text,
    vida_util_horas numeric default 0,
    alerta_horas numeric default 0,
    horas_usadas numeric default 0,
    status text default 'disponivel', -- disponivel | em_uso | alerta | quebrado
    maquina_id uuid references public.maquinas(id) on delete set null,
    observacao text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Histórico de eventos (quebra, troca, instalação)
create table if not exists public.historico_ferramental (
    id uuid primary key default uuid_generate_v4(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    ferramental_id uuid references public.ferramental(id) on delete set null,
    evento text not null, -- quebra | troca | instalacao
    maquina_nome text,
    operador_nome text,
    horas_no_evento numeric default 0,
    observacao text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.ferramental enable row level security;
alter table public.historico_ferramental enable row level security;

create policy "Usuários veem ferramental da própria empresa"
    on public.ferramental for select
    using (empresa_id = get_user_empresa_id());

create policy "Usuários gerenciam ferramental da própria empresa"
    on public.ferramental for all
    using (empresa_id = get_user_empresa_id())
    with check (empresa_id = get_user_empresa_id());

create policy "Usuários veem histórico ferramental da própria empresa"
    on public.historico_ferramental for select
    using (empresa_id = get_user_empresa_id());

create policy "Usuários registram histórico ferramental da própria empresa"
    on public.historico_ferramental for insert
    with check (empresa_id = get_user_empresa_id());

create index if not exists idx_ferramental_empresa on public.ferramental(empresa_id);
create index if not exists idx_historico_ferramental_empresa on public.historico_ferramental(empresa_id);

-- ========================================================
-- Migração opcional: status CNC nas ordens de serviço
-- (somente se vier de um banco EDM Lean existente)
-- ========================================================
-- update public.ordens_servico set status = 'Prep. Ferramental' where status = 'Set-up';
-- update public.ordens_servico set status = 'Em Usinagem' where status = 'Em Corte';
-- update public.ordens_servico set status = 'Inspeção' where status = 'Aferição';
