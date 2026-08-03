-- ==========================================
-- CNC LEAN — Movimentações de estoque
-- Execute DEPOIS de supabase_schema.sql.
-- Idempotente: pode rodar quantas vezes quiser.
--
-- Antes disso o estoque só sabia baixar 1 unidade por vez: não havia como dar
-- entrada de compra nem corrigir uma contagem errada sem apagar o item.
-- ==========================================

create table if not exists public.movimentacoes_estoque (
    id uuid primary key default uuid_generate_v4(),
    empresa_id uuid not null references public.empresas(id) on delete cascade,
    estoque_item_id uuid references public.estoque_itens(id) on delete set null,
    item_nome text not null,
    tipo text not null, -- entrada | saida
    quantidade integer not null,
    quantidade_resultante integer,
    motivo text,
    operador_nome text,
    observacao text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.movimentacoes_estoque enable row level security;

drop policy if exists "Usuários veem movimentações da própria empresa" on public.movimentacoes_estoque;
create policy "Usuários veem movimentações da própria empresa"
    on public.movimentacoes_estoque for select
    using (empresa_id = get_user_empresa_id());

drop policy if exists "Usuários registram movimentações da própria empresa" on public.movimentacoes_estoque;
create policy "Usuários registram movimentações da própria empresa"
    on public.movimentacoes_estoque for insert
    with check (empresa_id = get_user_empresa_id());

create index if not exists idx_movimentacoes_estoque_empresa on public.movimentacoes_estoque(empresa_id);
create index if not exists idx_movimentacoes_estoque_item on public.movimentacoes_estoque(estoque_item_id);

-- Soma `delta` (negativo para saída) direto no banco, nunca abaixo de zero.
-- Feito no servidor para que dois terminais movimentando ao mesmo tempo não
-- sobrescrevam a contagem um do outro.
create or replace function movimentar_estoque(item_id uuid, delta int, emp_id uuid)
returns setof estoque_itens language sql volatile security definer as $$
    update estoque_itens
    set quantidade = greatest(quantidade + delta, 0)
    where id = item_id and empresa_id = emp_id
    returning *;
$$;
